import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});
const docClient = DynamoDBDocumentClient.from(ddbClient);

export async function GET(request: Request) {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
        return new Response(
            JSON.stringify({ error: 'userId is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
    }

    if (!process.env.DYNAMODB_CONVERSATIONS_TABLE_NAME) {
        return new Response(
            JSON.stringify({ conversations: [] }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
    }

    try {
        const result = await docClient.send(
            new QueryCommand({
                TableName: process.env.DYNAMODB_CONVERSATIONS_TABLE_NAME,
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues: { ':userId': userId },
            }),
        );

        const conversations = (result.Items || [])
            .sort((a, b) => {
                const ta = a.updatedAt ?? '';
                const tb = b.updatedAt ?? '';
                return tb.localeCompare(ta);
            })
            .map((item) => ({
                conversationId: item.conversationId as string,
                summary: (item.summary as string) || '',
                messages: (item.messages as { role: string; content: string }[]) || [],
                vehicleInfo: (item.vehicleInfo as Record<string, unknown>) || {},
                updatedAt: (item.updatedAt as string) || '',
                createdAt: (item.createdAt as string) || '',
            }));

        return new Response(
            JSON.stringify({ conversations }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
    } catch (err) {
        console.error('Failed to fetch conversations:', err);
        return new Response(
            JSON.stringify({ error: 'Failed to fetch conversations' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
}
