import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from "react-native"
import { NButton } from "../components/replacements/NButton"
import { NInput } from "../components/replacements/NInput"
import { NTabBar } from "../components/replacements/NTabBar"
import { NContextMenu } from "../components/replacements/NContextMenu"

import { useState } from "react"
import { Ionicons } from "@expo/vector-icons"

export const ButtonGarden = () => {
    const [count, setCount] = useState(0)
    const [text, setText] = useState("")

    const TABS = [
        {
            key: "home",
            label: "Home",
            icon: <Ionicons name="home" size={22} color="white" />,
        },
        {
            key: "dash",
            label: "Dashboard",
            icon: <Ionicons name="grid" size={22} color="white" />,
        },
        {
            key: "news",
            label: "News",
            icon: <Ionicons name="radio" size={22} color="white" />,
        },
    ]

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
    const [active, setActive] = useState("library")

    return (
        <>
            <ScrollView style={styles.scrollViewContainer}>
                <View style={styles.container}>
                    {/** Custom Button Component */}

                    <Text style={styles.countText}>{count}</Text>

                    <NButton
                        onPress={() => setCount((c) => c + 1)}
                        color="#33333342"
                    >
                        <Text style={styles.buttonText}>Button</Text>
                    </NButton>
                </View>

                <View style={styles.container}>
                    {/** Custom Textbox Component */}

                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={styles.innerContainer}
                    >
                        <NInput
                            placeholder="Type something..."
                            value={text}
                            onChangeText={setText}
                        />

                        <NButton
                            onPress={() => console.log("Submitted:", text)}
                            color="rgba(79, 172, 254, 0.2)" // A subtle blue tint
                        >
                            <View style={{ paddingHorizontal: 20 }}>
                                <Text
                                    style={{
                                        color: "white",
                                        fontWeight: "600",
                                    }}
                                >
                                    Submit
                                </Text>
                            </View>
                        </NButton>
                    </KeyboardAvoidingView>
                </View>

                {/** Custom Tab Component */}

                <View style={styles.container}>
                    <NTabBar
                        tabs={TABS}
                        activeKey={active}
                        onTabPress={setActive}
                    />
                </View>

                {/** Custom Context Menu Component */}

                <View style={styles.container}>
                    <NContextMenu
                        avatar={
                            <Ionicons name="person" size={22} color="white" />
                        }
                        onAction={(key) => console.log(key)}
                        actions={CONTEXT}
                    />
                </View>
            </ScrollView>
        </>
    )
}

const styles = StyleSheet.create({
    background: {
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    scrollViewContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1212125e",
        margin: 20,
        borderRadius: 20,
        padding: 20,
    },
    countText: {
        fontSize: 60,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 40,
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
    },
    innerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 30,
    },
})
