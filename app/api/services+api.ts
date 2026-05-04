import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb"
import { CarService } from "../types/CarService"

const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})

const docClient = DynamoDBDocumentClient.from(client)

export async function GET() {
    const tableName = process.env.DYNAMODB_SERVICES_TABLE_NAME
    if (!tableName) {
        return new Response(
            JSON.stringify({ error: "Services table not configured" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        )
    }

    try {
        const result = await docClient.send(
            new ScanCommand({ TableName: tableName }),
        )

        const services = (result.Items ?? []).map((item) => ({
            ...item,
            type: Array.isArray(item.type)
                ? item.type
                : item.type
                  ? [item.type]
                  : [],
        })) as CarService[]

        return new Response(JSON.stringify(services), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        })
    } catch (error) {
        console.error("Failed to fetch services:", error)
        return new Response(
            JSON.stringify({ error: "Failed to fetch services" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        )
    }
}
