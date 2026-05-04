import React, { useState, useRef } from "react"
import {
    StyleSheet,
    View,
    ViewStyle,
    TouchableOpacity,
    Modal,
    Pressable,
    useWindowDimensions,
} from "react-native"
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    SharedValue,
    Easing,
    runOnJS,
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
                            {
                                color: action.destructive
                                    ? theme.error
                                    : theme.text,
                            },
                            { fontFamily: fonts.light },
                        ]}
                    >
                        {action.label}
                    </NText>
                </TouchableOpacity>
            </Animated.View>

            {index < total - 1 && (
                <Animated.View
                    style={[
                        styles.separator,
                        { backgroundColor: theme.surfaceHigh },
                        itemStyle,
                    ]}
                />
            )}
        </>
    )
}

export function NContextMenu({
    actions,
    onAction,
    avatar,
    color = "rgba(255, 255, 255, 0.08)",
    intensity = 40,
    style,
}: NContextMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [menuPos, setMenuPos] = useState({ top: 0, right: 16 })
    const triggerRef = useRef<View>(null)
    const openProgress = useSharedValue(0)
    // Estimate height upfront so the first frame isn't wildly wrong
    const measuredHeight = useSharedValue(42 + actions.length * 52)
    const { theme } = useTheme()
    const { width: screenWidth } = useWindowDimensions()

    const open = () => {
        triggerRef.current?.measure((_x, _y, w, h, pageX, pageY) => {
            setMenuPos({
                top: pageY,
                right: screenWidth - pageX - w,
            })
            setIsOpen(true)
            openProgress.value = withTiming(1, {
                duration: 320,
                easing: Easing.out(Easing.cubic),
            })
        })
    }

    const close = () => {
        openProgress.value = withTiming(
            0,
            { duration: 220, easing: Easing.in(Easing.quad) },
            (finished) => {
                if (finished) runOnJS(setIsOpen)(false)
            },
        )
    }

    const handleAction = (key: string) => {
        close()
        onAction?.(key)
    }

    // Outer pill: right edge stays fixed, grows leftward
    const containerStyle = useAnimatedStyle(() => ({
        width: interpolate(openProgress.value, [0, 1], [42, 230]),
        height: interpolate(
            openProgress.value,
            [0, 1],
            [42, measuredHeight.value],
        ),
        borderRadius: interpolate(openProgress.value, [0, 1], [21, 32]),
    }))

    // Avatar (right side): shrinks and fades out
    const avatarStyle = useAnimatedStyle(() => ({
        width: interpolate(openProgress.value, [0, 0.25], [42, 0], "clamp"),
        opacity: interpolate(openProgress.value, [0, 0.2], [1, 0], "clamp"),
        overflow: "hidden",
    }))

    // Menu panel (left side): grows and fades in
    const menuPanelStyle = useAnimatedStyle(() => ({
        width: interpolate(openProgress.value, [0, 1], [0, 238]),
        opacity: interpolate(openProgress.value, [0, 0.2, 1], [0, 0, 1]),
    }))

    // Backdrop: fades in
    const backdropStyle = useAnimatedStyle(() => ({
        opacity: interpolate(openProgress.value, [0, 1], [0, 1]),
    }))

    return (
        <>
            {/* Trigger — fixed size, never shifts layout. Hidden while modal is open. */}
            <View
                ref={triggerRef}
                style={[styles.trigger, style, isOpen && { opacity: 0 }]}
            >
                <LinearGradient
                    colors={[theme.borderStart, theme.borderEnd]}
                    style={styles.gradientStroke}
                >
                    <BlurView
                        intensity={intensity}
                        tint={theme.blurTint}
                        style={[
                            styles.triggerInner,
                            { backgroundColor: color },
                        ]}
                    >
                        <TouchableOpacity
                            onPress={open}
                            style={styles.avatarButton}
                            activeOpacity={0.75}
                        >
                            <View style={styles.avatarInner}>{avatar}</View>
                        </TouchableOpacity>
                    </BlurView>
                </LinearGradient>
            </View>

            <Modal
                visible={isOpen}
                transparent
                animationType="none"
                onRequestClose={close}
                statusBarTranslucent
            >
                {/* Dim + blur backdrop */}
                <Animated.View
                    style={[StyleSheet.absoluteFill, backdropStyle]}
                    pointerEvents="none"
                >
                    <BlurView
                        intensity={14}
                        tint={theme.blurTint}
                        style={StyleSheet.absoluteFill}
                    />
                    <View
                        style={[
                            StyleSheet.absoluteFill,
                            { backgroundColor: "rgba(0,0,0,0.45)" },
                        ]}
                    />
                </Animated.View>

                {/* Full-screen tap-to-close */}
                <Pressable style={StyleSheet.absoluteFill} onPress={close} />

                {/* Expanding pill - starts as a circle at the trigger's exact position */}
                <Animated.View
                    style={[
                        styles.wrapper,
                        { top: menuPos.top, right: menuPos.right },
                        containerStyle,
                    ]}
                >
                    <LinearGradient
                        colors={[theme.borderStart, theme.borderEnd]}
                        style={styles.gradientStroke}
                    >
                        <BlurView
                            intensity={intensity}
                            tint={theme.blurTint}
                            style={[
                                styles.container,
                                { backgroundColor: color },
                            ]}
                        >
                            {/* Items on the left, expand leftward */}
                            <Animated.View
                                style={[styles.menuPanel, menuPanelStyle]}
                            >
                                <View
                                    style={styles.menuItems}
                                    onLayout={(e) => {
                                        measuredHeight.value =
                                            e.nativeEvent.layout.height + 3
                                    }}
                                >
                                    {actions.map((action, index) => (
                                        <AnimatedMenuItem
                                            key={action.key}
                                            action={action}
                                            index={index}
                                            total={actions.length}
                                            openProgress={openProgress}
                                            onPress={() =>
                                                handleAction(action.key)
                                            }
                                        />
                                    ))}
                                </View>
                            </Animated.View>

                            {/* Avatar on the right, collapses as items appear */}
                            <Animated.View style={avatarStyle}>
                                <TouchableOpacity
                                    onPress={close}
                                    style={styles.avatarButton}
                                    activeOpacity={0.75}
                                >
                                    <View style={styles.avatarInner}>
                                        {avatar}
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                        </BlurView>
                    </LinearGradient>
                </Animated.View>
            </Modal>
        </>
    )
}

const styles = StyleSheet.create({
    // The fixed trigger that lives in the navbar
    trigger: {
        width: 42,
        height: 42,
        borderRadius: 32,
        overflow: "hidden",
    },
    triggerInner: {
        flex: 1,
        borderRadius: 30,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
    },
    // The animated expanding pill inside the Modal
    wrapper: {
        position: "absolute",
        overflow: "hidden",
    },
    gradientStroke: {
        paddingVertical: 1.25,
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
        paddingLeft: 14,
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
        flexWrap: "wrap",
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        marginHorizontal: 4,
    },
})
