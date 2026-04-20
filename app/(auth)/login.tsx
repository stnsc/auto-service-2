import { useState } from "react"
import { View, StyleSheet, Pressable, Image } from "react-native"
import { useRouter } from "expo-router"
import { NInput } from "../../components/replacements/NInput"
import { NButton } from "../../components/replacements/NButton"
import { NText } from "../../components/replacements/NText"
import { fonts } from "../../theme"
import { useAuthContext } from "../../context/AuthContext"
import { validators, validateForm, hasErrors } from "../../utils/validation"

const VALIDATION_RULES = {
    email: [validators.required("Email"), validators.email()],
    password: [validators.required("Password")],
}

export default function LoginScreen() {
    const router = useRouter()
    const { signIn } = useAuthContext()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [errors, setErrors] = useState<Record<string, string | null>>({})
    const [loading, setLoading] = useState(false)

    const handleLogin = async () => {
        const formData = { email: email.trim(), password }
        const newErrors = validateForm(formData, VALIDATION_RULES)
        setErrors(newErrors)

        if (hasErrors(newErrors)) return

        setLoading(true)

        try {
            await signIn(formData.email, password)
        } catch (err: any) {
            if (err.message === "User is disabled.") {
                router.replace("/(auth)/pending")
            } else if (err.code === "UserNotConfirmedException") {
                router.push({
                    pathname: "/(auth)/verify",
                    params: { email: formData.email },
                })
            } else {
                setErrors((prev) => ({
                    ...prev,
                    password: err.message || "Login failed. Please try again.",
                }))
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <View style={styles.container}>
            <Image
                source={require("../../assets/autoservice/logo.png")}
                style={styles.logo}
            />
            <NText style={styles.title}>Welcome To The Closed Alpha!</NText>
            <NText style={styles.subtitle}>Sign in to AutoService</NText>

            <View style={styles.form}>
                <NInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    failed={!!errors.email}
                    failedText={errors.email || ""}
                />

                <NInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password"
                    failed={!!errors.password}
                    failedText={errors.password || ""}
                />

                <NButton color="rgba(33, 168, 112, 0.51)" onPress={handleLogin}>
                    <NText style={styles.buttonText}>
                        {loading ? "Signing in..." : "Sign In"}
                    </NText>
                </NButton>
            </View>

            <NButton
                color="rgba(255, 255, 255, 0.15)"
                onPress={() => router.push("/(auth)/signup")}
                style={styles.linkWrapper}
            >
                <NText style={styles.linkText}>
                    Don't have an account?{" "}
                    <NText style={styles.linkBold}>Sign Up</NText>
                </NText>
            </NButton>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 8,
    },
    icon: {
        alignSelf: "center",
        marginBottom: 12,
    },
    title: {
        fontFamily: fonts.bold,
        fontSize: 28,
        color: "#fff",
        textAlign: "center",
    },
    subtitle: {
        fontFamily: fonts.regular,
        fontSize: 16,
        color: "rgba(255,255,255,0.6)",
        textAlign: "center",
        marginBottom: 32,
    },
    form: {
        gap: 12,
    },
    buttonText: {
        fontFamily: fonts.bold,
        color: "#fff",
        fontSize: 16,
    },
    linkWrapper: {
        marginTop: 24,
        alignSelf: "center",
    },
    linkText: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 14,
    },
    linkBold: {
        fontFamily: fonts.bold,
        color: "#fff",
    },
    logo: {
        transform: [{ scale: 0.35 }],
        alignSelf: "center",
        marginBottom: 20,
    },
})
