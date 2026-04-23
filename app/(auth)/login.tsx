import { useState } from "react"
import { View, StyleSheet, Pressable, Image, ScrollView } from "react-native"
import { useRouter } from "expo-router"
import { NInput } from "../../components/replacements/NInput"
import { NButton } from "../../components/replacements/NButton"
import { NText } from "../../components/replacements/NText"
import { fonts } from "../../theme"
import { useAuthContext } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { validators, validateForm, hasErrors } from "../../utils/validation"
import { useGoogleAuth } from "../../hooks/useGoogleAuth"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import "../../i18n"

export default function LoginScreen() {
    const { t } = useTranslation()
    const router = useRouter()
    const { signIn } = useAuthContext()
    const { theme } = useTheme()
    const {
        promptAsync,
        loading: googleLoading,
        error: googleError,
        request,
    } = useGoogleAuth()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [errors, setErrors] = useState<Record<string, string | null>>({})
    const [loading, setLoading] = useState(false)

    const handleLogin = async () => {
        const validationRules = {
            email: [
                validators.required(
                    t("login.emailField"),
                    t("common.isRequired"),
                ),
                validators.email(t("validation.invalidEmail")),
            ],
            password: [
                validators.required(
                    t("login.passwordField"),
                    t("common.isRequired"),
                ),
            ],
        }
        const formData = { email: email.trim(), password }
        const newErrors = validateForm(formData, validationRules)
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
                    password: err.message || t("login.loginFailed"),
                }))
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    width: "100%",
                    alignSelf: "center",
                    padding: 20,
                    paddingBottom: 40,
                }}
            >
                <Image
                    source={require("../../assets/autoservice/logo.png")}
                    style={styles.logo}
                />
                <NText style={styles.title}>{t("login.title")}</NText>
                <NText style={[styles.subtitle, { color: theme.textMuted }]}>
                    {t("login.subtitle")}
                </NText>

                <View style={styles.form}>
                    <NInput
                        placeholder={t("login.emailPlaceholder")}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        failed={!!errors.email}
                        failedText={errors.email || ""}
                    />

                    <NInput
                        placeholder={t("login.passwordPlaceholder")}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        autoComplete="password"
                        failed={!!errors.password}
                        failedText={errors.password || ""}
                    />

                    <NButton
                        color="rgba(33, 168, 112, 0.51)"
                        onPress={handleLogin}
                    >
                        <NText style={styles.buttonText}>
                            {loading ? t("login.signingIn") : t("login.signIn")}
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
                        <NText
                            style={[styles.errorText, { color: theme.error }]}
                        >
                            {googleError}
                        </NText>
                    )}
                </View>

                <View
                    style={{
                        display: "flex",
                        justifyContent: "center",
                    }}
                >
                    <NButton
                        onPress={() => router.push("/(auth)/forgot-password")}
                        style={styles.linkWrapper}
                    >
                        <NText
                            style={[
                                styles.linkText,
                                { color: theme.textMuted },
                            ]}
                        >
                            {t("login.forgotPassword")}{" "}
                            <NText style={styles.linkBold}>
                                {t("login.resetIt")}
                            </NText>
                        </NText>
                    </NButton>

                    <NButton
                        onPress={() => router.push("/(auth)/signup")}
                        style={styles.linkWrapper}
                    >
                        <NText
                            style={[
                                styles.linkText,
                                { color: theme.textMuted },
                            ]}
                        >
                            {t("login.noAccount")}{" "}
                            <NText style={styles.linkBold}>
                                {t("login.signUp")}
                            </NText>
                        </NText>
                    </NButton>
                </View>
            </ScrollView>
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
    logo: {
        transform: [{ scale: 0.35 }],
        alignSelf: "center",
        marginBottom: 20,
    },
})
