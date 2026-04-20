import { useState } from "react"
import { View, StyleSheet, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { NInput } from "../../components/replacements/NInput"
import { NButton } from "../../components/replacements/NButton"
import { NText } from "../../components/replacements/NText"
import { fonts } from "../../theme"
import { useAuthContext } from "../../context/AuthContext"
import { Ionicons } from "@expo/vector-icons"
import {
    validators,
    validateForm,
    hasErrors,
    ValidationRule,
} from "../../utils/validation"

export default function SignUpScreen() {
    const router = useRouter()
    const { signUp } = useAuthContext()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [errors, setErrors] = useState<Record<string, string | null>>({})
    const [loading, setLoading] = useState(false)

    const handleSignUp = async () => {
        const validationRules: Record<string, ValidationRule[]> = {
            email: [validators.required("Email"), validators.email()],
            password: [validators.required("Password"), validators.password()],
            confirmPassword: [
                validators.required("Confirm password"),
                validators.matches(() => password, "Passwords do not match"),
            ],
        }

        const formData = {
            email: email.trim(),
            password,
            confirmPassword,
        }
        const newErrors = validateForm(formData, validationRules)
        setErrors(newErrors)

        if (hasErrors(newErrors)) return

        setLoading(true)

        try {
            await signUp(formData.email, password)
            router.push({
                pathname: "/(auth)/verify",
                params: { email: formData.email },
            })
        } catch (err: any) {
            setErrors((prev) => ({
                ...prev,
                email: err.message || "Sign up failed. Please try again.",
            }))
        } finally {
            setLoading(false)
        }
    }

    return (
        <View style={styles.container}>
            <Ionicons
                name="person-add"
                size={48}
                color="rgba(33, 168, 112, 0.8)"
                style={styles.icon}
            />
            <NText style={styles.title}>Create Account</NText>
            <NText style={styles.subtitle}>
                Join the AutoService closed alpha
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

                <NInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="new-password"
                    failed={!!errors.password}
                    failedText={errors.password || ""}
                />

                <NInput
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="new-password"
                    failed={!!errors.confirmPassword}
                    failedText={errors.confirmPassword || ""}
                />

                <NButton
                    color="rgba(33, 168, 112, 0.51)"
                    onPress={handleSignUp}
                >
                    <NText style={styles.buttonText}>
                        {loading ? "Creating account..." : "Create Account"}
                    </NText>
                </NButton>
            </View>

            <NButton
                color="rgba(255, 255, 255, 0.15)"
                onPress={() => router.push("/(auth)/login")}
                style={styles.linkWrapper}
            >
                <NText style={styles.linkText}>
                    Already have an account?{" "}
                    <NText style={styles.linkBold}>Log In</NText>
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
