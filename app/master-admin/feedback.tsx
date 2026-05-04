import React, { useEffect, useState } from "react"
import { StyleSheet, View, ScrollView, ActivityIndicator } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../../components/replacements/NText"
import { fonts } from "../../theme"
import type { FeedbackEntry } from "../api/feedback+api"

function formatDate(iso: string) {
    if (!iso) return "—"
    return new Date(iso).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

function StarRow({ rating }: { rating: number }) {
    return (
        <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons
                    key={s}
                    name={s <= rating ? "star" : "star-outline"}
                    size={14}
                    color={s <= rating ? "#f59e0b" : "rgba(255,255,255,0.3)"}
                />
            ))}
        </View>
    )
}

function FeedbackCard({ entry }: { entry: FeedbackEntry }) {
    return (
        <LinearGradient
            colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.03)"]}
            style={styles.cardGradient}
        >
            <BlurView intensity={20} tint="dark" style={styles.cardInner}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardLeft}>
                        <StarRow rating={entry.rating} />
                        <NText
                            style={[
                                styles.email,
                                { fontFamily: fonts.regular },
                            ]}
                        >
                            {entry.email || "Anonymous"}
                        </NText>
                    </View>
                    <NText
                        style={[styles.date, { fontFamily: fonts.light }]}
                    >
                        {formatDate(entry.createdAt)}
                    </NText>
                </View>
                {entry.message ? (
                    <NText
                        style={[styles.message, { fontFamily: fonts.regular }]}
                    >
                        {entry.message}
                    </NText>
                ) : (
                    <NText
                        style={[styles.noMessage, { fontFamily: fonts.light }]}
                    >
                        No message provided.
                    </NText>
                )}
            </BlurView>
        </LinearGradient>
    )
}

export default function MasterAdminFeedback() {
    const [entries, setEntries] = useState<FeedbackEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/feedback")
            .then((r) => r.json())
            .then((data) => setEntries(Array.isArray(data) ? data : []))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const avgRating =
        entries.length > 0
            ? (
                  entries.reduce((s, e) => s + e.rating, 0) / entries.length
              ).toFixed(1)
            : "—"

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.summaryRow}>
                <LinearGradient
                    colors={["rgba(245,158,11,0.3)", "rgba(255,255,255,0.05)"]}
                    style={styles.summaryCard}
                >
                    <BlurView
                        intensity={30}
                        tint="dark"
                        style={styles.summaryInner}
                    >
                        <Ionicons name="star" size={22} color="#f59e0b" />
                        <NText
                            style={[
                                styles.summaryValue,
                                { fontFamily: fonts.bold },
                            ]}
                        >
                            {avgRating}
                        </NText>
                        <NText
                            style={[
                                styles.summaryLabel,
                                { fontFamily: fonts.light },
                            ]}
                        >
                            Avg. Rating
                        </NText>
                    </BlurView>
                </LinearGradient>
                <LinearGradient
                    colors={["rgba(33,168,112,0.3)", "rgba(255,255,255,0.05)"]}
                    style={styles.summaryCard}
                >
                    <BlurView
                        intensity={30}
                        tint="dark"
                        style={styles.summaryInner}
                    >
                        <Ionicons
                            name="chatbubble-ellipses-outline"
                            size={22}
                            color="#21a870"
                        />
                        <NText
                            style={[
                                styles.summaryValue,
                                { fontFamily: fonts.bold },
                            ]}
                        >
                            {loading ? "…" : String(entries.length)}
                        </NText>
                        <NText
                            style={[
                                styles.summaryLabel,
                                { fontFamily: fonts.light },
                            ]}
                        >
                            Total Submissions
                        </NText>
                    </BlurView>
                </LinearGradient>
            </View>

            {loading ? (
                <ActivityIndicator
                    color="#ffffff"
                    style={{ marginTop: 40 }}
                />
            ) : entries.length === 0 ? (
                <NText
                    style={[styles.empty, { fontFamily: fonts.light }]}
                >
                    No feedback submitted yet.
                </NText>
            ) : (
                entries.map((entry) => (
                    <FeedbackCard key={entry.feedbackId} entry={entry} />
                ))
            )}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingBottom: 40,
        gap: 12,
    },
    summaryRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 8,
    },
    summaryCard: {
        flex: 1,
        borderRadius: 16,
        overflow: "hidden",
    },
    summaryInner: {
        padding: 16,
        alignItems: "center",
        gap: 6,
        overflow: "hidden",
    },
    summaryValue: {
        color: "#ffffff",
        fontSize: 28,
    },
    summaryLabel: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 12,
    },
    cardGradient: {
        borderRadius: 16,
        overflow: "hidden",
    },
    cardInner: {
        padding: 16,
        gap: 10,
        overflow: "hidden",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    cardLeft: {
        gap: 4,
    },
    stars: {
        flexDirection: "row",
        gap: 2,
    },
    email: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 13,
    },
    date: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 12,
    },
    message: {
        color: "#ffffff",
        fontSize: 14,
        lineHeight: 20,
    },
    noMessage: {
        color: "rgba(255,255,255,0.3)",
        fontSize: 13,
        fontStyle: "italic",
    },
    empty: {
        color: "rgba(255,255,255,0.4)",
        textAlign: "center",
        marginTop: 60,
        fontSize: 15,
    },
})
