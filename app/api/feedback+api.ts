import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
    DynamoDBDocumentClient,
    PutCommand,
    ScanCommand,
} from "@aws-sdk/lib-dynamodb"
import { randomUUID } from "crypto"

const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})
const docClient = DynamoDBDocumentClient.from(ddbClient)

const TABLE = process.env.DYNAMODB_FEEDBACK_TABLE_NAME!

export interface FeedbackEntry {
    feedbackId: string
    userId: string
    email: string
    rating: number
    message: string
    createdAt: string
}

export async function POST(request: Request) {
    const body = await request.json()
    const { userId, email, rating, message } = body

    if (!rating || rating < 1 || rating > 5) {
        return new Response(
            JSON.stringify({ error: "Rating must be between 1 and 5" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
        )
    }

    const item: FeedbackEntry = {
        feedbackId: randomUUID(),
        userId: userId ?? "anonymous",
        email: email ?? "",
        rating: Number(rating),
        message: (message ?? "").trim(),
        createdAt: new Date().toISOString(),
    }

    try {
        await docClient.send(new PutCommand({ TableName: TABLE, Item: item }))
        return new Response(JSON.stringify({ success: true }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        })
    } catch (err) {
        console.error("Failed to save feedback:", err)
        return new Response(
            JSON.stringify({ error: "Failed to save feedback" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        )
    }
}

export async function GET() {
    try {
        const result = await docClient.send(
            new ScanCommand({ TableName: TABLE }),
        )
        const items = (result.Items ?? []) as FeedbackEntry[]
        items.sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
        )
        return new Response(JSON.stringify(items), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        })
    } catch (err) {
        console.error("Failed to fetch feedback:", err)
        return new Response(
            JSON.stringify({ error: "Failed to fetch feedback" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        )
    }
}
