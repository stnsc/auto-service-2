import React, { useEffect } from "react"
import { StyleSheet, View, Text, ViewStyle, Pressable } from "react-native"
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    Easing,
} from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"

export interface TabItem {
    key: string
    label: string
    icon: React.ReactNode // pass any icon component
}

interface NTabBarProps {
    tabs: TabItem[]
    activeKey: string
    onTabPress?: (key: string) => void
    color?: string
    intensity?: number
    style?: ViewStyle
}

// Individual Tab Pill Component

function NTab({
    item,
    isActive,
    onPress,
}: {
    item: TabItem
    isActive: boolean
    onPress: () => void
    intensity: number
}) {
    const pressed = useSharedValue(false)
    const active = useSharedValue(isActive ? 1 : 0)

    useEffect(() => {
        active.value = withTiming(isActive ? 1 : 0, {
            duration: 220,
            easing: Easing.out(Easing.cubic),
        })
    }, [isActive])

    const scaleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: withSpring(pressed.value ? 0.92 : 1) }],
    }))

    // Active indicator brightness overlay
    const activeOverlayStyle = useAnimatedStyle(() => ({
        opacity: withTiming(isActive ? 1 : 0, { duration: 200 }),
    }))

    // Label width — collapses for inactive tabs
    const labelStyle = useAnimatedStyle(() => ({
        maxWidth: interpolate(active.value, [0, 1], [0, 72]),
        opacity: active.value,
        marginLeft: interpolate(active.value, [0, 1], [0, 6]),
    }))

    return (
        <Pressable
            onPressIn={() => (pressed.value = true)}
            onPressOut={() => (pressed.value = false)}
            onPress={onPress}
            style={styles.tabTouchable}
        >
            <Animated.View style={[styles.tabInner, scaleStyle]}>
                {/* Active pill background */}
                {isActive && (
                    <Animated.View
                        style={[
                            StyleSheet.absoluteFill,
                            styles.activePill,
                            activeOverlayStyle,
                        ]}
                    >
                        <LinearGradient
                            colors={[
                                "rgba(255,255,255,0.28)",
                                "rgba(255,255,255,0.08)",
                            ]}
                            style={StyleSheet.absoluteFill}
                        />
                    </Animated.View>
                )}

                {/* Icon */}
                <View
                    style={[styles.iconWrap, isActive && styles.iconWrapActive]}
                >
                    {item.icon}
                </View>

                {/* Expanding label */}
                <Animated.Text
                    numberOfLines={1}
                    style={[
                        styles.tabLabel,
                        isActive && styles.tabLabelActive,
                        labelStyle,
                    ]}
                >
                    {item.label}
                </Animated.Text>
            </Animated.View>
        </Pressable>
    )
}

// Actual Component

export function NTabBar({
    tabs,
    activeKey,
    onTabPress,
    color = "rgba(255, 255, 255, 0.08)",
    intensity = 40,
    style,
}: NTabBarProps) {
    return (
        <View style={[styles.wrapper, style]}>
            <LinearGradient
                colors={["rgba(255,255,255,0.35)", "rgba(255,255,255,0.06)"]}
                style={styles.gradientStroke}
            >
                <BlurView
                    intensity={intensity}
                    tint="dark"
                    style={[styles.bar, { backgroundColor: color }]}
                >
                    {tabs.map((tab) => (
                        <NTab
                            key={tab.key}
                            item={tab}
                            isActive={tab.key === activeKey}
                            onPress={() => onTabPress?.(tab.key)}
                            intensity={intensity}
                        />
                    ))}
                </BlurView>
            </LinearGradient>
        </View>
    )
}

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: 50,
        overflow: "hidden",
        alignSelf: "center",
    },
    gradientStroke: {
        padding: 1.5,
        borderRadius: 50,
    },
    bar: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 48,
        gap: 4,
        overflow: "hidden",
    },

    // ── Per-tab ──
    tabTouchable: {
        borderRadius: 40,
        overflow: "hidden",
    },
    tabInner: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 40,
        overflow: "hidden",
    },
    activePill: {
        borderRadius: 40,
        overflow: "hidden",
    },
    iconWrap: {
        opacity: 0.55,
    },
    iconWrapActive: {
        opacity: 1,
    },
    tabLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "rgba(255,255,255,0.55)",
        overflow: "hidden",
    },
    tabLabelActive: {
        color: "#ffffff",
    },
})
