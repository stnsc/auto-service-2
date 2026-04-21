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
    code: [validators.required("Reset code"), validators.minLength(6)],
    password: [validators.required("Password"), validators.password()],
    confirmPassword: [validators.required("Confirm password")],
}

export default function ResetPasswordScreen() {
    const router = useRouter()
    const { email } = useLocalSearchParams<{ email: string }>()
    const { confirmNewPassword } = useAuthContext()

    const [code, setCode] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [errors, setErrors] = useState<Record<string, string | null>>({})
    const [loading, setLoading] = useState(false)

    const handleReset = async () => {
        const formData = {
            code: code.trim(),
            password,
            confirmPassword,
        }
        const newErrors = validateForm(formData, VALIDATION_RULES)

        if (!newErrors.confirmPassword && password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match"
        }

        if (!email) {
            newErrors.code = "Email not provided. Please start over."
        }

        setErrors(newErrors)
        if (hasErrors(newErrors)) return

        setLoading(true)
        try {
            await confirmNewPassword(email!, formData.code, formData.password)
            router.replace("/(auth)/login")
        } catch (err: any) {
            setErrors({
                code: err.message || "Reset failed. Please try again.",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <View style={styles.container}>
            <Ionicons
                name="key-outline"
                size={48}
                color="rgba(33, 168, 112, 0.8)"
                style={styles.icon}
            />
            <NText style={styles.title}>Reset Password</NText>
            <NText style={styles.subtitle}>
                Enter the code sent to{"\n"}
                <NText style={styles.emailText}>{email || "your email"}</NText>
            </NText>

            <View style={styles.form}>
                <NInput
                    placeholder="Reset Code"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    autoComplete="one-time-code"
                    failed={!!errors.code}
                    failedText={errors.code || ""}
                    overlayColor="rgba(10, 10, 10, 0.3)"
                />

                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <NText style={styles.dividerLabel}>New Password</NText>
                    <View style={styles.dividerLine} />
                </View>

                <NInput
                    placeholder="New Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="new-password"
                    failed={!!errors.password}
                    failedText={errors.password || ""}
                />

                <NInput
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="new-password"
                    failed={!!errors.confirmPassword}
                    failedText={errors.confirmPassword || ""}
                />

                <NButton color="rgba(33, 168, 112, 0.51)" onPress={handleReset}>
                    <NText style={styles.buttonText}>
                        {loading ? "Resetting..." : "Reset Password"}
                    </NText>
                </NButton>
            </View>

            <NButton
                onPress={() => router.replace("/(auth)/login")}
                style={styles.linkWrapper}
            >
                <NText style={styles.linkText}>
                    Back to <NText style={styles.linkBold}>Sign In</NText>
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
    emailText: {
        fontFamily: fonts.bold,
        color: "#fff",
    },
    form: {
        gap: 12,
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginVertical: 4,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "rgba(255,255,255,0.15)",
    },
    dividerLabel: {
        fontSize: 12,
        color: "rgba(255,255,255,0.4)",
        fontFamily: fonts.regular,
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
