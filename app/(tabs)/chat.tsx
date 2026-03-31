import {
    StyleSheet,
    View,
    ScrollView,
    ActivityIndicator,
    Animated,
    Easing,
    Platform,
} from "react-native"
import { NButton } from "../../components/NButton"
import { NInput } from "../../components/NInput"
import { Ionicons } from "@expo/vector-icons"
import { Suggestions } from "../../components/bundle/Suggestions"
import { useRef, useState } from "react"
import { NText } from "../../components/NText"
import { fonts } from "../../theme"
import { useRouter } from "expo-router"

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
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(false)

    // (1 = Initial, 0 = Chat Mode)
    const transitionAnim = useRef(new Animated.Value(1)).current

    const scrollRef = useRef<ScrollView>(null)
    const chatStarted = messages.length > 0

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
                body: JSON.stringify({ messages: newMessages }),
            })
            const data = await res.json()
            setMessages([
                ...newMessages,
                { role: "assistant", content: data.reply },
            ])
        } catch (err) {
            console.error("Chat error:", err)
        } finally {
            setLoading(false)
            scrollRef.current?.scrollToEnd({ animated: true })
        }
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
                    <ScrollView
                        ref={scrollRef}
                        style={styles.messageList}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.messageListContent}
                        onContentSizeChange={() =>
                            scrollRef.current?.scrollToEnd({ animated: true })
                        }
                    >
                        {messages.map((msg, i) => (
                            <View
                                key={i}
                                style={[styles.bubble, { alignSelf: "center" }]}
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
                                    </>
                                )}
                            </View>
                        ))}
                        {loading && (
                            <View
                                style={[
                                    styles.bubble,
                                    { alignSelf: "flex-start" },
                                ]}
                            >
                                <ActivityIndicator size="small" color="#fff" />
                            </View>
                        )}
                    </ScrollView>
                )}

                <View style={styles.inputWrapper}>
                    <NInput
                        onChangeText={setQuery}
                        value={query}
                        onSubmitEditing={handleSubmit}
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
                    styles.suggestionsContainer,
                    {
                        flex: transitionAnim, // Shrinks from 1 to 0
                        opacity: transitionAnim, // Fades out
                        maxHeight: transitionAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0%", "50%"], // Limits initial size to half screen
                        }),
                    },
                ]}
            >
                <View style={{ flex: 1, width: "100%", overflow: "hidden" }}>
                    <Suggestions
                        query={query}
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
