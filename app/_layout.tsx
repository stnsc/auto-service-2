import { Platform, Image, View, StyleSheet } from "react-native"
import { useState } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { Slot, usePathname, useRouter } from "expo-router"
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
    // Font loading
    const [fontsLoaded] = useFonts({
        IosevkaCharon_300Light,
        IosevkaCharon_400Regular,
        IosevkaCharon_500Medium,
        IosevkaCharon_700Bold,
    })

    // Router and pathname hooks for navigation and active tab state
    const router = useRouter()
    const pathname = usePathname()

    const TAB_ROUTES: Record<string, string> = {
        chat: "/",
        appointment: "/appointment",
        shop: "/shop",
        map: "/map",
    }

    const TABS = [
        {
            key: "chat",
            label: "Chat",
            icon: <Ionicons name="chatbubbles" size={22} color="white" />,
        },
        {
            key: "appointment",
            label: "Appointments",
            icon: <Ionicons name="calendar" size={22} color="white" />,
        },
        {
            key: "shop",
            label: "Shop",
            icon: <Ionicons name="cart" size={22} color="white" />,
        },
        {
            key: "map",
            label: "Map",
            icon: <Ionicons name="map" size={22} color="white" />,
        },
    ]

    const activeKey =
        Object.entries(TAB_ROUTES).find(
            ([, route]) => pathname === route,
        )?.[0] ?? "chat"

    const handleTabPress = (key: string) => {
        router.push(TAB_ROUTES[key] as any)
    }

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
                    <Slot />
                    {/* ← this is where index.tsx / other pages render */}
                </View>
                <View style={{ paddingBottom: 20, zIndex: 100 }}>
                    <NTabBar
                        tabs={TABS}
                        activeKey={activeKey}
                        onTabPress={handleTabPress}
                    />
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
