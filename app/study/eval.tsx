import {
    View,
    ScrollView,
    StyleSheet,
    Pressable,
    Platform,
} from "react-native"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { NText } from "../../components/replacements/NText"
import { NButton } from "../../components/replacements/NButton"
import { NInput } from "../../components/replacements/NInput"
import { GlassCard } from "../../components/replacements/GlassCard"
import { useTheme } from "../../context/ThemeContext"
import { fonts } from "../../theme"
import { EVAL_RESPONSES } from "../../constants/studyEvalData"

// Filter out empty responses (rate-limit failures)
const RESPONSES = EVAL_RESPONSES.filter((r) => r.response.trim().length > 0)
const TOTAL = RESPONSES.length

type Ratings = { accuracy: number | null; helpfulness: number | null; clarity: number | null }

// ── Likert row ─────────────────────────────────────────────────────────────────
function LikertRow({
    label,
    value,
    onChange,
    accent,
}: {
    label: string
    value: number | null
    onChange: (v: number) => void
    accent: string
}) {
    const { theme } = useTheme()
    return (
        <View style={styles.likertRow}>
            <NText style={[styles.likertLabel, { color: theme.textMuted }]}>{label}</NText>
            <View style={styles.likertScaleRow}>
                {[1, 2, 3, 4, 5].map((score) => {
                    const selected = value === score
                    return (
                        <Pressable key={score} onPress={() => onChange(score)} style={styles.likertItem}>
                            <View
                                style={[
                                    styles.likertCircle,
                                    {
                                        borderColor: selected ? accent : theme.surfaceMid,
                                        backgroundColor: selected ? accent + "33" : "rgba(255,255,255,0.06)",
                                    },
                                ]}
                            >
                                <NText
                                    style={[
                                        styles.likertNum,
                                        {
                                            color: selected ? accent : theme.textMuted,
                                            fontFamily: selected ? fonts.bold : fonts.regular,
                                        },
                                    ]}
                                >
                                    {score}
                                </NText>
                            </View>
                        </Pressable>
                    )
                })}
            </View>
        </View>
    )
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function StudyEvalScreen() {
    const { t } = useTranslation()
    const { theme } = useTheme()
    const accent = theme.accent

    // Rater ID entry phase
    const [raterId, setRaterId] = useState("")
    const [started, setStarted] = useState(false)

    // Evaluation state
    const [current, setCurrent] = useState(0)
    const [allRatings, setAllRatings] = useState<Ratings[]>(
        Array(TOTAL).fill(null).map(() => ({ accuracy: null, helpfulness: null, clarity: null })),
    )

    // Submission state
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [submitError, setSubmitError] = useState(false)
    const [validationError, setValidationError] = useState(false)

    const response = RESPONSES[current]
    const ratings = allRatings[current]
    const allAnswered =
        ratings.accuracy !== null && ratings.helpfulness !== null && ratings.clarity !== null
    const completedCount = allRatings.filter(
        (r) => r.accuracy !== null && r.helpfulness !== null && r.clarity !== null,
    ).length

    function setRating(field: keyof Ratings, value: number) {
        setAllRatings((prev) => {
            const next = [...prev]
            next[current] = { ...next[current], [field]: value }
            return next
        })
        if (validationError) setValidationError(false)
    }

    function goNext() {
        if (!allAnswered) { setValidationError(true); return }
        setValidationError(false)
        if (current < TOTAL - 1) setCurrent((c) => c + 1)
    }

    function goPrev() {
        if (current > 0) setCurrent((c) => c - 1)
    }

    async function handleSubmit() {
        const allDone = allRatings.every(
            (r) => r.accuracy !== null && r.helpfulness !== null && r.clarity !== null,
        )
        if (!allDone) { setValidationError(true); return }

        setSubmitting(true)
        setSubmitError(false)

        const payload = RESPONSES.map((r, i) => ({
            responseId: r.responseId,
            promptId: r.promptId,
            promptType: r.promptType,
            blindLabel: r.blindLabel,
            accuracy: allRatings[i].accuracy,
            helpfulness: allRatings[i].helpfulness,
            clarity: allRatings[i].clarity,
            average:
                (allRatings[i].accuracy! + allRatings[i].helpfulness! + allRatings[i].clarity!) / 3,
        }))

        try {
            const res = await fetch("/api/study-eval", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ raterId, ratings: payload }),
            })
            if (!res.ok) throw new Error("Server error")
            setSubmitted(true)
        } catch {
            setSubmitError(true)
        } finally {
            setSubmitting(false)
        }
    }

    // ── Rater ID entry ──────────────────────────────────────────────────────────
    if (!started) {
        return (
            <View style={styles.root}>
                <View style={styles.introContainer}>
                    <NText style={[styles.badge, { color: accent }]}>
                        {t("study.eval.badge")}
                    </NText>
                    <NText style={[styles.introTitle, { color: theme.text, fontFamily: fonts.bold }]}>
                        {t("study.eval.title")}
                    </NText>
                    <NText style={[styles.introDesc, { color: theme.textMuted }]}>
                        {t("study.eval.description")}
                    </NText>
                    <NText style={[styles.introDesc, { color: theme.textMuted, marginTop: 8 }]}>
                        {t("study.eval.instructions")}
                    </NText>
                    <NText style={[styles.fieldLabel, { color: theme.textMuted }]}>
                        {t("study.eval.raterIdLabel")}
                    </NText>
                    <NInput
                        placeholder={t("study.eval.raterIdPlaceholder")}
                        value={raterId}
                        onChangeText={setRaterId}
                        autoCapitalize="none"
                        containerStyle={styles.inputContainer}
                    />
                    <NButton
                        color={raterId.trim() ? accent : "rgba(255,255,255,0.08)"}
                        onPress={() => raterId.trim() && setStarted(true)}
                        style={styles.startBtn}
                    >
                        <NText
                            style={[
                                styles.startBtnText,
                                {
                                    color: raterId.trim() ? "#fff" : theme.textMuted,
                                    fontFamily: fonts.bold,
                                },
                            ]}
                        >
                            {t("study.eval.start")}
                        </NText>
                    </NButton>
                </View>
            </View>
        )
    }

    // ── Done / submitted ────────────────────────────────────────────────────────
    if (submitted) {
        return (
            <View style={[styles.root, styles.centerContent]}>
                <NText style={{ fontSize: 40, marginBottom: 16 }}>✅</NText>
                <NText style={[styles.introTitle, { color: theme.text, fontFamily: fonts.bold }]}>
                    {t("study.eval.doneTitle")}
                </NText>
                <NText style={[styles.introDesc, { color: theme.textMuted }]}>
                    {t("study.eval.doneBody")}
                </NText>
            </View>
        )
    }

    // ── Rating cards ────────────────────────────────────────────────────────────
    const isLast = current === TOTAL - 1

    return (
        <ScrollView
            style={styles.root}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            key={current}
        >
            {/* Header */}
            <View style={styles.header}>
                <NText style={[styles.badge, { color: accent }]}>{t("study.eval.badge")}</NText>
                <NText style={[styles.headerTitle, { color: theme.text, fontFamily: fonts.bold }]}>
                    {t("study.eval.cardTitle", { current: current + 1, total: TOTAL })}
                </NText>

                {/* Progress bar */}
                <View style={[styles.progressBar, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
                    <View
                        style={[
                            styles.progressFill,
                            { backgroundColor: accent, width: `${(completedCount / TOTAL) * 100}%` as any },
                        ]}
                    />
                </View>
                <NText style={[styles.progressText, { color: theme.textMuted }]}>
                    {t("study.eval.progress", { done: completedCount, total: TOTAL })}
                </NText>
            </View>

            {/* Prompt card */}
            <GlassCard
                color={accent + "55"}
                intensity={40}
                borderRadius={14}
                style={styles.cardOuter}
                innerStyle={styles.cardInner}
            >
                <View style={styles.cardHeader}>
                    <NText style={[styles.cardTag, { color: accent, fontFamily: fonts.bold }]}>
                        {response.promptType === "simple"
                            ? t("study.eval.tagSimple")
                            : t("study.eval.tagComplex")}
                    </NText>
                    <NText style={[styles.cardModelLabel, { color: theme.textMuted }]}>
                        {response.blindLabel}
                    </NText>
                </View>

                <NText style={[styles.promptLabel, { color: theme.textMuted }]}>
                    {t("study.eval.questionLabel")}
                </NText>
                <NText style={[styles.promptText, { color: theme.text, fontFamily: fonts.bold }]}>
                    {response.prompt}
                </NText>

                <View style={[styles.divider, { backgroundColor: accent + "33" }]} />

                <NText style={[styles.promptLabel, { color: theme.textMuted }]}>
                    {t("study.eval.responseLabel")}
                </NText>
                {response.response.trim() ? (
                    <NText style={[styles.responseText, { color: theme.text }]}>
                        {response.response}
                    </NText>
                ) : (
                    <NText style={[styles.responseText, { color: "#ff6b6b" }]}>
                        {t("study.eval.noResponse")}
                    </NText>
                )}
            </GlassCard>

            {/* Rating scales */}
            <GlassCard
                color="rgba(255,255,255,0.18)"
                intensity={40}
                borderRadius={14}
                style={styles.cardOuter}
                innerStyle={styles.cardInner}
            >
                <NText style={[styles.rateTitle, { color: theme.text, fontFamily: fonts.bold }]}>
                    {t("study.eval.rateTitle")}
                </NText>
                <NText style={[styles.rateHint, { color: theme.textSubtle }]}>
                    {t("study.eval.rateHint")}
                </NText>
                <LikertRow
                    label={t("study.eval.accuracy")}
                    value={ratings.accuracy}
                    onChange={(v) => setRating("accuracy", v)}
                    accent={accent}
                />
                <LikertRow
                    label={t("study.eval.helpfulness")}
                    value={ratings.helpfulness}
                    onChange={(v) => setRating("helpfulness", v)}
                    accent={accent}
                />
                <LikertRow
                    label={t("study.eval.clarity")}
                    value={ratings.clarity}
                    onChange={(v) => setRating("clarity", v)}
                    accent={accent}
                />
            </GlassCard>

            {validationError && (
                <NText style={[styles.errorText, { color: "#ff6b6b" }]}>
                    {t("study.eval.errorRateAll")}
                </NText>
            )}

            {/* Navigation */}
            <View style={styles.navRow}>
                <NButton
                    color={current === 0 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.10)"}
                    onPress={goPrev}
                    disabled={current === 0}
                    style={[styles.navBtn, { opacity: current === 0 ? 0.35 : 1 }]}
                >
                    <NText style={[styles.navBtnText, { color: current === 0 ? theme.textMuted : theme.text, fontFamily: fonts.bold }]}>
                        ← {t("study.eval.prev")}
                    </NText>
                </NButton>

                {isLast ? (
                    <NButton
                        color={completedCount === TOTAL ? accent : "rgba(255,255,255,0.08)"}
                        onPress={handleSubmit}
                        style={styles.navBtn}
                    >
                        <NText
                            style={[
                                styles.navBtnText,
                                {
                                    color: completedCount === TOTAL ? "#fff" : theme.textMuted,
                                    fontFamily: fonts.bold,
                                },
                            ]}
                        >
                            {submitting ? t("study.eval.submitting") : t("study.eval.submit")}
                        </NText>
                    </NButton>
                ) : (
                    <NButton
                        color={accent}
                        onPress={goNext}
                        style={styles.navBtn}
                    >
                        <NText style={[styles.navBtnText, { color: "#fff", fontFamily: fonts.bold }]}>
                            {t("study.eval.next")} →
                        </NText>
                    </NButton>
                )}
            </View>

            {submitError && (
                <NText style={[styles.errorText, { color: "#ff6b6b", textAlign: "center" }]}>
                    {t("study.eval.submitError")}
                </NText>
            )}

            {isLast && completedCount < TOTAL && (
                <NText style={[styles.errorText, { color: theme.textMuted, textAlign: "center" }]}>
                    {t("study.eval.incomplete", { remaining: TOTAL - completedCount })}
                </NText>
            )}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    centerContent: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
    content: { padding: 24, paddingBottom: 60 },
    introContainer: {
        flex: 1,
        padding: 32,
        paddingTop: Platform.OS === "web" ? 48 : 72,
        maxWidth: 560,
        alignSelf: "center",
        width: "100%",
    },
    badge: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 8 },
    introTitle: { fontSize: 22, marginBottom: 12 },
    introDesc: { fontSize: 14, lineHeight: 22, marginBottom: 8 },
    fieldLabel: { fontSize: 13, marginBottom: 6, marginTop: 20 },
    inputContainer: { marginBottom: 20 },
    startBtn: { marginTop: 4 },
    startBtnText: { fontSize: 15 },
    header: {
        paddingTop: Platform.OS === "web" ? 16 : 48,
        marginBottom: 20,
    },
    headerTitle: { fontSize: 18, marginBottom: 12 },
    progressBar: {
        height: 4,
        borderRadius: 2,
        overflow: "hidden",
        marginBottom: 6,
    },
    progressFill: { height: 4, borderRadius: 2 },
    progressText: { fontSize: 12 },
    cardOuter: { marginBottom: 16 },
    cardInner: { padding: 18 },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    cardTag: { fontSize: 11, letterSpacing: 1.2 },
    cardModelLabel: { fontSize: 12 },
    promptLabel: { fontSize: 11, letterSpacing: 1, marginBottom: 4 },
    promptText: { fontSize: 15, lineHeight: 22, marginBottom: 10 },
    divider: { height: 1, marginVertical: 12 },
    responseText: { fontSize: 14, lineHeight: 22 },
    rateTitle: { fontSize: 14, marginBottom: 2 },
    rateHint: { fontSize: 12, marginBottom: 14 },
    likertRow: { marginBottom: 16 },
    likertLabel: { fontSize: 13, marginBottom: 8 },
    likertScaleRow: { flexDirection: "row", gap: 8 },
    likertItem: { alignItems: "center" },
    likertCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
    },
    likertNum: { fontSize: 15 },
    navRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 12,
    },
    navBtn: { flex: 1 },
    navBtnText: { fontSize: 14 },
    errorText: { fontSize: 13, marginTop: 4 },
})
