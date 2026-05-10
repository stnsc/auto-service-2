import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb"

const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})
const docClient = DynamoDBDocumentClient.from(ddbClient)

const TABLE = process.env.DYNAMODB_STUDY_EVAL_TABLE_NAME!

// ── GET: list all submitted rating sets ───────────────────────────────────────
export async function GET() {
    if (!TABLE) {
        return Response.json({ error: "Not configured" }, { status: 503 })
    }
    try {
        const result = await docClient.send(new ScanCommand({ TableName: TABLE }))
        const items = (result.Items ?? []).sort((a, b) =>
            (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""),
        )
        return Response.json(items)
    } catch (err) {
        console.error("Failed to list eval ratings:", err)
        return Response.json({ error: "Server error" }, { status: 500 })
    }
}

// ── POST: save a completed rating set ─────────────────────────────────────────
export async function POST(request: Request) {
    if (!TABLE) {
        return Response.json({ error: "Not configured" }, { status: 503 })
    }

    let body: Record<string, unknown>
    try {
        body = await request.json()
    } catch {
        return Response.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const { raterId, ratings } = body
    if (!raterId || !Array.isArray(ratings) || ratings.length === 0) {
        return Response.json(
            { error: "Missing required fields: raterId, ratings[]" },
            { status: 400 },
        )
    }

    const item = {
        raterId: String(raterId),
        submittedAt: new Date().toISOString(),
        ratings,
    }

    try {
        await docClient.send(new PutCommand({ TableName: TABLE, Item: item }))
        return Response.json({ success: true })
    } catch (err) {
        console.error("Failed to save eval ratings:", err)
        return Response.json({ error: "Server error" }, { status: 500 })
    }
}
