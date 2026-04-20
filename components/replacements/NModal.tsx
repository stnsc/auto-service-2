import React, { ReactNode } from "react"
import {
    StyleSheet,
    View,
    Pressable,
    ScrollView,
} from "react-native"
import Animated, {
    FadeIn,
    FadeOut,
} from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { NText } from "./NText"
import { NButton } from "./NButton"
import { fonts } from "../../theme"

interface NModalProps {
    visible: boolean
    onDismiss: () => void
    title?: string
    children?: ReactNode
    dismissLabel?: string
    color?: string
}

export function NModal({
    visible,
    onDismiss,
    title,
    children,
    dismissLabel = "Got it",
    color = "rgba(255, 255, 255, 0.15)",
}: NModalProps) {
    if (!visible) return null

    return (
        <View style={styles.backdrop}>
            <Pressable style={styles.backdropPress} onPress={onDismiss} />

            <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}
                style={styles.cardWrapper}
            >
                <LinearGradient
                    colors={[color, "rgba(255,255,255,0.05)"]}
                    style={styles.gradientStroke}
                >
                    <BlurView intensity={40} tint="dark" style={styles.card}>
                        {title && <NText style={styles.title}>{title}</NText>}

                        <ScrollView
                            style={styles.body}
                            showsVerticalScrollIndicator={false}
                        >
                            {children}
                        </ScrollView>

                        <NButton
                            color="rgba(33, 168, 112, 0.51)"
                            onPress={onDismiss}
                            style={styles.dismissBtn}
                        >
                            <NText style={styles.dismissText}>
                                {dismissLabel}
                            </NText>
                        </NButton>
                    </BlurView>
                </LinearGradient>
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
    },
    backdropPress: {
        ...StyleSheet.absoluteFillObject,
    },
    cardWrapper: {
        width: "88%",
        maxWidth: 420,
        maxHeight: "80%",
    },
    gradientStroke: {
        padding: 1.5,
        borderRadius: 25,
    },
    card: {
        borderRadius: 23,
        padding: 24,
        overflow: "hidden",
    },
    title: {
        fontFamily: fonts.bold,
        fontSize: 20,
        color: "#fff",
        marginBottom: 16,
        textAlign: "center",
    },
    body: {
        marginBottom: 20,
    },
    dismissBtn: {
        alignSelf: "stretch",
    },
    dismissText: {
        fontFamily: fonts.bold,
        color: "#fff",
        fontSize: 15,
        textAlign: "center",
    },
})
