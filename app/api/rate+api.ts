import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
    DynamoDBDocumentClient,
    PutCommand,
    ScanCommand,
} from "@aws-sdk/lib-dynamodb"
import type { Appointment } from "./appointments+api"

const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})
const docClient = DynamoDBDocumentClient.from(ddbClient)

const TABLE = process.env.DYNAMODB_APPOINTMENTS_TABLE_NAME!

// ── GET: fetch appointment info by ratingToken ─────────────────────────────────
export async function GET(request: Request) {
    const url = new URL(request.url)
    const token = url.searchParams.get("t")

    if (!token) {
        return Response.json({ error: "Missing token" }, { status: 400 })
    }

    if (!TABLE) {
        return Response.json({ error: "Not configured" }, { status: 503 })
    }

    try {
        const result = await docClient.send(
            new ScanCommand({
                TableName: TABLE,
                FilterExpression: "ratingToken = :t",
                ExpressionAttributeValues: { ":t": token },
            }),
        )
        const item = result.Items?.[0] as Appointment | undefined
        if (!item) {
            return Response.json(
                { error: "Invalid or expired rating link" },
                { status: 404 },
            )
        }
        if (item.rating != null) {
            return Response.json({ error: "Already rated" }, { status: 409 })
        }
        // Return only safe fields for the rating page
        return Response.json({
            appointmentId: item.appointmentId,
            serviceId: item.serviceId,
            serviceName: item.serviceName,
            customerName: item.customerName,
            preferredDate: item.preferredDate,
            preferredTime: item.preferredTime,
            alreadyRated: false,
        })
    } catch (err) {
        console.error("Failed to fetch rating info:", err)
        return Response.json({ error: "Server error" }, { status: 500 })
    }
}

// ── POST: submit rating ────────────────────────────────────────────────────────
export async function POST(request: Request) {
    if (!TABLE) {
        return Response.json({ error: "Not configured" }, { status: 503 })
    }

    const body = await request.json()
    const { token, rating, comment } = body

    if (!token || !rating) {
        return Response.json(
            { error: "Missing token or rating" },
            { status: 400 },
        )
    }

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
        return Response.json(
            { error: "Rating must be between 1 and 5" },
            { status: 400 },
        )
    }

    try {
        const result = await docClient.send(
            new ScanCommand({
                TableName: TABLE,
                FilterExpression: "ratingToken = :t",
                ExpressionAttributeValues: { ":t": token },
            }),
        )
        const item = result.Items?.[0] as Appointment | undefined
        if (!item) {
            return Response.json(
                { error: "Invalid or expired rating link" },
                { status: 404 },
            )
        }
        if (item.rating != null) {
            return Response.json({ error: "Already rated" }, { status: 409 })
        }

        const updated: Appointment = {
            ...item,
            rating,
            ratingComment: comment ?? "",
            ratedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        await docClient.send(
            new PutCommand({ TableName: TABLE, Item: updated }),
        )

        return Response.json({ success: true })
    } catch (err) {
        console.error("Failed to submit rating:", err)
        return Response.json({ error: "Server error" }, { status: 500 })
    }
}
