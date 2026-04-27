import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
} from "@aws-sdk/lib-dynamodb"

const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})
const docClient = DynamoDBDocumentClient.from(ddbClient)

const TABLE = process.env.DYNAMODB_USER_PROFILES_TABLE_NAME!

export async function GET(request: Request) {
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")

    if (!userId) {
        return new Response(
            JSON.stringify({ error: "userId is required" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
        )
    }

    if (!TABLE) {
        return new Response(
            JSON.stringify(null),
            { status: 200, headers: { "Content-Type": "application/json" } },
        )
    }

    try {
        const result = await docClient.send(
            new GetCommand({ TableName: TABLE, Key: { userId } }),
        )
        return new Response(
            JSON.stringify(result.Item ?? null),
            { status: 200, headers: { "Content-Type": "application/json" } },
        )
    } catch (err) {
        console.error("Failed to fetch profile:", err)
        return new Response(
            JSON.stringify({ error: "Failed to fetch profile" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        )
    }
}

export async function POST(request: Request) {
    const body = await request.json()
    const { userId, firstName, lastName, phoneNumber, vehicles } = body

    if (!userId) {
        return new Response(
            JSON.stringify({ error: "userId is required" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
        )
    }

    if (!TABLE) {
        return new Response(
            JSON.stringify({ error: "Profile table not configured" }),
            { status: 503, headers: { "Content-Type": "application/json" } },
        )
    }

    const item = {
        userId,
        firstName: firstName ?? "",
        lastName: lastName ?? "",
        phoneNumber: phoneNumber ?? "",
        vehicles: vehicles ?? [],
        updatedAt: new Date().toISOString(),
    }

    try {
        await docClient.send(new PutCommand({ TableName: TABLE, Item: item }))
        return new Response(
            JSON.stringify(item),
            { status: 200, headers: { "Content-Type": "application/json" } },
        )
    } catch (err) {
        console.error("Failed to save profile:", err)
        return new Response(
            JSON.stringify({ error: "Failed to save profile" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        )
    }
}
