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
import { NTabBar } from "../components/NTabBar"
import { NContextMenu } from "../components/NContextMenu"
import { TopNavBar } from "../components/bundle/TopNavBar"

export const MainChat = () => {
    return (
        <View style={styles.container}>
            <TopNavBar></TopNavBar>

            <View style={styles.chatArea}>
                <NInput></NInput>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "column",
        justifyContent: "space-between",
    },
    chatArea: {
        flex: 1,
        padding: 20,
        height: 200,
    },
})
