import {
    CognitoIdentityProviderClient,
    ListUsersCommand,
    ListUsersCommandOutput,
} from "@aws-sdk/client-cognito-identity-provider"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb"

const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})

const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})
const docClient = DynamoDBDocumentClient.from(ddbClient)

export interface CognitoUser {
    userId: string
    email: string
    status: string
    enabled: boolean
    createdAt: string
}

export interface ActivityLog {
    userId: string
    timestamp: string
    action: string
    payload: {
        ip?: string
        userAgent?: string
        location?: { country?: string; region?: string }
        provider?: string
    }
}

function attr(user: NonNullable<ListUsersCommandOutput["Users"]>[number], name: string): string {
    return user.Attributes?.find((a) => a.Name === name)?.Value ?? ""
}

export async function GET(request: Request) {
    const url = new URL(request.url)
    const userId = url.searchParams.get("email") // logs table uses email as partition key

    // Return activity logs for a specific user (keyed by email in the logs table)
    if (userId) {
        const logsTable = process.env.DYNAMODB_TABLE_NAME
        if (!logsTable) {
            return new Response(JSON.stringify([]), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
        }
        try {
            const result = await docClient.send(
                new QueryCommand({
                    TableName: logsTable,
                    KeyConditionExpression: "userId = :uid",
                    ExpressionAttributeValues: { ":uid": userId },
                    ScanIndexForward: false, // newest first
                    Limit: 100,
                }),
            )
            return new Response(
                JSON.stringify((result.Items ?? []) as ActivityLog[]),
                { status: 200, headers: { "Content-Type": "application/json" } },
            )
        } catch (err) {
            console.error("Failed to query activity logs:", err)
            return new Response(JSON.stringify({ error: "Failed to query logs" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            })
        }
    }

    // Return all Cognito users
    const userPoolId = process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID
    if (!userPoolId) {
        return new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        })
    }

    try {
        const users: CognitoUser[] = []
        let paginationToken: string | undefined

        do {
            const result: ListUsersCommandOutput = await cognitoClient.send(
                new ListUsersCommand({
                    UserPoolId: userPoolId,
                    Limit: 60,
                    PaginationToken: paginationToken,
                }),
            )
            for (const u of result.Users ?? []) {
                users.push({
                    userId: attr(u, "sub") || u.Username || "",
                    email: attr(u, "email"),
                    status: u.UserStatus ?? "UNKNOWN",
                    enabled: u.Enabled ?? true,
                    createdAt: u.UserCreateDate?.toISOString() ?? "",
                })
            }
            paginationToken = result.PaginationToken
        } while (paginationToken)

        return new Response(JSON.stringify(users), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        })
    } catch (err) {
        console.error("Failed to list Cognito users:", err)
        return new Response(JSON.stringify({ error: "Failed to list users" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
}
