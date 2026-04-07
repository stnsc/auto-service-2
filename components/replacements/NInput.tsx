import React from "react"
import { StyleSheet, TextInput, TextInputProps, ViewStyle } from "react-native"
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedProps,
    withTiming,
    withSpring,
    interpolateColor,
} from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { fonts } from "../../theme"
import { NText } from "./NText"

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
        if (text.length == 0) {
            inputHeight.value = MIN_HEIGHT
        }
        textLength.value = text.length
        props.onChangeText?.(text)
    }

    const onFocus = () => {
        focusValue.value = withTiming(1, { duration: 300 })
    }

    const onBlur = () => {
        focusValue.value = withTiming(0, { duration: 300 })
    }

    const onContentSizeChange = (e: any) => {
        const newHeight = Math.max(MIN_HEIGHT, e.nativeEvent.contentSize.height)
        inputHeight.value = withSpring(newHeight, {
            damping: 20,
            stiffness: 200,
        })
    }

    const animatedWrapperStyle = useAnimatedStyle(() => ({
        shadowOpacity: interpolateColor(
            focusValue.value,
            [0, 1],
            [0.1, 0.5],
        ) as any,
        shadowRadius: withTiming(focusValue.value ? 15 : 5),
        transform: [{ scale: withTiming(focusValue.value ? 1.02 : 1) }],
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
                            multiline={true}
                            textAlignVertical="top"
                            scrollEnabled={false}
                            placeholder={props.placeholder}
                        />
                    </BlurView>
                </LinearGradient>
                {failed && (
                    <NText
                        style={{
                            fontFamily: fonts.bold,
                            color: "red",
                            textAlign: "center",
                            marginTop: 5,
                        }}
                    >
                        {failedText}
                    </NText>
                )}
            </Animated.View>
        </>
    )
}

const styles = StyleSheet.create({
    wrapper: {
        width: "100%",
        borderRadius: 25,
        shadowColor: "#fff",
        shadowOffset: { width: 0, height: 0 },
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
