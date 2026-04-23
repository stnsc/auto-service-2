export const fonts = {
    light: "IosevkaCharon_300Light",
    regular: "IosevkaCharon_400Regular",
    medium: "IosevkaCharon_500Medium",
    bold: "IosevkaCharon_700Bold",
}

export type ColorScheme = "dark" | "light"

export const colors = {
    dark: {
        text: "#ffffff",
        textMuted: "rgba(255,255,255,0.6)",
        textSubtle: "rgba(255,255,255,0.4)",
        surface: "rgba(255,255,255,0.05)",
        surfaceMid: "rgba(255,255,255,0.1)",
        surfaceHigh: "rgba(255,255,255,0.15)",
        borderStart: "rgba(255,255,255,0.35)",
        borderEnd: "rgba(255,255,255,0.06)",
        overlayBg: "rgba(0,0,0,0.4)",
        inputPlaceholder: "rgba(255,255,255,0.4)",
        blurTint: "dark" as const,
        accent: "rgba(33, 168, 112, 0.51)",
        accentSolid: "rgb(33, 168, 112)",
        error: "rgba(255, 80, 80, 0.9)",
        icon: "#ffffff",
        iconMuted: "rgba(255,255,255,0.6)",
        backdrop: "rgba(0,0,0,0.6)",
    },
    light: {
        text: "#0d0d0d",
        textMuted: "rgba(0,0,0,0.55)",
        textSubtle: "rgba(0,0,0,0.35)",
        surface: "rgba(0,0,0,0.04)",
        surfaceMid: "rgba(0,0,0,0.08)",
        surfaceHigh: "rgba(0,0,0,0.12)",
        borderStart: "rgba(0,0,0,0.22)",
        borderEnd: "rgba(0,0,0,0.04)",
        overlayBg: "rgba(255,255,255,0.6)",
        inputPlaceholder: "rgba(0,0,0,0.35)",
        blurTint: "light" as const,
        accent: "rgba(20, 150, 90, 0.7)",
        accentSolid: "rgb(20, 150, 90)",
        error: "rgba(180, 30, 30, 0.9)",
        icon: "#0d0d0d",
        iconMuted: "rgba(0,0,0,0.55)",
        backdrop: "rgba(0,0,0,0.45)",
    },
} as const

export type ThemeColors = typeof colors.dark