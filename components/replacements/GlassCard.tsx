import React, { ReactNode } from "react"
import { View, StyleProp, ViewStyle } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { useTheme } from "../../context/ThemeContext"

interface GlassCardProps {
    children?: ReactNode
    /** Gradient start colour — also acts as the subtle border tint. Default: faint white. */
    color?: string
    /** BlurView intensity. Default: 30 */
    intensity?: number
    /** Corner radius of the inner card. Default: 14 */
    borderRadius?: number
    /** Styles applied to the outer wrapper (use for flex, minWidth, margin…) */
    style?: StyleProp<ViewStyle>
    /** Styles applied to the inner BlurView (use for padding, alignment…) */
    innerStyle?: StyleProp<ViewStyle>
}

export function GlassCard({
    children,
    color = "rgba(255,255,255,0.15)",
    intensity = 30,
    borderRadius = 14,
    style,
    innerStyle,
}: GlassCardProps) {
    const { theme } = useTheme()
    const outerRadius = borderRadius + 2

    return (
        <View style={[{ borderRadius: outerRadius, overflow: "hidden" }, style]}>
            <LinearGradient
                colors={[color, "rgba(255,255,255,0.04)"]}
                style={{ padding: 1, borderRadius: outerRadius }}
            >
                <BlurView
                    intensity={intensity}
                    tint={theme.blurTint}
                    style={[{ borderRadius, overflow: "hidden" }, innerStyle]}
                >
                    {children}
                </BlurView>
            </LinearGradient>
        </View>
    )
}
