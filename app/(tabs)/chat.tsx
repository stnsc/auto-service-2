import {
    StyleSheet,
    View,
    ScrollView,
    ActivityIndicator,
    Animated,
    Easing,
    Platform,
} from "react-native"
import { NButton } from "../../components/replacements/NButton"
import { NInput } from "../../components/replacements/NInput"
import { Ionicons } from "@expo/vector-icons"
import { Suggestions } from "../../components/bundle/Suggestions"
import { useRef, useState, useEffect } from "react"
import { NText } from "../../components/replacements/NText"
import { fonts } from "../../theme"
import { useRouter } from "expo-router"
import { useChatContext } from "../../context/ChatContext"

const CHAT_API_URL = "/api/chat"

interface Message {
    role: "user" | "assistant"
    content: string
}

export default function ChatScreen() {
    // enabling router
    const router = useRouter()

    const [user] = useState("<user>")
    const [query, setQuery] = useState("")
    const [loading, setLoading] = useState(false)
    const [chatIntent, setChatIntent] = useState<string>("")
    const [chatConfidence, setChatConfidence] = useState<number>(0)
    const [hasIntentSuggestion, setHasIntentSuggestion] = useState(false)

    // Use global chat context
    const {
        messages,
        setMessages,
        summary,
        setSummary,
        vehicleInfo,
        setVehicleInfo,
        setPartQuery,
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
                body: JSON.stringify({ messages: newMessages, vehicleInfo }),
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
            <View style={styles.chatArea}>
                {!chatStarted ? (
                    <NText
                        style={[styles.greeting, { fontFamily: fonts.regular }]}
                    >
                        Hello, {user}! {"\n"}
                        How can I help?
                    </NText>
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

                        <ScrollView
                            ref={scrollRef}
                            style={styles.messageList}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.messageListContent}
                            onContentSizeChange={() =>
                                scrollRef.current?.scrollToEnd({
                                    animated: true,
                                })
                            }
                        >
                            <Animated.View
                                style={{
                                    paddingBottom: chatShiftAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 80], // Shift up when intent suggestion present
                                    }),
                                }}
                            >
                                {messages.map((msg, i) => (
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
                                                    {user}
                                                </NText>
                                                <NButton color="rgba(33, 168, 112, 0.51)">
                                                    <NText
                                                        style={{
                                                            fontFamily:
                                                                fonts.bold,
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
                                                        fontFamily:
                                                            fonts.regular,
                                                        color: "#fff",
                                                    }}
                                                >
                                                    AutoService Intelligence
                                                </NText>
                                                <NButton color="rgba(34, 34, 34, 0.51)">
                                                    <NText
                                                        style={{
                                                            fontFamily:
                                                                fonts.light,
                                                            color: "#fff",
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </NText>
                                                </NButton>
                                            </>
                                        )}
                                    </View>
                                ))}
                            </Animated.View>
                            {loading && (
                                <View
                                    style={[
                                        styles.bubble,
                                        { alignSelf: "flex-start" },
                                    ]}
                                >
                                    <ActivityIndicator
                                        size="small"
                                        color="#fff"
                                    />
                                </View>
                            )}
                        </ScrollView>
                    </>
                )}

                <View style={styles.inputWrapper}>
                    <NInput
                        onChangeText={setQuery}
                        value={query}
                        onSubmitEditing={handleSubmit}
                        placeholder="What's your question?"
                    />
                    <View style={styles.inputButton}>
                        <NButton
                            color="rgba(33, 168, 112, 0.51)"
                            onPress={handleSubmit}
                        >
                            <Ionicons name="send" size={22} color="white" />
                        </NButton>
                    </View>
                </View>
            </View>

            <Animated.View
                style={[
                    {
                        flex: 1,
                        maxHeight: transitionAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["10%", "50%"], // Smaller when chat active
                        }),
                        transform: [
                            {
                                translateY: transitionAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-180, 0], // Move up when chat active
                                }),
                            },
                        ],
                    },
                ]}
            >
                <View style={{ flex: 1, width: "100%", overflow: "hidden" }}>
                    <Suggestions
                        query={query}
                        chatStarted={chatStarted}
                        onHasIntentSuggestion={setHasIntentSuggestion}
                        onSelect={(suggestion) => {
                            //routing logic for suggestions
                            if (!suggestion) return
                            if (suggestion.startsWith("/(tabs)/")) {
                                router.push(suggestion as any)
                            } else {
                                setQuery(suggestion)
                            }
                        }}
                    />
                </View>
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "column",
        backgroundColor: "transparent",
    },
    chatArea: {
        flex: 1,
        paddingLeft: 20,
        paddingRight: 20,
        justifyContent: "flex-end",
    },
    newChatButton: {
        top: 0,
        marginTop: 90,
        alignSelf: "flex-end",
        paddingVertical: 8,
        position: "absolute",
        zIndex: 1,
    },
    messageList: {
        flex: 1,
    },
    messageListContent: {
        paddingTop: "15%",
        paddingHorizontal: 10,
        gap: 10,
        flexGrow: 1,
        justifyContent: "flex-end",
    },
    bubble: {
        padding: 6,
    },
    inputWrapper: {
        position: "relative",
        width: "100%",
    },
    inputButton: {
        alignItems: "flex-end",
        marginTop: -20,
    },
    suggestionsContainer: {
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
    },
    greeting: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "100",
        padding: 20,
    },
})
