import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb"

const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    maxAttempts: 1,
})

const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
}

export async function GET() {
    const tableName = process.env.DYNAMODB_SERVICES_TABLE_NAME

    if (!tableName) {
        return new Response(JSON.stringify({ ok: false }), { status: 503, headers })
    }

    try {
        await client.send(
            new ScanCommand({ TableName: tableName, Limit: 1, Select: "COUNT" }),
            { abortSignal: AbortSignal.timeout(5000) },
        )
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers })
    } catch {
        return new Response(JSON.stringify({ ok: false }), { status: 503, headers })
    }
}
