import React from "react"
import {
    Platform,
    StyleSheet,
    TextInput,
    TextInputProps,
    ViewStyle,
} from "react-native"
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedProps,
    withTiming,
    withSpring,
    interpolateColor,
    Easing,
} from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { fonts } from "../../theme"
import { NText } from "./NText"
import { Ionicons } from "@expo/vector-icons"

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

const MIN_HEIGHT = 50

interface NInputProps extends TextInputProps {
    containerStyle?: ViewStyle
    placeholder?: string
    color?: string
    intensity?: number
    failed?: boolean
    failedText?: string
}

export const NInput = ({
    containerStyle,
    color = "rgba(255, 255, 255, 0.05)",
    intensity = 30,
    failed = false,
    failedText = "Invalid input",
    ...props
}: NInputProps) => {
    const focusValue = useSharedValue(0)
    const inputHeight = useSharedValue(MIN_HEIGHT)

    const textLength = useSharedValue(0)

    const onChangeText = (text: string) => {
        textLength.value = text.length
        if (text.length === 0) {
            inputHeight.value = withSpring(MIN_HEIGHT, {
                damping: 20,
                stiffness: 200,
            })
        }
        props.onChangeText?.(text)
    }

    const onFocus = () => {
        focusValue.value = withTiming(1, { duration: 300 })
    }

    const onBlur = () => {
        focusValue.value = withTiming(0, { duration: 300 })
    }

    const onContentSizeChange = (e: any) => {
        if (textLength.value === 0) return
        const newHeight = Math.max(MIN_HEIGHT, e.nativeEvent.contentSize.height)
        inputHeight.value = withSpring(newHeight, {
            damping: 20,
            stiffness: 200,
        })
    }

    const animatedWrapperStyle = useAnimatedStyle(() => ({
        transform: [{ scale: withTiming(focusValue.value ? 1.02 : 1) }],
    }))

    const errorTiming = { duration: 250, easing: Easing.out(Easing.cubic) }

    const errorAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: withTiming(failed ? 0 : -20, errorTiming),
            },
        ],
        opacity: withTiming(failed ? 1 : 0, errorTiming),
        zIndex: -1,
    }))

    const animatedInputStyle = useAnimatedStyle(() => ({
        height: inputHeight.value,
    }))

    return (
        <>
            <Animated.View
                style={[styles.wrapper, animatedWrapperStyle, containerStyle]}
            >
                <LinearGradient
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
                        <AnimatedTextInput
                            {...props}
                            style={[
                                styles.input,
                                { fontFamily: fonts.regular },
                                animatedInputStyle,
                                props.style,
                            ]}
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            onFocus={onFocus}
                            onBlur={onBlur}
                            onContentSizeChange={onContentSizeChange}
                            onChangeText={onChangeText}
                            multiline={!props.secureTextEntry}
                            textAlignVertical="top"
                            scrollEnabled={false}
                            placeholder={props.placeholder}
                        />
                    </BlurView>
                </LinearGradient>
                <Animated.View style={[errorAnimation]}>
                    <NText style={styles.failed}>{failedText}</NText>
                </Animated.View>
            </Animated.View>
        </>
    )
}

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: 25,
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
        ...(Platform.OS === "web"
            ? ({ outlineStyle: "none", overflow: "hidden" } as any)
            : {}),
    },
    failed: {
        backgroundColor: "rgba(255,0,0,0.3)",
        fontFamily: fonts.bold,
        color: "white",
        textAlign: "center",
        paddingTop: 25,
        paddingBottom: 5,
        paddingHorizontal: 15,
        marginTop: -25,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
})
