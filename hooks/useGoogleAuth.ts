// Hook that handles the full Google → Cognito Hosted UI OAuth flow.
//
// Prerequisites (one-time AWS + Google setup):
//   1. In AWS Cognito → User pool → Sign-in experience → Federated identity
//      provider sign-in, add Google as an IdP using your Google OAuth client
//      ID & secret.
//   2. In AWS Cognito → App clients → your client → Hosted UI, set:
//        - Allowed callback URL: <your-origin>/oauth-callback
//          (e.g. https://yourapp.vercel.app/oauth-callback and
//               http://localhost:8081/oauth-callback for dev)
//        - Allowed sign-out URL: <your-origin>
//        - OAuth 2.0 grant types: Authorization code grant
//        - OpenID Connect scopes: email, openid, profile
//   3. In Google Cloud Console → OAuth 2.0 client → Authorized redirect URIs,
//      add the Cognito domain callback:
//        https://<COGNITO_DOMAIN>/oauth2/idpresponse
//   4. Set EXPO_PUBLIC_COGNITO_DOMAIN in .env (see below).

import { useState, useEffect, useRef } from "react"
import * as AuthSession from "expo-auth-session"
import * as WebBrowser from "expo-web-browser"
import { useRouter } from "expo-router"
import { useAuthContext } from "../context/AuthContext"

WebBrowser.maybeCompleteAuthSession()

const COGNITO_DOMAIN = process.env.EXPO_PUBLIC_COGNITO_DOMAIN ?? ""
const CLIENT_ID = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID ?? ""

export function useGoogleAuth() {
    const { signInWithGoogle } = useAuthContext()
    const router = useRouter()

    const redirectUri = AuthSession.makeRedirectUri({ path: "oauth-callback" })

    const discovery = {
        authorizationEndpoint: `https://${COGNITO_DOMAIN}/oauth2/authorize`,
        tokenEndpoint: `https://${COGNITO_DOMAIN}/oauth2/token`,
    }

    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: CLIENT_ID,
            scopes: ["email", "openid", "profile"],
            responseType: AuthSession.ResponseType.Code,
            redirectUri,
            usePKCE: true,
            extraParams: {
                // Skip Cognito's own login UI and go straight to Google
                identity_provider: "Google",
            },
        },
        discovery,
    )

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Keep a stable ref so the token-exchange callback always sees the latest
    // code_verifier even if the effect captures a stale closure.
    const codeVerifierRef = useRef<string | undefined>(undefined)
    useEffect(() => {
        if (request?.codeVerifier) {
            codeVerifierRef.current = request.codeVerifier
        }
    }, [request])

    useEffect(() => {
        if (!response) return

        if (response.type === "success") {
            exchangeCode(response.params.code)
        } else if (response.type === "error") {
            // Cognito returns these errors when the user's account is disabled
            // (still pending admin approval).
            const errorCode = response.error?.code ?? String(response.error ?? "")
            const errorDesc = response.params?.error_description ?? ""
            const isPending =
                errorCode === "access_denied" ||
                errorDesc.includes("not enabled") ||
                errorDesc.includes("User is disabled")

            if (isPending) {
                router.replace("/(auth)/pending")
            } else {
                setError("Google sign-in failed. Please try again.")
            }
        }
    }, [response])

    const exchangeCode = async (code: string) => {
        setLoading(true)
        setError(null)
        try {
            const tokenRes = await fetch(
                `https://${COGNITO_DOMAIN}/oauth2/token`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        grant_type: "authorization_code",
                        client_id: CLIENT_ID,
                        code,
                        redirect_uri: redirectUri,
                        ...(codeVerifierRef.current
                            ? { code_verifier: codeVerifierRef.current }
                            : {}),
                    }).toString(),
                },
            )

            if (!tokenRes.ok) {
                throw new Error("Token exchange failed")
            }

            const tokens = await tokenRes.json()
            const result = await signInWithGoogle(
                tokens.access_token,
                tokens.id_token,
                tokens.refresh_token,
                tokens.expires_in,
            )

            if (result.status === "pending") {
                router.replace("/(auth)/pending")
            }
            // "approved" → AuthContext sets isAuthenticated, root layout redirects to /
        } catch (err: any) {
            setError(err.message ?? "Google sign-in failed. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return {
        /** Call this when the user presses the Google sign-in button */
        promptAsync,
        /** True while exchanging the auth code or calling the backend */
        loading,
        /** Non-null when something went wrong */
        error,
        /** Becomes non-null once expo-auth-session has built the request */
        request,
    }
}
