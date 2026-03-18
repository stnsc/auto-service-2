import React, { ReactNode } from "react"
import { StyleSheet, View, ViewStyle, Text } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur" // Import BlurView

interface NButtonProps {
    onPress?: () => void
    children?: ReactNode
    color?: string
    style?: ViewStyle
    intensity?: number // Control how strong the blur is (0-100)
}

export const NButton = ({
    onPress,
    children,
    color = "rgba(255, 255, 255, 0.1)", // Default to a subtle transparent white
    intensity = 30,
    style,
}: NButtonProps) => {
    const isPressed = useSharedValue(false)
    const translateX = useSharedValue(0)
    const translateY = useSharedValue(0)

    const tap = Gesture.Tap()
        .onBegin(() => {
            isPressed.value = true
        })
        .onFinalize(() => {
            isPressed.value = false
        })
        .onEnd(() => {
            if (onPress) {
                runOnJS(onPress)()
            }
        })

    const pan = Gesture.Pan()
        .onUpdate((event) => {
            translateX.value = event.translationX / 20
            translateY.value = event.translationY / 20
        })
        .onEnd(() => {
            translateX.value = withSpring(0, { damping: 15, stiffness: 120 })
            translateY.value = withSpring(0, { damping: 15, stiffness: 120 })
        })

    const composedGestures = Gesture.Simultaneous(tap, pan)

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: withSpring(isPressed.value ? 1.05 : 1) },
        ],
        // Glow effect remains the same
        shadowOpacity: withTiming(isPressed.value ? 0.4 : 0.1),
        shadowRadius: withTiming(isPressed.value ? 20 : 5),
    }))

    return (
        <GestureDetector gesture={composedGestures}>
            <Animated.View style={[styles.wrapper, animatedStyle, style]}>
                <LinearGradient
                    colors={["rgba(255,255,255,0.4)", "rgba(255,255,255,0.05)"]}
                    style={styles.gradientStroke}
                >
                    <BlurView
                        intensity={intensity}
                        tint="dark"
                        style={[styles.innerButton, { backgroundColor: color }]}
                    >
                        {children}
                    </BlurView>
                </LinearGradient>
            </Animated.View>
        </GestureDetector>
    )
}

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: 25,
        // Overflow hidden is important to keep the blur inside the rounded corners
        overflow: "hidden",
        shadowColor: "#fff",
        shadowOffset: { width: 0, height: 0 },
    },
    gradientStroke: {
        padding: 1, // Thin "glass" edge
        borderRadius: 25,
    },
    innerButton: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 23,
        alignItems: "center",
        justifyContent: "center",
    },
})
