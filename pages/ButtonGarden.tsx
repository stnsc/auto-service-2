import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from "react-native"
import { NButton } from "../components/NButton"
import { NInput } from "../components/NInput"
import { useState } from "react"

export const ButtonGarden = () => {
    const [count, setCount] = useState(0)
    const [text, setText] = useState("")

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
        width: "100%",
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
