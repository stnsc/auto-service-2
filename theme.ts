export const fonts = {
    light: "IosevkaCharon_300Light",
    regular: "IosevkaCharon_400Regular",
    medium: "IosevkaCharon_500Medium",
    bold: "IosevkaCharon_700Bold",
}

export type ColorScheme = "dark" | "light"

export type AccentKey = "green" | "blue" | "purple" | "amber" | "teal"

export interface AccentEntry {
    accent: string
    accentSolid: string
    accentIcon: string
    accentSubtle: string
}

export const accentColors: Record<AccentKey, Record<ColorScheme, AccentEntry>> =
    {
        green: {
            dark: {
                accent: "rgba(33, 168, 112, 0.51)",
                accentSolid: "rgb(33, 168, 112)",
                accentIcon: "rgba(33, 168, 112, 0.8)",
                accentSubtle: "rgba(33, 168, 112, 0.18)",
            },
            light: {
                accent: "rgba(20, 150, 90, 0.7)",
                accentSolid: "rgb(20, 150, 90)",
                accentIcon: "rgba(20, 150, 90, 0.85)",
                accentSubtle: "rgba(20, 150, 90, 0.18)",
            },
        },
        blue: {
            dark: {
                accent: "rgba(59, 130, 246, 0.51)",
                accentSolid: "rgb(59, 130, 246)",
                accentIcon: "rgba(59, 130, 246, 0.8)",
                accentSubtle: "rgba(59, 130, 246, 0.18)",
            },
            light: {
                accent: "rgba(37, 99, 235, 0.7)",
                accentSolid: "rgb(37, 99, 235)",
                accentIcon: "rgba(37, 99, 235, 0.85)",
                accentSubtle: "rgba(37, 99, 235, 0.18)",
            },
        },
        purple: {
            dark: {
                accent: "rgba(168, 85, 247, 0.51)",
                accentSolid: "rgb(168, 85, 247)",
                accentIcon: "rgba(168, 85, 247, 0.8)",
                accentSubtle: "rgba(168, 85, 247, 0.18)",
            },
            light: {
                accent: "rgba(124, 58, 237, 0.7)",
                accentSolid: "rgb(124, 58, 237)",
                accentIcon: "rgba(124, 58, 237, 0.85)",
                accentSubtle: "rgba(124, 58, 237, 0.18)",
            },
        },
        amber: {
            dark: {
                accent: "rgba(245, 158, 11, 0.51)",
                accentSolid: "rgb(245, 158, 11)",
                accentIcon: "rgba(245, 158, 11, 0.8)",
                accentSubtle: "rgba(245, 158, 11, 0.18)",
            },
            light: {
                accent: "rgba(217, 119, 6, 0.7)",
                accentSolid: "rgb(217, 119, 6)",
                accentIcon: "rgba(217, 119, 6, 0.85)",
                accentSubtle: "rgba(217, 119, 6, 0.18)",
            },
        },
        teal: {
            dark: {
                accent: "rgba(20, 184, 166, 0.51)",
                accentSolid: "rgb(20, 184, 166)",
                accentIcon: "rgba(20, 184, 166, 0.8)",
                accentSubtle: "rgba(20, 184, 166, 0.18)",
            },
            light: {
                accent: "rgba(13, 148, 136, 0.7)",
                accentSolid: "rgb(13, 148, 136)",
                accentIcon: "rgba(13, 148, 136, 0.85)",
                accentSubtle: "rgba(13, 148, 136, 0.18)",
            },
        },
    }

export interface ThemeColors {
    text: string
    textMuted: string
    textSubtle: string
    surface: string
    surfaceMid: string
    surfaceHigh: string
    borderStart: string
    borderEnd: string
    overlayBg: string
    inputPlaceholder: string
    blurTint: "dark" | "light"
    accent: string
    accentSolid: string
    accentIcon: string
    accentSubtle: string
    error: string
    icon: string
    iconMuted: string
    backdrop: string
}

export const colors: Record<ColorScheme, ThemeColors> = {
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
        blurTint: "dark",
        accent: "rgba(33, 168, 112, 0.51)",
        accentSolid: "rgb(33, 168, 112)",
        accentIcon: "rgba(33, 168, 112, 0.8)",
        accentSubtle: "rgba(33, 168, 112, 0.18)",
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
        blurTint: "light",
        accent: "rgba(20, 150, 90, 0.7)",
        accentSolid: "rgb(20, 150, 90)",
        accentIcon: "rgba(20, 150, 90, 0.85)",
        accentSubtle: "rgba(20, 150, 90, 0.18)",
        error: "rgba(180, 30, 30, 0.9)",
        icon: "#0d0d0d",
        iconMuted: "rgba(0,0,0,0.55)",
        backdrop: "rgba(0,0,0,0.45)",
    },
}