import { useEffect, useState } from "react"
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../components/replacements/NText"
import { fonts } from "../theme"
import { useChatContext, ConversationRecord } from "../context/ChatContext"
import { useAuthContext } from "../context/AuthContext"
import { NButton } from "../components/replacements/NButton"
import { useTranslation } from "react-i18next"
import "../i18n"

const TRUNCATE_LENGTH = 110

function truncate(text: string, max: number) {
    if (!text) return ""
    return text.length > max ? text.slice(0, max).trimEnd() + "…" : text
}

function formatDate(iso: string) {
    if (!iso) return ""
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

export default function HistoryScreen() {
    const { t } = useTranslation()
    const router = useRouter()
    const { userEmail } = useAuthContext()
    const { loadConversation } = useChatContext()

    const [loading, setLoading] = useState(true)
    const [conversations, setConversations] = useState<ConversationRecord[]>([])

    useEffect(() => {
        load()
    }, [])

    const load = async () => {
        if (!userEmail) return
        setLoading(true)
        try {
            const res = await fetch(
                `/api/conversations?userId=${encodeURIComponent(userEmail)}`,
            )
            const data = await res.json()
            setConversations(data.conversations ?? [])
        } catch (err) {
            console.error("Failed to load chat history:", err)
        } finally {
            setLoading(false)
        }
    }

    const lastAssistantMessage = (conv: ConversationRecord) => {
        const msgs = conv.messages
        for (let i = msgs.length - 1; i >= 0; i--) {
            if (msgs[i].role === "assistant") return msgs[i].content
        }
        return ""
    }

    const handleTap = (conv: ConversationRecord) => {
        loadConversation(conv)
        router.push("/")
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <NButton onPress={() => router.back()} color="rgb(0, 0, 0)">
                    <Ionicons
                        name="chevron-back"
                        size={25}
                        color="rgba(255,255,255,0.7)"
                    />
                </NButton>
                <NText style={[styles.title, { fontFamily: fonts.bold }]}>
                    {t("history.title")}
                </NText>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="small" color="#fff" />
                </View>
            ) : conversations.length === 0 ? (
                <View style={styles.center}>
                    <NText style={[styles.empty, { fontFamily: fonts.light }]}>
                        {t("history.empty")}
                    </NText>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                >
                    {conversations.map((conv) => {
                        const lastMsg = lastAssistantMessage(conv)
                        return (
                            <NButton
                                key={conv.conversationId}
                                onPress={() => handleTap(conv)}
                            >
                                <View style={styles.cardTop}>
                                    <NText
                                        style={[
                                            styles.timestamp,
                                            { fontFamily: fonts.light },
                                        ]}
                                    >
                                        {formatDate(conv.updatedAt)}
                                    </NText>
                                    <Ionicons
                                        name="chevron-forward"
                                        size={14}
                                        color="rgba(255,255,255,0.3)"
                                    />
                                </View>
                                {conv.summary ? (
                                    <NText
                                        style={[
                                            styles.summary,
                                            { fontFamily: fonts.regular },
                                        ]}
                                    >
                                        {conv.summary}
                                    </NText>
                                ) : null}
                                {lastMsg ? (
                                    <NText
                                        style={[
                                            styles.lastMsg,
                                            { fontFamily: fonts.light },
                                        ]}
                                    >
                                        {truncate(lastMsg, TRUNCATE_LENGTH)}
                                    </NText>
                                ) : null}
                            </NButton>
                        )
                    })}
                </ScrollView>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 90,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingBottom: 16,
        gap: 8,
    },
    backBtn: {
        padding: 4,
    },
    title: {
        color: "#fff",
        fontSize: 20,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    empty: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 14,
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 110,
        gap: 10,
    },
    cardTop: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "flex-start",
    },
    timestamp: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 11,
    },
    summary: {
        color: "#fff",
        fontSize: 14,
        lineHeight: 20,
    },
    lastMsg: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 12,
        lineHeight: 17,
    },
})
