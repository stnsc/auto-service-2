import { useEffect, useRef, useState } from "react"
import { View, Animated, Easing, StyleSheet } from "react-native"
import { useDebounce } from "../../hooks/useDebounce"
import { fonts } from "../../theme"
import { NText } from "../NText"
import { NButton } from "../NButton"

const API_URL = "/api/suggestions"

interface Props {
    query: string
    onSelect: (suggestion: string) => void
}

function SuggestionItem({
    text,
    index,
    onPress,
}: {
    text: string
    index: number
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
            <NButton onPress={onPress}>
                <NText style={{ fontFamily: fonts.regular, color: "#fff" }}>
                    {text}
                </NText>
            </NButton>
        </Animated.View>
    )
}

export function Suggestions({ query, onSelect }: Props) {
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const debouncedQuery = useDebounce(query, 300)

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
                    body: JSON.stringify({ query: debouncedQuery }),
                    signal: controller.signal,
                })
                const data = await res.json()
                setSuggestions(
                    Array.isArray(data.suggestions) ? data.suggestions : [],
                )
            } catch (err: any) {
                if (err.name !== "AbortError") console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchSuggestions()
        return () => controller.abort()
    }, [debouncedQuery])

    if (loading) return null

    if (suggestions.length === 0) {
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
            {suggestions.map((s, i) => (
                <SuggestionItem
                    key={s}
                    text={s}
                    index={i}
                    onPress={() => onSelect(s)}
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
        paddingHorizontal: 8,
        gap: 8,
    },
})
