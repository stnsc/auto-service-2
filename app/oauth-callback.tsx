import { useEffect } from "react"
import { View, ActivityIndicator } from "react-native"
import * as WebBrowser from "expo-web-browser"
import { useTheme } from "../context/ThemeContext"

// This page exists solely to close the OAuth popup and pass the auth code
// back to the opener (login/signup screen). expo-web-browser uses postMessage
// to communicate between the popup and the parent window.
WebBrowser.maybeCompleteAuthSession()

export default function OAuthCallbackScreen() {
    const { theme } = useTheme()
    return (
        <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
            <ActivityIndicator color={theme.accentIcon} size="large" />
        </View>
    )
}
