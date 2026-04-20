import { useState } from "react"
import { View, StyleSheet, Pressable } from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { NInput } from "../../components/replacements/NInput"
import { NButton } from "../../components/replacements/NButton"
import { NText } from "../../components/replacements/NText"
import { fonts } from "../../theme"
import { useAuthContext } from "../../context/AuthContext"
import { Ionicons } from "@expo/vector-icons"
import { validators, validateForm, hasErrors } from "../../utils/validation"

const VALIDATION_RULES = {
    code: [
        validators.required("Verification code"),
        validators.minLength(6),
    ],
}

export default function VerifyScreen() {
    const router = useRouter()
    const { email } = useLocalSearchParams<{ email: string }>()
    const { confirmSignUp, resendConfirmationCode } = useAuthContext()

    const [code, setCode] = useState("")
    const [errors, setErrors] = useState<Record<string, string | null>>({})
    const [loading, setLoading] = useState(false)
    const [resent, setResent] = useState(false)

    const handleVerify = async () => {
        const formData = { code: code.trim() }
        const newErrors = validateForm(formData, VALIDATION_RULES)

        if (!email) {
            newErrors.code = "Email not provided. Please go back and sign up again."
        }

        setErrors(newErrors)
        if (hasErrors(newErrors)) return

        setLoading(true)

        try {
            await confirmSignUp(email!, formData.code)
            router.replace("/(auth)/pending")
        } catch (err: any) {
            setErrors({ code: err.message || "Verification failed. Please try again." })
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        if (!email) return
        try {
            await resendConfirmationCode(email)
            setResent(true)
            setTimeout(() => setResent(false), 5000)
        } catch (err: any) {
            setErrors({ code: err.message || "Failed to resend code" })
        }
    }

    return (
        <View style={styles.container}>
            <Ionicons
                name="mail-open"
                size={48}
                color="rgba(33, 168, 112, 0.8)"
                style={styles.icon}
            />
            <NText style={styles.title}>Verify Email</NText>
            <NText style={styles.subtitle}>
                We sent a 6-digit code to{"\n"}
                <NText style={styles.emailText}>{email || "your email"}</NText>
            </NText>

            <View style={styles.form}>
                <NInput
                    placeholder="Verification Code"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    autoComplete="one-time-code"
                    failed={!!errors.code}
                    failedText={errors.code || ""}
                />

                <NButton
                    color="rgba(33, 168, 112, 0.51)"
                    onPress={handleVerify}
                >
                    <NText style={styles.buttonText}>
                        {loading ? "Verifying..." : "Verify"}
                    </NText>
                </NButton>
            </View>

            <Pressable onPress={handleResend} style={styles.linkWrapper}>
                <NText style={styles.linkText}>
                    {resent ? (
                        <NText style={styles.linkBold}>
                            Code resent! Check your inbox.
                        </NText>
                    ) : (
                        <>
                            Didn't receive the code?{" "}
                            <NText style={styles.linkBold}>Resend</NText>
                        </>
                    )}
                </NText>
            </Pressable>
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
    emailText: {
        fontFamily: fonts.bold,
        color: "#fff",
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
