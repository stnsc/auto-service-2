import React, { useRef, useState, useCallback, useEffect } from "react"
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Animated,
    Pressable,
    Linking,
} from "react-native"
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
    PanGesture,
} from "react-native-gesture-handler"
import { NButton } from "../replacements/NButton"
import { GestureContext } from "../../context/GestureContext"
import { NText } from "../replacements/NText"
import { CarService } from "../../app/types/CarService"
import { fonts } from "../../theme"
import { Ionicons } from "@expo/vector-icons"
import { router, useRouter } from "expo-router"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

const PEEK_WIDTH = SCREEN_WIDTH * 0.15
const CARD_WIDTH = SCREEN_WIDTH - PEEK_WIDTH * 2
const CARD_STEP = CARD_WIDTH

interface HorizontalCarouselProps {
    services: CarService[]
    activeIndex: number
    onIndexChange: (index: number) => void
}

// Velocity threshold to trigger a flick to the next/prev card
const SWIPE_VELOCITY_THRESHOLD = 500

export default function HorizontalCarousel({
    services,
    activeIndex,
    onIndexChange,
}: HorizontalCarouselProps) {
    const router = useRouter()

    const indexCount = services.length

    const panRef = useRef<PanGesture>(null!)

    // translateX drives all card positions. Negative = scrolled right.
    const translateX = useRef(new Animated.Value(0)).current
    // Snapshot of translateX at the moment a pan gesture starts
    const offsetAtGestureStart = useRef(0)

    // Clamp index to valid range
    const clamp = (val: number, min: number, max: number) =>
        Math.min(Math.max(val, min), max)

    // Animate to a specific card index
    const snapToIndex = useCallback(
        (index: number) => {
            const clamped = clamp(index, 0, indexCount - 1)
            onIndexChange(clamped)
            Animated.spring(translateX, {
                toValue: -clamped * CARD_STEP,
                useNativeDriver: true,
                damping: 20,
                stiffness: 180,
                mass: 0.8,
            }).start()
        },
        [translateX, onIndexChange, indexCount],
    )

    useEffect(() => {
        Animated.spring(translateX, {
            toValue: -activeIndex * CARD_STEP,
            useNativeDriver: true,
            damping: 20,
            stiffness: 180,
            mass: 0.8,
        }).start()
    }, [activeIndex])

    const pan = Gesture.Pan()
        .withRef(panRef)
        .runOnJS(true)
        .onBegin(() => {
            // Capture current offset so we can add drag delta on top
            offsetAtGestureStart.current = -activeIndex * CARD_STEP
        })
        .onUpdate((e) => {
            // Apply drag with slight rubber-banding at the edges
            const raw = offsetAtGestureStart.current + e.translationX
            const minTranslate = -(indexCount - 1) * CARD_STEP
            const maxTranslate = 0

            let clamped = raw
            if (raw > maxTranslate) {
                // Past the first card — rubber band
                clamped = maxTranslate + (raw - maxTranslate) * 0.2
            } else if (raw < minTranslate) {
                // Past the last card — rubber band
                clamped = minTranslate + (raw - minTranslate) * 0.2
            }
            translateX.setValue(clamped)
        })
        .onEnd((e) => {
            // Use velocity to decide whether to advance to next/prev card
            const currentOffset = offsetAtGestureStart.current + e.translationX
            let targetIndex = activeIndex

            if (e.velocityX < -SWIPE_VELOCITY_THRESHOLD) {
                // Fast swipe left → next card
                targetIndex = activeIndex + 1
            } else if (e.velocityX > SWIPE_VELOCITY_THRESHOLD) {
                // Fast swipe right → prev card
                targetIndex = activeIndex - 1
            } else {
                // Slow drag — snap to whichever card is closest to center
                targetIndex = Math.round(-currentOffset / CARD_STEP)
            }

            snapToIndex(targetIndex)
        })

    return (
        <GestureContext.Provider value={panRef}>
            <GestureHandlerRootView style={styles.root}>
                <View style={styles.container}>
                    {/* The GestureDetector wraps only the carousel track */}
                    <GestureDetector gesture={pan}>
                        <View style={styles.track}>
                            <Animated.View
                                style={[
                                    styles.row,
                                    { transform: [{ translateX }] },
                                ]}
                            >
                                {services.map((service, index) => {
                                    const inputRange = [
                                        -(index + 1) * CARD_STEP,
                                        -index * CARD_STEP,
                                        -(index - 1) * CARD_STEP,
                                    ]

                                    const scale = translateX.interpolate({
                                        inputRange,
                                        outputRange: [0.92, 1, 0.92],
                                        extrapolate: "clamp",
                                    })

                                    const opacity = translateX.interpolate({
                                        inputRange,
                                        outputRange: [0.4, 1, 0.4],
                                        extrapolate: "clamp",
                                    })

                                    return (
                                        <Animated.View
                                            key={service.id}
                                            style={[
                                                styles.card,
                                                {
                                                    transform: [{ scale }],
                                                    opacity,
                                                },
                                            ]}
                                        >
                                            <NText
                                                style={{
                                                    color: "#fff",
                                                    fontSize: 14,
                                                    fontWeight: "bold",
                                                    textAlign: "center",
                                                    marginBottom: -8,
                                                    zIndex: 1,
                                                }}
                                            >
                                                {service.type}
                                            </NText>
                                            <NButton color={"#22222284"}>
                                                <View
                                                    style={{
                                                        flex: 1,
                                                        width: "100%",
                                                    }}
                                                >
                                                    <View
                                                        style={{
                                                            flexDirection:
                                                                "row",
                                                            justifyContent:
                                                                "space-between",
                                                            alignItems:
                                                                "center",
                                                        }}
                                                    >
                                                        <Pressable
                                                            onPress={() => {
                                                                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${service.latitude},${service.longitude}`
                                                                Linking.openURL(
                                                                    mapsUrl,
                                                                )
                                                            }}
                                                            style={{
                                                                backgroundColor:
                                                                    "rgba(33, 168, 112, 0.50)",
                                                                paddingHorizontal: 8,
                                                                paddingVertical: 4,
                                                                borderRadius: 12,
                                                            }}
                                                        >
                                                            <NText
                                                                style={{
                                                                    color: "#fff",
                                                                    fontSize: 12,
                                                                }}
                                                            >
                                                                Get Directions
                                                            </NText>
                                                        </Pressable>
                                                        <NText
                                                            style={{
                                                                fontFamily:
                                                                    fonts.bold,
                                                                color: "#fff",
                                                            }}
                                                        >
                                                            {service.rating}{" "}
                                                            stars
                                                        </NText>
                                                    </View>
                                                    <NText
                                                        style={{
                                                            fontFamily:
                                                                fonts.bold,
                                                            color: "#fff",
                                                            fontSize: 22,
                                                        }}
                                                    >
                                                        {service.name}
                                                    </NText>
                                                    <NText
                                                        style={{
                                                            fontFamily:
                                                                fonts.light,
                                                            color: "#aaa",
                                                            fontSize: 14,
                                                        }}
                                                    >
                                                        {service.address} ·{" "}
                                                        {service.distance?.toFixed(
                                                            1,
                                                        )}{" "}
                                                        km away
                                                    </NText>

                                                    <View
                                                        style={{
                                                            flex: 1,
                                                            justifyContent:
                                                                "space-evenly",
                                                            marginTop: 20,
                                                            flexDirection:
                                                                "row",
                                                            gap: 8,
                                                        }}
                                                    >
                                                        <NButton
                                                            color={
                                                                "rgba(33, 168, 112, 0.51)"
                                                            }
                                                            onPress={() => {
                                                                router.push(
                                                                    `/appointment/`,
                                                                )
                                                            }}
                                                        >
                                                            <NText
                                                                style={{
                                                                    color: "#fff",
                                                                }}
                                                            >
                                                                Schedule
                                                            </NText>
                                                        </NButton>
                                                        <NButton color={"#333"}>
                                                            <View
                                                                style={{
                                                                    flexDirection:
                                                                        "row",
                                                                    gap: 6,
                                                                }}
                                                            >
                                                                <Ionicons
                                                                    name="call"
                                                                    size={16}
                                                                    color="#fff"
                                                                />
                                                                <NText
                                                                    style={{
                                                                        color: "#fff",
                                                                    }}
                                                                >
                                                                    {
                                                                        service.phone
                                                                    }
                                                                </NText>
                                                            </View>
                                                        </NButton>
                                                    </View>
                                                </View>
                                            </NButton>
                                        </Animated.View>
                                    )
                                })}
                            </Animated.View>
                        </View>
                    </GestureDetector>
                </View>
            </GestureHandlerRootView>
        </GestureContext.Provider>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: "center",
        paddingVertical: 40,
    },
    title: {
        color: "#ffffff",
        fontSize: 28,
        fontWeight: "700",
        letterSpacing: 1,
        paddingHorizontal: PEEK_WIDTH,
        marginBottom: 24,
    },
    // Clipping window — only SCREEN_WIDTH wide, overflow hidden hides the rest
    track: {
        width: SCREEN_WIDTH,
        overflow: "hidden",
        height: 240,
    },
    // The full row of cards, laid out side by side starting at PEEK_WIDTH
    row: {
        flexDirection: "row",
        paddingHorizontal: PEEK_WIDTH,
        height: "100%",
        alignItems: "center",
    },
    card: {
        width: CARD_WIDTH,
        borderRadius: 20,
        justifyContent: "center",
    },
    cardSub: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 13,
        marginTop: 6,
        letterSpacing: 0.3,
    },
})
