import React, { ReactNode } from "react"
import { StyleSheet, View, Pressable, ScrollView, Modal } from "react-native"
import Animated, { FadeIn, FadeOut } from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { NText } from "./NText"
import { NButton } from "./NButton"
import { fonts } from "../../theme"
import { useTheme } from "../../context/ThemeContext"

interface NModalProps {
    visible: boolean
    onDismiss: () => void
    title?: string
    children?: ReactNode
    dismissLabel?: string
    confirmLabel?: string
    onConfirm?: () => void
    color?: string
}

export function NModal({
    visible,
    onDismiss,
    title,
    children,
    dismissLabel = "Got it",
    confirmLabel,
    onConfirm,
    color = "rgba(255, 255, 255, 0.15)",
}: NModalProps) {
    const { theme } = useTheme()
    if (!visible) return null

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onDismiss}
            statusBarTranslucent
        >
        <View style={[styles.backdrop, { backgroundColor: theme.backdrop }]}>
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
                    <BlurView
                        intensity={40}
                        tint={theme.blurTint}
                        style={styles.card}
                    >
                        {title && <NText style={styles.title}>{title}</NText>}

                        <ScrollView
                            style={styles.body}
                            contentContainerStyle={styles.bodyContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {children}
                        </ScrollView>

                        {onConfirm ? (
                            <View style={styles.buttonRow}>
                                <NButton
                                    onPress={onDismiss}
                                    style={styles.buttonRowItem}
                                >
                                    <NText style={styles.dismissText}>
                                        {dismissLabel}
                                    </NText>
                                </NButton>
                                <NButton
                                    color="rgba(33, 168, 112, 0.51)"
                                    onPress={onConfirm}
                                    style={styles.buttonRowItem}
                                >
                                    <NText style={styles.dismissText}>
                                        {confirmLabel}
                                    </NText>
                                </NButton>
                            </View>
                        ) : (
                            <NButton
                                color="rgba(33, 168, 112, 0.51)"
                                onPress={onDismiss}
                                style={styles.dismissBtn}
                            >
                                <NText style={styles.dismissText}>
                                    {dismissLabel}
                                </NText>
                            </NButton>
                        )}
                    </BlurView>
                </LinearGradient>
            </Animated.View>
        </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
    },
    backdropPress: {
        ...StyleSheet.absoluteFillObject,
    },
    cardWrapper: {
        width: "88%",
        maxWidth: 420,
        maxHeight: "80%",
        overflow: "hidden",
    },
    gradientStroke: {
        padding: 1.5,
        borderRadius: 25,
        flex: 1,
    },
    card: {
        borderRadius: 23,
        padding: 24,
        overflow: "hidden",
        flex: 1,
    },
    title: {
        fontFamily: fonts.bold,
        fontSize: 20,
        marginBottom: 16,
        textAlign: "center",
    },
    body: {
        marginBottom: 20,
        flex: 1,
    },
    bodyContent: {
        paddingHorizontal: 3,
    },
    dismissBtn: {
        alignSelf: "stretch",
    },
    dismissText: {
        fontFamily: fonts.bold,
        fontSize: 15,
        textAlign: "center",
    },
    buttonRow: {
        flexDirection: "row",
        gap: 10,
    },
    buttonRowItem: {
        flex: 1,
    },
})
