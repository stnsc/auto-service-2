import React, { useState } from "react"
import { View, StyleSheet, TextInput, Linking, Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { NModal } from "../replacements/NModal"
import { NText } from "../replacements/NText"
import { useTheme } from "../../context/ThemeContext"
import { useAuthContext } from "../../context/AuthContext"
import { fonts } from "../../theme"
import { useTranslation } from "react-i18next"

interface FeedbackModalProps {
    visible: boolean
    onDismiss: () => void
}

export function FeedbackModal({ visible, onDismiss }: FeedbackModalProps) {
    const { t } = useTranslation()
    const { theme } = useTheme()
    const { userEmail, user } = useAuthContext()

    const [rating, setRating] = useState(0)
    const [message, setMessage] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState("")

    const handleClose = () => {
        setRating(0)
        setMessage("")
        setSubmitted(false)
        setError("")
        onDismiss()
    }

    const handleSubmit = async () => {
        if (rating === 0) return
        setSubmitting(true)
        setError("")
        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user?.getUsername() ?? userEmail ?? "anonymous",
                    email: userEmail ?? "",
                    rating,
                    message,
                }),
            })
            if (!res.ok) throw new Error()
            setSubmitted(true)
        } catch {
            setError(t("feedback.errorMessage"))
        } finally {
            setSubmitting(false)
        }
    }

    if (submitted) {
        return (
            <NModal
                visible={visible}
                onDismiss={handleClose}
                title={t("feedback.successTitle")}
                dismissLabel={t("common.close") as string}
            >
                <View style={styles.successContainer}>
                    <Ionicons
                        name="checkmark-circle"
                        size={64}
                        color={theme.accent}
                        style={styles.successIcon}
                    />
                    <NText
                        style={[styles.successText, { fontFamily: fonts.light }]}
                    >
                        {t("feedback.successMessage")}
                    </NText>
                </View>
            </NModal>
        )
    }

    return (
        <NModal
            visible={visible}
            onDismiss={handleClose}
            title={t("feedback.title")}
            confirmLabel={submitting ? t("feedback.submitting") : t("feedback.submit")}
            onConfirm={rating > 0 && !submitting ? handleSubmit : undefined}
            dismissLabel={t("common.cancel") as string}
        >
            <View style={styles.content}>
                <NText style={[styles.label, { fontFamily: fonts.light, color: theme.textSubtle }]}>
                    {t("feedback.ratingLabel")}
                </NText>

                <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Pressable
                            key={star}
                            onPress={() => setRating(star)}
                            style={styles.star}
                        >
                            <Ionicons
                                name={star <= rating ? "star" : "star-outline"}
                                size={36}
                                color={star <= rating ? "#f59e0b" : theme.textSubtle}
                            />
                        </Pressable>
                    ))}
                </View>

                <NText style={[styles.label, { fontFamily: fonts.light, color: theme.textSubtle, marginTop: 16 }]}>
                    {t("feedback.messageLabel")}
                </NText>

                <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder={t("feedback.messagePlaceholder")}
                    placeholderTextColor={theme.textSubtle}
                    multiline
                    numberOfLines={4}
                    style={[
                        styles.input,
                        {
                            color: theme.text,
                            borderColor: theme.border,
                            backgroundColor: theme.surfaceLight,
                            fontFamily: fonts.regular,
                        },
                    ]}
                />

                {error ? (
                    <NText style={[styles.error, { fontFamily: fonts.regular }]}>
                        {error}
                    </NText>
                ) : null}

                <Pressable
                    onPress={() =>
                        Linking.openURL(
                            "https://github.com/stnsc/auto-service-2/issues",
                        )
                    }
                    style={styles.githubRow}
                >
                    <Ionicons
                        name="logo-github"
                        size={14}
                        color={theme.textSubtle}
                    />
                    <NText
                        style={[
                            styles.githubLink,
                            { color: theme.textSubtle, fontFamily: fonts.light },
                        ]}
                    >
                        {t("feedback.githubLink")}
                    </NText>
                </Pressable>
            </View>
        </NModal>
    )
}

const styles = StyleSheet.create({
    content: {
        gap: 8,
    },
    label: {
        fontSize: 13,
        marginBottom: 4,
    },
    stars: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 8,
    },
    star: {
        padding: 4,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        minHeight: 100,
        textAlignVertical: "top",
        fontSize: 14,
    },
    error: {
        color: "#ef4444",
        fontSize: 13,
        marginTop: 4,
    },
    githubRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 8,
        justifyContent: "center",
    },
    githubLink: {
        fontSize: 12,
        textDecorationLine: "underline",
    },
    successContainer: {
        alignItems: "center",
        paddingVertical: 16,
    },
    successIcon: {
        marginBottom: 16,
    },
    successText: {
        fontSize: 15,
        textAlign: "center",
    },
})
