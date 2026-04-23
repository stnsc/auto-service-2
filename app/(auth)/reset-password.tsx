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
import { useTranslation } from "react-i18next"
import "../../i18n"

export default function ResetPasswordScreen() {
    const { t } = useTranslation()
    const router = useRouter()
    const { email } = useLocalSearchParams<{ email: string }>()
    const { confirmNewPassword } = useAuthContext()

    const [code, setCode] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [errors, setErrors] = useState<Record<string, string | null>>({})
    const [loading, setLoading] = useState(false)

    const handleReset = async () => {
        const validationRules = {
            code: [
                validators.required(
                    t("resetPassword.codeField"),
                    t("common.isRequired"),
                ),
                validators.minLength(6, t("validation.minLength", { min: 6 })),
            ],
            password: [
                validators.required(
                    t("resetPassword.passwordField"),
                    t("common.isRequired"),
                ),
                validators.password({
                    minLength: t("validation.passwordMinLength"),
                    uppercase: t("validation.passwordUppercase"),
                    lowercase: t("validation.passwordLowercase"),
                    number: t("validation.passwordNumber"),
                }),
            ],
            confirmPassword: [
                validators.required(
                    t("resetPassword.confirmPasswordField"),
                    t("common.isRequired"),
                ),
            ],
        }
        const formData = {
            code: code.trim(),
            password,
            confirmPassword,
        }
        const newErrors = validateForm(formData, validationRules)

        if (!newErrors.confirmPassword && password !== confirmPassword) {
            newErrors.confirmPassword = t("resetPassword.passwordsDoNotMatch")
        }

        if (!email) {
            newErrors.code = t("resetPassword.emailNotProvided")
        }

        setErrors(newErrors)
        if (hasErrors(newErrors)) return

        setLoading(true)
        try {
            await confirmNewPassword(email!, formData.code, formData.password)
            router.replace("/(auth)/login")
        } catch (err: any) {
            setErrors({
                code: err.message || t("resetPassword.resetFailed"),
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
            <NText style={styles.title}>{t("resetPassword.title")}</NText>
            <NText style={styles.subtitle}>
                {t("resetPassword.subtitlePrefix")}
                {"\n"}
                <NText style={styles.emailText}>
                    {email || t("resetPassword.yourEmail")}
                </NText>
            </NText>

            <View style={styles.form}>
                <NInput
                    placeholder={t("resetPassword.codePlaceholder")}
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
                    <NText style={styles.dividerLabel}>
                        {t("resetPassword.newPasswordDivider")}
                    </NText>
                    <View style={styles.dividerLine} />
                </View>

                <NInput
                    placeholder={t("resetPassword.newPasswordPlaceholder")}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="new-password"
                    failed={!!errors.password}
                    failedText={errors.password || ""}
                />

                <NInput
                    placeholder={t(
                        "resetPassword.confirmNewPasswordPlaceholder",
                    )}
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
                        {loading
                            ? t("resetPassword.resetting")
                            : t("resetPassword.resetPasswordBtn")}
                    </NText>
                </NButton>
            </View>

            <NButton
                onPress={() => router.replace("/(auth)/login")}
                style={styles.linkWrapper}
            >
                <NText style={styles.linkText}>
                    {t("resetPassword.backTo")}{" "}
                    <NText style={styles.linkBold}>
                        {t("resetPassword.signIn")}
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
