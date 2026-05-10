import {
    View,
    StyleSheet,
    ScrollView,
    Platform,
    Pressable,
} from "react-native"
import { useState } from "react"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { NButton } from "../components/replacements/NButton"
import { NText } from "../components/replacements/NText"
import { GlassCard } from "../components/replacements/GlassCard"
import { useTheme } from "../context/ThemeContext"
import {
    useStudyContext,
    StudyMetrics,
} from "../context/StudyContext"
import { fonts } from "../theme"

// ─── Helper components ────────────────────────────────────────────────────────

function MetricCard({
    icon,
    label,
    value,
    sub,
    color,
}: {
    icon: keyof typeof Ionicons.glyphMap
    label: string
    value: string
    sub?: string
    color: string
}) {
    const { theme } = useTheme()
    return (
        <GlassCard
            color={color}
            borderRadius={14}
            style={styles.metricCardOuter}
            innerStyle={styles.metricCardInner}
        >
            <Ionicons name={icon} size={22} color={color} style={{ marginBottom: 8 }} />
            <NText style={[styles.metricValue, { color: theme.text, fontFamily: fonts.bold }]}>
                {value}
            </NText>
            <NText style={[styles.metricLabel, { color: theme.textMuted }]}>
                {label}
            </NText>
            {sub && (
                <NText style={[styles.metricSub, { color: theme.textSubtle }]}>
                    {sub}
                </NText>
            )}
        </GlassCard>
    )
}

function ScoreBar({
    score,
    color,
}: {
    score: number
    color: string
}) {
    const { theme } = useTheme()
    const pct = Math.min(score, 100)
    return (
        <View style={styles.scoreBarWrapper}>
            {/* Benchmarks */}
            <View
                style={[styles.benchmark, { left: "68%" as any }]}
                pointerEvents="none"
            >
                <View style={[styles.benchmarkLine, { backgroundColor: theme.textSubtle }]} />
                <NText style={[styles.benchmarkLabel, { color: theme.textSubtle }]}>
                    68
                </NText>
            </View>
            <View
                style={[styles.benchmark, { left: "80%" as any }]}
                pointerEvents="none"
            >
                <View style={[styles.benchmarkLine, { backgroundColor: theme.textSubtle }]} />
                <NText style={[styles.benchmarkLabel, { color: theme.textSubtle }]}>
                    80
                </NText>
            </View>
            <View
                style={[styles.benchmark, { left: "90%" as any }]}
                pointerEvents="none"
            >
                <View style={[styles.benchmarkLine, { backgroundColor: theme.textSubtle }]} />
                <NText style={[styles.benchmarkLabel, { color: theme.textSubtle }]}>
                    90
                </NText>
            </View>
            <View style={[styles.scoreBarTrack, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
                <View
                    style={[
                        styles.scoreBarFill,
                        { width: `${pct}%` as any, backgroundColor: color },
                    ]}
                />
            </View>
        </View>
    )
}

function TransitionTimeline({
    transitions,
    startTime,
}: {
    transitions: { route: string; secondsFromStart: number }[]
    startTime: number
}) {
    const { theme } = useTheme()
    return (
        <View style={styles.timeline}>
            {transitions.map((t, i) => (
                <View key={i} style={styles.timelineRow}>
                    <NText style={[styles.timelineTime, { color: theme.textSubtle }]}>
                        {t.secondsFromStart}s
                    </NText>
                    <View
                        style={[styles.timelineDot, { backgroundColor: theme.accent }]}
                    />
                    <NText style={[styles.timelineRoute, { color: theme.textMuted }]}>
                        {t.route}
                    </NText>
                </View>
            ))}
        </View>
    )
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function StudyResultsScreen() {
    const { theme } = useTheme()
    const router = useRouter()
    const { t } = useTranslation()
    const { session, computeMetrics, exportData, clearSession } = useStudyContext()
    const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")

    const metrics: StudyMetrics | null = computeMetrics()

    const scoreLabel = (score: number) => {
        if (score >= 90) return t("study.score.excellent")
        if (score >= 80) return t("study.score.good")
        if (score >= 68) return t("study.score.okay")
        if (score >= 51) return t("study.score.poor")
        return t("study.score.awful")
    }

    const formatTime = (secs: number | null) => {
        if (secs === null) return "—"
        const m = Math.floor(secs / 60)
        const s = secs % 60
        return m > 0 ? `${m}m ${s}s` : `${s}s`
    }

    const copyToClipboard = () => {
        const data = exportData()
        if (Platform.OS === "web") {
            try {
                navigator.clipboard.writeText(data)
            } catch {
                // fallback: create a textarea and copy
                const el = document.createElement("textarea")
                el.value = data
                document.body.appendChild(el)
                el.select()
                document.execCommand("copy")
                document.body.removeChild(el)
            }
        }
    }

    const uploadToDynamoDB = async () => {
        if (uploadStatus === "uploading" || uploadStatus === "success") return
        setUploadStatus("uploading")
        try {
            const data = exportData()
            const res = await fetch("/api/study-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: data,
            })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            setUploadStatus("success")
        } catch (err) {
            console.error("Failed to upload study session:", err)
            setUploadStatus("error")
        }
    }

    const handleNewSession = () => {
        clearSession()
        router.replace("/study-setup" as any)
    }

    if (!session) {
        return (
            <View
                style={[
                    styles.root,
                    styles.centered,
                ]}
            >
                <NText style={{ color: theme.textMuted }}>
                    {t("study.results.noSession")}
                </NText>
                <NButton
                    style={{ marginTop: 16 }}
                    onPress={() => router.replace("/study-setup" as any)}
                >
                    <NText style={{ color: theme.text, fontFamily: fonts.bold }}>
                        {t("study.results.startNew")}
                    </NText>
                </NButton>
            </View>
        )
    }

    const exportedTransitions: { route: string; secondsFromStart: number }[] =
        session.transitions.map((t) => ({
            route: t.route,
            secondsFromStart: Math.round(
                (t.timestamp - session.startTime) / 1000,
            ),
        }))

    return (
        <ScrollView
            style={styles.root}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.header}>
                <View
                    style={[
                        styles.statusBadge,
                        {
                            backgroundColor:
                                session.status === "completed"
                                    ? "#22c55e22"
                                    : session.status === "abandoned"
                                    ? "#ef444422"
                                    : "#f59e0b22",
                            borderColor:
                                session.status === "completed"
                                    ? "#22c55e"
                                    : session.status === "abandoned"
                                    ? "#ef4444"
                                    : "#f59e0b",
                        },
                    ]}
                >
                    <Ionicons
                        name={
                            session.status === "completed"
                                ? "checkmark-circle"
                                : session.status === "abandoned"
                                ? "close-circle"
                                : "time"
                        }
                        size={16}
                        color={
                            session.status === "completed"
                                ? "#22c55e"
                                : session.status === "abandoned"
                                ? "#ef4444"
                                : "#f59e0b"
                        }
                        style={{ marginRight: 6 }}
                    />
                    <NText
                        style={[
                            styles.statusText,
                            {
                                color:
                                    session.status === "completed"
                                        ? "#22c55e"
                                        : session.status === "abandoned"
                                        ? "#ef4444"
                                        : "#f59e0b",
                                fontFamily: fonts.bold,
                            },
                        ]}
                    >
                        {session.status.charAt(0).toUpperCase() +
                            session.status.slice(1)}
                    </NText>
                </View>

                <NText
                    style={[
                        styles.title,
                        { color: theme.text, fontFamily: fonts.bold },
                    ]}
                >
                    {t("study.results.title")}
                </NText>
                <NText style={[styles.subtitle, { color: theme.textMuted }]}>
                    Participant {session.participantId} · Group {session.group}
                </NText>
            </View>

            {/* Covariates */}
            <GlassCard borderRadius={14} style={styles.cardOuter} innerStyle={styles.cardInner}>
                <NText
                    style={[
                        styles.cardTitle,
                        { color: theme.text, fontFamily: fonts.bold },
                    ]}
                >
                    {t("study.results.participantInfo")}
                </NText>
                <View style={styles.infoRow}>
                    <NText style={[styles.infoLabel, { color: theme.textMuted }]}>{t("study.results.priorExpLabel")}</NText>
                    <NText style={[styles.infoValue, { color: theme.text }]}>
                        {session.covariates.priorAppExperience ? t("study.setup.yes") : t("study.setup.no")}
                    </NText>
                </View>
                <View style={styles.infoRow}>
                    <NText style={[styles.infoLabel, { color: theme.textMuted }]}>{t("study.results.ageGroupLabel")}</NText>
                    <NText style={[styles.infoValue, { color: theme.text }]}>
                        {session.covariates.ageGroup}
                    </NText>
                </View>
                <View style={styles.infoRow}>
                    <NText style={[styles.infoLabel, { color: theme.textMuted }]}>{t("study.results.frequencyLabel")}</NText>
                    <NText style={[styles.infoValue, { color: theme.text }]}>
                        {session.covariates.serviceTaskFrequency}
                    </NText>
                </View>
            </GlassCard>

            {/* Key metrics */}
            <NText
                style={[
                    styles.sectionTitle,
                    { color: theme.textMuted, fontFamily: fonts.bold },
                ]}
            >
                {t("study.results.measuredVars")}
            </NText>
            <View style={styles.metricsGrid}>
                <MetricCard
                    icon="navigate"
                    label={t("study.results.transitions")}
                    value={
                        session.group === "B"
                            ? "N/A"
                            : metrics
                            ? String(metrics.totalTransitions)
                            : "—"
                    }
                    sub={
                        session.group === "B"
                            ? t("study.results.externalSession")
                            : metrics
                            ? t("study.results.uniqueScreens", { count: metrics.uniqueScreens.length })
                            : undefined
                    }
                    color={theme.accent}
                />
                <MetricCard
                    icon="timer"
                    label={t("study.results.timeToBooking")}
                    value={formatTime(metrics?.timeToBookingSeconds ?? null)}
                    sub={
                        session.status !== "completed"
                            ? t("study.results.taskNotCompleted")
                            : undefined
                    }
                    color={theme.accent}
                />
                <MetricCard
                    icon={session.status === "completed" ? "checkmark-circle" : "close-circle"}
                    label={t("study.results.taskSuccess")}
                    value={session.status === "completed" ? t("study.setup.yes") : t("study.setup.no")}
                    color={
                        session.status === "completed" ? "#22c55e" : "#ef4444"
                    }
                />
                <MetricCard
                    icon="bar-chart"
                    label={t("study.results.susScore")}
                    value={
                        metrics?.susScore !== null &&
                        metrics?.susScore !== undefined
                            ? String(metrics.susScore)
                            : "—"
                    }
                    sub={
                        metrics?.susScore !== null &&
                        metrics?.susScore !== undefined
                            ? scoreLabel(metrics.susScore)
                            : undefined
                    }
                    color={theme.accent}
                />
            </View>

            {/* SUS score bar */}
            {metrics?.susScore !== null && metrics?.susScore !== undefined && (
                <GlassCard borderRadius={14} style={styles.cardOuter} innerStyle={styles.cardInner}>
                    <NText
                        style={[
                            styles.cardTitle,
                            { color: theme.text, fontFamily: fonts.bold },
                        ]}
                    >
                        {t("study.results.susScore")}: {metrics.susScore} — {scoreLabel(metrics.susScore)}
                    </NText>
                    <ScoreBar score={metrics.susScore} color={theme.accent} />
                    <NText style={[styles.benchmarkNote, { color: theme.textSubtle }]}>
                        {t("study.results.benchmarkNote")}
                    </NText>
                </GlassCard>
            )}

            {/* Screen transition log */}
            <GlassCard borderRadius={14} style={styles.cardOuter} innerStyle={styles.cardInner}>
                <NText
                    style={[
                        styles.cardTitle,
                        { color: theme.text, fontFamily: fonts.bold },
                    ]}
                >
                    {t("study.results.navigationLog", { count: session.transitions.length })}
                </NText>
                {session.transitions.length === 0 ? (
                    <NText style={{ color: theme.textSubtle }}>
                        {t("study.results.noTransitions")}
                    </NText>
                ) : (
                    <TransitionTimeline
                        transitions={exportedTransitions}
                        startTime={session.startTime}
                    />
                )}
            </GlassCard>

            {/* Export */}
            <NText
                style={[
                    styles.sectionTitle,
                    { color: theme.textMuted, fontFamily: fonts.bold },
                ]}
            >
                {t("study.results.exportData")}
            </NText>
            <NButton
                color={
                    uploadStatus === "success"
                        ? "#22c55e"
                        : uploadStatus === "error"
                        ? "#ef4444"
                        : theme.accent
                }
                onPress={uploadToDynamoDB}
                style={styles.exportBtn}
            >
                <View style={styles.btnInner}>
                    <Ionicons
                        name={
                            uploadStatus === "success"
                                ? "checkmark-circle-outline"
                                : uploadStatus === "error"
                                ? "alert-circle-outline"
                                : uploadStatus === "uploading"
                                ? "cloud-upload-outline"
                                : "cloud-upload-outline"
                        }
                        size={18}
                        color="#fff"
                        style={{ marginRight: 8 }}
                    />
                    <NText
                        style={[
                            styles.exportBtnText,
                            { color: "#fff", fontFamily: fonts.bold },
                        ]}
                    >
                        {uploadStatus === "success"
                            ? t("study.results.uploadSuccess")
                            : uploadStatus === "error"
                            ? t("study.results.uploadError")
                            : uploadStatus === "uploading"
                            ? t("study.results.uploading")
                            : t("study.results.uploadDynamo")}
                    </NText>
                </View>
            </NButton>
            <NButton
                color="rgba(255,255,255,0.08)"
                onPress={copyToClipboard}
                style={styles.exportBtn}
            >
                <View style={styles.btnInner}>
                    <Ionicons
                        name="copy-outline"
                        size={18}
                        color={theme.text}
                        style={{ marginRight: 8 }}
                    />
                    <NText
                        style={[
                            styles.exportBtnText,
                            { color: theme.text, fontFamily: fonts.bold },
                        ]}
                    >
                        {t("study.results.copyClipboard")}
                    </NText>
                </View>
            </NButton>

            {/* New session */}
            <View style={styles.divider} />
            <NButton
                color="rgba(255,255,255,0.06)"
                onPress={handleNewSession}
                style={styles.exportBtn}
            >
                <NText
                    style={[
                        styles.exportBtnText,
                        { color: theme.textMuted, fontFamily: fonts.bold },
                    ]}
                >
                    {t("study.results.startNew")}
                </NText>
            </NButton>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    centered: {
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        padding: 24,
        paddingBottom: 48,
    },
    header: {
        alignItems: "center",
        marginBottom: 24,
        paddingTop: Platform.OS === "web" ? 16 : 48,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 10,
    },
    statusText: {
        fontSize: 13,
    },
    title: {
        fontSize: 24,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
    },
    sectionTitle: {
        fontSize: 11,
        letterSpacing: 1,
        marginBottom: 12,
        marginTop: 4,
    },
    metricsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 20,
    },
    metricCardOuter: {
        flex: 1,
        minWidth: "45%" as any,
    },
    metricCardInner: {
        padding: 14,
        alignItems: "center",
    },
    metricValue: {
        fontSize: 22,
        marginBottom: 2,
    },
    metricLabel: {
        fontSize: 11,
        textAlign: "center",
    },
    metricSub: {
        fontSize: 10,
        textAlign: "center",
        marginTop: 2,
    },
    cardOuter: {
        marginBottom: 16,
    },
    cardInner: {
        padding: 16,
    },
    cardTitle: {
        fontSize: 15,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 4,
    },
    infoLabel: {
        fontSize: 13,
    },
    infoValue: {
        fontSize: 13,
    },
    scoreBarWrapper: {
        position: "relative",
        marginBottom: 28,
        marginTop: 4,
    },
    benchmark: {
        position: "absolute",
        top: 0,
        bottom: 0,
        alignItems: "center",
        zIndex: 1,
    },
    benchmarkLine: {
        width: 1,
        height: 16,
        marginBottom: 2,
    },
    benchmarkLabel: {
        fontSize: 9,
    },
    scoreBarTrack: {
        height: 8,
        borderRadius: 4,
        overflow: "hidden",
        marginTop: 20,
    },
    scoreBarFill: {
        height: 8,
        borderRadius: 4,
    },
    benchmarkNote: {
        fontSize: 10,
        textAlign: "center",
        marginTop: 4,
    },
    timeline: {
        gap: 6,
    },
    timelineRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    timelineTime: {
        fontSize: 11,
        width: 36,
        textAlign: "right",
    },
    timelineDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    timelineRoute: {
        fontSize: 12,
        flex: 1,
    },
    exportBtn: {
        marginBottom: 10,
    },
    exportBtnText: {
        fontSize: 15,
    },
    btnInner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    divider: {
        height: 1,
        backgroundColor: "rgba(255,255,255,0.08)",
        marginVertical: 16,
    },
})
