import { Platform } from "react-native"

export async function logLogin(
    userId: string,
    provider: "cognito" | "google",
): Promise<void> {
    // On web the browser provides a rich user-agent string; on native we fall
    // back to the platform name and OS version.
    const userAgent =
        Platform.OS === "web"
            ? navigator.userAgent
            : `${Platform.OS} ${Platform.Version}`

    try {
        await fetch("/api/auth/log-action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId,
                action: "LOGIN",
                payload: { provider, userAgent },
            }),
        })
    } catch (err) {
        // Logging failures must never interrupt the sign-in flow
        console.error("Failed to log login event:", err)
    }
}
