import {
    StyleSheet,
    View,
    ScrollView,
    ActivityIndicator,
    Animated,
    Easing,
    Platform,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { NButton } from "../../components/replacements/NButton"
import { NInput } from "../../components/replacements/NInput"
import { NModal } from "../../components/replacements/NModal"
import { Ionicons } from "@expo/vector-icons"
import { Suggestions } from "../../components/bundle/Suggestions"
import React, { useRef, useState, useEffect } from "react"
import { NText } from "../../components/replacements/NText"
import { fonts } from "../../theme"
import { useRouter } from "expo-router"
import { useChatContext } from "../../context/ChatContext"
import { useAuthContext } from "../../context/AuthContext"
import { useProfileContext } from "../../context/ProfileContext"
import { useTheme } from "../../context/ThemeContext"
import { useAlphaNotice } from "../../hooks/useAlphaNotice"
import { useInfoNotice } from "../../context/InfoNoticeContext"
import { useTranslation } from "react-i18next"
import "../../i18n"

const CHAT_API_URL = "/api/chat"

const INTENT_KEYWORDS: Record<
    string,
    {
        words: string[]
        route: string
        label: string
        icon: "map" | "calendar" | "cart"
    }
> = {
    shop: {
        words: [
            // English
            "buy",
            "parts",
            "shop",
            "purchase",
            "order",
            "product",
            "products",
            "spare",
            "component",
            "components",
            // Romanian
            "cumpăr",
            "cumpara",
            "cumpăra",
            "piese",
            "piesă",
            "magazin",
            "achiziție",
            "achiziționez",
            "comandă",
            "comand",
            "produs",
            "produse",
            "componentă",
            "componente",
        ],
        route: "/(tabs)/shop",
        label: "Go to Shop",
        icon: "cart",
    },
    appointment: {
        words: [
            // English
            "appointment",
            "book",
            "booking",
            "schedule",
            "reserve",
            "service",
            "repair",
            "fix",
            "maintenance",
            // Romanian
            "programare",
            "programez",
            "rezerv",
            "rezervare",
            "program",
            "serviciu",
            "reparație",
            "repara",
            "reparare",
            "întreținere",
            "fixez",
            "service",
        ],
        route: "/(tabs)/appointment",
        label: "Go to Appointment",
        icon: "calendar",
    },
    map: {
        words: [
            // English
            "map",
            "location",
            "directions",
            "nearby",
            "garage",
            "workshop",
            "where",
            "address",
            // Romanian
            "hartă",
            "locație",
            "direcții",
            "aproape",
            "garaj",
            "atelier",
            "unde",
            "adresă",
        ],
        route: "/(tabs)/map",
        label: "Go to Map",
        icon: "map",
    },
}

function getHighlightedSegments(
    text: string,
): { text: string; highlight: boolean }[] {
    const allKeywords = Object.values(INTENT_KEYWORDS).flatMap((v) => v.words)
    const segments: { text: string; highlight: boolean }[] = []
    // Character class includes Romanian diacritics (ă â î ș ț and uppercase)
    // so words like "hartă" or "programare" tokenise as a single unit.
    const parts = text.split(
        /([A-Za-z0-9\u0103\u00e2\u00ee\u015f\u0163\u0102\u00c2\u00ce\u015e\u0162]+)/i,
    )
    for (const part of parts) {
        segments.push({
            text: part,
            highlight: allKeywords.includes(part.toLowerCase()),
        })
    }
    return segments
}

// ─── Helper components ────────────────────────────────────────────────────────

function TypingDots() {
    const { theme } = useTheme()
    const dot1 = useRef(new Animated.Value(0)).current
    const dot2 = useRef(new Animated.Value(0)).current
    const dot3 = useRef(new Animated.Value(0)).current

    useEffect(() => {
        const makeBounce = (dot: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, {
                        toValue: -6,
                        duration: 260,
                        useNativeDriver: true,
                        easing: Easing.out(Easing.ease),
                    }),
                    Animated.timing(dot, {
                        toValue: 0,
                        duration: 260,
                        useNativeDriver: true,
                        easing: Easing.in(Easing.ease),
                    }),
                    Animated.delay(500),
                ]),
            )
        const a1 = makeBounce(dot1, 0)
        const a2 = makeBounce(dot2, 140)
        const a3 = makeBounce(dot3, 280)
        a1.start()
        a2.start()
        a3.start()
        return () => {
            a1.stop()
            a2.stop()
            a3.stop()
        }
    }, [])

    return (
        <View
            style={{
                flexDirection: "row",
                gap: 5,
                paddingVertical: 4,
                paddingHorizontal: 2,
                alignItems: "flex-end",
            }}
        >
            {([dot1, dot2, dot3] as Animated.Value[]).map((dot, i) => (
                <Animated.View
                    key={i}
                    style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.text,
                        opacity: 0.55,
                        transform: [{ translateY: dot }],
                    }}
                />
            ))}
        </View>
    )
}

function MessageBubble({ children }: { children: React.ReactNode }) {
    const opacity = useRef(new Animated.Value(0)).current
    const translateY = useRef(new Animated.Value(14)).current

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 320,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 320,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
            }),
        ]).start()
    }, [])

    return (
        <Animated.View style={{ opacity, transform: [{ translateY }] }}>
            {children}
        </Animated.View>
    )
}

function formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    })
}

/** Single word that pops in with a fade + spring-up + scale-up on mount. */
function StreamWord({ word }: { word: string }) {
    const opacity = useRef(new Animated.Value(0)).current
    const translateY = useRef(new Animated.Value(6)).current
    const scale = useRef(new Animated.Value(0.82)).current

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 280,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
            }),
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 140,
                friction: 14,
            }),
            Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 140,
                friction: 14,
            }),
        ]).start()
    }, [])

    return (
        <Animated.View
            style={{
                opacity,
                transform: [{ translateY }, { scale }],
            }}
        >
            <NText style={{ fontFamily: fonts.light }}>{word + " "}</NText>
        </Animated.View>
    )
}

/**
 * Renders each word as a separate animated token (pop-in on mount).
 * Because words are keyed by index, only the newest word re-mounts and
 * animates — existing tokens stay mounted and static.
 */
function StreamingText({ content }: { content: string }) {
    const words = content.split(" ").filter(Boolean)
    return (
        <View
            style={{
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "flex-end",
            }}
        >
            {words.map((word, i) => (
                <StreamWord key={i} word={word} />
            ))}
        </View>
    )
}

// ──────────────────────────────────────────────────────────────────────────────

interface Message {
    role: "user" | "assistant"
    content: string
}

export default function ChatScreen() {
    // enabling router
    const router = useRouter()
    const { t } = useTranslation()
    const { theme, colorScheme } = useTheme()

    const { userEmail } = useAuthContext()
    const { profile } = useProfileContext()
    const firstName = profile?.firstName || ""

    // Derive vehicleInfo from the user's primary vehicle (if any)
    const primaryVehicle = profile?.vehicles?.find((v) => v.isPrimary) ?? null
    const vehicleInfoFromProfile = primaryVehicle
        ? {
              make: primaryVehicle.make || null,
              model: primaryVehicle.model || null,
              year: primaryVehicle.year
                  ? parseInt(primaryVehicle.year, 10)
                  : null,
              mileage: primaryVehicle.currentMileage
                  ? parseInt(primaryVehicle.currentMileage, 10)
                  : null,
              warningLights: null as boolean | null,
          }
        : null
    const [query, setQuery] = useState("")
    const [loading, setLoading] = useState(false)
    const [chatIntent, setChatIntent] = useState<string>("")
    const [chatConfidence, setChatConfidence] = useState<number>(0)
    const [hasIntentSuggestion, setHasIntentSuggestion] = useState(false)
    const [hasSuggestions, setHasSuggestions] = useState(false)
    const intentHeightAnim = useRef(new Animated.Value(0)).current
    const intentOpacityAnim = useRef(new Animated.Value(0)).current
    const quickActionsOpacity = useRef(new Animated.Value(1)).current
    const chatNotice = useAlphaNotice("chat-logging")
    const { register } = useInfoNotice()

    useEffect(() => {
        register(chatNotice.show)
        return () => register(null)
    }, [])

    // Use global chat context
    const {
        messages,
        setMessages,
        summary,
        setSummary,
        vehicleInfo,
        setVehicleInfo,
        setPartQuery,
        setPartPriceLimit,
        conversationId,
        clearChat,
    } = useChatContext()

    // (1 = Initial, 0 = Chat Mode)
    const transitionAnim = useRef(new Animated.Value(1)).current
    const chatShiftAnim = useRef(new Animated.Value(0)).current

    const scrollRef = useRef<ScrollView>(null)
    const chatStarted = messages.length > 0

    // Timestamps array — one entry per message, parallel to messages[]
    const [timestamps, setTimestamps] = useState<number[]>(() =>
        Array(messages.length).fill(Date.now()),
    )
    // Word-by-word streaming of the last assistant reply
    const [streamingContent, setStreamingContent] = useState<string | null>(
        null,
    )
    const streamingRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    // Greeting fade-out: start hidden if chat already has messages
    const [greetingHidden, setGreetingHidden] = useState(chatStarted)
    const greetingOpacity = useRef(
        new Animated.Value(chatStarted ? 0 : 1),
    ).current

    // Sync animation state with chat history when returning to screen
    useEffect(() => {
        if (chatStarted) {
            transitionAnim.setValue(0)
        } else {
            transitionAnim.setValue(1)
        }
    }, [chatStarted, transitionAnim])

    // Fade the greeting out when the first message is sent, then unmount it
    useEffect(() => {
        if (chatStarted && !greetingHidden) {
            Animated.timing(greetingOpacity, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
            }).start(() => setGreetingHidden(true))
        }
    }, [chatStarted])

    // Seed vehicleInfo from the primary vehicle when profile loads,
    // but only if vehicleInfo is still empty (no data gathered yet)
    useEffect(() => {
        if (
            vehicleInfoFromProfile &&
            vehicleInfo.make === null &&
            vehicleInfo.model === null &&
            vehicleInfo.year === null
        ) {
            setVehicleInfo(vehicleInfoFromProfile)
        }
    }, [profile])

    // Clean up streaming timer on unmount
    useEffect(() => {
        return () => {
            if (streamingRef.current) clearTimeout(streamingRef.current)
        }
    }, [])

    const handleSubmit = async (overrideText?: string) => {
        const trimmed = (overrideText ?? query).trim()
        if (!trimmed || loading) return

        if (!chatStarted) {
            Animated.timing(transitionAnim, {
                toValue: 0,
                duration: 600,
                easing: Easing.out(Easing.exp),
                useNativeDriver: false,
            }).start()
        }

        const newMessages: Message[] = [
            ...messages,
            { role: "user", content: trimmed },
        ]
        setMessages(newMessages)
        setTimestamps((prev) => [...prev, Date.now()])
        setQuery("")
        setLoading(true)

        try {
            const res = await fetch(CHAT_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: newMessages,
                    vehicleInfo,
                    userId: userEmail,
                    conversationId,
                }),
            })

            if (!res.ok) {
                throw new Error(`API error: ${res.status}`)
            }

            const data = await res.json()

            // Validate that we have a reply
            if (!data.reply) {
                throw new Error("No reply in API response")
            }

            // Only add the assistant message if it has content
            setMessages([
                ...newMessages,
                { role: "assistant", content: data.reply },
            ])
            setTimestamps((prev) => [...prev, Date.now()])

            // Word-by-word streaming reveal of the assistant reply
            if (streamingRef.current) clearTimeout(streamingRef.current)
            const words = data.reply.split(" ")
            setStreamingContent("")
            let wordIdx = 0
            const revealNext = () => {
                wordIdx++
                setStreamingContent(words.slice(0, wordIdx).join(" "))
                if (wordIdx < words.length) {
                    streamingRef.current = setTimeout(revealNext, 28)
                } else {
                    streamingRef.current = setTimeout(
                        () => setStreamingContent(null),
                        80,
                    )
                }
            }
            streamingRef.current = setTimeout(revealNext, 28)

            // Store the summary separately
            if (data.summary) {
                setSummary(data.summary)
            }

            // Update vehicle info with any new details extracted
            if (data.vehicleInfo) {
                setVehicleInfo({
                    ...vehicleInfo,
                    ...data.vehicleInfo,
                })
            }

            // Update part query for the shop tab
            if (data.partQuery) {
                setPartQuery(data.partQuery)
            }

            // Update price limit for the shop tab
            if (data.partPriceLimit !== undefined) {
                setPartPriceLimit(data.partPriceLimit)
            }

            // Update intent and confidence for suggestions
            if (data.intent) {
                setChatIntent(data.intent)
                setChatConfidence(data.confidence || 0)
            }
        } catch (err) {
            console.error("Chat error:", err)
            // Remove the user message if the API call failed
            setMessages(messages)
        } finally {
            setLoading(false)
            scrollRef.current?.scrollToEnd({ animated: true })
        }
    }

    const handleQuickAction = (text: string) => {
        handleSubmit(text)
    }

    const handleNewChat = () => {
        if (streamingRef.current) clearTimeout(streamingRef.current)
        setStreamingContent(null)
        setTimestamps([])
        setGreetingHidden(false)
        greetingOpacity.setValue(1)
        clearChat()
        // Re-seed vehicle info from primary vehicle after clearing
        if (vehicleInfoFromProfile) {
            setVehicleInfo(vehicleInfoFromProfile)
        }
        setChatIntent("")
        setChatConfidence(0)
        setQuery("")
        // Reset animation back to initial state
        Animated.timing(transitionAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.exp),
            useNativeDriver: false,
        }).start()
    }

    const showIntentRecommendation =
        messages.length > 0 &&
        messages[messages.length - 1]?.role === "assistant" &&
        !loading &&
        !!chatIntent &&
        chatIntent !== "chat" &&
        chatConfidence > 0.75

    const intentIcon =
        chatIntent === "map" ? (
            <Ionicons name="map" size={16} color={theme.icon} />
        ) : chatIntent === "appointment" ? (
            <Ionicons name="calendar" size={16} color={theme.icon} />
        ) : chatIntent === "shop" ? (
            <Ionicons name="cart" size={16} color={theme.icon} />
        ) : null

    // Animate quick chips in/out when suggestions appear/disappear
    useEffect(() => {
        Animated.timing(quickActionsOpacity, {
            toValue: hasSuggestions ? 0 : 1,
            duration: 220,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start()
    }, [hasSuggestions])

    // Animate the intent button in/out. Lives outside the scroll so it
    // never causes the message list to shift when it appears.
    useEffect(() => {
        Animated.parallel([
            Animated.timing(intentHeightAnim, {
                toValue: showIntentRecommendation ? 70 : 0,
                duration: 250,
                easing: Easing.out(Easing.ease),
                useNativeDriver: false,
            }),
            Animated.timing(intentOpacityAnim, {
                toValue: showIntentRecommendation ? 1 : 0,
                duration: 250,
                easing: Easing.out(Easing.ease),
                useNativeDriver: false,
            }),
        ]).start()
    }, [showIntentRecommendation])

    return (
        <View style={styles.container}>
            {/* New Chat button — floats top-right, absolute so it never
                participates in the flex layout */}
            {chatStarted && (
                <NButton onPress={handleNewChat} style={styles.newChatButton}>
                    <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                    >
                        <Ionicons name="refresh" size={18} color={theme.icon} />
                        <NText
                            style={{ fontFamily: fonts.bold, marginLeft: 6 }}
                        >
                            {t("chat.newChat")}
                        </NText>
                    </View>
                </NButton>
            )}

            {/* Greeting — fades out when first message is sent, then unmounts */}
            {!greetingHidden && (
                <Animated.View
                    style={[styles.centerContent, { opacity: greetingOpacity }]}
                    pointerEvents={chatStarted ? "none" : "auto"}
                >
                    <NText
                        style={[styles.greeting, { fontFamily: fonts.regular }]}
                    >
                        {firstName
                            ? t("chat.greeting", { name: firstName })
                            : t("chat.greetingAnon")}
                    </NText>
                    <Animated.View
                        style={[
                            styles.quickActions,
                            { opacity: quickActionsOpacity },
                        ]}
                        pointerEvents={hasSuggestions ? "none" : "auto"}
                    >
                        {[
                            {
                                key: "quickBook",
                                icon: "calendar-outline" as const,
                            },
                            {
                                key: "quickFind",
                                icon: "location-outline" as const,
                            },
                            {
                                key: "quickParts",
                                icon: "construct-outline" as const,
                            },
                        ].map(({ key, icon }) => (
                            <NButton
                                key={key}
                                onPress={() =>
                                    handleQuickAction(t(`chat.${key}`))
                                }
                                color="rgba(255,255,255,0.07)"
                                style={styles.quickChip}
                            >
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 6,
                                    }}
                                >
                                    <Ionicons
                                        name={icon}
                                        size={14}
                                        color={theme.icon}
                                    />
                                    <NText
                                        style={{
                                            fontFamily: fonts.regular,
                                            fontSize: 13,
                                        }}
                                    >
                                        {t(`chat.${key}`)}
                                    </NText>
                                </View>
                            </NButton>
                        ))}
                    </Animated.View>
                </Animated.View>
            )}

            {/* Message list — flex: 1 so it takes whatever space is left
                above the overlay. No dynamic paddingBottom; the scroll
                simply shrinks when the overlay grows. */}
            {chatStarted && (
                <ScrollView
                    ref={scrollRef}
                    style={styles.messageList}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.messageListContent}
                    onContentSizeChange={() =>
                        scrollRef.current?.scrollToEnd({ animated: true })
                    }
                >
                    {messages.map((msg, i) => {
                        const isLastAssistant =
                            msg.role === "assistant" &&
                            i === messages.length - 1
                        const displayContent =
                            isLastAssistant && streamingContent !== null
                                ? streamingContent
                                : msg.content
                        return (
                            <MessageBubble key={i}>
                                <View
                                    style={[
                                        styles.bubble,
                                        { alignSelf: "center" },
                                    ]}
                                >
                                    {msg.role === "user" ? (
                                        <>
                                            <View style={styles.bubbleHeader}>
                                                <NText
                                                    style={{
                                                        fontFamily: fonts.bold,
                                                        textAlign: "right",
                                                        flex: 1,
                                                        paddingRight: 8,
                                                    }}
                                                >
                                                    {firstName || "You"}
                                                </NText>
                                            </View>
                                            <NButton color="rgba(33, 168, 112, 0.51)">
                                                <NText
                                                    style={{
                                                        fontFamily: fonts.bold,
                                                    }}
                                                >
                                                    {msg.content}
                                                </NText>
                                            </NButton>
                                        </>
                                    ) : (
                                        <>
                                            <View style={styles.bubbleHeader}>
                                                <NText
                                                    style={{
                                                        fontFamily:
                                                            fonts.regular,
                                                        flex: 1,
                                                        paddingLeft: 8,
                                                    }}
                                                >
                                                    {t("chat.assistantLabel")}
                                                </NText>
                                            </View>
                                            <NButton color="rgba(34, 34, 34, 0.51)">
                                                {isLastAssistant &&
                                                streamingContent !== null ? (
                                                    <StreamingText
                                                        content={displayContent}
                                                    />
                                                ) : (
                                                    <NText
                                                        style={{
                                                            fontFamily:
                                                                fonts.light,
                                                        }}
                                                    >
                                                        {displayContent}
                                                    </NText>
                                                )}
                                            </NButton>
                                        </>
                                    )}
                                    {timestamps[i] !== undefined && (
                                        <NText style={styles.timestamp}>
                                            {formatTime(timestamps[i])}
                                        </NText>
                                    )}
                                </View>
                            </MessageBubble>
                        )
                    })}
                    {loading && (
                        <MessageBubble>
                            <View
                                style={[styles.bubble, { alignSelf: "center" }]}
                            >
                                <View style={styles.bubbleHeader}>
                                    <View style={styles.avatarAssistant}>
                                        <Ionicons
                                            name="build"
                                            size={13}
                                            color={theme.icon}
                                        />
                                    </View>
                                    <NText
                                        style={{ fontFamily: fonts.regular }}
                                    >
                                        {t("chat.assistantLabel")}
                                    </NText>
                                </View>
                                <NButton color="rgba(34, 34, 34, 0.51)">
                                    <TypingDots />
                                </NButton>
                            </View>
                        </MessageBubble>
                    )}
                </ScrollView>
            )}

            {/* Bottom overlay — in normal flex flow, so when it grows the
                ScrollView above it shrinks gracefully with no layout jump */}
            <View style={styles.bottomOverlay}>
                {/* Intent button slides in/out without touching the scroll */}
                <Animated.View
                    style={{
                        maxHeight: intentHeightAnim,
                        opacity: intentOpacityAnim,
                        overflow: "hidden",
                    }}
                    pointerEvents={showIntentRecommendation ? "auto" : "none"}
                >
                    <NButton
                        color="rgba(33, 168, 112, 0.51)"
                        onPress={() =>
                            router.push(`/(tabs)/${chatIntent}` as any)
                        }
                        style={{ alignSelf: "flex-start", marginBottom: 8 }}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            {intentIcon}
                            <NText style={{ fontFamily: fonts.bold }}>
                                {t("chat.goTo", {
                                    intent: t(`tabs.${chatIntent}`),
                                })}
                            </NText>
                        </View>
                    </NButton>
                </Animated.View>

                <View style={{ width: "100%", overflow: "hidden" }}>
                    <Suggestions
                        query={query}
                        chatStarted={chatStarted}
                        onHasIntentSuggestion={setHasIntentSuggestion}
                        onHasSuggestions={setHasSuggestions}
                        onSelect={(suggestion) => {
                            if (!suggestion) return
                            if (suggestion.startsWith("/(tabs)/")) {
                                if (
                                    suggestion === "/(tabs)/shop" &&
                                    query.trim()
                                ) {
                                    setPartQuery(query.trim())
                                }
                                router.push(suggestion as any)
                            } else {
                                setQuery(suggestion)
                            }
                        }}
                    />
                </View>

                <View style={styles.inputWrapper}>
                    <NInput
                        containerStyle={{ flex: 1 }}
                        onChangeText={setQuery}
                        value={query}
                        onSubmitEditing={() => handleSubmit()}
                        placeholder={t("chat.inputPlaceholder")}
                        highlightSegments={
                            query.trim().length > 0
                                ? getHighlightedSegments(query)
                                : undefined
                        }
                    />
                    <View>
                        <NButton
                            color={
                                loading
                                    ? "rgba(255,255,255,0.08)"
                                    : "rgba(33, 168, 112, 0.51)"
                            }
                            onPress={() => handleSubmit()}
                            style={{ paddingLeft: 10 }}
                        >
                            {loading ? (
                                <ActivityIndicator
                                    size="small"
                                    color={theme.text}
                                />
                            ) : (
                                <Ionicons
                                    name="send"
                                    size={19}
                                    color={theme.icon}
                                />
                            )}
                        </NButton>
                    </View>
                </View>
            </View>

            {/* Gradient fade over the bottom of the message list */}
            {chatStarted && (
                <LinearGradient
                    colors={
                        [
                            "transparent",
                            colorScheme === "dark"
                                ? "rgba(0,0,0,0.92)"
                                : "rgba(255,255,255,0.92)",
                        ] as [string, string]
                    }
                    style={styles.bottomFade}
                    pointerEvents="none"
                />
            )}

            <NModal
                visible={chatNotice.visible}
                onDismiss={chatNotice.dismiss}
                title={t("chat.modalTitle")}
            >
                <NText style={styles.noticeText}>{t("chat.modalLine1")}</NText>
                <NText style={styles.noticeText}>{t("chat.modalLine2")}</NText>
            </NModal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "column",
    },
    newChatButton: {
        marginTop: 90,
        alignSelf: "flex-end",
        paddingVertical: 8,
        position: "absolute",
        right: 20,
        zIndex: 2,
    },
    messageList: {
        flex: 1,
    },
    messageListContent: {
        paddingTop: "15%",
        paddingHorizontal: 30,
        gap: 10,
        flexGrow: 1,
        justifyContent: "flex-end",
        paddingBottom: 240,
    },
    bottomOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: 80,
        zIndex: 1,
    },
    bottomFade: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 180,
        pointerEvents: "none",
    },
    bubble: {
        padding: 6,
    },
    centerContent: {
        flex: 1,
        justifyContent: "center",
        alignItems: "flex-start",
        paddingHorizontal: 20,
    },
    inputWrapper: {
        flexDirection: "row",
        width: "100%",
    },
    greeting: {
        fontSize: 24,
        fontWeight: "100",
        padding: 20,
    },
    quickActions: {
        marginTop: 12,
        gap: 8,
        paddingHorizontal: 20,
        width: "100%",
    },
    quickChip: {
        alignSelf: "flex-start",
    },
    bubbleHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
    },
    avatarUser: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: "rgba(33, 168, 112, 0.7)",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarAssistant: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: "rgba(255,255,255,0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        fontSize: 12,
        fontFamily: fonts.bold,
        color: "white",
    },
    timestamp: {
        fontSize: 10,
        opacity: 0.35,
        marginTop: 4,
        textAlign: "right",
    },
    noticeText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 10,
    },
})
