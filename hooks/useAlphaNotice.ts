import { useState, useEffect } from "react"
import { Platform } from "react-native"

const STORAGE_PREFIX = "alpha_notice_"

function getFlag(key: string): boolean {
    if (Platform.OS !== "web") return false
    try {
        return localStorage.getItem(STORAGE_PREFIX + key) === "1"
    } catch {
        return false
    }
}

function setFlag(key: string) {
    if (Platform.OS !== "web") return
    try {
        localStorage.setItem(STORAGE_PREFIX + key, "1")
    } catch {}
}

/**
 * Shows a one-time notice identified by `key`.
 * Once dismissed, the notice won't appear again for this browser.
 */
export function useAlphaNotice(key: string) {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (!getFlag(key)) setVisible(true)
    }, [key])

    const dismiss = () => {
        setFlag(key)
        setVisible(false)
    }

    return { visible, dismiss }
}
