import React, { useState } from "react"
import {
    StyleSheet,
    View,
    Text,
    ViewStyle,
    TouchableOpacity,
} from "react-native"
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    SharedValue,
    Easing,
} from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { NText } from "./NText"
import { fonts } from "../../theme"
import { useTheme } from "../../context/ThemeContext"

export interface MenuAction {
    key: string
    label: string
    icon: React.ReactNode
    destructive?: boolean
}

interface NContextMenuProps {
    actions: MenuAction[]
    onAction?: (key: string) => void
    avatar?: React.ReactNode
    color?: string
    intensity?: number
    style?: ViewStyle
}

// Single Anim Row

function AnimatedMenuItem({
    action,
    index,
    total,
    openProgress,
    onPress,
}: {
    action: MenuAction
    index: number
    total: number
    openProgress: SharedValue<number>
    onPress: () => void
}) {
    const { theme } = useTheme()
    const staggerStart = index * 0.07

    const itemStyle = useAnimatedStyle(() => {
        const p = interpolate(
            openProgress.value,
            [staggerStart, staggerStart + 0.35],
            [0, 1],
            "clamp",
        )
        return {
            opacity: p,
            transform: [{ translateY: interpolate(p, [0, 1], [5, 0]) }],
        }
    })

    return (
        <>
            <Animated.View style={itemStyle}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={onPress}
                    activeOpacity={0.6}
                >
                    <View style={styles.menuItemIcon}>{action.icon}</View>
                    <NText
                        style={[
                            styles.menuItemLabel,
                            { color: action.destructive ? theme.error : theme.text },
                            { fontFamily: fonts.light },
                        ]}
                    >
                        {action.label}
                    </NText>
                </TouchableOpacity>
            </Animated.View>

            {index < total - 1 && (
                <Animated.View style={[styles.separator, { backgroundColor: theme.surfaceHigh }, itemStyle]} />
            )}
        </>
    )
}

// Context Menu

export function NContextMenu({
    actions,
    onAction,
    avatar,
    color = "rgba(255, 255, 255, 0.08)",
    intensity = 40,
    style,
}: NContextMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const openProgress = useSharedValue(0)
    const { theme } = useTheme()

    const toggle = () => {
        const next = !isOpen
        setIsOpen(next)
        openProgress.value = withTiming(next ? 1 : 0, {
            duration: 320,
            easing: next ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
        })
    }

    const handleAction = (key: string) => {
        openProgress.value = withTiming(0, {
            duration: 220,
            easing: Easing.in(Easing.quad),
        })
        setIsOpen(false)
        onAction?.(key)
    }

    // The whole pill grows from circle → rectangle
    const containerStyle = useAnimatedStyle(() => ({
        width: interpolate(openProgress.value, [0, 1], [42, 230]),
        height: interpolate(openProgress.value, [0, 1], [42, 42 + actions.length * 38]),
        borderRadius: interpolate(openProgress.value, [0, 1], [21, 32]),
    }))

    const avatarButtonStyle = useAnimatedStyle(() => ({
        width: interpolate(openProgress.value, [0, 0.25], [42, 0], "clamp"),
        opacity: interpolate(openProgress.value, [0, 0.2], [1, 0], "clamp"),
        overflow: "hidden",
    }))

    // Update menuPanelStyle to use full width when avatar is gone
    const menuPanelStyle = useAnimatedStyle(() => ({
        width: interpolate(openProgress.value, [0, 1], [0, 238]),
        opacity: interpolate(openProgress.value, [0, 0.2, 1], [0, 0, 1]),
    }))

    return (
        <Animated.View style={[styles.wrapper, containerStyle, style]}>
            <LinearGradient
                colors={[theme.borderStart, theme.borderEnd]}
                style={styles.gradientStroke}
            >
                <BlurView
                    intensity={intensity}
                    tint={theme.blurTint}
                    style={[styles.container, { backgroundColor: color }]}
                >
                    {/* Avatar — the trigger */}
                    <Animated.View style={avatarButtonStyle}>
                        <TouchableOpacity
                            onPress={toggle}
                            style={styles.avatarButton}
                            activeOpacity={0.75}
                        >
                            <View style={styles.avatarInner}>{avatar}</View>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Expanding items panel — no arrow */}
                    <Animated.View style={[styles.menuPanel, menuPanelStyle]}>
                        <View style={styles.menuItems}>
                            {actions.map((action, index) => (
                                <AnimatedMenuItem
                                    key={action.key}
                                    action={action}
                                    index={index}
                                    total={actions.length}
                                    openProgress={openProgress}
                                    onPress={() => handleAction(action.key)}
                                />
                            ))}
                        </View>
                    </Animated.View>
                </BlurView>
            </LinearGradient>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: 32,
        overflow: "hidden",
    },
    gradientStroke: {
        padding: 1.5,
        borderRadius: 32,
        flex: 1,
    },
    container: {
        flexDirection: "row",
        alignItems: "flex-start",
        borderRadius: 30,
        overflow: "hidden",
        flex: 1,
    },
    avatarButton: {
        width: 42,
        paddingTop: 2,
        alignItems: "center",
        flexShrink: 0,
    },
    avatarInner: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },

    menuPanel: {
        overflow: "hidden",
    },
    menuItems: {
        width: 228,
        paddingRight: 14,
        paddingLeft: 14, // left padding now that avatar is gone
        paddingVertical: 6,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 11,
        paddingHorizontal: 4,
        gap: 10,
    },
    menuItemIcon: {
        width: 22,
        alignItems: "center",
    },
    menuItemLabel: {
        fontSize: 13,
        fontWeight: "500",
        flexShrink: 1,
    },
    destructiveLabel: {},
    separator: {
        height: StyleSheet.hairlineWidth,
        marginHorizontal: 4,
    },
})
