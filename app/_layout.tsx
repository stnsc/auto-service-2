import { Platform, Image, View, StyleSheet } from "react-native"
import { useState } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { Slot } from "expo-router"
import { NTabBar } from "../components/NTabBar"
import { Ionicons } from "@expo/vector-icons"
import { TopNavBar } from "../components/bundle/TopNavBar"

import {
    useFonts,
    IosevkaCharon_300Light,
    IosevkaCharon_400Regular,
    IosevkaCharon_500Medium,
    IosevkaCharon_700Bold,
} from "@expo-google-fonts/iosevka-charon"
import { BlurView } from "expo-blur"

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        IosevkaCharon_300Light,
        IosevkaCharon_400Regular,
        IosevkaCharon_500Medium,
        IosevkaCharon_700Bold,
    })

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

    const [hue, setHue] = useState(80)
    const [sat, setSat] = useState(70)

    // You can keep this early return, or swap it for a loading screen
    if (!fontsLoaded) return null

    return (
        <GestureHandlerRootView style={styles.container}>
            <Image
                source={require("../assets/autoservice/background.jpg")}
                style={[
                    styles.image,
                    Platform.select({
                        web: {
                            filter: `hue-rotate(${hue}deg) saturate(${sat}%) blur(2px)`,
                        } as any,
                    }),
                ]}
                resizeMode="cover"
            />

            <View style={styles.overlay} />

            <View style={{ flex: 1 }}>
                <BlurView style={styles.topNav} intensity={30} tint="dark">
                    <TopNavBar />
                </BlurView>
                <View style={{ flex: 1 }}>
                    <Slot />{" "}
                    {/* ← this is where index.tsx / other pages render */}
                </View>
                <View style={{ paddingBottom: 20, zIndex: 100 }}>
                    <NTabBar tabs={TABS} activeKey={"home"} />
                </View>
            </View>
        </GestureHandlerRootView>
    )
}

const styles = StyleSheet.create({
    topNav: {
        width: "100%",
        zIndex: 100,
        position: "absolute",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.1)",
    },
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
