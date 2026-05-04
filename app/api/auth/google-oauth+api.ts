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

// Called after a successful Cognito Hosted UI OAuth flow.
// Returns "approved" for enabled users, "pending" for manually disabled ones.
export async function POST(request: Request) {
    const { username } = await request.json()

    if (!username) {
        return new Response(
            JSON.stringify({ error: "username is required" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
        )
    }

    try {
        const userResult = await cognitoClient.send(
            new AdminGetUserCommand({
                UserPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID,
                Username: username,
            }),
        )

        const isEnabled = userResult.Enabled ?? true
        const email =
            userResult.UserAttributes?.find((a) => a.Name === "email")
                ?.Value ?? username

        if (!isEnabled) {
            return new Response(
                JSON.stringify({ status: "pending", email }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            )
        }

        return new Response(
            JSON.stringify({ status: "approved", email }),
            { status: 200, headers: { "Content-Type": "application/json" } },
        )
    } catch (error: any) {
        if (error.name === "UserNotFoundException") {
            return new Response(
                JSON.stringify({ error: "User not found in pool" }),
                { status: 404, headers: { "Content-Type": "application/json" } },
            )
        }
        console.error("Google OAuth processing error:", error)
        return new Response(
            JSON.stringify({ error: "Failed to process OAuth sign-in" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        )
    }
}
