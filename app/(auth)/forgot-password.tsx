import { useState } from "react"
import { View, StyleSheet, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { NInput } from "../../components/replacements/NInput"
import { NButton } from "../../components/replacements/NButton"
import { NText } from "../../components/replacements/NText"
import { fonts } from "../../theme"
import { useAuthContext } from "../../context/AuthContext"
import { Ionicons } from "@expo/vector-icons"
import { validators, validateForm, hasErrors } from "../../utils/validation"

const VALIDATION_RULES = {
    email: [validators.required("Email"), validators.email()],
}

export default function ForgotPasswordScreen() {
    const router = useRouter()
    const { forgotPassword } = useAuthContext()

    const [email, setEmail] = useState("")
    const [errors, setErrors] = useState<Record<string, string | null>>({})
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        const formData = { email: email.trim() }
        const newErrors = validateForm(formData, VALIDATION_RULES)
        setErrors(newErrors)
        if (hasErrors(newErrors)) return

        setLoading(true)
        try {
            await forgotPassword(formData.email)
            router.push({
                pathname: "/(auth)/reset-password",
                params: { email: formData.email },
            })
        } catch (err: any) {
            setErrors({
                email:
                    err.message ||
                    "Failed to send reset code. Please try again.",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <View style={styles.container}>
            <Ionicons
                name="lock-closed-outline"
                size={48}
                color="rgba(33, 168, 112, 0.8)"
                style={styles.icon}
            />
            <NText style={styles.title}>Forgot Password?</NText>
            <NText style={styles.subtitle}>
                Enter your email and we'll send you a code to reset your
                password.
            </NText>

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

                <NButton
                    color="rgba(33, 168, 112, 0.51)"
                    onPress={handleSubmit}
                >
                    <NText style={styles.buttonText}>
                        {loading ? "Sending..." : "Send Reset Code"}
                    </NText>
                </NButton>
            </View>

            <NButton onPress={() => router.back()} style={styles.linkWrapper}>
                <NText style={styles.linkText}>
                    Remember your password?{" "}
                    <NText style={styles.linkBold}>Sign In</NText>
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
})
