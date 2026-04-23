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
import { useTranslation } from "react-i18next"
import "../../i18n"

export default function ForgotPasswordScreen() {
    const { t } = useTranslation()
    const router = useRouter()
    const { forgotPassword } = useAuthContext()

    const [email, setEmail] = useState("")
    const [errors, setErrors] = useState<Record<string, string | null>>({})
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        const validationRules = {
            email: [
                validators.required(
                    t("forgotPassword.emailField"),
                    t("common.isRequired"),
                ),
                validators.email(t("validation.invalidEmail")),
            ],
        }
        const formData = { email: email.trim() }
        const newErrors = validateForm(formData, validationRules)
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
                email: err.message || t("forgotPassword.sendFailed"),
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
            <NText style={styles.title}>{t("forgotPassword.title")}</NText>
            <NText style={styles.subtitle}>
                {t("forgotPassword.subtitle")}
            </NText>

            <View style={styles.form}>
                <NInput
                    placeholder={t("forgotPassword.emailPlaceholder")}
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
                        {loading
                            ? t("forgotPassword.sending")
                            : t("forgotPassword.sendResetCode")}
                    </NText>
                </NButton>
            </View>

            <NButton onPress={() => router.back()} style={styles.linkWrapper}>
                <NText style={styles.linkText}>
                    {t("forgotPassword.rememberPassword")}{" "}
                    <NText style={styles.linkBold}>
                        {t("forgotPassword.signIn")}
                    </NText>
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
