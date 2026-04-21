// Web-only helpers for persisting OAuth (Google) session tokens in localStorage.
// Cognito email/password sessions are managed by amazon-cognito-identity-js itself.

const OAUTH_SESSION_KEY = "autoservice_oauth_session"

export interface OAuthSession {
    accessToken: string
    idToken: string
    refreshToken: string
    email: string
    /** Unix timestamp (ms) when access/id tokens expire */
    expiresAt: number
}

export function saveOAuthSession(session: OAuthSession): void {
    if (typeof window === "undefined") return
    localStorage.setItem(OAUTH_SESSION_KEY, JSON.stringify(session))
}

export function getOAuthSession(): OAuthSession | null {
    if (typeof window === "undefined") return null
    try {
        const raw = localStorage.getItem(OAUTH_SESSION_KEY)
        if (!raw) return null
        const session = JSON.parse(raw) as OAuthSession
        // Treat as expired if less than 60 s remain to avoid edge cases
        if (Date.now() > session.expiresAt - 60_000) {
            localStorage.removeItem(OAUTH_SESSION_KEY)
            return null
        }
        return session
    } catch {
        return null
    }
}

export function clearOAuthSession(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(OAUTH_SESSION_KEY)
}
