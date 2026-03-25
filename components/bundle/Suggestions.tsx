import { useEffect, useState } from "react"
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
} from "react-native"
import { useDebounce } from "../../hooks/useDebounce"
import { fonts } from "../../theme"
import { NText } from "../NText"
import { NButton } from "../NButton"

const API_URL = "/api/suggestions"

interface Props {
    query: string
    onSelect: (suggestion: string) => void
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
                setSuggestions(data.suggestions ?? [])
            } catch (err: any) {
                if (err.name !== "AbortError") console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchSuggestions()
        return () => controller.abort() // cancel stale requests
    }, [debouncedQuery])

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color="#ffffff" size="small" />
            </View>
        )
    }

    if (suggestions.length === 0) {
        return (
            <View style={styles.center}>
                <NText style={(styles.empty, { fontFamily: fonts.regular })}>
                    No suggestions available yet.
                </NText>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {suggestions.map((s, i) => (
                <NButton key={i} onPress={() => onSelect(s)}>
                    <NText style={{ fontFamily: fonts.regular, color: "#fff" }}>
                        {s}
                    </NText>
                </NButton>
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    center: {
        alignItems: "center",
        paddingVertical: 16,
    },
    empty: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 14,
    },
    container: {
        paddingHorizontal: 8,
        gap: 8,
    },
    chip: {
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
    },
})
