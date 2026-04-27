import React from "react"
import {
    View,
    StyleSheet,
    Image,
    Linking,
    TouchableOpacity,
} from "react-native"
import { useRouter } from "expo-router"
import { NContextMenu } from "../replacements/NContextMenu"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../replacements/NText"
import { fonts } from "../../theme"
import { useAuthContext } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { useTranslation } from "react-i18next"
import i18n from "../../i18n"

export const TopNavBar = () => {
    const { t, i18n: i18nInstance } = useTranslation()
    const router = useRouter()
    const { signOut } = useAuthContext()
    const { theme, colorScheme, toggleTheme } = useTheme()
    const currentLang = i18nInstance.language

    const toggleLanguage = () => {
        const next = currentLang === "en" ? "ro" : "en"
        i18n.changeLanguage(next)
    }

    const CONTEXT = [
        {
            key: "profile",
            label: t("tabs.profile"),
            icon: <Ionicons name="person" size={22} color={theme.icon} />,
        },
        {
            key: "history",
            label: t("topNav.chatHistory"),
            icon: <Ionicons name="time-outline" size={18} color={theme.icon} />,
        },
        {
            key: "github",
            label: t("topNav.reportBug"),
            icon: <Ionicons name="bug-outline" size={18} color={theme.icon} />,
        },
        {
            key: "admin",
            label: t("topNav.adminPanel"),
            icon: (
                <Ionicons name="shield-outline" size={18} color={theme.icon} />
            ),
        },
        {
            key: "logout",
            label: t("topNav.logout"),
            icon: (
                <Ionicons name="log-out-outline" size={18} color={theme.icon} />
            ),
            destructive: true,
        },
    ]

    const handleAction = (key: string) => {
        if (key === "profile") {
            router.push("/profile" as any)
            return
        }
        if (key === "history") {
            router.push("/history" as any)
            return
        }
        if (key === "github") {
            const url = "https://github.com/stnsc/auto-service-2/issues"
            Linking.openURL(url)
            return
        }
        if (key === "admin") {
            router.push("/admin/dashboard" as any)
            return
        }
        if (key === "logout") {
            signOut()
            router.replace("/(auth)/login")
            return
        }
        console.log(key)
    }

    return (
        <View style={styles.container}>
            <Image
                source={require("../../assets/autoservice/logo.png")}
                style={styles.logo}
            />
            <NText style={[styles.version, { fontFamily: fonts.light }]}>
                {t("common.closedAlpha")}
            </NText>
            <View style={styles.right}>
                <TouchableOpacity
                    onPress={toggleTheme}
                    style={[
                        styles.themeToggle,
                        { backgroundColor: theme.surfaceMid },
                    ]}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={colorScheme === "dark" ? "sunny" : "moon"}
                        size={16}
                        color={theme.icon}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={toggleLanguage}
                    style={[
                        styles.langToggle,
                        { backgroundColor: theme.surfaceMid },
                    ]}
                    activeOpacity={0.7}
                >
                    <NText
                        style={[
                            styles.langOption,
                            { color: theme.textSubtle },
                            {
                                fontFamily:
                                    currentLang === "en"
                                        ? fonts.bold
                                        : fonts.light,
                            },
                            currentLang === "en" && { color: theme.text },
                        ]}
                    >
                        EN
                    </NText>
                    <NText
                        style={[
                            styles.langSep,
                            {
                                fontFamily: fonts.light,
                                color: theme.textSubtle,
                            },
                        ]}
                    >
                        |
                    </NText>
                    <NText
                        style={[
                            styles.langOption,
                            { color: theme.textSubtle },
                            {
                                fontFamily:
                                    currentLang === "ro"
                                        ? fonts.bold
                                        : fonts.light,
                            },
                            currentLang === "ro" && { color: theme.text },
                        ]}
                    >
                        RO
                    </NText>
                </TouchableOpacity>
                <NContextMenu
                    avatar={
                        <Ionicons name="person" size={22} color={theme.icon} />
                    }
                    onAction={handleAction}
                    actions={CONTEXT}
                />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 20,
    },
    logo: {
        width: 120,
        height: 40,
        resizeMode: "contain",
    },
    version: {
        flex: 1,
        fontSize: 12,
        opacity: 0.5,
        left: 0,
    },
    right: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    themeToggle: {
        padding: 6,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    langToggle: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
    },
    langOption: {
        fontSize: 12,
    },
    langOptionActive: {},
    langSep: {
        fontSize: 11,
    },
})
