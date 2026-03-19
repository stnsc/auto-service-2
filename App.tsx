import { Platform, Image, View, StyleSheet } from "react-native"
import { useState } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { MainChat } from "./pages/MainChat"
import { NTabBar } from "./components/NTabBar"
import { Ionicons } from "@expo/vector-icons"

export default function App() {
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

    const [hue, setHue] = useState(80) //hue color rotation in degrees
    const [sat, setSat] = useState(70) //saturation percentage

    return (
        <GestureHandlerRootView style={styles.container}>
            <Image
                source={require("./assets/autoservice/background.jpg")}
                style={[
                    styles.image,
                    Platform.select({
                        web: {
                            //this is a workaround for web, as CSS filters are not supported in React Native Web
                            filter: `hue-rotate(${hue}deg) saturate(${sat}%) blur(2px)`,
                        } as any,
                    }),
                ]}
                resizeMode="cover"
            />

            <View style={styles.overlay} />

            {/** App Wrapper */}
            <View style={{ ...StyleSheet.absoluteFillObject }}>
                <MainChat />
                <NTabBar tabs={TABS} activeKey={"home"} />
            </View>
        </GestureHandlerRootView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    image: {
        ...StyleSheet.absoluteFillObject,
        width: "100%",
        height: "100%",
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.4)",
    },
})
