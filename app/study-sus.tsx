import {
    View,
    StyleSheet,
    ScrollView,
    Pressable,
    Platform,
} from "react-native"
import { useState } from "react"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { NButton } from "../components/replacements/NButton"
import { NText } from "../components/replacements/NText"
import { useTheme } from "../context/ThemeContext"
import { useStudyContext, computeSusScore } from "../context/StudyContext"
import { fonts } from "../theme"

// ─── SUS questions and Likert labels come from i18n translations ──────────────

function LikertRow({
    questionIndex,
    questionText,
    value,
    onChange,
    accentColor,
    likertLabels,
}: {
    questionIndex: number
    questionText: string
    value: number | null
    onChange: (v: number) => void
    accentColor: string
    likertLabels: string[]
}){
    const { theme } = useTheme()
    return (
        <View style={styles.questionBlock}>
            <NText
                style={[
                    styles.questionNum,
                    { color: accentColor, fontFamily: fonts.bold },
                ]}
            >
                Q{questionIndex + 1}
            </NText>
            <NText
                style={[styles.questionText, { color: theme.text }]}
            >
                {questionText}
            </NText>
            <View style={styles.scaleRow}>
                {[1, 2, 3, 4, 5].map((score) => {
                    const isSelected = value === score
                    return (
                        <Pressable
                            key={score}
                            onPress={() => onChange(score)}
                            style={styles.scaleItem}
                        >
                            <View
                                style={[
                                    styles.scaleCircle,
                                    {
                                        borderColor: isSelected
                                            ? accentColor
                                            : theme.surfaceMid,
                                        backgroundColor: isSelected
                                            ? accentColor + "33"
                                            : "rgba(255,255,255,0.06)",
                                    },
                                ]}
                            >
                                <NText
                                    style={[
                                        styles.scaleNum,
                                        {
                                            color: isSelected
                                                ? accentColor
                                                : theme.textMuted,
                                            fontFamily: isSelected
                                                ? fonts.bold
                                                : fonts.regular,
                                        },
                                    ]}
                                >
                                    {score}
                                </NText>
                            </View>
                            <NText
                                style={[
                                    styles.scaleLabel,
                                    { color: theme.textMuted },
                                ]}
                            >
                                {likertLabels[score - 1]}
                            </NText>
                        </Pressable>
                    )
                })}
            </View>
        </View>
    )
}

export default function StudySusScreen() {
    const { theme } = useTheme()
    const router = useRouter()
    const { t } = useTranslation()
    const { session, saveSusAnswers } = useStudyContext()

    const susQuestions = t("study.sus.questions", { returnObjects: true }) as string[]
    const likertLabels = t("study.sus.likert", { returnObjects: true }) as string[]

    // answers[i] is 1–5, null means not answered
    const [answers, setAnswers] = useState<(number | null)[]>(
        Array(10).fill(null),
    )
    const [submitError, setSubmitError] = useState(false)

    const allAnswered = answers.every((a) => a !== null)

    const setAnswer = (index: number, value: number) => {
        setAnswers((prev) => {
            const next = [...prev]
            next[index] = value
            return next
        })
        if (submitError) setSubmitError(false)
    }

    const handleSubmit = () => {
        if (!allAnswered) {
            setSubmitError(true)
            return
        }
        saveSusAnswers(answers as number[])
        router.replace("/study-results" as any)
    }

    const answeredCount = answers.filter((a) => a !== null).length
    const previewScore =
        allAnswered ? computeSusScore(answers as number[]) : null

    return (
        <ScrollView
            style={styles.root}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.header}>
                <NText
                    style={[
                        styles.title,
                        { color: theme.text, fontFamily: fonts.bold },
                    ]}
                >
                    {t("study.sus.title")}
                </NText>
                <NText style={[styles.subtitle, { color: theme.textMuted }]}>
                    {session?.participantId
                        ? `Participant ${session.participantId} · Group ${session.group}`
                        : "Post-task questionnaire"}
                </NText>
                <NText style={[styles.instruction, { color: theme.textMuted }]}>
                    {t("study.sus.instruction")}
                </NText>
            </View>

            {/* Progress indicator */}
            <View
                style={[
                    styles.progressBar,
                    { backgroundColor: "rgba(255,255,255,0.1)" },
                ]}
            >
                <View
                    style={[
                        styles.progressFill,
                        {
                            backgroundColor: theme.accent,
                            width: `${(answeredCount / 10) * 100}%` as any,
                        },
                    ]}
                />
            </View>
            <NText style={[styles.progressText, { color: theme.textMuted }]}>
                {t("study.sus.answered", { count: answeredCount })}
            </NText>

            {/* Questions */}
            {susQuestions.map((q, i) => (
                <LikertRow
                    key={i}
                    questionIndex={i}
                    questionText={q}
                    value={answers[i]}
                    onChange={(v) => setAnswer(i, v)}
                    accentColor={theme.accent}
                    likertLabels={likertLabels}
                />
            ))}

            {submitError && (
                <NText style={[styles.error, { color: "#ff6b6b" }]}>
                    {t("study.sus.errorAnswer")}
                </NText>
            )}

            {previewScore !== null && (
                <View
                    style={[
                        styles.scorePreview,
                        { borderColor: theme.accent + "55" },
                    ]}
                >
                    <NText
                        style={[
                            styles.scorePreviewLabel,
                            { color: theme.textMuted },
                        ]}
                    >
                        {t("study.sus.previewScore")}
                    </NText>
                    <NText
                        style={[
                            styles.scorePreviewValue,
                            { color: theme.accent, fontFamily: fonts.bold },
                        ]}
                    >
                        {previewScore} / 100
                    </NText>
                </View>
            )}

            <NButton
                color={allAnswered ? theme.accent : "rgba(255,255,255,0.08)"}
                onPress={handleSubmit}
                style={styles.submitBtn}
            >
                <NText
                    style={[
                        styles.submitBtnText,
                        {
                            color: allAnswered ? "#fff" : theme.textMuted,
                            fontFamily: fonts.bold,
                        },
                    ]}
                >
                    {t("study.sus.submit")}
                </NText>
            </NButton>

            <NText style={[styles.footer, { color: theme.textSubtle }]}>
                {t("study.sus.footer")}
            </NText>
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
        marginBottom: 24,
        paddingTop: Platform.OS === "web" ? 16 : 48,
    },
    title: {
        fontSize: 24,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        marginBottom: 10,
    },
    instruction: {
        fontSize: 13,
        lineHeight: 20,
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
        overflow: "hidden",
        marginBottom: 6,
    },
    progressFill: {
        height: 4,
        borderRadius: 2,
    },
    progressText: {
        fontSize: 12,
        textAlign: "right",
        marginBottom: 20,
    },
    questionBlock: {
        marginBottom: 28,
    },
    questionNum: {
        fontSize: 12,
        marginBottom: 4,
    },
    questionText: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 12,
    },
    scaleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    scaleItem: {
        alignItems: "center",
        flex: 1,
    },
    scaleCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
    },
    scaleNum: {
        fontSize: 15,
    },
    scaleLabel: {
        fontSize: 10,
        textAlign: "center",
        lineHeight: 13,
    },
    error: {
        fontSize: 13,
        textAlign: "center",
        marginBottom: 16,
    },
    scorePreview: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        marginBottom: 20,
    },
    scorePreviewLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    scorePreviewValue: {
        fontSize: 28,
    },
    submitBtn: {
        marginBottom: 16,
    },
    submitBtnText: {
        fontSize: 16,
    },
    footer: {
        fontSize: 11,
        textAlign: "center",
        lineHeight: 16,
    },
})
