import React from "react"
import { View, Text, StyleSheet, Image } from "react-native"
import { useRouter } from "expo-router"
import { NContextMenu } from "../replacements/NContextMenu"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../replacements/NText"
import { fonts } from "../../theme"
import { useAuthContext } from "../../context/AuthContext"

export const TopNavBar = () => {
    const router = useRouter()
    const { signOut } = useAuthContext()

    const CONTEXT = [
        {
            key: "account",
            label: "Account Details",
            icon: <Ionicons name="book-outline" size={18} color="white" />,
        },
        {
            key: "vehicle",
            label: "Vehicle Configuration",
            icon: <Ionicons name="settings-outline" size={18} color="white" />,
        },
        {
            key: "admin",
            label: "Admin Panel",
            icon: <Ionicons name="shield-outline" size={18} color="white" />,
        },
        {
            key: "language",
            label: "Language",
            icon: <Ionicons name="text-outline" size={18} color="white" />,
        },
        {
            key: "logout",
            label: "Logout",
            icon: <Ionicons name="log-out-outline" size={18} color="white" />,
            destructive: true,
        },
    ]

    const handleAction = (key: string) => {
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
                ALPHA
            </NText>
            <NContextMenu
                avatar={<Ionicons name="person" size={22} color="white" />}
                onAction={handleAction}
                actions={CONTEXT}
            />
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
})
