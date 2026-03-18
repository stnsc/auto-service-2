import { ImageBackground, StyleSheet } from "react-native"
import React from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { ButtonGarden } from "./pages/ButtonGarden"

export default function App() {
    return (
        <GestureHandlerRootView style={styles.container}>
            <ImageBackground
                source={require("./assets/autoservice/background.jpg")}
                style={styles.background}
            >
                <ButtonGarden />
            </ImageBackground>
        </GestureHandlerRootView>
    )
}

const styles = StyleSheet.create({
    background: {
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        flex: 1,
        backgroundColor: "#121212",
    },
})
