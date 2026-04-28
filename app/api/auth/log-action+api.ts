import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"

const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})

const docClient = DynamoDBDocumentClient.from(client)

function extractClientIp(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for")
    if (forwarded) {
        return forwarded.split(",")[0].trim()
    }
    return (
        request.headers.get("x-real-ip") ??
        request.headers.get("cf-connecting-ip") ??
        "unknown"
    )
}

function extractLocation(request: Request) {
    return {
        country: request.headers.get("x-vercel-ip-country") ?? "unknown",
        region: request.headers.get("x-vercel-ip-country-region") ?? "unknown",
    }
}

export async function POST(request: Request) {
    const { userId, action, payload } = await request.json()

    if (!userId || !action) {
        return new Response(
            JSON.stringify({ error: "userId and action are required" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
        )
    }

    const ip = extractClientIp(request)
    const userAgent = request.headers.get("user-agent") ?? "unknown"
    const location = extractLocation(request)

    const enrichedPayload = {
        ...(payload || {}),
        ip,
        userAgent,
        location,
    }

    try {
        await docClient.send(
            new PutCommand({
                TableName: process.env.DYNAMODB_TABLE_NAME,
                Item: {
                    userId,
                    timestamp: new Date().toISOString(),
                    action,
                    payload: enrichedPayload,
                },
            }),
        )

        return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { "Content-Type": "application/json" } },
        )
    } catch (error) {
        console.error("Failed to log action:", error)
        return new Response(
            JSON.stringify({ error: "Failed to log action" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        )
    }
}
