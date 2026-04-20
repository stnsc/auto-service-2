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

export async function POST(request: Request) {
    const { userId, action, payload } = await request.json()

    if (!userId || !action) {
        return new Response(
            JSON.stringify({ error: "userId and action are required" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
        )
    }

    try {
        await docClient.send(
            new PutCommand({
                TableName: process.env.DYNAMODB_TABLE_NAME,
                Item: {
                    userId,
                    timestamp: new Date().toISOString(),
                    action,
                    payload: payload || {},
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
