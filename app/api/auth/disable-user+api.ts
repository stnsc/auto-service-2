import {
    CognitoIdentityProviderClient,
    AdminDisableUserCommand,
} from "@aws-sdk/client-cognito-identity-provider"

const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})

export async function POST(request: Request) {
    const { email } = await request.json()

    if (!email) {
        return new Response(
            JSON.stringify({ error: "Email is required" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
        )
    }

    try {
        await cognitoClient.send(
            new AdminDisableUserCommand({
                UserPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID,
                Username: email,
            }),
        )

        return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { "Content-Type": "application/json" } },
        )
    } catch (error) {
        console.error("Failed to disable user:", error)
        return new Response(
            JSON.stringify({ error: "Failed to disable user" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        )
    }
}
