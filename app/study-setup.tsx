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
import { NInput } from "../components/replacements/NInput"
import { GlassCard } from "../components/replacements/GlassCard"
import { useTheme } from "../context/ThemeContext"
import { useStudyContext, StudyGroup } from "../context/StudyContext"
import { fonts } from "../theme"


function OptionPill({
    label,
    selected,
    onPress,
    color,
}: {
    label: string
    selected: boolean
    onPress: () => void
    color: string
}) {
    const { theme } = useTheme()
    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.pill,
                {
                    borderColor: selected ? color : theme.surfaceMid,
                    backgroundColor: selected
                        ? color + "33"
                        : "rgba(255,255,255,0.06)",
                },
            ]}
        >
            <NText
                style={[
                    styles.pillText,
                    {
                        color: selected ? color : theme.textMuted,
                        fontFamily: selected ? fonts.bold : fonts.regular,
                    },
                ]}
            >
                {label}
            </NText>
        </Pressable>
    )
}

export default function StudySetupScreen() {
    const { theme } = useTheme()
    const router = useRouter()
    const { t } = useTranslation()
    const { startSession } = useStudyContext()

    const ageGroups = t("study.setup.ageGroups", { returnObjects: true }) as string[]
    const frequencyOptions = t("study.setup.frequencyOptions", { returnObjects: true }) as string[]

    const [participantId, setParticipantId] = useState("")
    const [group, setGroup] = useState<StudyGroup | null>(null)
    const [priorExp, setPriorExp] = useState<boolean | null>(null)
    const [ageGroup, setAgeGroup] = useState<string | null>(null)
    const [frequency, setFrequency] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const canStart =
        participantId.trim().length > 0 &&
        group !== null &&
        priorExp !== null &&
        ageGroup !== null &&
        frequency !== null

    const handleStart = () => {
        if (!canStart) {
            setError(t("study.setup.errorFillAll"))
            return
        }
        setError(null)
        startSession(group!, participantId.trim(), {
            priorAppExperience: priorExp!,
            ageGroup: ageGroup!,
            serviceTaskFrequency: frequency!,
        })
        router.replace(group === "A" ? "/(tabs)/chat" : "/study-timer" as any)
    }

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
                        styles.iconCircle,
                        { backgroundColor: theme.accent + "22" },
                    ]}
                >
                    <Ionicons
                        name="flask"
                        size={36}
                        color={theme.accentIcon}
                    />
                </View>
                <NText
                    style={[
                        styles.title,
                        { color: theme.text, fontFamily: fonts.bold },
                    ]}
                >
                    {t("study.setup.title")}
                </NText>
                <NText style={[styles.subtitle, { color: theme.textMuted }]}>
                    {t("study.setup.subtitle")}
                </NText>
            </View>

            {/* Participant ID */}
            <View style={styles.section}>
                <NText
                    style={[styles.label, { color: theme.text, fontFamily: fonts.bold }]}
                >
                    {t("study.setup.participantId")}
                </NText>
                <NInput
                    placeholder={t("study.setup.participantIdPlaceholder")}
                    value={participantId}
                    onChangeText={setParticipantId}
                    containerStyle={styles.input}
                />
            </View>

            {/* Group */}
            <View style={styles.section}>
                <NText
                    style={[styles.label, { color: theme.text, fontFamily: fonts.bold }]}
                >
                    {t("study.setup.groupLabel")}
                </NText>
                <NText style={[styles.hint, { color: theme.textMuted }]}>
                    {t("study.setup.groupHint")}
                </NText>
                <View style={styles.pillRow}>
                    <OptionPill
                        label={t("study.setup.groupA")}
                        selected={group === "A"}
                        onPress={() => setGroup("A")}
                        color={theme.accent}
                    />
                    <OptionPill
                        label={t("study.setup.groupB")}
                        selected={group === "B"}
                        onPress={() => setGroup("B")}
                        color={theme.accent}
                    />
                </View>
            </View>

            {/* Covariate: prior experience */}
            <View style={styles.section}>
                <NText
                    style={[styles.label, { color: theme.text, fontFamily: fonts.bold }]}
                >
                    {t("study.setup.priorExp")}
                </NText>
                <View style={styles.pillRow}>
                    <OptionPill
                        label={t("study.setup.yes")}
                        selected={priorExp === true}
                        onPress={() => setPriorExp(true)}
                        color={theme.accent}
                    />
                    <OptionPill
                        label={t("study.setup.no")}
                        selected={priorExp === false}
                        onPress={() => setPriorExp(false)}
                        color={theme.accent}
                    />
                </View>
            </View>

            {/* Covariate: age group */}
            <View style={styles.section}>
                <NText
                    style={[styles.label, { color: theme.text, fontFamily: fonts.bold }]}
                >
                    {t("study.setup.ageGroup")}
                </NText>
                <View style={styles.pillRow}>
                    {ageGroups.map((ag) => (
                        <OptionPill
                            key={ag}
                            label={ag}
                            selected={ageGroup === ag}
                            onPress={() => setAgeGroup(ag)}
                            color={theme.accent}
                        />
                    ))}
                </View>
            </View>

            {/* Covariate: frequency */}
            <View style={styles.section}>
                <NText
                    style={[styles.label, { color: theme.text, fontFamily: fonts.bold }]}
                >
                    {t("study.setup.frequency")}
                </NText>
                <View style={styles.pillRow}>
                    {frequencyOptions.map((f) => (
                        <OptionPill
                            key={f}
                            label={f}
                            selected={frequency === f}
                            onPress={() => setFrequency(f)}
                            color={theme.accent}
                        />
                    ))}
                </View>
            </View>

            {error && (
                <NText style={[styles.error, { color: "#ff6b6b" }]}>
                    {error}
                </NText>
            )}

            <NButton
                color={canStart ? theme.accent : "rgba(255,255,255,0.08)"}
                onPress={handleStart}
                disabled={!canStart}
                style={styles.startBtn}
            >
                <NText
                    style={[
                        styles.startBtnText,
                        {
                            color: canStart ? "#fff" : theme.textMuted,
                            fontFamily: fonts.bold,
                        },
                    ]}
                >
                    {t("study.setup.startSession")}
                </NText>
            </NButton>

            <NText style={[styles.footer, { color: theme.textSubtle }]}>
                {t("study.setup.footer")}
            </NText>

            {/* ── Study Case 3: Intent Routing ─────────────────────────────── */}
            <GlassCard
                color="#8B5CF6"
                borderRadius={12}
                style={styles.routingSectionOuter}
                innerStyle={styles.routingSectionInner}
            >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Ionicons name="git-branch" size={16} color="#8B5CF6" />
                    <NText style={[styles.routingLabel, { color: "#8B5CF6", fontFamily: fonts.bold }]}>
                        STUDY CASE 3
                    </NText>
                </View>
                <NText style={[styles.routingTitle, { color: theme.text, fontFamily: fonts.bold }]}>
                    Intent Routing Evaluation
                </NText>
                <NText style={[styles.routingHint, { color: theme.textMuted }]}>
                    Automated test of the LLM + keyword routing pipeline against 30 standardised prompts. Independent of the A/B study above.
                </NText>
                <NButton
                    color="#8B5CF6"
                    onPress={() => router.push("/study-routing" as any)}
                    style={{ marginTop: 10 }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Ionicons name="play" size={14} color="#fff" />
                        <NText style={{ color: "#fff", fontFamily: fonts.bold, fontSize: 14 }}>
                            {t("study.routing.openRoutingStudy")}
                        </NText>
                    </View>
                </NButton>
            </GlassCard>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    content: {
        padding: 24,
        paddingBottom: 48,
    },
    header: {
        alignItems: "center",
        marginBottom: 32,
        paddingTop: Platform.OS === "web" ? 16 : 48,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    title: {
        fontSize: 26,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        textAlign: "center",
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 15,
        marginBottom: 4,
    },
    hint: {
        fontSize: 12,
        marginBottom: 10,
    },
    input: {
        marginTop: 6,
    },
    pillRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 8,
    },
    pill: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    pillText: {
        fontSize: 13,
    },
    error: {
        fontSize: 13,
        marginBottom: 12,
        textAlign: "center",
    },
    startBtn: {
        marginTop: 8,
        marginBottom: 16,
    },
    startBtnText: {
        fontSize: 16,
    },
    footer: {
        fontSize: 12,
        textAlign: "center",
        lineHeight: 18,
    },
    routingSectionOuter: {
        marginTop: 32,
    },
    routingSectionInner: {
        padding: 16,
    },
    routingLabel: {
        fontSize: 11,
        letterSpacing: 1.5,
    },
    routingTitle: {
        fontSize: 16,
        marginBottom: 4,
    },
    routingHint: {
        fontSize: 12,
        lineHeight: 18,
        fontFamily: "IosevkaCharon_300Light",
    },
})
