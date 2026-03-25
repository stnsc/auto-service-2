import { StyleSheet, View } from "react-native"
import { NButton } from "../components/NButton"
import { NInput } from "../components/NInput"
import { Ionicons } from "@expo/vector-icons"
import { Suggestions } from "../components/bundle/Suggestions"
import { useState } from "react"
import { NText } from "../components/NText"
import { fonts } from "../theme"

export const MainChat = () => {
    const [user, setUser] = useState("Vlad")
    const [query, setQuery] = useState("")

    return (
        <View style={styles.container}>
            <View style={styles.chatArea}>
                <View>
                    <NText
                        style={[styles.greeting, { fontFamily: fonts.regular }]}
                    >
                        Hello, {user}! {"\n"}
                        How can I help?
                    </NText>
                </View>
                <NInput onChangeText={setQuery} value={query} />
                <View style={styles.inputButton}>
                    <NButton color="rgba(33, 168, 112, 0.51)">
                        <Ionicons name="send" size={22} color="white" />
                    </NButton>
                </View>
            </View>
            <View style={styles.suggestions}>
                <Suggestions query={query} onSelect={setQuery} />
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
