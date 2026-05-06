import { View, StyleSheet, Platform } from "react-native"
import { useEffect, useState } from "react"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { Ionicons } from "@expo/vector-icons"
import { NButton } from "../components/replacements/NButton"
import { NText } from "../components/replacements/NText"
import { GlassCard } from "../components/replacements/GlassCard"
import { useTheme } from "../context/ThemeContext"
import { useStudyContext } from "../context/StudyContext"
import { fonts } from "../theme"

export default function StudyTimerScreen() {
    const { theme } = useTheme()
    const router = useRouter()
    const { t } = useTranslation()
    const { session, completeSession, abandonSession } = useStudyContext()

    const [elapsed, setElapsed] = useState(0)

    useEffect(() => {
        if (!session) return
        const tick = () =>
            setElapsed(Math.round((Date.now() - session.startTime) / 1000))
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [session?.startTime])

    const formatElapsed = (secs: number) => {
        const m = Math.floor(secs / 60)
        const s = secs % 60
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    }

    const handleComplete = () => {
        completeSession()
        router.replace("/study-sus" as any)
    }

    const handleAbandon = () => {
        abandonSession()
        router.replace("/study-sus" as any)
    }

    return (
        <View style={styles.root}>
            {/* Header */}
            <View style={styles.header}>
                <View
                    style={[
                        styles.groupBadge,
                        {
                            backgroundColor: theme.accent + "22",
                            borderColor: theme.accent + "55",
                        },
                    ]}
                >
                    <NText
                        style={[
                            styles.groupBadgeText,
                            { color: theme.accent, fontFamily: fonts.bold },
                        ]}
                    >
                        {t("study.timer.groupBadge")}
                    </NText>
                </View>
                <NText
                    style={[
                        styles.title,
                        { color: theme.text, fontFamily: fonts.bold },
                    ]}
                >
                    {t("study.timer.title")}
                </NText>
                {session?.participantId ? (
                    <NText
                        style={[styles.subtitle, { color: theme.textMuted }]}
                    >
                        {t("study.timer.participant")} {session.participantId}
                    </NText>
                ) : null}
            </View>

            {/* Big stopwatch */}
            <View style={styles.timerBlock}>
                <NText
                    style={[
                        styles.timerDisplay,
                        { color: theme.accent, fontFamily: fonts.bold },
                    ]}
                >
                    {formatElapsed(elapsed)}
                </NText>
                <NText style={[styles.timerLabel, { color: theme.textMuted }]}>
                    {t("study.timer.elapsed")}
                </NText>
            </View>

            {/* Task reminder card */}
            <GlassCard
                borderRadius={12}
                style={styles.taskCardOuter}
                innerStyle={styles.taskCardInner}
            >
                <NText
                    style={[
                        styles.taskTitle,
                        { color: theme.textMuted, fontFamily: fonts.bold },
                    ]}
                >
                    {t("study.timer.taskTitle")}
                </NText>
                <NText style={[styles.taskBody, { color: theme.text }]}>
                    {t("study.timer.taskBody")}
                </NText>
            </GlassCard>

            {/* Action buttons */}
            <NButton
                color="#22c55e"
                onPress={handleComplete}
                style={styles.btn}
            >
                <View style={styles.btnInner}>
                    <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#fff"
                        style={{ marginRight: 8 }}
                    />
                    <NText
                        style={[
                            styles.btnText,
                            { color: "#fff", fontFamily: fonts.bold },
                        ]}
                    >
                        {t("study.timer.bookingConfirmed")}
                    </NText>
                </View>
            </NButton>

            <NButton
                color="rgba(239,68,68,0.12)"
                onPress={handleAbandon}
                style={[styles.btn]}
            >
                <View style={styles.btnInner}>
                    <Ionicons
                        name="close-circle"
                        size={18}
                        color="#ef4444"
                        style={{ marginRight: 8 }}
                    />
                    <NText
                        style={[
                            styles.btnText,
                            { color: "#ef4444", fontFamily: fonts.bold },
                        ]}
                    >
                        {t("study.timer.participantGaveUp")}
                    </NText>
                </View>
            </NButton>

            <NText style={[styles.instruction, { color: theme.textSubtle }]}>
                {t("study.timer.instruction")}
            </NText>
        </View>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: Platform.OS === "web" ? 48 : 64,
        paddingBottom: 40,
        justifyContent: "center",
    },
    header: {
        alignItems: "center",
        marginBottom: 32,
    },
    groupBadge: {
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 5,
        marginBottom: 10,
    },
    groupBadgeText: {
        fontSize: 11,
        letterSpacing: 1.5,
    },
    title: {
        fontSize: 22,
        textAlign: "center",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
    },
    timerBlock: {
        alignItems: "center",
        marginBottom: 32,
    },
    timerDisplay: {
        fontSize: 72,
        lineHeight: 80,
        letterSpacing: -2,
    },
    timerLabel: {
        fontSize: 13,
        marginTop: 4,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    taskCardOuter: {
        marginBottom: 28,
    },
    taskCardInner: {
        padding: 16,
    },
    taskTitle: {
        fontSize: 11,
        letterSpacing: 1,
        marginBottom: 8,
    },
    taskBody: {
        fontSize: 15,
        lineHeight: 22,
        fontStyle: "italic",
    },
    btn: {
        marginBottom: 10,
    },
    btnInner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    btnText: {
        fontSize: 15,
    },
    instruction: {
        fontSize: 12,
        textAlign: "center",
        marginTop: 16,
        lineHeight: 18,
    },
})
