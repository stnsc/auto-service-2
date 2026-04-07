import React, { ReactNode } from "react"
import { StyleSheet, View, ViewStyle } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { useCarouselGesture } from "../../context/GestureContext"

interface NButtonProps {
    onPress?: () => void
    children?: ReactNode
    color?: string
    style?: ViewStyle
    intensity?: number
}

export function NButton({
    onPress,
    children,
    color = "rgba(255, 255, 255, 0.1)",
    intensity = 30,
    style,
}: NButtonProps) {
    const carouselPanRef = useCarouselGesture()

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
        .withTestId("button-pan")
        // If a carousel pan ref is available, this button's pan waits for it to fail
        // before claiming the gesture. This lets horizontal drags pass through.
        .requireExternalGestureToFail(
            (carouselPanRef as any) || Gesture.Native(),
        )
        .onUpdate((event) => {
            translateX.value = event.translationX / 15
            translateY.value = event.translationY / 15
        })
        .onEnd(() => {
            translateX.value = withSpring(0)
            translateY.value = withSpring(0)
        })

    const composedGestures = Gesture.Simultaneous(tap, pan)

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: withSpring(isPressed.value ? 1.1 : 1) },
        ],
    }))

    // This handles the brightness increase
    const brightnessStyle = useAnimatedStyle(() => ({
        backgroundColor: "white",
        opacity: withTiming(isPressed.value ? 0.2 : 0, { duration: 100 }),
    }))

    return (
        <GestureDetector gesture={composedGestures}>
            <Animated.View style={[styles.wrapper, animatedStyle, style]}>
                <LinearGradient
                    colors={[color, "rgba(255,255,255,0.05)"]}
                    style={styles.gradientStroke}
                >
                    <BlurView
                        intensity={intensity}
                        tint="dark"
                        style={[styles.innerButton]}
                    >
                        <Animated.View
                            style={[StyleSheet.absoluteFill, brightnessStyle]}
                        />

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
        overflow: "hidden",
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
