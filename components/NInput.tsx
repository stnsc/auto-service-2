import React, { useState } from "react"
import {
    StyleSheet,
    View,
    TextInput,
    TextInputProps,
    ViewStyle,
} from "react-native"
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolateColor,
} from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"

interface NInputProps extends TextInputProps {
    containerStyle?: ViewStyle
    color?: string
    intensity?: number
}

export const NInput = ({
    containerStyle,
    color = "rgba(255, 255, 255, 0.05)",
    intensity = 30,
    ...props
}: NInputProps) => {
    const focusValue = useSharedValue(0)

    // Animate the "glow" when the user clicks inside
    const onFocus = () => {
        focusValue.value = withTiming(1, { duration: 300 })
    }

    const onBlur = () => {
        focusValue.value = withTiming(0, { duration: 300 })
    }

    const animatedWrapperStyle = useAnimatedStyle(() => ({
        // The glow gets stronger on focus
        shadowOpacity: interpolateColor(
            focusValue.value,
            [0, 1],
            [0.1, 0.5],
        ) as any,
        shadowRadius: withTiming(focusValue.value ? 15 : 5),
        transform: [{ scale: withTiming(focusValue.value ? 1.02 : 1) }],
    }))

    return (
        <Animated.View
            style={[styles.wrapper, animatedWrapperStyle, containerStyle]}
        >
            <LinearGradient
                // Border changes from subtle to bright on focus
                colors={["rgba(255,255,255,0.4)", "rgba(255,255,255,0.05)"]}
                style={styles.gradientStroke}
            >
                <BlurView
                    intensity={intensity}
                    tint="dark"
                    style={[
                        styles.innerInputContainer,
                        { backgroundColor: color },
                    ]}
                >
                    <TextInput
                        {...props}
                        style={[styles.input, props.style]}
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        onFocus={onFocus}
                        onBlur={onBlur}
                    />
                </BlurView>
            </LinearGradient>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    wrapper: {
        width: "100%",
        borderRadius: 25,
        shadowColor: "#fff",
        shadowOffset: { width: 0, height: 0 },
        marginVertical: 10,
    },
    gradientStroke: {
        padding: 1,
        borderRadius: 25,
    },
    innerInputContainer: {
        borderRadius: 24,
        overflow: "hidden",
    },
    input: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        fontSize: 16,
        color: "#fff",
    },
})
