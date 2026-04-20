import {
    Platform,
    Image,
    View,
    StyleSheet,
    useWindowDimensions,
} from "react-native"
import { useEffect, useState } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { Slot, usePathname, useRouter, useSegments } from "expo-router"
import { NTabBar } from "../components/replacements/NTabBar"
import { Ionicons } from "@expo/vector-icons"
import { TopNavBar } from "../components/bundle/TopNavBar"
import maplibregl from "maplibre-gl"
import { ChatProvider } from "../context/ChatContext"
import { AppointmentProvider } from "../context/AppointmentContext"
import { AuthProvider, useAuthContext } from "../context/AuthContext"

import {
    useFonts,
    IosevkaCharon_300Light,
    IosevkaCharon_400Regular,
    IosevkaCharon_500Medium,
    IosevkaCharon_700Bold,
} from "@expo-google-fonts/iosevka-charon"
import { BlurView } from "expo-blur"

// eww global values i know, but this is a workaround for a bug that BlurView
// has related to a saturation backdrop filter being applied for no reason when intensity is 0
let intensity = 0

export default function RootLayout() {
    return (
        <AuthProvider>
            <AuthGatedLayout />
        </AuthProvider>
    )
}

function AuthGatedLayout() {
    const { isAuthenticated, isLoading } = useAuthContext()
    const segments = useSegments()
    const router = useRouter()

    // Auth guard — redirect based on auth state
    useEffect(() => {
        if (isLoading) return

        const inAuthGroup = segments[0] === "(auth)"

        if (!isAuthenticated && !inAuthGroup) {
            router.replace("/(auth)/login")
        } else if (isAuthenticated && inAuthGroup) {
            router.replace("/")
        }
    }, [isAuthenticated, isLoading, segments])

    useEffect(() => {
        maplibregl.prewarm()
    }, [])

    // Font loading
    const [fontsLoaded] = useFonts({
        IosevkaCharon_300Light,
        IosevkaCharon_400Regular,
        IosevkaCharon_500Medium,
        IosevkaCharon_700Bold,
    })

    // Pathname hook for active tab state
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
            label: "Schedule",
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

    const isAdmin = pathname.startsWith("/admin")
    const isAuth = ["/login", "/signup", "/verify", "/pending"].includes(
        pathname,
    )
    const showContainer = !isAdmin
    const showNav = !isAdmin && !isAuth

    activeKey === "chat" ? (intensity = 30) : (intensity = 0)

    const { width: windowWidth } = useWindowDimensions()

    const [hue, setHue] = useState(80)
    const [sat, setSat] = useState(70)

    if (!fontsLoaded) return null

    return (
        <ChatProvider>
            <AppointmentProvider>
                <GestureHandlerRootView style={styles.container}>
                    <View
                        style={[
                            styles.appFrame,
                            showContainer && styles.customerShell,
                            showContainer &&
                                windowWidth > 600 &&
                                styles.customerShellDesktop,
                        ]}
                    >
                        {/* Background layer — clipped separately so overflow:hidden
                             doesn't break backdrop-filter on content BlurViews */}
                        <View
                            style={[
                                styles.bgLayer,
                                showContainer &&
                                    windowWidth > 600 &&
                                    styles.bgLayerRounded,
                            ]}
                        >
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
                        </View>

                        <View style={{ flex: 1 }}>
                            {showNav && (
                                <>
                                    {intensity > 0 ? (
                                        <BlurView
                                            style={[
                                                styles.topNav,
                                                windowWidth > 600 && {
                                                    borderRadius: 20,
                                                },
                                            ]}
                                            intensity={intensity}
                                            tint="dark"
                                        >
                                            <TopNavBar />
                                        </BlurView>
                                    ) : (
                                        <View style={styles.topNav}>
                                            <TopNavBar />
                                        </View>
                                    )}
                                </>
                            )}

                            <View style={{ flex: 1 }}>
                                <Slot />
                            </View>

                            {showNav && (
                                <View style={styles.bottomNav}>
                                    <NTabBar
                                        tabs={TABS}
                                        activeKey={activeKey}
                                        onTabPress={handleTabPress}
                                    />
                                </View>
                            )}
                        </View>
                    </View>
                </GestureHandlerRootView>
            </AppointmentProvider>
        </ChatProvider>
    )
}

const styles = StyleSheet.create({
    topNav: {
        width: "100%",
        zIndex: 100,
        position: "absolute",
    },
    bottomNav: {
        position: "absolute",
        paddingBottom: 20,
        zIndex: 100,
        bottom: 0,
        width: "100%",
    },
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    appFrame: {
        flex: 1,
    },
    customerShell: {
        maxWidth: 600,
        width: "100%",
        alignSelf: "center",
    },
    customerShellDesktop: {
        marginVertical: 16,
        borderRadius: 20,
    },
    bgLayer: {
        ...StyleSheet.absoluteFillObject,
    },
    bgLayerRounded: {
        borderRadius: 20,
        overflow: "hidden",
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
