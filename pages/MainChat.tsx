import { StyleSheet, View, Text } from "react-native"
import { NButton } from "../components/NButton"
import { NInput } from "../components/NInput"
import { Ionicons } from "@expo/vector-icons"
import { Suggestions } from "../components/bundle/Suggestions"
import React from "react"
import { NText } from "../components/NText"
import { fonts } from "../theme"

export const MainChat = () => {
    const [user, setUser] = React.useState("Vlad")

    return (
        <View style={styles.container}>
            <View style={styles.chatArea}>
                <View>
                    <NText
                        style={[styles.greeting, { fontFamily: fonts.regular }]}
                    >
                        Hello, {user}! {"\n"}
                        How can I help ya?
                    </NText>
                </View>
                <NInput></NInput>
                <View style={styles.inputButton}>
                    <NButton color="rgba(33, 168, 112, 0.51)">
                        <Ionicons name="send" size={22} color="white" />
                    </NButton>
                </View>
            </View>
            <View style={styles.suggestions}>
                <Suggestions />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "column",
    },
    chatArea: {
        flex: 1,
        padding: 20,
        justifyContent: "flex-end",
    },
    inputButton: {
        alignItems: "flex-end",
        marginTop: -20,
    },
    suggestions: {
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
    },
    greeting: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "100",
        padding: 20,
    },
})
