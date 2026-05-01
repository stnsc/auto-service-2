import React, { useState, useEffect } from "react"
import { View, StyleSheet, ActivityIndicator, Pressable } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams } from "expo-router"
import { NText } from "../components/replacements/NText"
import { NButton } from "../components/replacements/NButton"
import { fonts } from "../theme"
import { useTranslation } from "react-i18next"
import "../i18n"

interface RatingInfo {
    appointmentId: string
    serviceId: string
    serviceName?: string
    customerName: string
    preferredDate: string
    preferredTime: string
    alreadyRated: false
}

export default function RateScreen() {
    const { t } = useTranslation()
    const { t: token } = useLocalSearchParams<{ t: string }>()

    const [info, setInfo] = useState<RatingInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [alreadyRated, setAlreadyRated] = useState(false)

    const [selectedRating, setSelectedRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [comment, setComment] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    useEffect(() => {
        if (!token) {
            setError(t("rate.invalidLink"))
            setLoading(false)
            return
        }
        fetch(`/api/rate?t=${encodeURIComponent(token)}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.error === "Already rated") {
                    setAlreadyRated(true)
                } else if (data.error) {
                    setError(data.error)
                } else {
                    setInfo(data)
                }
            })
            .catch(() => setError(t("rate.loadError")))
            .finally(() => setLoading(false))
    }, [token])

    const handleSubmit = async () => {
        if (!selectedRating || !token) return
        setSubmitting(true)
        try {
            const res = await fetch("/api/rate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    rating: selectedRating,
                    comment,
                }),
            })
            if (res.ok) {
                setSubmitted(true)
            } else {
                const err = await res.json()
                setError(err.error ?? t("rate.submitError"))
            }
        } catch {
            setError(t("rate.submitError"))
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color="rgba(33,168,112,0.8)" size="large" />
            </View>
        )
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Ionicons
                    name="alert-circle-outline"
                    size={48}
                    color="rgba(220,80,80,0.8)"
                />
                <NText
                    style={[styles.stateTitle, { fontFamily: fonts.medium }]}
                >
                    {t("rate.errorTitle")}
                </NText>
                <NText style={[styles.stateSub, { fontFamily: fonts.light }]}>
                    {error}
                </NText>
            </View>
        )
    }

    if (alreadyRated) {
        return (
            <View style={styles.center}>
                <Ionicons
                    name="checkmark-circle-outline"
                    size={48}
                    color="rgba(33,168,112,0.8)"
                />
                <NText
                    style={[styles.stateTitle, { fontFamily: fonts.medium }]}
                >
                    {t("rate.alreadyRatedTitle")}
                </NText>
                <NText style={[styles.stateSub, { fontFamily: fonts.light }]}>
                    {t("rate.alreadyRatedDesc")}
                </NText>
            </View>
        )
    }

    if (submitted) {
        return (
            <View style={styles.center}>
                <Ionicons
                    name="heart-outline"
                    size={48}
                    color="rgba(33,168,112,0.8)"
                />
                <NText
                    style={[styles.stateTitle, { fontFamily: fonts.medium }]}
                >
                    {t("rate.thankYouTitle")}
                </NText>
                <NText style={[styles.stateSub, { fontFamily: fonts.light }]}>
                    {t("rate.thankYouDesc")}
                </NText>
            </View>
        )
    }

    const displayRating = hoveredRating || selectedRating

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <LinearGradient
                    colors={[
                        "rgba(255,255,255,0.12)",
                        "rgba(255,255,255,0.04)",
                    ]}
                    style={styles.cardGradient}
                >
                    <BlurView
                        intensity={20}
                        tint="dark"
                        style={styles.cardInner}
                    >
                        {/* Header */}
                        <NText
                            style={[
                                styles.cardTitle,
                                { fontFamily: fonts.medium },
                            ]}
                        >
                            {t("rate.title")}
                        </NText>
                        {info?.serviceName && (
                            <NText
                                style={[
                                    styles.serviceName,
                                    { fontFamily: fonts.light },
                                ]}
                            >
                                {info.serviceName}
                            </NText>
                        )}
                        {info && (
                            <NText
                                style={[
                                    styles.apptInfo,
                                    { fontFamily: fonts.light },
                                ]}
                            >
                                {info.preferredDate} · {info.preferredTime}
                            </NText>
                        )}

                        {/* Stars */}
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Pressable
                                    key={star}
                                    onPress={() => setSelectedRating(star)}
                                    onHoverIn={() => setHoveredRating(star)}
                                    onHoverOut={() => setHoveredRating(0)}
                                    style={styles.starBtn}
                                >
                                    <Ionicons
                                        name={
                                            star <= displayRating
                                                ? "star"
                                                : "star-outline"
                                        }
                                        size={36}
                                        color={
                                            star <= displayRating
                                                ? "#f59e0b"
                                                : "rgba(255,255,255,0.25)"
                                        }
                                    />
                                </Pressable>
                            ))}
                        </View>

                        {selectedRating > 0 && (
                            <NText
                                style={[
                                    styles.ratingLabel,
                                    { fontFamily: fonts.light },
                                ]}
                            >
                                {t(`rate.stars.${selectedRating}`)}
                            </NText>
                        )}

                        {/* Comment */}
                        <View style={styles.commentWrapper}>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder={t("rate.commentPlaceholder")}
                                style={{
                                    width: "100%",
                                    minHeight: 80,
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    borderRadius: 10,
                                    padding: "10px 12px",
                                    color: "#ffffff",
                                    fontSize: 14,
                                    fontFamily: fonts.regular,
                                    resize: "vertical",
                                    outline: "none",
                                    boxSizing: "border-box",
                                }}
                            />
                        </View>

                        {error ? (
                            <NText
                                style={[
                                    styles.errorText,
                                    { fontFamily: fonts.light },
                                ]}
                            >
                                {error}
                            </NText>
                        ) : null}

                        {/* Submit */}
                        <NButton
                            onPress={handleSubmit}
                            disabled={!selectedRating || submitting}
                            color="rgba(33,168,112,0.5)"
                            style={styles.submitBtn}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <NText
                                    style={[
                                        styles.submitText,
                                        { fontFamily: fonts.medium },
                                    ]}
                                >
                                    {t("rate.submit")}
                                </NText>
                            )}
                        </NButton>
                    </BlurView>
                </LinearGradient>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
        gap: 12,
    },
    stateTitle: {
        color: "#ffffff",
        fontSize: 20,
        textAlign: "center",
    },
    stateSub: {
        color: "rgba(255,255,255,0.55)",
        fontSize: 15,
        textAlign: "center",
        maxWidth: 300,
    },
    card: {
        width: "100%",
        maxWidth: 480,
        borderRadius: 20,
        overflow: "hidden",
    },
    cardGradient: { padding: 1.5, borderRadius: 20 },
    cardInner: {
        borderRadius: 18,
        overflow: "hidden",
        padding: 28,
        gap: 8,
    },
    cardTitle: {
        color: "#ffffff",
        fontSize: 22,
        textAlign: "center",
        marginBottom: 4,
    },
    serviceName: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 16,
        textAlign: "center",
    },
    apptInfo: {
        color: "rgba(255,255,255,0.45)",
        fontSize: 14,
        textAlign: "center",
        marginBottom: 8,
    },
    starsRow: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
        marginVertical: 12,
    },
    starBtn: { padding: 4 },
    ratingLabel: {
        color: "rgba(245,158,11,0.9)",
        fontSize: 14,
        textAlign: "center",
        marginBottom: 8,
    },
    commentWrapper: {
        marginVertical: 8,
    },
    errorText: {
        color: "rgba(220,80,80,0.9)",
        fontSize: 13,
        textAlign: "center",
    },
    submitBtn: {
        marginTop: 12,
    },
    submitText: { color: "#ffffff", fontSize: 15 },
})
