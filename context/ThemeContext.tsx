import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react"
import { useColorScheme } from "react-native"
import { colors, accentColors, ColorScheme, AccentKey, ThemeColors } from "../theme"

const STORAGE_KEY = "autoservice_theme_preference"
const STORAGE_KEY_ACCENT = "autoservice_accent_preference"

const VALID_ACCENT_KEYS: AccentKey[] = ["green", "blue", "purple", "amber", "teal"]

function savePreference(scheme: ColorScheme) {
    if (typeof window === "undefined") return
    try {
        localStorage.setItem(STORAGE_KEY, scheme)
    } catch {}
}

function loadPreference(): ColorScheme | null {
    if (typeof window === "undefined") return null
    try {
        const val = localStorage.getItem(STORAGE_KEY)
        if (val === "dark" || val === "light") return val
    } catch {}
    return null
}

function saveAccentPreference(key: AccentKey) {
    if (typeof window === "undefined") return
    try {
        localStorage.setItem(STORAGE_KEY_ACCENT, key)
    } catch {}
}

function loadAccentPreference(): AccentKey | null {
    if (typeof window === "undefined") return null
    try {
        const val = localStorage.getItem(STORAGE_KEY_ACCENT)
        if (val && VALID_ACCENT_KEYS.includes(val as AccentKey)) return val as AccentKey
    } catch {}
    return null
}

interface ThemeContextType {
    colorScheme: ColorScheme
    theme: ThemeColors
    toggleTheme: () => void
    accentKey: AccentKey
    setAccentKey: (key: AccentKey) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const deviceScheme = useColorScheme()
    const [colorScheme, setColorScheme] = useState<ColorScheme>(
        () => loadPreference() ?? (deviceScheme === "light" ? "light" : "dark"),
    )
    const [accentKey, setAccentKeyState] = useState<AccentKey>(
        () => loadAccentPreference() ?? "green",
    )

    // If no saved preference, follow the device scheme when it changes
    useEffect(() => {
        if (loadPreference() !== null) return
        setColorScheme(deviceScheme === "light" ? "light" : "dark")
    }, [deviceScheme])

    const toggleTheme = useCallback(() => {
        setColorScheme((prev) => {
            const next: ColorScheme = prev === "dark" ? "light" : "dark"
            savePreference(next)
            return next
        })
    }, [])

    const setAccentKey = useCallback((key: AccentKey) => {
        setAccentKeyState(key)
        saveAccentPreference(key)
    }, [])

    const theme = useMemo<ThemeColors>(
        () => ({
            ...colors[colorScheme],
            ...accentColors[accentKey][colorScheme],
        }),
        [colorScheme, accentKey],
    )

    return (
        <ThemeContext.Provider
            value={{ colorScheme, theme, toggleTheme, accentKey, setAccentKey }}
        >
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
    return ctx
}
