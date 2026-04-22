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
import { useRef, useState, useEffect } from "react"
import { NText } from "../../components/replacements/NText"
import { fonts } from "../../theme"
import { useRouter } from "expo-router"
import { useChatContext } from "../../context/ChatContext"
import { useAuthContext } from "../../context/AuthContext"
import { useAlphaNotice } from "../../hooks/useAlphaNotice"

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
        ],
        route: "/(tabs)/shop",
        label: "Go to Shop",
        icon: "cart",
    },
    appointment: {
        words: [
            "appointment",
            "book",
            "booking",
            "schedule",
            "reserve",
            "service",
            "repair",
            "fix",
            "maintenance",
        ],
        route: "/(tabs)/appointment",
        label: "Go to Appointment",
        icon: "calendar",
    },
    map: {
        words: [
            "map",
            "location",
            "directions",
            "nearby",
            "garage",
            "workshop",
            "where",
            "address",
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
    const parts = text.split(/(\b\w+\b)/)
    for (const part of parts) {
        segments.push({
            text: part,
            highlight: allKeywords.includes(part.toLowerCase()),
        })
    }
    return segments
}

interface Message {
    role: "user" | "assistant"
    content: string
}

export default function ChatScreen() {
    // enabling router
    const router = useRouter()

    const [user] = useState("<user>")
    const { userEmail } = useAuthContext()
    const displayName = userEmail?.split("@")[0] || "User"
    const [query, setQuery] = useState("")
    const [loading, setLoading] = useState(false)
    const [chatIntent, setChatIntent] = useState<string>("")
    const [chatConfidence, setChatConfidence] = useState<number>(0)
    const [hasIntentSuggestion, setHasIntentSuggestion] = useState(false)
    const [suggestionsHeight, setSuggestionsHeight] = useState(0)
    const chatNotice = useAlphaNotice("chat-logging")

    // Use global chat context
    const {
        messages,
        setMessages,
        summary,
        setSummary,
        vehicleInfo,
        setVehicleInfo,
        setPartQuery,
        conversationId,
        clearChat,
    } = useChatContext()

    // (1 = Initial, 0 = Chat Mode)
    const transitionAnim = useRef(new Animated.Value(1)).current
    const chatShiftAnim = useRef(new Animated.Value(0)).current

    const scrollRef = useRef<ScrollView>(null)
    const chatStarted = messages.length > 0

    // Sync animation state with chat history when returning to screen
    useEffect(() => {
        if (chatStarted) {
            // If chat has started, immediately set animation to chat mode
            transitionAnim.setValue(0)
        } else {
            // If no chat, show initial state
            transitionAnim.setValue(1)
        }
    }, [chatStarted, transitionAnim])

    // Shift chat conversation slightly up when a suggestion with intent is present
    useEffect(() => {
        Animated.timing(chatShiftAnim, {
            toValue: hasIntentSuggestion ? 1 : 0,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
        }).start()
    }, [hasIntentSuggestion])

    // Re-scroll to end whenever suggestions change height (padding changes)
    useEffect(() => {
        scrollRef.current?.scrollToEnd({ animated: true })
    }, [suggestionsHeight])

    const handleSubmit = async () => {
        const trimmed = query.trim()
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

    const handleNewChat = () => {
        clearChat()
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

    return (
        <View style={styles.container}>
            {chatStarted && (
                <ScrollView
                    ref={scrollRef}
                    style={StyleSheet.absoluteFillObject}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.messageListContent,
                        { paddingBottom: 140 + suggestionsHeight },
                    ]}
                    onContentSizeChange={() =>
                        scrollRef.current?.scrollToEnd({ animated: true })
                    }
                >
                    <Animated.View>
                        {messages.map((msg, i) => {
                            const isLastAssistant =
                                msg.role === "assistant" &&
                                i === messages.length - 1 &&
                                !loading
                            const showIntentRecommendation =
                                isLastAssistant &&
                                chatIntent &&
                                chatIntent !== "chat" &&
                                chatConfidence > 0.75

                            const intentIcon =
                                chatIntent === "map" ? (
                                    <Ionicons
                                        name="map"
                                        size={16}
                                        color="white"
                                    />
                                ) : chatIntent === "appointment" ? (
                                    <Ionicons
                                        name="calendar"
                                        size={16}
                                        color="white"
                                    />
                                ) : chatIntent === "shop" ? (
                                    <Ionicons
                                        name="cart"
                                        size={16}
                                        color="white"
                                    />
                                ) : null

                            return (
                                <View
                                    key={i}
                                    style={[
                                        styles.bubble,
                                        { alignSelf: "center" },
                                    ]}
                                >
                                    {msg.role === "user" ? (
                                        <>
                                            <NText
                                                style={{
                                                    fontFamily: fonts.bold,
                                                    color: "#fff",
                                                    textAlign: "right",
                                                }}
                                            >
                                                {displayName}
                                            </NText>
                                            <NButton color="rgba(33, 168, 112, 0.51)">
                                                <NText
                                                    style={{
                                                        fontFamily: fonts.bold,
                                                        color: "#fff",
                                                    }}
                                                >
                                                    {msg.content}
                                                </NText>
                                            </NButton>
                                        </>
                                    ) : (
                                        <>
                                            <NText
                                                style={{
                                                    fontFamily: fonts.regular,
                                                    color: "#fff",
                                                }}
                                            >
                                                AutoService Intelligence
                                            </NText>
                                            <NButton color="rgba(34, 34, 34, 0.51)">
                                                <NText
                                                    style={{
                                                        fontFamily: fonts.light,
                                                        color: "#fff",
                                                    }}
                                                >
                                                    {msg.content}
                                                </NText>
                                            </NButton>
                                            {showIntentRecommendation && (
                                                <NButton
                                                    color="rgba(33, 168, 112, 0.51)"
                                                    onPress={() =>
                                                        router.push(
                                                            `/(tabs)/${chatIntent}` as any,
                                                        )
                                                    }
                                                    style={{
                                                        marginTop: 6,
                                                        alignSelf: "flex-start",
                                                    }}
                                                >
                                                    <View
                                                        style={{
                                                            flexDirection:
                                                                "row",
                                                            alignItems:
                                                                "center",
                                                            gap: 6,
                                                        }}
                                                    >
                                                        {intentIcon}
                                                        <NText
                                                            style={{
                                                                fontFamily:
                                                                    fonts.bold,
                                                                color: "#fff",
                                                            }}
                                                        >
                                                            Go to{" "}
                                                            {chatIntent
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                                chatIntent.slice(
                                                                    1,
                                                                )}
                                                        </NText>
                                                    </View>
                                                </NButton>
                                            )}
                                        </>
                                    )}
                                </View>
                            )
                        })}
                    </Animated.View>
                    {loading && (
                        <View
                            style={[styles.bubble, { alignSelf: "flex-start" }]}
                        >
                            <ActivityIndicator size="small" color="#fff" />
                        </View>
                    )}
                </ScrollView>
            )}

            <View style={styles.chatArea} pointerEvents="box-none">
                {!chatStarted ? (
                    <View style={styles.centerContent}>
                        <NText
                            style={[
                                styles.greeting,
                                { fontFamily: fonts.regular },
                            ]}
                        >
                            Hello, {displayName}! {"\n"}
                            How can I help?
                        </NText>
                    </View>
                ) : (
                    <>
                        <NButton
                            onPress={handleNewChat}
                            style={styles.newChatButton}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}
                            >
                                <Ionicons
                                    name="refresh"
                                    size={18}
                                    color="white"
                                />
                                <NText
                                    style={{
                                        fontFamily: fonts.bold,
                                        color: "#fff",
                                        marginLeft: 6,
                                    }}
                                >
                                    New Chat
                                </NText>
                            </View>
                        </NButton>
                    </>
                )}

                <View
                    style={{ width: "100%", overflow: "hidden" }}
                    onLayout={(e) =>
                        setSuggestionsHeight(e.nativeEvent.layout.height)
                    }
                >
                    <Suggestions
                        query={query}
                        chatStarted={chatStarted}
                        onHasIntentSuggestion={setHasIntentSuggestion}
                        onSelect={(suggestion) => {
                            if (!suggestion) return
                            if (suggestion.startsWith("/(tabs)/")) {
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
                        onSubmitEditing={handleSubmit}
                        placeholder="What's your question?"
                        highlightSegments={
                            query.trim().length > 0
                                ? getHighlightedSegments(query)
                                : undefined
                        }
                    />
                    <View>
                        <NButton
                            color="rgba(33, 168, 112, 0.51)"
                            onPress={handleSubmit}
                            style={{ paddingLeft: 10 }}
                        >
                            <Ionicons name="send" size={19} color="white" />
                        </NButton>
                    </View>
                </View>
            </View>

            {chatStarted && (
                <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.92)"]}
                    style={styles.bottomFade}
                    pointerEvents="none"
                />
            )}

            <NModal
                visible={chatNotice.visible}
                onDismiss={chatNotice.dismiss}
                title="Chat Preview"
            >
                <NText style={styles.noticeText}>
                    During the Closed Alpha, all conversations with the AI
                    chatbot are being logged to help improve the service.
                </NText>
                <NText style={styles.noticeText}>
                    Please avoid sharing personal or sensitive information in
                    your messages.
                </NText>
            </NModal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "column",
    },
    chatArea: {
        flex: 1,
        paddingLeft: 20,
        paddingRight: 20,
        justifyContent: "flex-end",
        zIndex: 1,
    },
    newChatButton: {
        top: 0,
        marginTop: 90,
        alignSelf: "flex-end",
        paddingVertical: 8,
        position: "absolute",
        zIndex: 1,
    },
    messageListContent: {
        paddingTop: "15%",
        paddingHorizontal: 30,
        gap: 10,
        flexGrow: 1,
        justifyContent: "flex-end",
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
    },
    inputWrapper: {
        flexDirection: "row",
        width: "100%",
        paddingBottom: 80,
    },
    greeting: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "100",
        padding: 20,
    },
    noticeText: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 10,
    },
})
