import React from "react"
import { View, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../replacements/NText"
import { fonts } from "../../theme"

interface StarRatingProps {
    rating: number
    size?: number
    color?: string
    textColor?: string
}

export function StarRating({
    rating,
    size = 14,
    color = "#f59e0b",
    textColor,
}: StarRatingProps) {
    const stars = Array.from({ length: 5 }, (_, i) => {
        const full = i + 1
        if (rating >= full) return "star"
        if (rating >= full - 0.5) return "star-half"
        return "star-outline"
    }) as ("star" | "star-half" | "star-outline")[]

    return (
        <View style={styles.row}>
            {stars.map((name, i) => (
                <Ionicons key={i} name={name} size={size} color={color} />
            ))}
            <NText style={[styles.label, { fontSize: size, color: textColor }]}>
                {rating.toFixed(1)}
            </NText>
        </View>
    )
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
    },
    label: {
        fontFamily: fonts.bold,
        marginLeft: 4,
    },
})
