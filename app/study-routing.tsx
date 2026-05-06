import {
    View,
    ScrollView,
    StyleSheet,
    Platform,
    ActivityIndicator,
    Pressable,
} from "react-native"
import { useState, useCallback } from "react"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { NButton } from "../components/replacements/NButton"
import { NText } from "../components/replacements/NText"
import { GlassCard } from "../components/replacements/GlassCard"
import { useTheme } from "../context/ThemeContext"
import { fonts } from "../theme"

// ─── Types ────────────────────────────────────────────────────────────────────

type PromptCategory =
    | "single_simple"
    | "single_ambiguous"
    | "multi_complex"
    | "out_of_scope"

type Intent = "appointment" | "shop" | "map" | "chat"
type FailureMode = "wrong_category" | "no_route" | "false_positive" | null
type ResultStatus = "pending" | "running" | "done" | "error"

interface TestPrompt {
    id: number
    category: PromptCategory
    prompt: string
    groundTruth: Intent
    followUp: string
    ambiguous?: boolean
    notes?: string
}

interface PromptResult {
    id: number
    status: ResultStatus
    keywordIntent: Intent | null
    keywordMatchesGT: boolean
    llmIntent: Intent
    llmConfidence: number
    turnsUsed: number
    isRouted: boolean
    isCorrect: boolean | null
    failureMode: FailureMode
    aiResponse: string
    errorMsg?: string
}

interface StudyStats {
    total: number
    eligible: number
    correct: number
    overallAccuracy: number
    byCategory: Record<
        PromptCategory,
        { total: number; eligible: number; correct: number; accuracy: number }
    >
    avgTurnsAll: number
    avgTurnsCorrect: number | null
    keywordHits: number
    keywordCorrect: number
    noRoutedCount: number
    intentDist: Record<Intent, number>
    failureCounts: { wrong_category: number; no_route: number; false_positive: number }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<PromptCategory, string> = {
    single_simple: "#3B82F6",
    single_ambiguous: "#F59E0B",
    multi_complex: "#8B5CF6",
    out_of_scope: "#EF4444",
}

const CATEGORY_LABELS: Record<PromptCategory, string> = {
    single_simple: "SS-Simple",
    single_ambiguous: "SS-Ambiguous",
    multi_complex: "Multi-Complex",
    out_of_scope: "Out-of-Scope",
}

const CATEGORY_FULL_LABELS: Record<PromptCategory, string> = {
    single_simple: "Single-System Simple",
    single_ambiguous: "Single-System Ambiguous",
    multi_complex: "Multi-System Complex",
    out_of_scope: "Out-of-Scope / Adversarial",
}

const INTENT_COLORS: Record<Intent, string> = {
    appointment: "#10B981",
    shop: "#3B82F6",
    map: "#F59E0B",
    chat: "#6B7280",
}

const INTENT_LABELS: Record<Intent, string> = {
    appointment: "Appointment",
    shop: "Shop",
    map: "Map",
    chat: "No Route",
}

// Mirrors INTENT_KEYWORDS from chat.tsx (English only — test prompts are in English)
const ROUTING_KEYWORDS: Record<string, string[]> = {
    shop: [
        "buy", "parts", "shop", "purchase", "order",
        "product", "products", "spare", "component", "components",
    ],
    appointment: [
        "appointment", "book", "booking", "schedule", "reserve",
        "service", "repair", "fix", "maintenance",
    ],
    map: [
        "map", "location", "directions", "nearby",
        "garage", "workshop", "where", "address",
    ],
}

const FOLLOW_UP_STANDARD =
    "Yes, this is about my car. Should I bring it to a professional mechanic or book a service?"

// ─── 30 Test Prompts ─────────────────────────────────────────────────────────
// Ground-truth labels assigned based on app routing intents:
//   appointment = needs professional service/repair booking
//   shop        = needs to purchase a part or accessory
//   map         = needs to locate a nearby service
//   chat        = out-of-scope, should not trigger routing

const TEST_PROMPTS: TestPrompt[] = [
    // ── Single-system simple (8): clear, one-symptom descriptions ────────────
    {
        id: 1, category: "single_simple",
        prompt: "My oil light is on",
        groundTruth: "appointment",
        followUp: "Should I take my car to a mechanic urgently?",
    },
    {
        id: 2, category: "single_simple",
        prompt: "My brakes are squealing whenever I stop",
        groundTruth: "appointment",
        followUp: "Do I need professional brake service for this?",
    },
    {
        id: 3, category: "single_simple",
        prompt: "I need to buy new wiper blades for my car",
        groundTruth: "shop",
        followUp: "Where can I order them online?",
    },
    {
        id: 4, category: "single_simple",
        prompt: "Where is the nearest car service center?",
        groundTruth: "map",
        followUp: "Can you show it on the map?",
    },
    {
        id: 5, category: "single_simple",
        prompt: "I want to book an oil change appointment",
        groundTruth: "appointment",
        followUp: "How do I schedule one?",
    },
    {
        id: 6, category: "single_simple",
        prompt: "My car battery is dead and it will not start",
        groundTruth: "appointment",
        followUp: "Do I need to take it to a workshop?",
    },
    {
        id: 7, category: "single_simple",
        prompt: "I need to order a new cabin air filter",
        groundTruth: "shop",
        followUp: "Where can I purchase one?",
    },
    {
        id: 8, category: "single_simple",
        prompt: "Where can I find a tire shop near me?",
        groundTruth: "map",
        followUp: "Show me locations nearby.",
    },

    // ── Single-system ambiguous (8): symptom without obvious category ─────────
    {
        id: 9, category: "single_ambiguous",
        prompt: "My car pulls to the left when I am driving",
        groundTruth: "appointment",
        followUp: "Is this something a mechanic should look at?",
    },
    {
        id: 10, category: "single_ambiguous",
        prompt: "I hear a clicking noise when I turn the steering wheel",
        groundTruth: "appointment",
        followUp: "Should I bring the car in for service?",
    },
    {
        id: 11, category: "single_ambiguous",
        prompt: "My steering wheel vibrates at highway speeds",
        groundTruth: "appointment",
        followUp: "How urgent is this? Should I book a service?",
    },
    {
        id: 12, category: "single_ambiguous",
        prompt: "There is a knocking sound coming from under the hood",
        groundTruth: "appointment",
        followUp: "Do I need to take the car to a workshop?",
    },
    {
        id: 13, category: "single_ambiguous",
        prompt: "My car is leaking a dark fluid underneath",
        groundTruth: "appointment",
        followUp: "Should I get this checked by a mechanic?",
    },
    {
        id: 14, category: "single_ambiguous",
        prompt: "The ride feels unusually bouncy lately",
        groundTruth: "appointment",
        followUp: "Is this a suspension issue that needs professional repair?",
    },
    {
        id: 15, category: "single_ambiguous",
        prompt: "My car seems to take much longer to stop than before",
        groundTruth: "appointment",
        followUp: "Should I book a brake inspection?",
    },
    {
        id: 16, category: "single_ambiguous",
        prompt: "My engine stalls at traffic lights sometimes",
        groundTruth: "appointment",
        followUp: "Is this something a mechanic needs to diagnose?",
    },

    // ── Multi-system complex (8): two or more symptoms ────────────────────────
    {
        id: 17, category: "multi_complex",
        prompt: "I see blue smoke from the exhaust and my brakes are grinding badly",
        groundTruth: "appointment",
        followUp: "I need professional help with multiple car problems urgently.",
    },
    {
        id: 18, category: "multi_complex",
        prompt: "My engine overheats and I also hear a loud rattling noise",
        groundTruth: "appointment",
        followUp: "Should I get both issues checked at a garage?",
    },
    {
        id: 19, category: "multi_complex",
        prompt: "There is an oil leak and a burning smell coming from the engine",
        groundTruth: "appointment",
        followUp: "How quickly do I need to see a mechanic?",
    },
    {
        id: 20, category: "multi_complex",
        prompt: "My car pulls to the right and the front tires look uneven",
        groundTruth: "appointment",
        followUp: "Do I need to book an alignment and tire inspection?",
    },
    {
        id: 21, category: "multi_complex",
        prompt: "The air conditioning stopped working and the battery warning light came on",
        groundTruth: "appointment",
        followUp: "Can I book an electrical and AC diagnostic appointment?",
    },
    {
        id: 22, category: "multi_complex",
        prompt: "My battery keeps dying and there is a clicking noise when I try to start the car",
        groundTruth: "appointment",
        followUp: "Should I book a battery and electrical system service?",
    },
    {
        id: 23, category: "multi_complex",
        prompt: "My car vibrates badly at speed and clunks when going over bumps",
        groundTruth: "appointment",
        followUp: "Can you help me book a suspension and wheel balance service?",
    },
    {
        id: 24, category: "multi_complex",
        prompt: "I need an oil change and also want to find a body shop nearby",
        groundTruth: "appointment",
        followUp: "Can you book the oil change and show me the body shop on the map?",
        ambiguous: true,
        notes: "Compound intent: appointment + map. Either is a defensible answer.",
    },

    // ── Out-of-scope / adversarial (6): non-automotive or nonsensical ─────────
    {
        id: 25, category: "out_of_scope",
        prompt: "Can you book me a haircut please?",
        groundTruth: "chat",
        followUp: "",
    },
    {
        id: 26, category: "out_of_scope",
        prompt: "I need to fill up with petrol",
        groundTruth: "chat",
        followUp: "",
    },
    {
        id: 27, category: "out_of_scope",
        prompt: "What is the weather forecast for today?",
        groundTruth: "chat",
        followUp: "",
    },
    {
        id: 28, category: "out_of_scope",
        prompt: "Can you order me a pizza for delivery?",
        groundTruth: "chat",
        followUp: "",
    },
    {
        id: 29, category: "out_of_scope",
        prompt: "Tell me a funny joke",
        groundTruth: "chat",
        followUp: "",
    },
    {
        id: 30, category: "out_of_scope",
        prompt: "I want to buy some groceries online",
        groundTruth: "chat",
        followUp: "",
    },
]

// ─── Helper: keyword layer ────────────────────────────────────────────────────

function checkKeywordIntent(text: string): Intent | null {
    const words = text
        .toLowerCase()
        .replace(/[^a-z\s]/g, "")
        .split(/\s+/)
    for (const [intent, keywords] of Object.entries(ROUTING_KEYWORDS)) {
        if (words.some((w) => keywords.includes(w))) {
            return intent as Intent
        }
    }
    return null
}

// ─── Helper: LLM call ─────────────────────────────────────────────────────────

async function callChat(
    messages: { role: string; content: string }[],
): Promise<{ intent: Intent; confidence: number; reply: string }> {
    const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            messages,
            vehicleInfo: {
                make: null,
                model: null,
                year: null,
                mileage: null,
                warningLights: null,
            },
            userId: "study-routing-researcher",
            conversationId: `routing_study_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2)}`,
        }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return {
        intent: (["appointment", "shop", "map", "chat"].includes(data.intent)
            ? data.intent
            : "chat") as Intent,
        confidence:
            typeof data.confidence === "number" ? data.confidence : 0,
        reply: data.reply || "",
    }
}

function isRoutingTriggered(intent: Intent, confidence: number): boolean {
    return intent !== "chat" && confidence > 0.75
}

// ─── Helper: statistics ───────────────────────────────────────────────────────

function computeStats(results: PromptResult[]): StudyStats {
    const done = results.filter((r) => r.status === "done")

    const cats: PromptCategory[] = [
        "single_simple",
        "single_ambiguous",
        "multi_complex",
        "out_of_scope",
    ]
    const intents: Intent[] = ["appointment", "shop", "map", "chat"]

    const byCategory = Object.fromEntries(
        cats.map((cat) => {
            const rows = done.filter(
                (r) => TEST_PROMPTS[r.id - 1].category === cat,
            )
            const eligible = rows.filter((r) => r.isCorrect !== null)
            const correct = eligible.filter((r) => r.isCorrect === true)
            return [
                cat,
                {
                    total: rows.length,
                    eligible: eligible.length,
                    correct: correct.length,
                    accuracy:
                        eligible.length > 0
                            ? Math.round(
                                  (correct.length / eligible.length) * 100,
                              )
                            : 0,
                },
            ]
        }),
    ) as StudyStats["byCategory"]

    const eligible = done.filter((r) => r.isCorrect !== null)
    const correct = eligible.filter((r) => r.isCorrect === true)

    const correctWithTurns = correct.filter((r) => r.turnsUsed > 0)
    const avgTurnsCorrect =
        correctWithTurns.length > 0
            ? correctWithTurns.reduce((s, r) => s + r.turnsUsed, 0) /
              correctWithTurns.length
            : null

    const allTurns = done.filter((r) => r.turnsUsed > 0)
    const avgTurnsAll =
        allTurns.length > 0
            ? allTurns.reduce((s, r) => s + r.turnsUsed, 0) / allTurns.length
            : 0

    return {
        total: done.length,
        eligible: eligible.length,
        correct: correct.length,
        overallAccuracy:
            eligible.length > 0
                ? Math.round((correct.length / eligible.length) * 100)
                : 0,
        byCategory,
        avgTurnsAll: Math.round(avgTurnsAll * 100) / 100,
        avgTurnsCorrect:
            avgTurnsCorrect !== null
                ? Math.round(avgTurnsCorrect * 100) / 100
                : null,
        keywordHits: done.filter((r) => r.keywordIntent !== null).length,
        keywordCorrect: done.filter((r) => r.keywordMatchesGT).length,
        noRoutedCount: done.filter((r) => !r.isRouted).length,
        intentDist: Object.fromEntries(
            intents.map((i) => [
                i,
                done.filter((r) => r.llmIntent === i).length,
            ]),
        ) as Record<Intent, number>,
        failureCounts: {
            wrong_category: done.filter(
                (r) => r.failureMode === "wrong_category",
            ).length,
            no_route: done.filter((r) => r.failureMode === "no_route").length,
            false_positive: done.filter(
                (r) => r.failureMode === "false_positive",
            ).length,
        },
    }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Chip({
    label,
    color,
    small,
}: {
    label: string
    color: string
    small?: boolean
}) {
    return (
        <View
            style={[
                styles.chip,
                {
                    backgroundColor: color + "22",
                    borderColor: color + "66",
                    paddingHorizontal: small ? 6 : 8,
                    paddingVertical: small ? 2 : 3,
                },
            ]}
        >
            <NText
                style={[
                    styles.chipText,
                    {
                        color,
                        fontSize: small ? 10 : 11,
                        fontFamily: fonts.bold,
                    },
                ]}
            >
                {label}
            </NText>
        </View>
    )
}

function HorizBar({
    value,
    max,
    color,
    label,
    sub,
}: {
    value: number
    max: number
    color: string
    label: string
    sub?: string
}) {
    const { theme } = useTheme()
    const pct = max > 0 ? Math.round((value / max) * 100) : 0
    return (
        <View style={{ marginBottom: 10 }}>
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 4,
                }}
            >
                <NText
                    style={{
                        color: theme.textMuted,
                        fontSize: 12,
                        fontFamily: fonts.regular,
                    }}
                >
                    {label}
                    {sub ? (
                        <NText
                            style={{
                                color: theme.textSubtle,
                                fontSize: 11,
                            }}
                        >
                            {" "}
                            {sub}
                        </NText>
                    ) : null}
                </NText>
                <NText
                    style={{
                        color: theme.text,
                        fontSize: 12,
                        fontFamily: fonts.bold,
                    }}
                >
                    {value} ({pct}%)
                </NText>
            </View>
            <View
                style={[
                    styles.barTrack,
                    { backgroundColor: "rgba(255,255,255,0.08)" },
                ]}
            >
                <View
                    style={[
                        styles.barFill,
                        {
                            width: `${pct}%` as any,
                            backgroundColor: color,
                        },
                    ]}
                />
            </View>
        </View>
    )
}

function AccuracyBar({
    pct,
    color,
    label,
    eligible,
}: {
    pct: number
    color: string
    label: string
    eligible: number
}) {
    const { theme } = useTheme()
    return (
        <View style={{ marginBottom: 10 }}>
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 4,
                }}
            >
                <NText
                    style={{
                        color: theme.textMuted,
                        fontSize: 12,
                        fontFamily: fonts.regular,
                    }}
                >
                    {label}
                </NText>
                <NText
                    style={{
                        color: theme.text,
                        fontSize: 12,
                        fontFamily: fonts.bold,
                    }}
                >
                    {pct}%
                    <NText
                        style={{
                            color: theme.textSubtle,
                            fontSize: 11,
                            fontFamily: fonts.regular,
                        }}
                    >
                        {" "}
                        (n={eligible})
                    </NText>
                </NText>
            </View>
            <View
                style={[
                    styles.barTrack,
                    { backgroundColor: "rgba(255,255,255,0.08)" },
                ]}
            >
                {/* H1 threshold line at 80% */}
                <View
                    style={[
                        styles.benchmarkLine,
                        { left: "80%" as any, backgroundColor: "#f59e0b44" },
                    ]}
                    pointerEvents="none"
                />
                <View
                    style={[
                        styles.barFill,
                        {
                            width: `${Math.min(pct, 100)}%` as any,
                            backgroundColor: color,
                        },
                    ]}
                />
            </View>
        </View>
    )
}

function PromptRow({ result, prompt }: { result: PromptResult; prompt: TestPrompt }) {
    const { theme } = useTheme()
    const [expanded, setExpanded] = useState(false)

    const catColor = CATEGORY_COLORS[prompt.category]
    const intentColor = INTENT_COLORS[result.llmIntent] ?? "#6B7280"
    const gtColor = INTENT_COLORS[prompt.groundTruth]

    const resultColor =
        result.isCorrect === null
            ? "#F59E0B"
            : result.isCorrect
            ? "#22C55E"
            : "#EF4444"
    const resultIcon =
        result.isCorrect === null ? "help-circle" : result.isCorrect ? "checkmark-circle" : "close-circle"
    const resultLabel =
        result.isCorrect === null ? "~" : result.isCorrect ? "✓" : "✗"

    return (
        <Pressable onPress={() => setExpanded((v) => !v)}>
            <GlassCard
                color={
                    result.status === "running"
                        ? theme.accent + "55"
                        : result.status === "done"
                        ? resultColor + "33"
                        : "rgba(255,255,255,0.10)"
                }
                borderRadius={10}
                style={styles.promptRowOuter}
                innerStyle={styles.promptRowInner}
            >
                {/* Row header */}
                <View style={styles.promptRowHeader}>
                    {/* ID + status */}
                    <View style={{ width: 32, alignItems: "center" }}>
                        {result.status === "running" ? (
                            <ActivityIndicator size="small" color={theme.accent} />
                        ) : result.status === "error" ? (
                            <Ionicons name="alert-circle" size={16} color="#EF4444" />
                        ) : result.status === "done" ? (
                            <Ionicons
                                name={resultIcon as any}
                                size={16}
                                color={resultColor}
                            />
                        ) : (
                            <NText
                                style={{
                                    color: theme.textSubtle,
                                    fontSize: 11,
                                    fontFamily: fonts.bold,
                                }}
                            >
                                {prompt.id}
                            </NText>
                        )}
                    </View>

                    {/* Prompt text */}
                    <NText
                        style={[
                            styles.promptText,
                            { color: result.status === "pending" ? theme.textSubtle : theme.text },
                        ]}
                        numberOfLines={expanded ? undefined : 2}
                    >
                        {prompt.prompt}
                    </NText>

                    {/* Tags */}
                    <View style={styles.promptTags}>
                        <Chip
                            label={CATEGORY_LABELS[prompt.category]}
                            color={catColor}
                            small
                        />
                        {result.status === "done" && (
                            <>
                                <Chip
                                    label={
                                        result.isRouted
                                            ? INTENT_LABELS[result.llmIntent]
                                            : "—"
                                    }
                                    color={
                                        result.isRouted ? intentColor : "#6B7280"
                                    }
                                    small
                                />
                                <NText
                                    style={[
                                        styles.resultBadge,
                                        { color: resultColor, fontFamily: fonts.bold },
                                    ]}
                                >
                                    {resultLabel}
                                </NText>
                            </>
                        )}
                    </View>
                </View>

                {/* Expanded detail */}
                {expanded && result.status === "done" && (
                    <View style={styles.promptDetail}>
                        <View style={styles.detailGrid}>
                            <View style={styles.detailItem}>
                                <NText style={[styles.detailLabel, { color: theme.textSubtle }]}>
                                    Ground Truth
                                </NText>
                                <Chip
                                    label={INTENT_LABELS[prompt.groundTruth]}
                                    color={gtColor}
                                    small
                                />
                            </View>
                            <View style={styles.detailItem}>
                                <NText style={[styles.detailLabel, { color: theme.textSubtle }]}>
                                    LLM Intent
                                </NText>
                                <Chip
                                    label={INTENT_LABELS[result.llmIntent]}
                                    color={intentColor}
                                    small
                                />
                            </View>
                            <View style={styles.detailItem}>
                                <NText style={[styles.detailLabel, { color: theme.textSubtle }]}>
                                    Confidence
                                </NText>
                                <NText
                                    style={{
                                        color: theme.textMuted,
                                        fontSize: 12,
                                        fontFamily: fonts.bold,
                                    }}
                                >
                                    {(result.llmConfidence * 100).toFixed(0)}%
                                </NText>
                            </View>
                            <View style={styles.detailItem}>
                                <NText style={[styles.detailLabel, { color: theme.textSubtle }]}>
                                    Turns
                                </NText>
                                <NText
                                    style={{
                                        color: theme.textMuted,
                                        fontSize: 12,
                                        fontFamily: fonts.bold,
                                    }}
                                >
                                    {result.turnsUsed}
                                </NText>
                            </View>
                            <View style={styles.detailItem}>
                                <NText style={[styles.detailLabel, { color: theme.textSubtle }]}>
                                    Keyword Layer
                                </NText>
                                <NText
                                    style={{
                                        color: result.keywordIntent
                                            ? INTENT_COLORS[result.keywordIntent]
                                            : theme.textSubtle,
                                        fontSize: 12,
                                        fontFamily: fonts.bold,
                                    }}
                                >
                                    {result.keywordIntent
                                        ? `${INTENT_LABELS[result.keywordIntent]} ${result.keywordMatchesGT ? "✓" : "✗"}`
                                        : "No match"}
                                </NText>
                            </View>
                            {result.failureMode && (
                                <View style={styles.detailItem}>
                                    <NText style={[styles.detailLabel, { color: theme.textSubtle }]}>
                                        Failure Mode
                                    </NText>
                                    <Chip
                                        label={
                                            result.failureMode === "no_route"
                                                ? "No Route"
                                                : result.failureMode === "false_positive"
                                                ? "False Positive"
                                                : "Wrong Category"
                                        }
                                        color="#EF4444"
                                        small
                                    />
                                </View>
                            )}
                        </View>
                        {prompt.ambiguous && (
                            <NText
                                style={{
                                    color: "#F59E0B",
                                    fontSize: 11,
                                    fontFamily: fonts.regular,
                                    marginTop: 6,
                                }}
                            >
                                ⚠ Ambiguous ground truth — excluded from accuracy.
                                {prompt.notes ? ` ${prompt.notes}` : ""}
                            </NText>
                        )}
                        {result.aiResponse ? (
                            <NText
                                style={{
                                    color: theme.textSubtle,
                                    fontSize: 11,
                                    fontFamily: fonts.light,
                                    marginTop: 6,
                                    fontStyle: "italic",
                                }}
                                numberOfLines={3}
                            >
                                AI: "{result.aiResponse}"
                            </NText>
                        ) : null}
                        {result.errorMsg ? (
                            <NText style={{ color: "#EF4444", fontSize: 11, marginTop: 4 }}>
                                Error: {result.errorMsg}
                            </NText>
                        ) : null}
                    </View>
                )}
            </GlassCard>
        </Pressable>
    )
}

function StatCard({
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
            borderRadius={10}
            style={styles.statCardOuter}
            innerStyle={styles.statCardInner}
        >
            <Ionicons name={icon} size={20} color={color} style={{ marginBottom: 6 }} />
            <NText style={[styles.statValue, { color: theme.text, fontFamily: fonts.bold }]}>
                {value}
            </NText>
            <NText style={[styles.statLabel, { color: theme.textMuted }]}>{label}</NText>
            {sub ? (
                <NText style={[styles.statSub, { color: theme.textSubtle }]}>{sub}</NText>
            ) : null}
        </GlassCard>
    )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function StudyRoutingScreen() {
    const { theme } = useTheme()
    const router = useRouter()

    const [results, setResults] = useState<PromptResult[]>(() =>
        TEST_PROMPTS.map((p) => ({
            id: p.id,
            status: "pending" as ResultStatus,
            keywordIntent: null,
            keywordMatchesGT: false,
            llmIntent: "chat" as Intent,
            llmConfidence: 0,
            turnsUsed: 0,
            isRouted: false,
            isCorrect: null,
            failureMode: null,
            aiResponse: "",
        })),
    )
    const [isRunning, setIsRunning] = useState(false)
    const [currentId, setCurrentId] = useState<number | null>(null)

    const doneCnt = results.filter((r) => r.status === "done" || r.status === "error").length
    const isDone = doneCnt === TEST_PROMPTS.length

    const updateResult = useCallback(
        (id: number, patch: Partial<PromptResult>) => {
            setResults((prev) =>
                prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
            )
        },
        [],
    )

    const runAll = useCallback(async () => {
        if (isRunning) return
        setIsRunning(true)

        // Reset to pending
        setResults(
            TEST_PROMPTS.map((p) => ({
                id: p.id,
                status: "pending" as ResultStatus,
                keywordIntent: null,
                keywordMatchesGT: false,
                llmIntent: "chat" as Intent,
                llmConfidence: 0,
                turnsUsed: 0,
                isRouted: false,
                isCorrect: null,
                failureMode: null,
                aiResponse: "",
            })),
        )

        for (const prompt of TEST_PROMPTS) {
            setCurrentId(prompt.id)
            setResults((prev) =>
                prev.map((r) =>
                    r.id === prompt.id ? { ...r, status: "running" } : r,
                ),
            )

            try {
                // ── Keyword layer ──────────────────────────────────────────────
                const keywordIntent = checkKeywordIntent(prompt.prompt)
                const keywordMatchesGT = keywordIntent === prompt.groundTruth

                // ── LLM layer — Turn 1 ─────────────────────────────────────────
                const t1 = await callChat([
                    { role: "user", content: prompt.prompt },
                ])

                let finalIntent: Intent = t1.intent
                let finalConf: number = t1.confidence
                let aiResponse = t1.reply
                let turnsUsed = 1

                // ── LLM layer — Turn 2 (if needed) ────────────────────────────
                if (
                    !isRoutingTriggered(t1.intent, t1.confidence) &&
                    prompt.groundTruth !== "chat" &&
                    prompt.followUp
                ) {
                    const t2 = await callChat([
                        { role: "user", content: prompt.prompt },
                        { role: "assistant", content: t1.reply },
                        { role: "user", content: prompt.followUp },
                    ])
                    finalIntent = t2.intent
                    finalConf = t2.confidence
                    aiResponse = t2.reply
                    turnsUsed = 2
                }

                const isRouted = isRoutingTriggered(finalIntent, finalConf)

                // ── Correctness ────────────────────────────────────────────────
                let isCorrect: boolean | null = null
                if (!prompt.ambiguous) {
                    if (prompt.groundTruth === "chat") {
                        isCorrect = !isRouted
                    } else {
                        isCorrect = isRouted && finalIntent === prompt.groundTruth
                    }
                }

                // ── Failure mode ───────────────────────────────────────────────
                let failureMode: FailureMode = null
                if (isCorrect === false) {
                    if (prompt.groundTruth === "chat") {
                        failureMode = "false_positive"
                    } else if (!isRouted) {
                        failureMode = "no_route"
                    } else {
                        failureMode = "wrong_category"
                    }
                }

                setResults((prev) =>
                    prev.map((r) =>
                        r.id === prompt.id
                            ? {
                                  ...r,
                                  status: "done",
                                  keywordIntent,
                                  keywordMatchesGT,
                                  llmIntent: finalIntent,
                                  llmConfidence: finalConf,
                                  turnsUsed,
                                  isRouted,
                                  isCorrect,
                                  failureMode,
                                  aiResponse,
                              }
                            : r,
                    ),
                )
            } catch (err) {
                setResults((prev) =>
                    prev.map((r) =>
                        r.id === prompt.id
                            ? {
                                  ...r,
                                  status: "error",
                                  errorMsg: String(err),
                              }
                            : r,
                    ),
                )
            }

            // Brief pause between API calls to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 600))
        }

        setCurrentId(null)
        setIsRunning(false)
    }, [isRunning])

    const reset = useCallback(() => {
        if (isRunning) return
        setResults(
            TEST_PROMPTS.map((p) => ({
                id: p.id,
                status: "pending" as ResultStatus,
                keywordIntent: null,
                keywordMatchesGT: false,
                llmIntent: "chat" as Intent,
                llmConfidence: 0,
                turnsUsed: 0,
                isRouted: false,
                isCorrect: null,
                failureMode: null,
                aiResponse: "",
            })),
        )
        setCurrentId(null)
    }, [isRunning])

    const exportJson = useCallback(() => {
        if (!isDone || !Platform.OS === "web") return
        const doneResults = results.filter((r) => r.status === "done")
        const stats = computeStats(doneResults)
        const payload = {
            studyCase: "Contextual Intent Routing",
            timestamp: new Date().toISOString(),
            pipeline: "INTENT_KEYWORDS (keyword layer) + LLM (Groq llama-3.3-70b)",
            stats,
            prompts: TEST_PROMPTS.map((p) => {
                const r = doneResults.find((d) => d.id === p.id)
                return {
                    id: p.id,
                    category: p.category,
                    prompt: p.prompt,
                    groundTruth: p.groundTruth,
                    ambiguous: p.ambiguous ?? false,
                    notes: p.notes ?? null,
                    keywordIntent: r?.keywordIntent ?? null,
                    keywordMatchesGT: r?.keywordMatchesGT ?? false,
                    llmIntent: r?.llmIntent ?? null,
                    llmConfidence: r?.llmConfidence ?? null,
                    turnsUsed: r?.turnsUsed ?? null,
                    isRouted: r?.isRouted ?? null,
                    isCorrect: r?.isCorrect ?? null,
                    failureMode: r?.failureMode ?? null,
                }
            }),
        }
        try {
            const blob = new Blob([JSON.stringify(payload, null, 2)], {
                type: "application/json",
            })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `routing_study_${Date.now()}.json`
            a.click()
            URL.revokeObjectURL(url)
        } catch {}
    }, [results, isDone])

    const stats = isDone ? computeStats(results.filter((r) => r.status === "done")) : null

    return (
        <ScrollView
            style={styles.root}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* ── Header ───────────────────────────────────────────────────── */}
            <Pressable
                onPress={() => router.back()}
                style={styles.backBtn}
            >
                <Ionicons name="arrow-back" size={18} color={theme.icon} />
                <NText style={[styles.backLabel, { color: theme.textMuted }]}>
                    Back
                </NText>
            </Pressable>

            <View style={styles.header}>
                <View
                    style={[
                        styles.studyBadge,
                        { backgroundColor: "#8B5CF622", borderColor: "#8B5CF644" },
                    ]}
                >
                    <NText
                        style={[
                            styles.studyBadgeText,
                            { color: "#8B5CF6", fontFamily: fonts.bold },
                        ]}
                    >
                        STUDY CASE 3
                    </NText>
                </View>
                <NText
                    style={[
                        styles.title,
                        { color: theme.text, fontFamily: fonts.bold },
                    ]}
                >
                    Intent Routing Evaluation
                </NText>
                <NText
                    style={[styles.subtitle, { color: theme.textMuted }]}
                >
                    Contextual Intent Routing — From Natural Language to Actionable UI
                </NText>
                <NText
                    style={[styles.description, { color: theme.textSubtle }]}
                >
                    Tests the two-layer routing pipeline (keyword matching + LLM) against 30
                    standardised prompts across 4 categories. Validates H1 (≥80% accuracy),
                    H2 (1–2 turns avg), and H3 (failure mode clustering).
                </NText>
            </View>

            {/* ── Controls ─────────────────────────────────────────────────── */}
            <View style={styles.controls}>
                <NButton
                    onPress={runAll}
                    color={isRunning ? "rgba(139,92,246,0.15)" : "#8B5CF6"}
                    style={{ flex: 1, marginRight: 8 }}
                    disabled={isRunning}
                >
                    <View style={styles.btnInner}>
                        {isRunning ? (
                            <ActivityIndicator
                                size="small"
                                color="#8B5CF6"
                                style={{ marginRight: 8 }}
                            />
                        ) : (
                            <Ionicons
                                name="play"
                                size={16}
                                color={isRunning ? "#8B5CF6" : "#fff"}
                                style={{ marginRight: 8 }}
                            />
                        )}
                        <NText
                            style={[
                                styles.btnText,
                                {
                                    color: isRunning ? "#8B5CF6" : "#fff",
                                    fontFamily: fonts.bold,
                                },
                            ]}
                        >
                            {isRunning
                                ? `Testing ${currentId ?? "..."}/${TEST_PROMPTS.length}`
                                : isDone
                                ? "Re-run All Tests"
                                : "Run All Tests"}
                        </NText>
                    </View>
                </NButton>

                <NButton
                    onPress={reset}
                    color="rgba(255,255,255,0.06)"
                    disabled={isRunning}
                >
                    <Ionicons name="refresh" size={16} color={theme.icon} />
                </NButton>
            </View>

            {/* Progress bar */}
            {(isRunning || isDone) && (
                <View style={{ marginBottom: 20 }}>
                    <View
                        style={[
                            styles.barTrack,
                            { backgroundColor: "rgba(255,255,255,0.08)", height: 6 },
                        ]}
                    >
                        <View
                            style={[
                                styles.barFill,
                                {
                                    width: `${Math.round((doneCnt / TEST_PROMPTS.length) * 100)}%` as any,
                                    backgroundColor: isDone ? "#22C55E" : "#8B5CF6",
                                    height: 6,
                                },
                            ]}
                        />
                    </View>
                    <NText
                        style={[
                            styles.progressText,
                            { color: theme.textSubtle },
                        ]}
                    >
                        {doneCnt} / {TEST_PROMPTS.length} prompts tested
                    </NText>
                </View>
            )}

            {/* ── Results Table ─────────────────────────────────────────────── */}
            <NText
                style={[styles.sectionTitle, { color: theme.textMuted, fontFamily: fonts.bold }]}
            >
                TEST PROMPTS
            </NText>

            <View style={styles.legend}>
                {(["single_simple", "single_ambiguous", "multi_complex", "out_of_scope"] as PromptCategory[]).map(
                    (cat) => (
                        <View key={cat} style={styles.legendItem}>
                            <View
                                style={[
                                    styles.legendDot,
                                    { backgroundColor: CATEGORY_COLORS[cat] },
                                ]}
                            />
                            <NText
                                style={{
                                    color: theme.textSubtle,
                                    fontSize: 10,
                                    fontFamily: fonts.regular,
                                }}
                            >
                                {CATEGORY_LABELS[cat]}
                            </NText>
                        </View>
                    ),
                )}
            </View>

            {results.map((result) => (
                <PromptRow
                    key={result.id}
                    result={result}
                    prompt={TEST_PROMPTS[result.id - 1]}
                />
            ))}

            {/* ── Statistics ────────────────────────────────────────────────── */}
            {isDone && stats && (
                <>
                    <NText
                        style={[
                            styles.sectionTitle,
                            {
                                color: theme.textMuted,
                                fontFamily: fonts.bold,
                                marginTop: 32,
                            },
                        ]}
                    >
                        RESULTS SUMMARY
                    </NText>

                    {/* Top-line metric cards */}
                    <View style={styles.statsRow}>
                        <StatCard
                            icon="checkmark-circle"
                            label="Overall Accuracy"
                            value={`${stats.overallAccuracy}%`}
                            sub={`${stats.correct}/${stats.eligible} eligible`}
                            color={stats.overallAccuracy >= 80 ? "#22C55E" : "#EF4444"}
                        />
                        <StatCard
                            icon="time"
                            label="Avg Turns (All)"
                            value={
                                stats.avgTurnsCorrect !== null
                                    ? stats.avgTurnsCorrect.toFixed(2)
                                    : "—"
                            }
                            sub="Turns for correct routes"
                            color={
                                stats.avgTurnsCorrect !== null &&
                                stats.avgTurnsCorrect <= 2
                                    ? "#22C55E"
                                    : "#F59E0B"
                            }
                        />
                        <StatCard
                            icon="close-circle"
                            label="Routing Failures"
                            value={String(
                                stats.failureCounts.wrong_category +
                                    stats.failureCounts.no_route +
                                    stats.failureCounts.false_positive,
                            )}
                            sub={`${stats.failureCounts.no_route} no-route · ${stats.failureCounts.wrong_category} wrong cat`}
                            color="#EF4444"
                        />
                        <StatCard
                            icon="key"
                            label="Keyword Hits"
                            value={String(stats.keywordHits)}
                            sub={`${stats.keywordCorrect} matched GT`}
                            color="#F59E0B"
                        />
                    </View>

                    {/* ── H1: Accuracy ──────────────────────────────────────── */}
                    <GlassCard
                        borderRadius={12}
                        style={styles.chartBlockOuter}
                        innerStyle={styles.chartBlockInner}
                    >
                        <View style={styles.hypothesisHeader}>
                            <View
                                style={[
                                    styles.hypothesisBadge,
                                    {
                                        backgroundColor:
                                            stats.overallAccuracy >= 80
                                                ? "#22C55E22"
                                                : "#EF444422",
                                        borderColor:
                                            stats.overallAccuracy >= 80
                                                ? "#22C55E66"
                                                : "#EF444466",
                                    },
                                ]}
                            >
                                <Ionicons
                                    name={
                                        stats.overallAccuracy >= 80
                                            ? "checkmark-circle"
                                            : "close-circle"
                                    }
                                    size={14}
                                    color={
                                        stats.overallAccuracy >= 80
                                            ? "#22C55E"
                                            : "#EF4444"
                                    }
                                    style={{ marginRight: 4 }}
                                />
                                <NText
                                    style={{
                                        color:
                                            stats.overallAccuracy >= 80
                                                ? "#22C55E"
                                                : "#EF4444",
                                        fontSize: 11,
                                        fontFamily: fonts.bold,
                                    }}
                                >
                                    H1{" "}
                                    {stats.overallAccuracy >= 80
                                        ? "SUPPORTED"
                                        : "REJECTED"}
                                </NText>
                            </View>
                        </View>
                        <NText
                            style={[
                                styles.chartTitle,
                                { color: theme.text, fontFamily: fonts.bold },
                            ]}
                        >
                            Routing Accuracy by Category
                        </NText>
                        <NText
                            style={[styles.chartSub, { color: theme.textSubtle }]}
                        >
                            H1: ≥80% accuracy threshold (dashed line)
                        </NText>
                        {(
                            [
                                "single_simple",
                                "single_ambiguous",
                                "multi_complex",
                                "out_of_scope",
                            ] as PromptCategory[]
                        ).map((cat) => (
                            <AccuracyBar
                                key={cat}
                                pct={stats.byCategory[cat].accuracy}
                                color={CATEGORY_COLORS[cat]}
                                label={CATEGORY_FULL_LABELS[cat]}
                                eligible={stats.byCategory[cat].eligible}
                            />
                        ))}
                        <View style={styles.overallBarWrap}>
                            <AccuracyBar
                                pct={stats.overallAccuracy}
                                color="#8B5CF6"
                                label="OVERALL"
                                eligible={stats.eligible}
                            />
                        </View>
                        <NText
                            style={[styles.benchmarkNote, { color: theme.textSubtle }]}
                        >
                            ← Below H1 threshold (80%) · H1 boundary →
                        </NText>
                    </GlassCard>

                    {/* ── H2: Turns ─────────────────────────────────────────── */}
                    <GlassCard
                        borderRadius={12}
                        style={styles.chartBlockOuter}
                        innerStyle={styles.chartBlockInner}
                    >
                        <View style={styles.hypothesisHeader}>
                            <View
                                style={[
                                    styles.hypothesisBadge,
                                    {
                                        backgroundColor:
                                            stats.avgTurnsCorrect !== null &&
                                            stats.avgTurnsCorrect <= 2
                                                ? "#22C55E22"
                                                : "#F59E0B22",
                                        borderColor:
                                            stats.avgTurnsCorrect !== null &&
                                            stats.avgTurnsCorrect <= 2
                                                ? "#22C55E66"
                                                : "#F59E0B66",
                                    },
                                ]}
                            >
                                <Ionicons
                                    name={
                                        stats.avgTurnsCorrect !== null &&
                                        stats.avgTurnsCorrect <= 2
                                            ? "checkmark-circle"
                                            : "alert-circle"
                                    }
                                    size={14}
                                    color={
                                        stats.avgTurnsCorrect !== null &&
                                        stats.avgTurnsCorrect <= 2
                                            ? "#22C55E"
                                            : "#F59E0B"
                                    }
                                    style={{ marginRight: 4 }}
                                />
                                <NText
                                    style={{
                                        color:
                                            stats.avgTurnsCorrect !== null &&
                                            stats.avgTurnsCorrect <= 2
                                                ? "#22C55E"
                                                : "#F59E0B",
                                        fontSize: 11,
                                        fontFamily: fonts.bold,
                                    }}
                                >
                                    H2{" "}
                                    {stats.avgTurnsCorrect !== null &&
                                    stats.avgTurnsCorrect <= 2
                                        ? "SUPPORTED"
                                        : "MARGINAL"}
                                </NText>
                            </View>
                        </View>
                        <NText
                            style={[
                                styles.chartTitle,
                                { color: theme.text, fontFamily: fonts.bold },
                            ]}
                        >
                            Turns-to-Routing Distribution
                        </NText>
                        <NText
                            style={[styles.chartSub, { color: theme.textSubtle }]}
                        >
                            H2: correctly routed prompts resolve in 1–2 turns
                        </NText>
                        {[1, 2].map((turn) => {
                            const cnt = results.filter(
                                (r) =>
                                    r.status === "done" &&
                                    r.isCorrect === true &&
                                    r.turnsUsed === turn,
                            ).length
                            return (
                                <HorizBar
                                    key={turn}
                                    value={cnt}
                                    max={stats.correct || 1}
                                    color={turn === 1 ? "#22C55E" : "#F59E0B"}
                                    label={`Turn ${turn}`}
                                    sub={`correctly routed in ${turn} turn${turn > 1 ? "s" : ""}`}
                                />
                            )
                        })}
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                marginTop: 8,
                            }}
                        >
                            <NText style={[styles.chartSub, { color: theme.textSubtle }]}>
                                Avg turns (correct routes):{" "}
                                <NText
                                    style={{
                                        fontFamily: fonts.bold,
                                        color: theme.textMuted,
                                    }}
                                >
                                    {stats.avgTurnsCorrect !== null
                                        ? stats.avgTurnsCorrect.toFixed(2)
                                        : "—"}
                                </NText>
                            </NText>
                            <NText style={[styles.chartSub, { color: theme.textSubtle }]}>
                                Avg all:{" "}
                                <NText
                                    style={{
                                        fontFamily: fonts.bold,
                                        color: theme.textMuted,
                                    }}
                                >
                                    {stats.avgTurnsAll.toFixed(2)}
                                </NText>
                            </NText>
                        </View>
                    </GlassCard>

                    {/* ── H3: Failure Modes ─────────────────────────────────── */}
                    <GlassCard
                        borderRadius={12}
                        style={styles.chartBlockOuter}
                        innerStyle={styles.chartBlockInner}
                    >
                        <View style={styles.hypothesisHeader}>
                            <View
                                style={[
                                    styles.hypothesisBadge,
                                    {
                                        backgroundColor: "#8B5CF622",
                                        borderColor: "#8B5CF644",
                                    },
                                ]}
                            >
                                <Ionicons
                                    name="analytics"
                                    size={14}
                                    color="#8B5CF6"
                                    style={{ marginRight: 4 }}
                                />
                                <NText
                                    style={{
                                        color: "#8B5CF6",
                                        fontSize: 11,
                                        fontFamily: fonts.bold,
                                    }}
                                >
                                    H3 ANALYSIS
                                </NText>
                            </View>
                        </View>
                        <NText
                            style={[
                                styles.chartTitle,
                                { color: theme.text, fontFamily: fonts.bold },
                            ]}
                        >
                            Failure Mode Breakdown
                        </NText>
                        <NText
                            style={[styles.chartSub, { color: theme.textSubtle }]}
                        >
                            H3: failures cluster in multi-system / complex prompts
                        </NText>
                        <HorizBar
                            value={stats.failureCounts.no_route}
                            max={stats.eligible || 1}
                            color="#EF4444"
                            label="No Route Triggered"
                            sub="LLM did not exceed 0.75 confidence"
                        />
                        <HorizBar
                            value={stats.failureCounts.wrong_category}
                            max={stats.eligible || 1}
                            color="#F59E0B"
                            label="Wrong Category"
                            sub="Route triggered but intent ≠ ground truth"
                        />
                        <HorizBar
                            value={stats.failureCounts.false_positive}
                            max={stats.eligible || 1}
                            color="#8B5CF6"
                            label="False Positive (Out-of-scope routed)"
                            sub="Adversarial prompt triggered routing"
                        />

                        {/* Per-category failure breakdown */}
                        <NText
                            style={[
                                styles.chartSub,
                                {
                                    color: theme.textMuted,
                                    marginTop: 16,
                                    marginBottom: 8,
                                    fontFamily: fonts.bold,
                                },
                            ]}
                        >
                            Failures by category:
                        </NText>
                        {(
                            [
                                "single_simple",
                                "single_ambiguous",
                                "multi_complex",
                                "out_of_scope",
                            ] as PromptCategory[]
                        ).map((cat) => {
                            const catResults = results.filter(
                                (r) =>
                                    r.status === "done" &&
                                    TEST_PROMPTS[r.id - 1].category === cat &&
                                    r.isCorrect === false,
                            )
                            return (
                                <HorizBar
                                    key={cat}
                                    value={catResults.length}
                                    max={stats.byCategory[cat].eligible || 1}
                                    color={CATEGORY_COLORS[cat]}
                                    label={CATEGORY_FULL_LABELS[cat]}
                                    sub={`${catResults.length} failure${catResults.length !== 1 ? "s" : ""}`}
                                />
                            )
                        })}
                    </GlassCard>

                    {/* ── Intent Distribution ───────────────────────────────── */}
                    <GlassCard
                        borderRadius={12}
                        style={styles.chartBlockOuter}
                        innerStyle={styles.chartBlockInner}
                    >
                        <NText
                            style={[
                                styles.chartTitle,
                                { color: theme.text, fontFamily: fonts.bold },
                            ]}
                        >
                            Routing Intent Distribution
                        </NText>
                        <NText
                            style={[styles.chartSub, { color: theme.textSubtle }]}
                        >
                            How the LLM classified all 30 prompts
                        </NText>
                        {(["appointment", "shop", "map", "chat"] as Intent[]).map(
                            (intent) => (
                                <HorizBar
                                    key={intent}
                                    value={stats.intentDist[intent]}
                                    max={stats.total || 1}
                                    color={INTENT_COLORS[intent]}
                                    label={INTENT_LABELS[intent]}
                                />
                            ),
                        )}
                    </GlassCard>

                    {/* ── Keyword vs LLM Layer ──────────────────────────────── */}
                    <GlassCard
                        borderRadius={12}
                        style={styles.chartBlockOuter}
                        innerStyle={styles.chartBlockInner}
                    >
                        <NText
                            style={[
                                styles.chartTitle,
                                { color: theme.text, fontFamily: fonts.bold },
                            ]}
                        >
                            Keyword Layer vs. LLM Layer
                        </NText>
                        <NText
                            style={[styles.chartSub, { color: theme.textSubtle }]}
                        >
                            Pre-send keyword detection accuracy vs. post-send LLM routing
                        </NText>
                        <HorizBar
                            value={stats.keywordHits}
                            max={stats.total || 1}
                            color="#F59E0B"
                            label="Keyword layer — any match"
                            sub="INTENT_KEYWORDS triggered pre-send"
                        />
                        <HorizBar
                            value={stats.keywordCorrect}
                            max={stats.total || 1}
                            color="#22C55E"
                            label="Keyword layer — correct GT match"
                            sub="Keyword intent === ground truth"
                        />
                        <HorizBar
                            value={stats.correct}
                            max={stats.eligible || 1}
                            color="#8B5CF6"
                            label="LLM layer — correct route"
                            sub="LLM confidence > 0.75 and intent === GT"
                        />
                    </GlassCard>

                    {/* ── Export ────────────────────────────────────────────── */}
                    <NText
                        style={[
                            styles.sectionTitle,
                            {
                                color: theme.textMuted,
                                fontFamily: fonts.bold,
                                marginTop: 24,
                            },
                        ]}
                    >
                        EXPORT
                    </NText>
                    <NButton onPress={exportJson} color="#8B5CF6">
                        <View style={styles.btnInner}>
                            <Ionicons
                                name="download-outline"
                                size={16}
                                color="#fff"
                                style={{ marginRight: 8 }}
                            />
                            <NText
                                style={[
                                    styles.btnText,
                                    { color: "#fff", fontFamily: fonts.bold },
                                ]}
                            >
                                Download Full Results JSON
                            </NText>
                        </View>
                    </NButton>
                    <NText
                        style={[
                            styles.exportNote,
                            { color: theme.textSubtle },
                        ]}
                    >
                        JSON includes all 30 prompts, ground-truth labels, LLM responses,
                        confidence scores, turn counts, and computed statistics. Suitable for
                        import into Excel, Python, or R for further analysis and graph generation.
                    </NText>
                </>
            )}

            <View style={{ height: 60 }} />
        </ScrollView>
    )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "web" ? 40 : 60,
        paddingBottom: 40,
        maxWidth: 860,
        alignSelf: "center" as any,
        width: "100%",
    },
    backBtn: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
        gap: 6,
    },
    backLabel: {
        fontSize: 13,
        fontFamily: "IosevkaCharon_400Regular",
    },
    header: {
        marginBottom: 28,
    },
    studyBadge: {
        alignSelf: "flex-start",
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginBottom: 12,
    },
    studyBadgeText: {
        fontSize: 11,
        letterSpacing: 1.5,
    },
    title: {
        fontSize: 24,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 10,
        fontFamily: "IosevkaCharon_400Regular",
    },
    description: {
        fontSize: 12,
        lineHeight: 18,
        fontFamily: "IosevkaCharon_300Light",
    },
    controls: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    btnInner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    btnText: {
        fontSize: 14,
    },
    progressText: {
        fontSize: 11,
        textAlign: "right",
        marginTop: 4,
        fontFamily: "IosevkaCharon_400Regular",
    },
    sectionTitle: {
        fontSize: 11,
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    legend: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 12,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    promptRowOuter: {
        marginBottom: 8,
    },
    promptRowInner: {
        padding: 12,
    },
    promptRowHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
    },
    promptText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
        fontFamily: "IosevkaCharon_400Regular",
    },
    promptTags: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        flexShrink: 0,
    },
    resultBadge: {
        fontSize: 15,
        marginLeft: 2,
    },
    promptDetail: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "rgba(255,255,255,0.1)",
    },
    detailGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    detailItem: {
        gap: 3,
    },
    detailLabel: {
        fontSize: 10,
        letterSpacing: 0.5,
        fontFamily: "IosevkaCharon_400Regular",
    },
    chip: {
        borderWidth: 1,
        borderRadius: 6,
    },
    chipText: {
        letterSpacing: 0.3,
    },
    statsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 20,
    },
    statCardOuter: {
        flex: 1,
        minWidth: 140,
    },
    statCardInner: {
        padding: 14,
        alignItems: "center",
    },
    statValue: {
        fontSize: 22,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        textAlign: "center",
        fontFamily: "IosevkaCharon_400Regular",
    },
    statSub: {
        fontSize: 10,
        textAlign: "center",
        marginTop: 3,
        fontFamily: "IosevkaCharon_300Light",
    },
    chartBlockOuter: {
        marginBottom: 16,
    },
    chartBlockInner: {
        padding: 16,
    },
    hypothesisHeader: {
        flexDirection: "row",
        marginBottom: 8,
    },
    hypothesisBadge: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    chartTitle: {
        fontSize: 15,
        marginBottom: 3,
    },
    chartSub: {
        fontSize: 11,
        marginBottom: 14,
        fontFamily: "IosevkaCharon_300Light",
    },
    overallBarWrap: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "rgba(255,255,255,0.1)",
    },
    benchmarkNote: {
        fontSize: 10,
        textAlign: "center",
        marginTop: 4,
        fontFamily: "IosevkaCharon_300Light",
    },
    barTrack: {
        height: 8,
        borderRadius: 4,
        overflow: "hidden",
        position: "relative",
    },
    barFill: {
        height: "100%",
        borderRadius: 4,
    },
    benchmarkLine: {
        position: "absolute",
        width: 1,
        height: "100%",
        zIndex: 1,
    },
    exportNote: {
        fontSize: 11,
        lineHeight: 17,
        marginTop: 10,
        fontFamily: "IosevkaCharon_300Light",
    },
})
