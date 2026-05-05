import React from "react"
import { StyleSheet, View } from "react-native"
import { NButton } from "../replacements/NButton"
import { NText } from "../replacements/NText"
import { useTheme } from "../../context/ThemeContext"
import { fonts } from "../../theme"

export interface FilterChipProps {
    label: string
    active: boolean
    color: string
    onPress: () => void
}

export function FilterChip({ label, active, color, onPress }: FilterChipProps) {
    const { theme } = useTheme()

    return (
        <NButton
            onPress={onPress}
            color={active ? color : theme.borderStart}
            intensity={50}
            style={styles.chipOuter}
            innerStyle={styles.chipInner}
        >
            <View style={styles.chipContent}>
                <View style={[styles.dot, { backgroundColor: color, opacity: active ? 1 : 0.5 }]} />
                <NText style={[styles.chipLabel, { color: active ? theme.text : theme.textMuted }]}>
                    {label}
                </NText>
            </View>
        </NButton>
    )
}

const styles = StyleSheet.create({
    chipOuter: {
        alignSelf: "flex-start",
        flexShrink: 0,
    },
    chipInner: {
        paddingVertical: 7,
        paddingHorizontal: 13,
    },
    chipContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    chipLabel: {
        fontSize: 13,
        fontFamily: fonts.medium,
    },
})
