import { useRef, useState } from "react"
import {
    View,
    Image,
    StyleSheet,
    Pressable,
    Animated,
    Easing,
    Platform,
} from "react-native"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { NButton } from "../components/replacements/NButton"
import { NText } from "../components/replacements/NText"
import { useTheme } from "../context/ThemeContext"
import { fonts } from "../theme"
import { useTranslation } from "react-i18next"
import "../i18n"

function markOnboardingSeen() {
    if (Platform.OS !== "web") return
    try {
        localStorage.setItem("onboarding_seen", "1")
    } catch {}
}

type SlideIcon =
    | { kind: "image"; source: ReturnType<typeof require> }
    | { kind: "icon"; name: React.ComponentProps<typeof Ionicons>["name"] }

interface Slide {
    icon: SlideIcon
    titleKey: string
    bodyKey: string
}

const SLIDES: Slide[] = [
    {
        icon: { kind: "image", source: require("../assets/autoservice/logo.png") },
        titleKey: "onboarding.slide1Title",
        bodyKey: "onboarding.slide1Body",
    },
    {
        icon: { kind: "icon", name: "chatbubbles" },
        titleKey: "onboarding.slide2Title",
        bodyKey: "onboarding.slide2Body",
    },
    {
        icon: { kind: "icon", name: "calendar-sharp" },
        titleKey: "onboarding.slide3Title",
        bodyKey: "onboarding.slide3Body",
    },
    {
        icon: { kind: "icon", name: "construct" },
        titleKey: "onboarding.slide4Title",
        bodyKey: "onboarding.slide4Body",
    },
]

export default function OnboardingScreen() {
    const { t } = useTranslation()
    const { theme } = useTheme()
    const router = useRouter()

    const [step, setStep] = useState(0)
    const fadeAnim = useRef(new Animated.Value(1)).current
    const slideAnim = useRef(new Animated.Value(0)).current

    const total = SLIDES.length
    const isLast = step === total - 1

    const animateTransition = (nextStep: number) => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 140,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: nextStep > step ? -20 : 20,
                duration: 140,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
            }),
        ]).start(() => {
            setStep(nextStep)
            slideAnim.setValue(nextStep > step ? 20 : -20)
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 200,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
            ]).start()
        })
    }

    const handleNext = () => {
        if (isLast) {
            markOnboardingSeen()
            router.replace("/(auth)/login")
        } else {
            animateTransition(step + 1)
        }
    }

    const handleBack = () => {
        if (step > 0) animateTransition(step - 1)
    }

    const handleSkip = () => {
        markOnboardingSeen()
        router.replace("/(auth)/login")
    }

    const slide = SLIDES[step]

    return (
        <View style={styles.container}>
            {/* Skip button */}
            {!isLast && (
                <Pressable style={styles.skipBtn} onPress={handleSkip}>
                    <NText style={[styles.skipText, { color: theme.textMuted }]}>
                        {t("onboarding.skip")}
                    </NText>
                </Pressable>
            )}

            {/* Animated content */}
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                {/* Image / Icon area */}
                <View style={styles.imageWrapper}>
                    {slide.icon.kind === "image" ? (
                        <Image
                            source={slide.icon.source}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    ) : (
                        <View
                            style={[
                                styles.iconCircle,
                                { backgroundColor: theme.accentSubtle },
                            ]}
                        >
                            <Ionicons
                                name={slide.icon.name}
                                size={72}
                                color={theme.accentIcon}
                            />
                        </View>
                    )}
                </View>

                {/* Text */}
                <NText style={styles.title}>{t(slide.titleKey)}</NText>
                <NText style={[styles.body, { color: theme.textMuted }]}>
                    {t(slide.bodyKey)}
                </NText>
            </Animated.View>

            {/* Dot indicators */}
            <View style={styles.dots}>
                {SLIDES.map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            {
                                backgroundColor:
                                    i === step
                                        ? theme.accentSolid
                                        : theme.surfaceHigh,
                                width: i === step ? 20 : 8,
                            },
                        ]}
                    />
                ))}
            </View>

            {/* Navigation buttons */}
            <View style={styles.navRow}>
                {step > 0 ? (
                    <NButton
                        style={styles.navBtn}
                        color="rgba(255,255,255,0.1)"
                        onPress={handleBack}
                    >
                        <NText style={styles.navBtnText}>
                            {t("onboarding.back")}
                        </NText>
                    </NButton>
                ) : (
                    <View style={styles.navBtn} />
                )}

                <NButton
                    style={styles.navBtn}
                    color={theme.accent}
                    onPress={handleNext}
                >
                    <NText style={styles.navBtnText}>
                        {isLast
                            ? t("onboarding.getStarted")
                            : t("onboarding.next")}
                    </NText>
                </NButton>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 28,
        paddingVertical: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    skipBtn: {
        position: "absolute",
        top: 24,
        right: 24,
        zIndex: 10,
        padding: 8,
    },
    skipText: {
        fontSize: 14,
        fontFamily: fonts.regular,
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        paddingHorizontal: 8,
    },
    imageWrapper: {
        marginBottom: 36,
        alignItems: "center",
    },
    logoImage: {
        width: 140,
        height: 140,
    },
    iconCircle: {
        width: 148,
        height: 148,
        borderRadius: 74,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 24,
        fontFamily: fonts.bold,
        textAlign: "center",
        marginBottom: 16,
        lineHeight: 32,
    },
    body: {
        fontSize: 15,
        fontFamily: fonts.regular,
        textAlign: "center",
        lineHeight: 24,
        maxWidth: 340,
    },
    dots: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
        marginBottom: 28,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    navRow: {
        flexDirection: "row",
        gap: 12,
        width: "100%",
        justifyContent: "space-between",
    },
    navBtn: {
        flex: 1,
    },
    navBtnText: {
        fontSize: 15,
        fontFamily: fonts.medium,
        textAlign: "center",
    },
})
