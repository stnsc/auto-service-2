import React, { useEffect } from "react"
import { StyleSheet, View, Pressable, Image } from "react-native"
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    Easing,
} from "react-native-reanimated"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../replacements/NText"
import { fonts } from "../../theme"

export interface SidebarItem {
    key: string
    label: string
    icon: keyof typeof Ionicons.glyphMap
}

interface AdminSidebarProps {
    items: SidebarItem[]
    activeKey: string
    onNavigate: (key: string) => void
    collapsed?: boolean
}

function SidebarNavItem({
    item,
    isActive,
    onPress,
    collapsed,
}: {
    item: SidebarItem
    isActive: boolean
    onPress: () => void
    collapsed?: boolean
}) {
    const active = useSharedValue(isActive ? 1 : 0)

    useEffect(() => {
        active.value = withTiming(isActive ? 1 : 0, {
            duration: 220,
            easing: Easing.out(Easing.cubic),
        })
    }, [isActive])

    const pillStyle = useAnimatedStyle(() => ({
        opacity: active.value,
    }))

    const labelStyle = useAnimatedStyle(() => ({
        opacity: interpolate(active.value, [0, 1], [0.55, 1]),
    }))

    return (
        <Pressable onPress={onPress} style={styles.navItem}>
            <Animated.View style={[StyleSheet.absoluteFill, styles.activePill, pillStyle]}>
                <LinearGradient
                    colors={["rgba(255,255,255,0.28)", "rgba(255,255,255,0.08)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>

            <Ionicons
                name={item.icon}
                size={20}
                color="white"
                style={{ opacity: isActive ? 1 : 0.55 }}
            />

            {!collapsed && (
                <Animated.View style={labelStyle}>
                    <NText
                        style={[
                            styles.navLabel,
                            { fontFamily: isActive ? fonts.medium : fonts.regular },
                        ]}
                    >
                        {item.label}
                    </NText>
                </Animated.View>
            )}
        </Pressable>
    )
}

export function AdminSidebar({
    items,
    activeKey,
    onNavigate,
    collapsed = false,
}: AdminSidebarProps) {
    return (
        <View style={[styles.wrapper, collapsed && styles.wrapperCollapsed]}>
            <LinearGradient
                colors={["rgba(255,255,255,0.35)", "rgba(255,255,255,0.06)"]}
                style={styles.gradientStroke}
            >
                <BlurView
                    intensity={40}
                    tint="dark"
                    style={[styles.sidebar, { backgroundColor: "rgba(255,255,255,0.08)" }]}
                >
                    {/* Logo area */}
                    <View style={styles.logoArea}>
                        {!collapsed ? (
                            <>
                                <Image
                                    source={require("../../assets/autoservice/logo.png")}
                                    style={styles.logo}
                                />
                                <NText style={[styles.adminBadge, { fontFamily: fonts.light }]}>
                                    ADMIN
                                </NText>
                            </>
                        ) : (
                            <Ionicons name="shield" size={24} color="white" style={{ opacity: 0.8 }} />
                        )}
                    </View>

                    <View style={styles.divider} />

                    {/* Nav items */}
                    <View style={styles.navList}>
                        {items.map((item) => (
                            <SidebarNavItem
                                key={item.key}
                                item={item}
                                isActive={item.key === activeKey}
                                onPress={() => onNavigate(item.key)}
                                collapsed={collapsed}
                            />
                        ))}
                    </View>

                    {/* Bottom: Customer View link */}
                    <View style={styles.bottomSection}>
                        <View style={styles.divider} />
                        <Pressable
                            onPress={() => onNavigate("__customer__")}
                            style={styles.navItem}
                        >
                            <Ionicons
                                name="swap-horizontal-outline"
                                size={20}
                                color="white"
                                style={{ opacity: 0.55 }}
                            />
                            {!collapsed && (
                                <NText style={[styles.navLabel, { opacity: 0.55 }]}>
                                    Customer View
                                </NText>
                            )}
                        </Pressable>
                    </View>
                </BlurView>
            </LinearGradient>
        </View>
    )
}

const SIDEBAR_WIDTH = 220
const SIDEBAR_WIDTH_COLLAPSED = 75

const styles = StyleSheet.create({
    wrapper: {
        width: SIDEBAR_WIDTH,
        overflow: "hidden",
    },
    wrapperCollapsed: {
        width: SIDEBAR_WIDTH_COLLAPSED,
    },
    gradientStroke: {
        padding: 1.5,
        paddingLeft: 0,
        flex: 1,
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
    },
    sidebar: {
        flex: 1,
        borderTopRightRadius: 18,
        borderBottomRightRadius: 18,
        overflow: "hidden",
        paddingVertical: 16,
        paddingHorizontal: 12,
    },
    logoArea: {
        alignItems: "center",
        paddingVertical: 12,
        gap: 4,
    },
    logo: {
        width: 100,
        height: 34,
        resizeMode: "contain",
    },
    adminBadge: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 11,
        letterSpacing: 3,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: "rgba(255,255,255,0.18)",
        marginVertical: 12,
        marginHorizontal: 4,
    },
    navList: {
        flex: 1,
        gap: 4,
    },
    navItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        gap: 12,
        overflow: "hidden",
    },
    activePill: {
        borderRadius: 14,
        overflow: "hidden",
    },
    navLabel: {
        color: "#ffffff",
        fontSize: 14,
    },
    bottomSection: {
        paddingTop: 8,
    },
})
