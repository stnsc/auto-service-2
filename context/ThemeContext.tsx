import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react"
import { useColorScheme } from "react-native"
import { colors, ColorScheme, ThemeColors } from "../theme"

const STORAGE_KEY = "autoservice_theme_preference"

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

interface ThemeContextType {
    colorScheme: ColorScheme
    theme: ThemeColors
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const deviceScheme = useColorScheme()
    const [colorScheme, setColorScheme] = useState<ColorScheme>(
        () => loadPreference() ?? (deviceScheme === "light" ? "light" : "dark"),
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

    return (
        <ThemeContext.Provider
            value={{ colorScheme, theme: colors[colorScheme], toggleTheme }}
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
