import React from "react"
import { View, Pressable, StyleSheet } from "react-native"
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from "react-native-reanimated"
import { accentColors, AccentKey, ColorScheme } from "../theme"

const ACCENT_KEYS: AccentKey[] = ["green", "blue", "purple", "amber", "teal"]

interface SwatchProps {
    solidColor: string
    selected: boolean
    onPress: () => void
}

function AccentSwatch({ solidColor, selected, onPress }: SwatchProps) {
    const pressed = useSharedValue(false)
    const animStyle = useAnimatedStyle(() => ({
        transform: [
            {
                scale: withSpring(selected ? 1.18 : pressed.value ? 1.08 : 1, {
                    damping: 14,
                }),
            },
        ],
    }))

    return (
        <Pressable
            onPress={onPress}
            onPressIn={() => {
                pressed.value = true
            }}
            onPressOut={() => {
                pressed.value = false
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
        >
            <Animated.View
                style={[
                    styles.swatchOuter,
                    {
                        borderColor: selected
                            ? solidColor
                            : "transparent",
                    },
                    animStyle,
                ]}
            >
                <View
                    style={[
                        styles.swatchInner,
                        { backgroundColor: solidColor },
                    ]}
                />
            </Animated.View>
        </Pressable>
    )
}

interface AccentPickerProps {
    accentKey: AccentKey
    colorScheme: ColorScheme
    onSelect: (key: AccentKey) => void
}

export function AccentPicker({
    accentKey,
    colorScheme,
    onSelect,
}: AccentPickerProps) {
    return (
        <View style={styles.row} accessibilityRole="radiogroup">
            {ACCENT_KEYS.map((key) => (
                <AccentSwatch
                    key={key}
                    solidColor={accentColors[key][colorScheme].accentSolid}
                    selected={accentKey === key}
                    onPress={() => onSelect(key)}
                />
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        gap: 16,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 6,
    },
    swatchOuter: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 2.5,
        padding: 4,
        alignItems: "center",
        justifyContent: "center",
    },
    swatchInner: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
})
