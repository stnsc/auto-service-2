import React, { version } from "react"
import { View, Text, StyleSheet, Image } from "react-native"
import { NContextMenu } from "../NContextMenu"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../NText"
import { fonts } from "../../theme"

export const TopNavBar = () => {
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
                onAction={(key) => console.log(key)}
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
