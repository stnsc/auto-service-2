import {
    Platform,
    Image,
    View,
    StyleSheet,
    useWindowDimensions,
    Animated,
    Easing,
} from "react-native"
import { useEffect, useRef, useState } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { Slot, usePathname, useRouter, useSegments } from "expo-router"
import Head from "expo-router/head"
import { NTabBar } from "../components/replacements/NTabBar"
import { NButton } from "../components/replacements/NButton"
import { Ionicons } from "@expo/vector-icons"
import { TopNavBar } from "../components/bundle/TopNavBar"
import maplibregl from "maplibre-gl"
import { ChatProvider } from "../context/ChatContext"
import { AppointmentProvider } from "../context/AppointmentContext"
import { AuthProvider, useAuthContext } from "../context/AuthContext"
import { ThemeProvider, useTheme } from "../context/ThemeContext"
import { ProfileProvider } from "../context/ProfileContext"
import { NModal } from "../components/replacements/NModal"
import { NText } from "../components/replacements/NText"
import { useAlphaNotice } from "../hooks/useAlphaNotice"
import { InfoNoticeProvider, useInfoNotice } from "../context/InfoNoticeContext"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"
import { useTranslation } from "react-i18next"
import "../i18n"

import {
    useFonts,
    IosevkaCharon_300Light,
    IosevkaCharon_400Regular,
    IosevkaCharon_500Medium,
    IosevkaCharon_700Bold,
} from "@expo-google-fonts/iosevka-charon"
// eww global values i know, but this is a workaround for a bug that BlurView
// has related to a saturation backdrop filter being applied for no reason when intensity is 0
let intensity = 0

export default function RootLayout() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <InfoNoticeProvider>
                    <AuthGatedLayout />
                </InfoNoticeProvider>
            </AuthProvider>
        </ThemeProvider>
    )
}

function AuthGatedLayout() {
    const { t } = useTranslation()
    const { isAuthenticated, isLoading } = useAuthContext()
    const { theme } = useTheme()
    const segments = useSegments()
    const router = useRouter()
    const welcomeNotice = useAlphaNotice("alpha-welcome")
    const { replay, hasReplay } = useInfoNotice()

    // Auth guard — redirect based on auth state
    useEffect(() => {
        if (isLoading) return

        const inAuthGroup = segments[0] === "(auth)"
        // Let the OAuth callback page handle itself — it only lives briefly
        // while expo-web-browser closes the popup.
        const isOAuthCallback = segments[0] === "oauth-callback"

        if (!isAuthenticated && !inAuthGroup && !isOAuthCallback) {
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
            label: t("tabs.chat"),
            icon: <Ionicons name="chatbubbles" size={22} color={theme.icon} />,
        },
        {
            key: "appointment",
            label: t("tabs.schedule"),
            icon: <Ionicons name="calendar" size={22} color={theme.icon} />,
        },
        {
            key: "shop",
            label: t("tabs.shop"),
            icon: <Ionicons name="cart" size={22} color={theme.icon} />,
        },
        {
            key: "map",
            label: t("tabs.map"),
            icon: <Ionicons name="map" size={22} color={theme.icon} />,
        },
    ]

    const activeKey =
        Object.entries(TAB_ROUTES).find(
            ([, route]) => pathname === route,
        )?.[0] ?? "chat"

    const handleTabPress = (key: string) => {
        router.push(TAB_ROUTES[key] as any)
    }

    const isAdmin =
        pathname.startsWith("/admin") || pathname.startsWith("/master-admin")
    const isAuth = [
        "/login",
        "/signup",
        "/verify",
        "/pending",
        "/forgot-password",
        "/reset-password",
        "/oauth-callback",
    ].includes(pathname)
    const showContainer = !isAdmin
    const showNav = !isAdmin && !isAuth

    activeKey === "chat" ? (intensity = 30) : (intensity = 0)

    const PAGE_TITLES: Record<string, string> = {
        "/": t("pageTitles.chat"),
        "/appointment": t("pageTitles.appointment"),
        "/shop": t("pageTitles.shop"),
        "/map": t("pageTitles.map"),
        "/history": t("pageTitles.history"),
        "/profile": t("pageTitles.profile"),
        "/login": t("pageTitles.login"),
        "/signup": t("pageTitles.signup"),
        "/verify": t("pageTitles.verify"),
        "/pending": t("pageTitles.pending"),
    }
    const pageTitle = `${PAGE_TITLES[pathname] || t("pageTitles.home")} - AutoService Closed Alpha ${process.env.EXPO_PUBLIC_APP_TYPE}`

    const { width: windowWidth } = useWindowDimensions()

    const [hue, setHue] = useState(80)
    const [sat, setSat] = useState(70)

    const fadeAnim = useRef(new Animated.Value(1)).current
    const slideAnim = useRef(new Animated.Value(0)).current

    useEffect(() => {
        fadeAnim.setValue(0)
        slideAnim.setValue(18)
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 220,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 220,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
        ]).start()
    }, [pathname])

    if (!fontsLoaded) return null

    return (
        <ChatProvider>
            <AppointmentProvider>
                <ProfileProvider>
                    <GestureHandlerRootView style={styles.container}>
                        <Head>
                            <title>{pageTitle}</title>
                        </Head>
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
                                <View
                                    style={[
                                        styles.overlay,
                                        { backgroundColor: theme.overlayBg },
                                    ]}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                {showNav && (
                                    <>
                                        <View style={styles.topNav}>
                                            <TopNavBar />
                                        </View>
                                    </>
                                )}

                                <Animated.View
                                    style={{
                                        flex: 1,
                                        opacity: fadeAnim,
                                        transform: [{ translateY: slideAnim }],
                                    }}
                                >
                                    <Slot />
                                </Animated.View>

                                {showNav && (
                                    <View style={styles.bottomNav}>
                                        <NTabBar
                                            tabs={TABS}
                                            activeKey={activeKey}
                                            onTabPress={handleTabPress}
                                        />
                                    </View>
                                )}

                                {showNav && hasReplay && (
                                    <NButton
                                        onPress={replay}
                                        style={styles.infoButton}
                                    >
                                        <Ionicons
                                            name="information-circle-outline"
                                            size={25}
                                            color={theme.icon}
                                        />
                                    </NButton>
                                )}
                            </View>
                        </View>

                        {isAuthenticated && !isAuth && (
                            <NModal
                                visible={welcomeNotice.visible}
                                onDismiss={welcomeNotice.dismiss}
                                title={t("welcome.title")}
                            >
                                <NText style={modalStyles.text}>
                                    {t("welcome.line1")}
                                </NText>
                                <NText style={modalStyles.text}>
                                    {t("welcome.line2")}
                                </NText>
                                <NText style={modalStyles.text}>
                                    {t("welcome.line3")}
                                </NText>
                                <NText style={modalStyles.text}>
                                    {t("welcome.line4")}
                                </NText>
                                <NText style={modalStyles.text}>
                                    {t("welcome.line5")}
                                </NText>
                            </NModal>
                        )}
                        <Analytics />
                        <SpeedInsights />
                    </GestureHandlerRootView>
                </ProfileProvider>
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
    },
    infoButton: {
        position: "absolute",
        bottom: 24,
        left: 16,
        zIndex: 100,
    },
})

const modalStyles = StyleSheet.create({
    text: {
        color: "rgba(255,255,255,0.8)" as string,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 10,
    },
})
