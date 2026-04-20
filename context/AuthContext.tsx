import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react"
import {
    CognitoUser,
    CognitoUserAttribute,
    AuthenticationDetails,
    CognitoUserSession,
} from "amazon-cognito-identity-js"
import { userPool } from "../utils/cognito"

interface AuthContextType {
    user: CognitoUser | null
    userEmail: string | null
    isLoading: boolean
    isAuthenticated: boolean
    isPendingApproval: boolean
    signUp: (email: string, password: string) => Promise<void>
    confirmSignUp: (email: string, code: string) => Promise<void>
    resendConfirmationCode: (email: string) => Promise<void>
    signIn: (email: string, password: string) => Promise<void>
    signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<CognitoUser | null>(null)
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isPendingApproval, setIsPendingApproval] = useState(false)

    // Check for existing session on mount
    useEffect(() => {
        const currentUser = userPool.getCurrentUser()
        if (currentUser) {
            currentUser.getSession(
                (err: Error | null, session: CognitoUserSession | null) => {
                    if (!err && session?.isValid()) {
                        setUser(currentUser)
                        // Fetch the email attribute instead of getUsername()
                        // which may return an internal UUID
                        currentUser.getUserAttributes(
                            (attrErr, attributes) => {
                                const email = attributes?.find(
                                    (a) => a.getName() === "email",
                                )
                                setUserEmail(
                                    email
                                        ? email.getValue()
                                        : currentUser.getUsername(),
                                )
                                setIsAuthenticated(true)
                                setIsLoading(false)
                            },
                        )
                        return
                    }
                    setIsLoading(false)
                },
            )
        } else {
            setIsLoading(false)
        }
    }, [])

    const signUp = useCallback(
        async (email: string, password: string): Promise<void> => {
            return new Promise((resolve, reject) => {
                const attributes = [
                    new CognitoUserAttribute({
                        Name: "email",
                        Value: email,
                    }),
                ]
                userPool.signUp(
                    email,
                    password,
                    attributes,
                    [],
                    (err, _result) => {
                        if (err) {
                            reject(err)
                            return
                        }
                        resolve()
                    },
                )
            })
        },
        [],
    )

    const confirmSignUp = useCallback(
        async (email: string, code: string): Promise<void> => {
            return new Promise((resolve, reject) => {
                const cognitoUser = new CognitoUser({
                    Username: email,
                    Pool: userPool,
                })
                cognitoUser.confirmRegistration(
                    code,
                    true,
                    async (err, _result) => {
                        if (err) {
                            reject(err)
                            return
                        }
                        // Auto-disable user for closed alpha approval
                        try {
                            await fetch("/api/auth/disable-user", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ email }),
                            })
                        } catch (disableErr) {
                            console.error("Failed to disable user:", disableErr)
                        }
                        setIsPendingApproval(true)
                        resolve()
                    },
                )
            })
        },
        [],
    )

    const resendConfirmationCode = useCallback(
        async (email: string): Promise<void> => {
            return new Promise((resolve, reject) => {
                const cognitoUser = new CognitoUser({
                    Username: email,
                    Pool: userPool,
                })
                cognitoUser.resendConfirmationCode((err, _result) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    resolve()
                })
            })
        },
        [],
    )

    const signIn = useCallback(
        async (email: string, password: string): Promise<void> => {
            return new Promise((resolve, reject) => {
                const cognitoUser = new CognitoUser({
                    Username: email,
                    Pool: userPool,
                })
                const authDetails = new AuthenticationDetails({
                    Username: email,
                    Password: password,
                })
                cognitoUser.authenticateUser(authDetails, {
                    onSuccess: (_session) => {
                        setUser(cognitoUser)
                        setUserEmail(email)
                        setIsAuthenticated(true)
                        setIsPendingApproval(false)
                        resolve()
                    },
                    onFailure: (err) => {
                        if (err.message === "User is disabled.") {
                            setIsPendingApproval(true)
                        }
                        reject(err)
                    },
                })
            })
        },
        [],
    )

    const signOut = useCallback(() => {
        const currentUser = userPool.getCurrentUser()
        if (currentUser) {
            currentUser.signOut()
        }
        setUser(null)
        setUserEmail(null)
        setIsAuthenticated(false)
        setIsPendingApproval(false)
    }, [])

    return (
        <AuthContext.Provider
            value={{
                user,
                userEmail,
                isLoading,
                isAuthenticated,
                isPendingApproval,
                signUp,
                confirmSignUp,
                resendConfirmationCode,
                signIn,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuthContext() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuthContext must be used within AuthProvider")
    }
    return context
}
