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
                    <Text
                        style={[
                            styles.menuItemLabel,
                            action.destructive && styles.destructiveLabel,
                        ]}
                    >
                        {action.label}
                    </Text>
                </TouchableOpacity>
            </Animated.View>

            {index < total - 1 && (
                <Animated.View style={[styles.separator, itemStyle]} />
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
        width: interpolate(openProgress.value, [0, 1], [60, 250]),
        height: interpolate(openProgress.value, [0, 1], [60, 240]),
        borderRadius: interpolate(openProgress.value, [0, 1], [30, 32]),
    }))

    const menuPanelStyle = useAnimatedStyle(() => ({
        width: interpolate(openProgress.value, [0, 1], [0, 185]),
        opacity: interpolate(openProgress.value, [0, 0.2, 1], [0, 0, 1]),
    }))

    return (
        <Animated.View style={[styles.wrapper, containerStyle, style]}>
            <LinearGradient
                colors={["rgba(255,255,255,0.35)", "rgba(255,255,255,0.06)"]}
                style={styles.gradientStroke}
            >
                <BlurView
                    intensity={intensity}
                    tint="dark"
                    style={[styles.container, { backgroundColor: color }]}
                >
                    {/* Avatar — the trigger */}
                    <TouchableOpacity
                        onPress={toggle}
                        style={styles.avatarButton}
                        activeOpacity={0.75}
                    >
                        <View style={styles.avatarInner}>{avatar}</View>
                    </TouchableOpacity>

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
        width: 57,
        paddingTop: 12,
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
        width: 175,
        paddingRight: 12,
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
        color: "rgba(255,255,255,0.9)",
        fontSize: 15,
        fontWeight: "500",
        flexShrink: 1,
    },
    destructiveLabel: {
        color: "#ff453a",
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: "rgba(255,255,255,0.18)",
        marginHorizontal: 4,
    },
})
