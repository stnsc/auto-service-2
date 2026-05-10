import React, { useEffect, useState } from "react"
import {
    StyleSheet,
    View,
    ScrollView,
    ActivityIndicator,
    Pressable,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../../components/replacements/NText"
import { fonts } from "../../theme"
import { useTheme } from "../../context/ThemeContext"

interface RatingEntry {
    responseId: number
    promptId: string
    promptType: string
    blindLabel: string
    accuracy: number
    helpfulness: number
    clarity: number
    average: number
}

interface EvalRecord {
    raterId: string
    submittedAt: string
    ratings: RatingEntry[]
}

function avg(nums: number[]): number {
    if (nums.length === 0) return 0
    return (
        Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100
    )
}

function StatPill({
    label,
    value,
    color,
}: {
    label: string
    value: string | number
    color: string
}) {
    const { theme } = useTheme()
    return (
        <View
            style={[
                styles.statPill,
                { borderColor: color + "44", backgroundColor: color + "11" },
            ]}
        >
            <NText
                style={[styles.statValue, { color, fontFamily: fonts.bold }]}
            >
                {value}
            </NText>
            <NText style={[styles.statLabel, { color: theme.textMuted }]}>
                {label}
            </NText>
        </View>
    )
}

export default function StudyEvalAdminPage() {
    const { theme } = useTheme()
    const [records, setRecords] = useState<EvalRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [expanded, setExpanded] = useState<string | null>(null)

    useEffect(() => {
        fetch("/api/study-eval")
            .then((r) => r.json())
            .then((data) => {
                setRecords(Array.isArray(data) ? data : [])
                setLoading(false)
            })
            .catch(() => {
                setError("Failed to load ratings")
                setLoading(false)
            })
    }, [])

    // Aggregate across all raters
    const allRatings = records.flatMap((r) => r.ratings)
    const modelAEntries = allRatings.filter((r) => r.blindLabel === "Model A")
    const modelBEntries = allRatings.filter((r) => r.blindLabel === "Model B")

    const globalAvg = avg(allRatings.map((r) => r.average))
    const modelAAvg = avg(modelAEntries.map((r) => r.average))
    const modelBAvg = avg(modelBEntries.map((r) => r.average))

    return (
        <ScrollView
            style={styles.root}
            contentContainerStyle={styles.content}
        >
            <NText style={[styles.subtitle, { color: theme.textMuted }]}>
                Aggregated quality scores from all raters. Model A =
                qwen/qwen3-32b · Model B = llama-3.1-8b-instant (labels hidden
                from raters).
            </NText>

            {loading && (
                <ActivityIndicator
                    color={theme.accent}
                    style={{ marginTop: 40 }}
                />
            )}
            {error && (
                <NText style={[styles.errorText, { color: "#ff6b6b" }]}>
                    {error}
                </NText>
            )}

            {!loading && !error && records.length === 0 && (
                <NText style={[styles.emptyText, { color: theme.textMuted }]}>
                    No evaluation submissions yet.
                </NText>
            )}

            {records.length > 0 && (
                <>
                    {/* Summary stats */}
                    <View style={styles.statsRow}>
                        <StatPill
                            label="Raters"
                            value={records.length}
                            color={theme.accent}
                        />
                        <StatPill
                            label="Global avg"
                            value={globalAvg}
                            color={theme.accent}
                        />
                        <StatPill
                            label="Model A avg"
                            value={modelAAvg}
                            color="#F59E0B"
                        />
                        <StatPill
                            label="Model B avg"
                            value={modelBAvg}
                            color="#2979FF"
                        />
                    </View>

                    <NText
                        style={[
                            styles.sectionTitle,
                            { color: theme.text, fontFamily: fonts.bold },
                        ]}
                    >
                        Submissions ({records.length})
                    </NText>

                    {records.map((rec) => {
                        const isOpen =
                            expanded === rec.raterId + rec.submittedAt
                        const recAvg = avg(rec.ratings.map((r) => r.average))
                        return (
                            <View
                                key={rec.raterId + rec.submittedAt}
                                style={[
                                    styles.card,
                                    {
                                        borderColor: theme.surfaceMid,
                                        backgroundColor:
                                            "rgba(255,255,255,0.04)",
                                    },
                                ]}
                            >
                                <Pressable
                                    onPress={() =>
                                        setExpanded(
                                            isOpen
                                                ? null
                                                : rec.raterId + rec.submittedAt,
                                        )
                                    }
                                    style={styles.cardHeader}
                                >
                                    <View style={{ flex: 1 }}>
                                        <NText
                                            style={[
                                                styles.raterName,
                                                {
                                                    color: theme.text,
                                                    fontFamily: fonts.bold,
                                                },
                                            ]}
                                        >
                                            {rec.raterId}
                                        </NText>
                                        <NText
                                            style={[
                                                styles.raterDate,
                                                { color: theme.textMuted },
                                            ]}
                                        >
                                            {new Date(
                                                rec.submittedAt,
                                            ).toLocaleString()}{" "}
                                            · avg {recAvg}/5
                                        </NText>
                                    </View>
                                    <Ionicons
                                        name={
                                            isOpen
                                                ? "chevron-up"
                                                : "chevron-down"
                                        }
                                        size={18}
                                        color={theme.textMuted}
                                    />
                                </Pressable>

                                {isOpen && (
                                    <View style={styles.tableWrapper}>
                                        {/* Table header */}
                                        <View
                                            style={[
                                                styles.tableRow,
                                                styles.tableHeader,
                                                {
                                                    borderColor:
                                                        theme.surfaceMid,
                                                },
                                            ]}
                                        >
                                            {[
                                                "ID",
                                                "Type",
                                                "Model",
                                                "Acc.",
                                                "Help.",
                                                "Clarity",
                                                "Avg",
                                            ].map((h) => (
                                                <NText
                                                    key={h}
                                                    style={[
                                                        styles.tableCell,
                                                        styles.tableHeaderText,
                                                        {
                                                            color: theme.textMuted,
                                                        },
                                                    ]}
                                                >
                                                    {h}
                                                </NText>
                                            ))}
                                        </View>
                                        {rec.ratings.map((r) => (
                                            <View
                                                key={r.responseId}
                                                style={[
                                                    styles.tableRow,
                                                    {
                                                        borderColor:
                                                            theme.surfaceMid,
                                                    },
                                                ]}
                                            >
                                                <NText
                                                    style={[
                                                        styles.tableCell,
                                                        { color: theme.text },
                                                    ]}
                                                >
                                                    {r.promptId}
                                                </NText>
                                                <NText
                                                    style={[
                                                        styles.tableCell,
                                                        {
                                                            color: theme.textMuted,
                                                        },
                                                    ]}
                                                >
                                                    {r.promptType === "simple"
                                                        ? "S"
                                                        : "C"}
                                                </NText>
                                                <NText
                                                    style={[
                                                        styles.tableCell,
                                                        {
                                                            color:
                                                                r.blindLabel ===
                                                                "Model A"
                                                                    ? "#F59E0B"
                                                                    : "#2979FF",
                                                        },
                                                    ]}
                                                >
                                                    {r.blindLabel}
                                                </NText>
                                                <NText
                                                    style={[
                                                        styles.tableCell,
                                                        { color: theme.text },
                                                    ]}
                                                >
                                                    {r.accuracy}
                                                </NText>
                                                <NText
                                                    style={[
                                                        styles.tableCell,
                                                        { color: theme.text },
                                                    ]}
                                                >
                                                    {r.helpfulness}
                                                </NText>
                                                <NText
                                                    style={[
                                                        styles.tableCell,
                                                        { color: theme.text },
                                                    ]}
                                                >
                                                    {r.clarity}
                                                </NText>
                                                <NText
                                                    style={[
                                                        styles.tableCell,
                                                        {
                                                            color: theme.accent,
                                                            fontFamily:
                                                                fonts.bold,
                                                        },
                                                    ]}
                                                >
                                                    {r.average.toFixed(2)}
                                                </NText>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )
                    })}
                </>
            )}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    content: { padding: 24, paddingBottom: 48 },
    title: { fontSize: 20, marginBottom: 6 },
    subtitle: { fontSize: 13, lineHeight: 20, marginBottom: 24 },
    errorText: { fontSize: 14, marginTop: 20 },
    emptyText: { fontSize: 14, marginTop: 40, textAlign: "center" },
    statsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 28,
    },
    statPill: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        alignItems: "center",
        minWidth: 80,
    },
    statValue: { fontSize: 20 },
    statLabel: { fontSize: 11, marginTop: 2 },
    sectionTitle: { fontSize: 14, marginBottom: 12 },
    card: {
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 12,
        overflow: "hidden",
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
    },
    raterName: { fontSize: 14 },
    raterDate: { fontSize: 12, marginTop: 2 },
    tableWrapper: {
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.08)",
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    tableHeader: { backgroundColor: "rgba(255,255,255,0.04)" },
    tableHeaderText: { fontFamily: "IosevkaCharon_700Bold" },
    tableCell: { flex: 1, fontSize: 12, textAlign: "center" },
})
