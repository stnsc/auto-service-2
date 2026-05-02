import React, { ReactNode, useCallback, useEffect } from "react"
import { Pressable, StyleSheet, ViewStyle } from "react-native"
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { useTheme } from "../../context/ThemeContext"

interface NButtonProps {
    onPress?: () => void
    children?: ReactNode
    color?: string
    style?: ViewStyle
    intensity?: number
    disabled?: boolean
}

export function NButton({
    onPress,
    children,
    color = "rgba(255, 255, 255, 0.1)",
    intensity = 30,
    style,
    disabled = false,
}: NButtonProps) {
    const { theme } = useTheme()

    const isPressed = useSharedValue(false)
    const isDisabled = useSharedValue(disabled)

    useEffect(() => {
        isDisabled.value = disabled
    }, [disabled])

    const onPressIn = useCallback(() => {
        if (isDisabled.value) return
        isPressed.value = true
    }, [])

    const onPressOut = useCallback(() => {
        isPressed.value = false
    }, [])

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: withSpring(isPressed.value ? 1.1 : 1) }],
        opacity: withTiming(isDisabled.value ? 0.4 : 1, { duration: 150 }),
    }))

    // This handles the brightness increase
    const brightnessStyle = useAnimatedStyle(() => ({
        backgroundColor: "white",
        opacity: withTiming(isPressed.value ? 0.2 : 0, { duration: 100 }),
    }))

    return (
        <Pressable
            onPress={disabled ? undefined : onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            style={style}
        >
            <Animated.View style={[styles.wrapper, animatedStyle]}>
                <LinearGradient
                    colors={[color, "rgba(255,255,255,0.05)"]}
                    style={styles.gradientStroke}
                >
                    <BlurView
                        intensity={intensity}
                        tint={theme.blurTint}
                        style={[styles.innerButton]}
                    >
                        <Animated.View
                            style={[StyleSheet.absoluteFill, brightnessStyle]}
                        />

                        {children}
                    </BlurView>
                </LinearGradient>
            </Animated.View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: 25,
        overflow: "hidden",
        width: "100%",
    },
    gradientStroke: {
        padding: 1.5,
        borderRadius: 25,
    },
    innerButton: {
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderRadius: 23,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
})
