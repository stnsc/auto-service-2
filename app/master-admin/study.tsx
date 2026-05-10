import React, { useEffect, useState } from "react"
import {
    StyleSheet,
    View,
    ScrollView,
    ActivityIndicator,
    Pressable,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../../components/replacements/NText"
import { fonts } from "../../theme"

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudySessionRecord {
    participantId: string
    group: "A" | "B"
    startTime: string
    endTime: string | null
    status: string
    savedAt: string
    covariates: {
        priorAppExperience: boolean
        ageGroup: string
        serviceTaskFrequency: string
    }
    metrics: {
        totalTransitions: number
        uniqueScreens: string[]
        timeToBookingSeconds: number | null
        taskSuccess: boolean
        susScore: number | null
    }
    susAnswers: number[] | null
    transitions: { route: string; secondsFromStart: number }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
    if (!iso) return "—"
    return new Date(iso).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

function formatDuration(secs: number | null | undefined) {
    if (secs == null) return "—"
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function susLabel(score: number) {
    if (score >= 90) return "Excellent (A)"
    if (score >= 80) return "Good (B)"
    if (score >= 68) return "Okay (C)"
    if (score >= 51) return "Poor (D)"
    return "Awful (F)"
}

function statusColor(status: string) {
    if (status === "completed") return "#22c55e"
    if (status === "abandoned") return "#ef4444"
    return "#f59e0b"
}

// ─── Session card ─────────────────────────────────────────────────────────────

function SessionCard({ session }: { session: StudySessionRecord }) {
    const [expanded, setExpanded] = useState(false)
    const sc = statusColor(session.status)
    const susScore = session.metrics?.susScore ?? null

    return (
        <LinearGradient
            colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.03)"]}
            style={styles.cardGradient}
        >
            <BlurView intensity={20} tint="dark" style={styles.cardInner}>
                {/* Header row */}
                <Pressable
                    onPress={() => setExpanded((v) => !v)}
                    style={styles.cardHeader}
                >
                    <View style={styles.cardHeaderLeft}>
                        <View style={[styles.groupBadge, { borderColor: sc + "88" }]}>
                            <NText style={[styles.groupText, { color: sc, fontFamily: fonts.bold }]}>
                                Group {session.group}
                            </NText>
                        </View>
                        <NText style={[styles.participantId, { fontFamily: fonts.bold }]}>
                            {session.participantId}
                        </NText>
                        <NText style={[styles.savedAt, { fontFamily: fonts.light }]}>
                            {formatDate(session.savedAt)}
                        </NText>
                    </View>
                    <View style={styles.cardHeaderRight}>
                        {susScore !== null && (
                            <View style={styles.scoreChip}>
                                <NText style={[styles.scoreChipValue, { fontFamily: fonts.bold }]}>
                                    {susScore}
                                </NText>
                                <NText style={[styles.scoreChipLabel, { fontFamily: fonts.light }]}>
                                    SUS
                                </NText>
                            </View>
                        )}
                        <View style={[styles.statusDot, { backgroundColor: sc }]} />
                        <Ionicons
                            name={expanded ? "chevron-up" : "chevron-down"}
                            size={16}
                            color="rgba(255,255,255,0.4)"
                        />
                    </View>
                </Pressable>

                {/* Collapsed summary */}
                <View style={styles.summaryRow}>
                    <SummaryPill
                        icon="timer-outline"
                        value={formatDuration(session.metrics?.timeToBookingSeconds)}
                        label="Duration"
                    />
                    <SummaryPill
                        icon="navigate-outline"
                        value={String(session.metrics?.totalTransitions ?? "—")}
                        label="Nav Steps"
                    />
                    <SummaryPill
                        icon={session.metrics?.taskSuccess ? "checkmark-circle-outline" : "close-circle-outline"}
                        value={session.metrics?.taskSuccess ? "Yes" : "No"}
                        label="Task Done"
                        valueColor={session.metrics?.taskSuccess ? "#22c55e" : "#ef4444"}
                    />
                </View>

                {/* Expanded detail */}
                {expanded && (
                    <View style={styles.expandedSection}>
                        <View style={styles.divider} />

                        {/* Covariates */}
                        <NText style={[styles.sectionLabel, { fontFamily: fonts.bold }]}>
                            Participant Info
                        </NText>
                        <InfoRow label="Age Group" value={session.covariates?.ageGroup ?? "—"} />
                        <InfoRow
                            label="Prior App Exp."
                            value={session.covariates?.priorAppExperience ? "Yes" : "No"}
                        />
                        <InfoRow
                            label="Task Frequency"
                            value={session.covariates?.serviceTaskFrequency ?? "—"}
                        />

                        {/* SUS answers */}
                        {session.susAnswers && (
                            <>
                                <View style={styles.divider} />
                                <NText style={[styles.sectionLabel, { fontFamily: fonts.bold }]}>
                                    SUS Answers
                                    {susScore !== null
                                        ? `  ·  Score ${susScore} — ${susLabel(susScore)}`
                                        : ""}
                                </NText>
                                <View style={styles.susGrid}>
                                    {session.susAnswers.map((a, i) => (
                                        <View key={i} style={styles.susCell}>
                                            <NText style={[styles.susCellQ, { fontFamily: fonts.light }]}>
                                                Q{i + 1}
                                            </NText>
                                            <NText style={[styles.susCellA, { fontFamily: fonts.bold }]}>
                                                {a}
                                            </NText>
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}

                        {/* Navigation log */}
                        {session.transitions && session.transitions.length > 0 && (
                            <>
                                <View style={styles.divider} />
                                <NText style={[styles.sectionLabel, { fontFamily: fonts.bold }]}>
                                    Navigation Log ({session.transitions.length} steps)
                                </NText>
                                <View style={styles.timeline}>
                                    {session.transitions.map((t, i) => (
                                        <View key={i} style={styles.timelineRow}>
                                            <NText style={[styles.timelineTime, { fontFamily: fonts.light }]}>
                                                {t.secondsFromStart}s
                                            </NText>
                                            <View style={styles.timelineDot} />
                                            <NText style={[styles.timelineRoute, { fontFamily: fonts.regular }]}>
                                                {t.route}
                                            </NText>
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}
                    </View>
                )}
            </BlurView>
        </LinearGradient>
    )
}

function SummaryPill({
    icon,
    value,
    label,
    valueColor,
}: {
    icon: keyof typeof Ionicons.glyphMap
    value: string
    label: string
    valueColor?: string
}) {
    return (
        <View style={styles.pill}>
            <Ionicons name={icon} size={13} color="rgba(255,255,255,0.4)" />
            <NText style={[styles.pillValue, { fontFamily: fonts.bold, color: valueColor ?? "#fff" }]}>
                {value}
            </NText>
            <NText style={[styles.pillLabel, { fontFamily: fonts.light }]}>
                {label}
            </NText>
        </View>
    )
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.infoRow}>
            <NText style={[styles.infoLabel, { fontFamily: fonts.light }]}>{label}</NText>
            <NText style={[styles.infoValue, { fontFamily: fonts.regular }]}>{value}</NText>
        </View>
    )
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function MasterAdminStudy() {
    const [sessions, setSessions] = useState<StudySessionRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const load = () => {
        setLoading(true)
        setError(false)
        fetch("/api/study-session")
            .then((r) => r.json())
            .then((data) => setSessions(Array.isArray(data) ? data : []))
            .catch(() => setError(true))
            .finally(() => setLoading(false))
    }

    useEffect(() => { load() }, [])

    const completed = sessions.filter((s) => s.status === "completed")
    const avgSus =
        completed.length > 0
            ? (
                  completed
                      .map((s) => s.metrics?.susScore ?? 0)
                      .reduce((a, b) => a + b, 0) / completed.length
              ).toFixed(1)
            : "—"
    const groupACnt = sessions.filter((s) => s.group === "A").length
    const groupBCnt = sessions.filter((s) => s.group === "B").length

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Summary cards */}
            <View style={styles.summaryRow}>
                <SummaryCard icon="people-outline" value={String(sessions.length)} label="Total Sessions" color="#6366f1" />
                <SummaryCard icon="bar-chart-outline" value={String(avgSus)} label="Avg. SUS Score" color="#f59e0b" />
                <SummaryCard icon="checkmark-circle-outline" value={String(completed.length)} label="Completed" color="#22c55e" />
                <SummaryCard icon="git-branch-outline" value={`A:${groupACnt} / B:${groupBCnt}`} label="Group Split" color="#38bdf8" />
            </View>

            {/* Refresh */}
            <Pressable onPress={load} style={styles.refreshRow}>
                <Ionicons name="refresh-outline" size={14} color="rgba(255,255,255,0.4)" />
                <NText style={[styles.refreshLabel, { fontFamily: fonts.light }]}>
                    Refresh
                </NText>
            </Pressable>

            {loading ? (
                <ActivityIndicator color="#ffffff" style={{ marginTop: 40 }} />
            ) : error ? (
                <NText style={[styles.empty, { fontFamily: fonts.light }]}>
                    Failed to load sessions. Check server logs.
                </NText>
            ) : sessions.length === 0 ? (
                <NText style={[styles.empty, { fontFamily: fonts.light }]}>
                    No study sessions uploaded yet.
                </NText>
            ) : (
                sessions.map((s) => (
                    <SessionCard
                        key={`${s.participantId}-${s.startTime}`}
                        session={s}
                    />
                ))
            )}
        </ScrollView>
    )
}

function SummaryCard({
    icon,
    value,
    label,
    color,
}: {
    icon: keyof typeof Ionicons.glyphMap
    value: string
    label: string
    color: string
}) {
    return (
        <LinearGradient
            colors={[color + "33", "rgba(255,255,255,0.04)"]}
            style={styles.summaryCard}
        >
            <BlurView intensity={30} tint="dark" style={styles.summaryInner}>
                <Ionicons name={icon} size={20} color={color} />
                <NText style={[styles.summaryValue, { fontFamily: fonts.bold }]}>
                    {value}
                </NText>
                <NText style={[styles.summaryLabel, { fontFamily: fonts.light }]}>
                    {label}
                </NText>
            </BlurView>
        </LinearGradient>
    )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingBottom: 40, gap: 12 },

    summaryRow: { flexDirection: "row", gap: 10, marginBottom: 4, flexWrap: "wrap" },
    summaryCard: { flex: 1, minWidth: 120, borderRadius: 14, overflow: "hidden" },
    summaryInner: { padding: 14, alignItems: "center", gap: 4, overflow: "hidden" },
    summaryValue: { color: "#fff", fontSize: 22 },
    summaryLabel: { color: "rgba(255,255,255,0.55)", fontSize: 11, textAlign: "center" },

    refreshRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
    refreshLabel: { color: "rgba(255,255,255,0.4)", fontSize: 12 },

    cardGradient: { borderRadius: 16, overflow: "hidden" },
    cardInner: { padding: 16, gap: 10, overflow: "hidden" },

    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    cardHeaderLeft: { gap: 2, flex: 1 },
    cardHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },

    groupBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start", marginBottom: 2 },
    groupText: { fontSize: 11 },
    participantId: { color: "#fff", fontSize: 15 },
    savedAt: { color: "rgba(255,255,255,0.4)", fontSize: 12 },

    scoreChip: { alignItems: "center" },
    scoreChipValue: { color: "#fff", fontSize: 18 },
    scoreChipLabel: { color: "rgba(255,255,255,0.4)", fontSize: 10 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },

    pill: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
    pillValue: { fontSize: 13 },
    pillLabel: { color: "rgba(255,255,255,0.45)", fontSize: 11 },

    expandedSection: { gap: 8 },
    divider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 4 },
    sectionLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11, letterSpacing: 0.5, marginBottom: 4 },

    infoRow: { flexDirection: "row", justifyContent: "space-between" },
    infoLabel: { color: "rgba(255,255,255,0.5)", fontSize: 13 },
    infoValue: { color: "#fff", fontSize: 13 },

    susGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    susCell: { alignItems: "center", width: 36 },
    susCellQ: { color: "rgba(255,255,255,0.4)", fontSize: 10 },
    susCellA: { color: "#fff", fontSize: 16 },

    timeline: { gap: 4 },
    timelineRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    timelineTime: { color: "rgba(255,255,255,0.4)", fontSize: 11, width: 32 },
    timelineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#6366f1" },
    timelineRoute: { color: "rgba(255,255,255,0.7)", fontSize: 12, flex: 1 },

    empty: { color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: 60, fontSize: 15 },
})
