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
import { useTranslation } from "react-i18next"
import i18n from "../../i18n"

export const TopNavBar = () => {
    const { t, i18n: i18nInstance } = useTranslation()
    const router = useRouter()
    const { signOut } = useAuthContext()
    const currentLang = i18nInstance.language

    const toggleLanguage = () => {
        const next = currentLang === "en" ? "ro" : "en"
        i18n.changeLanguage(next)
    }

    const CONTEXT = [
        {
            key: "history",
            label: t("topNav.chatHistory"),
            icon: <Ionicons name="time-outline" size={18} color="white" />,
        },
        {
            key: "github",
            label: t("topNav.reportBug"),
            icon: <Ionicons name="bug-outline" size={18} color="white" />,
        },
        {
            key: "admin",
            label: t("topNav.adminPanel"),
            icon: <Ionicons name="shield-outline" size={18} color="white" />,
        },
        {
            key: "logout",
            label: t("topNav.logout"),
            icon: <Ionicons name="log-out-outline" size={18} color="white" />,
            destructive: true,
        },
    ]

    const handleAction = (key: string) => {
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
                    onPress={toggleLanguage}
                    style={styles.langToggle}
                    activeOpacity={0.7}
                >
                    <NText
                        style={[
                            styles.langOption,
                            {
                                fontFamily:
                                    currentLang === "en"
                                        ? fonts.bold
                                        : fonts.light,
                            },
                            currentLang === "en" && styles.langOptionActive,
                        ]}
                    >
                        EN
                    </NText>
                    <NText
                        style={[styles.langSep, { fontFamily: fonts.light }]}
                    >
                        |
                    </NText>
                    <NText
                        style={[
                            styles.langOption,
                            {
                                fontFamily:
                                    currentLang === "ro"
                                        ? fonts.bold
                                        : fonts.light,
                            },
                            currentLang === "ro" && styles.langOptionActive,
                        ]}
                    >
                        RO
                    </NText>
                </TouchableOpacity>
                <NContextMenu
                    avatar={<Ionicons name="person" size={22} color="white" />}
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
        color: "white",
        fontSize: 12,
        opacity: 0.5,
        left: 0,
    },
    right: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    langToggle: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.08)",
    },
    langOption: {
        color: "rgba(255,255,255,0.45)",
        fontSize: 12,
    },
    langOptionActive: {
        color: "#fff",
    },
    langSep: {
        color: "rgba(255,255,255,0.2)",
        fontSize: 11,
    },
})
