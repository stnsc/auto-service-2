import { Redirect } from "expo-router"
import { useAuthContext } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import { ActivityIndicator, View } from "react-native"

export default function Root() {
    const { isAuthenticated, isLoading } = useAuthContext()
    const { theme } = useTheme()

    if (isLoading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <ActivityIndicator color={theme.text} size="large" />
            </View>
        )
    }

    if (!isAuthenticated) {
        return <Redirect href="/(auth)/login" />
    }

    return <Redirect href="/(tabs)/chat" />
}
