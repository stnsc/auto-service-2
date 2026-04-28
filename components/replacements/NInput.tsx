import React, { useCallback, useEffect, useState } from "react"
import {
    Platform,
    Pressable,
    StyleSheet,
    StyleProp,
    Text,
    TextInput,
    TextInputProps,
    View,
    ViewStyle,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    interpolate,
    interpolateColor,
    Easing,
} from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { fonts } from "../../theme"
import { NText } from "./NText"
import { useTheme } from "../../context/ThemeContext"
import { useCarouselGesture } from "../../context/GestureContext"

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

const MIN_HEIGHT = 50
const GRADIENT_COLORS: [string, string] = [
    "rgba(255,255,255,0.4)",
    "rgba(255,255,255,0.05)",
]
const ERROR_TIMING = { duration: 250, easing: Easing.out(Easing.cubic) }

interface NInputProps extends TextInputProps {
    containerStyle?: StyleProp<ViewStyle>
    placeholder?: string
    color?: string
    overlayColor?: string
    intensity?: number
    failed?: boolean
    failedText?: string
    highlightSegments?: { text: string; highlight: boolean }[]
}

export const NInput = React.memo(function NInput({
    containerStyle,
    color = "rgba(255, 255, 255, 0.05)",
    overlayColor,
    intensity = 30,
    failed = false,
    failedText = "Invalid input",
    secureTextEntry,
    highlightSegments,
    placeholder,
    ...props
}: NInputProps) {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const { theme } = useTheme()
    const carouselPanRef = useCarouselGesture()

    const focusValue = useSharedValue(0)
    const inputHeight = useSharedValue(MIN_HEIGHT)
    const translateX = useSharedValue(0)
    const translateY = useSharedValue(0)
    const labelProgress = useSharedValue(0)
    const hasFloatingLabel = !!placeholder

    // Track value internally so the shadow Text always reflects current content,
    // even for uncontrolled usage or external clears (e.g. after send).
    const [shadowValue, setShadowValue] = useState(props.value ?? "")

    useEffect(() => {
        if (props.value !== undefined) {
            setShadowValue(props.value)
        }
    }, [props.value])

    // Drive label up whenever focused or has a value
    useEffect(() => {
        if (!hasFloatingLabel) return
        const raised = isFocused || shadowValue.length > 0
        labelProgress.value = withTiming(raised ? 1 : 0, {
            duration: 200,
            easing: Easing.out(Easing.cubic),
        })
    }, [isFocused, shadowValue, hasFloatingLabel])

    const onChangeText = useCallback(
        (text: string) => {
            setShadowValue(text)
            props.onChangeText?.(text)
        },
        [props.onChangeText],
    )

    const onShadowLayout = useCallback(
        (e: any) => {
            const h = Math.max(MIN_HEIGHT, e.nativeEvent.layout.height)
            inputHeight.value = withTiming(h, {
                duration: 300,
                easing: Easing.out(Easing.ease),
            })
        },
        [inputHeight],
    )

    const onFocus = useCallback(() => {
        focusValue.value = withTiming(1, { duration: 300 })
        setIsFocused(true)
    }, [focusValue])

    const onBlur = useCallback(() => {
        focusValue.value = withTiming(0, { duration: 300 })
        setIsFocused(false)
    }, [focusValue])

    const pan = Gesture.Pan()
        // Fail if the user moves more than 10 px vertically — that's a scroll,
        // not an input interaction — so the native scroll view can take over.
        .failOffsetY([-10, 10])
        .requireExternalGestureToFail(
            (carouselPanRef as any) || Gesture.Native(),
        )
        .onUpdate((event) => {
            translateX.value = event.translationX / 15
            translateY.value = event.translationY / 15
        })
        // onFinalize runs on both normal end AND gesture failure/cancel,
        // so the component always springs back to its resting position.
        .onFinalize(() => {
            translateX.value = withSpring(0)
            translateY.value = withSpring(0)
        })

    const animatedWrapperStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: withTiming(focusValue.value ? 1.02 : 1) },
        ],
    }))

    const errorAnimation = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: withTiming(failed ? 0 : -20, ERROR_TIMING),
            },
        ],
        opacity: withTiming(failed ? 1 : 0, ERROR_TIMING),
        zIndex: -1,
    }))

    const animatedInputStyle = useAnimatedStyle(() => ({
        height: inputHeight.value,
        paddingTop: hasFloatingLabel
            ? interpolate(labelProgress.value, [0, 1], [15, 22])
            : 15,
        paddingBottom: hasFloatingLabel
            ? interpolate(labelProgress.value, [0, 1], [15, 8])
            : 15,
    }))

    const labelAnimStyle = useAnimatedStyle(() => {
        const p = labelProgress.value
        return {
            position: "absolute" as const,
            left: 20,
            top: interpolate(p, [0, 1], [15, 7]),
            fontSize: interpolate(p, [0, 1], [16, 11]),
            fontFamily: p > 0.5 ? fonts.bold : fonts.regular,
            color: interpolateColor(
                p,
                [0, 1],
                [theme.inputPlaceholder, theme.text],
            ),
            pointerEvents: "none" as any,
            zIndex: 1,
        }
    })

    return (
        <>
            <GestureDetector gesture={pan}>
                <Animated.View
                    style={[
                        styles.wrapper,
                        animatedWrapperStyle,
                        containerStyle,
                    ]}
                >
                    <LinearGradient
                        colors={GRADIENT_COLORS}
                        style={styles.gradientStroke}
                    >
                        <BlurView
                            intensity={intensity}
                            tint={theme.blurTint}
                            style={[
                                styles.innerInputContainer,
                                { backgroundColor: color },
                            ]}
                        >
                            {overlayColor && (
                                <View
                                    style={[
                                        StyleSheet.absoluteFillObject,
                                        { backgroundColor: overlayColor },
                                    ]}
                                    pointerEvents="none"
                                />
                            )}
                            {hasFloatingLabel && (
                                <Animated.Text
                                    style={labelAnimStyle}
                                    numberOfLines={1}
                                    pointerEvents="none"
                                >
                                    {placeholder}
                                </Animated.Text>
                            )}
                            <AnimatedTextInput
                                {...props}
                                placeholder={
                                    hasFloatingLabel ? "" : placeholder
                                }
                                style={[
                                    styles.input,
                                    {
                                        fontFamily: fonts.regular,
                                        color: theme.text,
                                    },
                                    animatedInputStyle,
                                    secureTextEntry && styles.inputWithEye,
                                    props.style,
                                ]}
                                placeholderTextColor={theme.inputPlaceholder}
                                onFocus={onFocus}
                                onBlur={onBlur}
                                onChangeText={onChangeText}
                                secureTextEntry={
                                    secureTextEntry && !showPassword
                                }
                                multiline={!secureTextEntry}
                                textAlignVertical="top"
                                scrollEnabled={false}
                            />
                            {secureTextEntry && (
                                <Pressable
                                    style={styles.eyeButton}
                                    onPress={() => setShowPassword((v) => !v)}
                                    hitSlop={8}
                                >
                                    <Ionicons
                                        name={showPassword ? "eye" : "eye-off"}
                                        size={20}
                                        color={theme.iconMuted}
                                    />
                                </Pressable>
                            )}
                            {/* Shadow Text: mirrors input value and fires onLayout on any size change,
                            including shrink — more reliable than onContentSizeChange cross-platform */}
                            <View
                                pointerEvents="none"
                                style={[
                                    styles.shadowContainer,
                                    highlightSegments
                                        ? styles.shadowVisible
                                        : undefined,
                                ]}
                            >
                                {highlightSegments ? (
                                    <Text
                                        style={[
                                            styles.input,
                                            styles.shadowText,
                                            {
                                                color: "transparent",
                                                fontFamily: fonts.regular,
                                            },
                                        ]}
                                        onLayout={onShadowLayout}
                                    >
                                        {highlightSegments.map((seg, i) =>
                                            seg.highlight ? (
                                                <Text
                                                    key={i}
                                                    style={{
                                                        textDecorationLine:
                                                            "underline",
                                                        textDecorationColor:
                                                            "#21a870",
                                                        textDecorationStyle:
                                                            "solid",
                                                        ...({
                                                            textDecorationThickness: 3,
                                                        } as any),
                                                        color: "transparent",
                                                        fontFamily:
                                                            fonts.regular,
                                                    }}
                                                >
                                                    {seg.text}
                                                </Text>
                                            ) : (
                                                <Text
                                                    key={i}
                                                    style={{
                                                        color: "transparent",
                                                        fontFamily:
                                                            fonts.regular,
                                                    }}
                                                >
                                                    {seg.text}
                                                </Text>
                                            ),
                                        )}
                                    </Text>
                                ) : (
                                    <Text
                                        style={[
                                            styles.input,
                                            styles.shadowText,
                                        ]}
                                        onLayout={onShadowLayout}
                                    >
                                        {shadowValue || " "}
                                    </Text>
                                )}
                            </View>
                        </BlurView>
                    </LinearGradient>
                    <Animated.View style={[errorAnimation]}>
                        <NText style={styles.failed}>{failedText}</NText>
                    </Animated.View>
                </Animated.View>
            </GestureDetector>
        </>
    )
})

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
        ...(Platform.OS === "web"
            ? ({ outlineStyle: "none", overflow: "hidden" } as any)
            : {}),
    },
    inputWithEye: {
        paddingRight: 50,
    },
    eyeButton: {
        position: "absolute",
        right: 16,
        top: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1,
    },
    shadowContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        opacity: 0,
    },
    shadowVisible: {
        opacity: 1,
    },
    shadowText: {
        height: undefined,
        color: "transparent",
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
