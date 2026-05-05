import {
    CognitoIdentityProviderClient,
    AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider"

const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})

// Lightweight status check called on app startup for existing sessions.
// Returns { enabled: boolean } — fails open (enabled: true) on unexpected errors
// so a transient network issue doesn't lock users out.
export async function GET(request: Request) {
    const url = new URL(request.url)
    const email = url.searchParams.get("email")

    if (!email) {
        return new Response(
            JSON.stringify({ error: "email is required" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
        )
    }

    try {
        const userResult = await cognitoClient.send(
            new AdminGetUserCommand({
                UserPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID,
                Username: email,
            }),
        )

        return new Response(
            JSON.stringify({ enabled: userResult.Enabled ?? true }),
            { status: 200, headers: { "Content-Type": "application/json" } },
        )
    } catch (error: any) {
        if (error.name === "UserNotFoundException") {
            return new Response(
                JSON.stringify({ enabled: false }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            )
        }
        console.error("check-status error:", error)
        // Fail open — unexpected errors should not lock users out
        return new Response(
            JSON.stringify({ enabled: true }),
            { status: 200, headers: { "Content-Type": "application/json" } },
        )
    }
}
