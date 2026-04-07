import { useEffect, useRef, useState } from "react"
import { View, Animated, Easing, StyleSheet } from "react-native"
import { useDebounce } from "../../hooks/useDebounce"
import { fonts } from "../../theme"
import { NText } from "../replacements/NText"
import { NButton } from "../replacements/NButton"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"

const API_URL = "/api/suggestions"

interface Props {
    query: string
    onSelect: (suggestion: string | void) => void
    chatStarted: boolean
    onHasIntentSuggestion?: (hasIntent: boolean) => void
}

function SuggestionItem({
    text,
    index,
    color,
    icon,
    onPress,
}: {
    text: string
    index: number
    color?: string
    icon?: React.ReactNode
    onPress: () => void
}) {
    const opacity = useRef(new Animated.Value(0)).current
    const translateY = useRef(new Animated.Value(16)).current

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 280,
                delay: index * 80,
                easing: Easing.out(Easing.exp),
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 280,
                delay: index * 80,
                easing: Easing.out(Easing.exp),
                useNativeDriver: true,
            }),
        ]).start()
    }, [])

    return (
        <Animated.View style={{ opacity, transform: [{ translateY }] }}>
            <NButton onPress={onPress} color={color}>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    {icon}
                    <NText style={{ fontFamily: fonts.regular, color: "#fff" }}>
                        {text}
                    </NText>
                </View>
            </NButton>
        </Animated.View>
    )
}

export function Suggestions({ query, onSelect, chatStarted, onHasIntentSuggestion }: Props) {
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [intent, setIntent] = useState<string>("")
    const [confidence, setConfidence] = useState<number>(0)
    const [loading, setLoading] = useState(false)
    const debouncedQuery = useDebounce(query, 450)

    useEffect(() => {
        const hasIntentSuggestion = intent !== "chat" && confidence > 0.75
        onHasIntentSuggestion?.(hasIntentSuggestion)
    }, [intent, confidence, onHasIntentSuggestion])

    useEffect(() => {
        if (!debouncedQuery || debouncedQuery.trim().length < 3) {
            setSuggestions([])
            return
        }

        const controller = new AbortController()

        const fetchSuggestions = async () => {
            setLoading(true)
            try {
                const res = await fetch(API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        query: debouncedQuery,
                        chatStarted,
                    }),
                    signal: controller.signal,
                })
                const data = await res.json()

                console.log(data)

                setSuggestions(
                    Array.isArray(data.suggestions) ? data.suggestions : [],
                )
                setIntent(typeof data.intent === "string" ? data.intent : "")
                setConfidence(
                    typeof data.confidence === "number" ? data.confidence : 0,
                )
            } catch (err: any) {
                if (err.name !== "AbortError") console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchSuggestions()
        return () => controller.abort()
    }, [debouncedQuery, chatStarted])

    if (loading) return null

    if (suggestions.length === 0 && !chatStarted) {
        return (
            <View style={styles.center}>
                <NText
                    style={{
                        fontFamily: fonts.regular,
                        color: "rgba(255,255,255,0.5)",
                        fontSize: 14,
                    }}
                >
                    No suggestions available yet.
                </NText>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {intent != "chat" && confidence > 0.75 && (
                <View>
                    <SuggestionItem
                        text={`Go to ${intent}`}
                        index={0}
                        icon={
                            intent === "map" ? (
                                <Ionicons name="map" size={22} color="white" />
                            ) : intent === "appointment" ? (
                                <Ionicons
                                    name="calendar"
                                    size={22}
                                    color="white"
                                />
                            ) : intent === "shop" ? (
                                <Ionicons name="cart" size={22} color="white" />
                            ) : undefined
                        }
                        onPress={() => onSelect(`/(tabs)/${intent}`)}
                        color={"rgba(33, 168, 112, 0.51)"}
                    />
                </View>
            )}

            {suggestions.map((s, i) => (
                <SuggestionItem
                    key={s}
                    text={s}
                    index={i}
                    onPress={() => onSelect(s)}
                    color={"rgb(60, 60, 60)"}
                />
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    center: {
        alignItems: "center",
        paddingVertical: 16,
    },
    container: {
        justifyContent: "flex-start",
        padding: 20,
        gap: 8,
    },
})
