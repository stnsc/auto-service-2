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

export default function VerifyScreen() {
    const { t } = useTranslation()
    const router = useRouter()
    const { email } = useLocalSearchParams<{ email: string }>()
    const { confirmSignUp, resendConfirmationCode } = useAuthContext()

    const [code, setCode] = useState("")
    const [errors, setErrors] = useState<Record<string, string | null>>({})
    const [loading, setLoading] = useState(false)
    const [resent, setResent] = useState(false)

    const handleVerify = async () => {
        const validationRules = {
            code: [
                validators.required(
                    t("verify.codeField"),
                    t("common.isRequired"),
                ),
                validators.minLength(6, t("validation.minLength", { min: 6 })),
            ],
        }
        const formData = { code: code.trim() }
        const newErrors = validateForm(formData, validationRules)

        if (!email) {
            newErrors.code = t("verify.emailNotProvided")
        }

        setErrors(newErrors)
        if (hasErrors(newErrors)) return

        setLoading(true)

        try {
            await confirmSignUp(email!, formData.code)
            router.replace("/(auth)/pending")
        } catch (err: any) {
            setErrors({ code: err.message || t("verify.verificationFailed") })
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
            setErrors({ code: err.message || t("verify.failedToResend") })
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
            <NText style={styles.title}>{t("verify.title")}</NText>
            <NText style={styles.subtitle}>
                {t("verify.subtitlePrefix")}
                {"\n"}
                <NText style={styles.emailText}>
                    {email || t("verify.yourEmail")}
                </NText>
            </NText>

            <View style={styles.form}>
                <NInput
                    placeholder={t("verify.codePlaceholder")}
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
                        {loading ? t("verify.verifying") : t("verify.verify")}
                    </NText>
                </NButton>
            </View>

            <Pressable onPress={handleResend} style={styles.linkWrapper}>
                <NText style={styles.linkText}>
                    {resent ? (
                        <NText style={styles.linkBold}>
                            {t("verify.codeResent")}
                        </NText>
                    ) : (
                        <>
                            {t("verify.didntReceive")}{" "}
                            <NText style={styles.linkBold}>
                                {t("verify.resend")}
                            </NText>
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
