import { useState } from "react"
import { View, StyleSheet, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { NInput } from "../../components/replacements/NInput"
import { NButton } from "../../components/replacements/NButton"
import { NText } from "../../components/replacements/NText"
import { fonts } from "../../theme"
import { useAuthContext } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { Ionicons } from "@expo/vector-icons"
import {
    validators,
    validateForm,
    hasErrors,
    ValidationRule,
} from "../../utils/validation"
import { useGoogleAuth } from "../../hooks/useGoogleAuth"
import { useTranslation } from "react-i18next"
import "../../i18n"

export default function SignUpScreen() {
    const { t } = useTranslation()
    const router = useRouter()
    const { signUp } = useAuthContext()
    const { theme } = useTheme()
    const {
        promptAsync,
        loading: googleLoading,
        error: googleError,
        request,
    } = useGoogleAuth()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [errors, setErrors] = useState<Record<string, string | null>>({})
    const [loading, setLoading] = useState(false)

    const handleSignUp = async () => {
        const validationRules: Record<string, ValidationRule[]> = {
            email: [
                validators.required(
                    t("signup.emailField"),
                    t("common.isRequired"),
                ),
                validators.email(t("validation.invalidEmail")),
            ],
            password: [
                validators.required(
                    t("signup.passwordField"),
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
                    t("signup.confirmPasswordField"),
                    t("common.isRequired"),
                ),
                validators.matches(
                    () => password,
                    t("signup.passwordsDoNotMatch"),
                ),
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
                email: err.message || t("signup.signUpFailed"),
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
            <NText style={styles.title}>{t("signup.title")}</NText>
            <NText style={[styles.subtitle, { color: theme.textMuted }]}>
                {t("signup.subtitle")}
            </NText>

            <View style={styles.form}>
                <NInput
                    placeholder={t("signup.emailPlaceholder")}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    failed={!!errors.email}
                    failedText={errors.email || ""}
                />

                <NInput
                    placeholder={t("signup.passwordPlaceholder")}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="new-password"
                    failed={!!errors.password}
                    failedText={errors.password || ""}
                />

                <NInput
                    placeholder={t("signup.confirmPasswordPlaceholder")}
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
                        {loading
                            ? t("signup.creatingAccount")
                            : t("signup.createAccount")}
                    </NText>
                </NButton>

                <View style={styles.dividerRow}>
                    <View
                        style={[
                            styles.dividerLine,
                            { backgroundColor: theme.surfaceHigh },
                        ]}
                    />
                    <NText
                        style={[
                            styles.dividerText,
                            { color: theme.textSubtle },
                        ]}
                    >
                        {t("common.or")}
                    </NText>
                    <View
                        style={[
                            styles.dividerLine,
                            { backgroundColor: theme.surfaceHigh },
                        ]}
                    />
                </View>

                <NButton
                    color="rgba(255, 255, 255, 0.15)"
                    onPress={() => promptAsync()}
                    style={!request ? styles.buttonDisabled : undefined}
                >
                    <View style={styles.googleRow}>
                        <Ionicons
                            name="logo-google"
                            size={18}
                            color={theme.icon}
                        />
                        <NText style={styles.buttonText}>
                            {googleLoading
                                ? t("common.signingIn")
                                : t("common.continueWithGoogle")}
                        </NText>
                    </View>
                </NButton>

                {googleError && (
                    <NText style={[styles.errorText, { color: theme.error }]}>
                        {googleError}
                    </NText>
                )}
            </View>

            <NButton
                onPress={() => router.push("/(auth)/login")}
                style={styles.linkWrapper}
            >
                <NText style={[styles.linkText, { color: theme.textMuted }]}>
                    {t("signup.alreadyHaveAccount")}{" "}
                    <NText style={styles.linkBold}>{t("signup.logIn")}</NText>
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
        textAlign: "center",
    },
    subtitle: {
        fontFamily: fonts.regular,
        fontSize: 16,
        textAlign: "center",
        marginBottom: 32,
    },
    form: {
        gap: 12,
    },
    buttonText: {
        fontFamily: fonts.bold,
        fontSize: 16,
    },
    googleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginVertical: 2,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        fontSize: 13,
    },
    errorText: {
        fontSize: 13,
        textAlign: "center",
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    linkWrapper: {
        marginTop: 24,
        alignSelf: "center",
    },
    linkText: {
        fontSize: 14,
    },
    linkBold: {
        fontFamily: fonts.bold,
    },
})
