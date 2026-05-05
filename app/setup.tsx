import { useState } from "react"
import {
    View,
    StyleSheet,
    ScrollView,
    Platform,
    Pressable,
} from "react-native"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import Animated, {
    FadeIn,
    FadeOut,
    SlideInRight,
    SlideOutLeft,
} from "react-native-reanimated"

import { NButton } from "../components/replacements/NButton"
import { NText } from "../components/replacements/NText"
import { NInput } from "../components/replacements/NInput"
import { NModal } from "../components/replacements/NModal"
import {
    VehicleFormContent,
    DEFAULT_VEHICLE_FORM,
} from "../components/bundle/VehicleFormContent"
import { useVinDecoder } from "../hooks/useVinDecoder"
import { useProfileContext } from "../context/ProfileContext"
import { useAuthContext } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import { fonts } from "../theme"
import type { Vehicle } from "./types/UserProfile"
import "../i18n"

function markSetupDone(email: string) {
    if (Platform.OS !== "web") return
    try {
        localStorage.setItem(`setup_done_${email}`, "1")
    } catch {}
}

// ─── Step 0: Splash ──────────────────────────────────────────────────────────

function SplashStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
    const { t } = useTranslation()
    const { theme } = useTheme()

    return (
        <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
                <Ionicons name="person-add" size={72} color={theme.accentIcon} />
            </View>

            <NText style={styles.stepTitle}>{t("setup.splashTitle")}</NText>
            <NText style={[styles.stepBody, { color: theme.textMuted }]}>
                {t("setup.splashBody")}
            </NText>

            <View style={styles.navRow}>
                <NButton
                    style={styles.navBtnFull}
                    color={theme.accent}
                    onPress={onNext}
                >
                    <NText style={styles.navBtnText}>{t("setup.letsGo")}</NText>
                </NButton>
            </View>

            <Pressable style={styles.skipBtn} onPress={onSkip}>
                <NText style={[styles.skipText, { color: theme.textSubtle }]}>
                    {t("setup.skipAll")}
                </NText>
            </Pressable>
        </View>
    )
}

// ─── Step 1: Personal Info ────────────────────────────────────────────────────

function PersonalInfoStep({
    onNext,
    onSkip,
}: {
    onNext: (firstName: string, lastName: string, phone: string) => void
    onSkip: () => void
}) {
    const { t } = useTranslation()
    const { theme } = useTheme()
    const { profile } = useProfileContext()

    const [firstName, setFirstName] = useState(profile?.firstName ?? "")
    const [lastName, setLastName] = useState(profile?.lastName ?? "")
    const [phone, setPhone] = useState(profile?.phoneNumber ?? "")
    const [errors, setErrors] = useState<{
        firstName?: string
        lastName?: string
        phone?: string
    }>({})

    const validate = () => {
        const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/
        const errs: typeof errors = {}
        if (
            firstName.trim() &&
            (firstName.trim().length < 2 || !nameRegex.test(firstName.trim()))
        )
            errs.firstName = t("validation.invalidName")
        if (
            lastName.trim() &&
            (lastName.trim().length < 2 || !nameRegex.test(lastName.trim()))
        )
            errs.lastName = t("validation.invalidName")
        if (phone.trim() && !/^[+\d\s\-(). ]{7,}$/.test(phone.trim()))
            errs.phone = t("validation.invalidPhone")
        return errs
    }

    const handleNext = () => {
        const errs = validate()
        if (Object.keys(errs).length > 0) {
            setErrors(errs)
            return
        }
        onNext(firstName.trim(), lastName.trim(), phone.trim())
    }

    return (
        <ScrollView
            style={styles.scrollStep}
            contentContainerStyle={styles.scrollStepContent}
            showsVerticalScrollIndicator={false}
        >
            <View
                style={[
                    styles.iconCircle,
                    { backgroundColor: theme.accentSubtle },
                ]}
            >
                <Ionicons name="id-card" size={72} color={theme.accentIcon} />
            </View>

            <NText style={styles.stepTitle}>{t("setup.infoTitle")}</NText>
            <NText style={[styles.stepBody, { color: theme.textMuted }]}>
                {t("setup.infoBody")}
            </NText>

            <View style={{ width: "100%", gap: 0 }}>
                <View style={styles.twoCol}>
                    <NInput
                        placeholder={t("profile.firstName")}
                        value={firstName}
                        onChangeText={(v) => {
                            setFirstName(v)
                            setErrors((e) => ({ ...e, firstName: undefined }))
                        }}
                        containerStyle={styles.flex1}
                        failed={!!errors.firstName}
                        failedText={errors.firstName}
                    />
                    <NInput
                        placeholder={t("profile.lastName")}
                        value={lastName}
                        onChangeText={(v) => {
                            setLastName(v)
                            setErrors((e) => ({ ...e, lastName: undefined }))
                        }}
                        containerStyle={styles.flex1}
                        failed={!!errors.lastName}
                        failedText={errors.lastName}
                    />
                </View>
                <NInput
                    placeholder={t("profile.phoneNumber")}
                    value={phone}
                    onChangeText={(v) => {
                        setPhone(v)
                        setErrors((e) => ({ ...e, phone: undefined }))
                    }}
                    keyboardType="phone-pad"
                    failed={!!errors.phone}
                    failedText={errors.phone}
                />
            </View>

            <View style={styles.navRow}>
                <NButton
                    style={styles.navBtnFull}
                    color={theme.accent}
                    onPress={handleNext}
                >
                    <NText style={styles.navBtnText}>{t("setup.next")}</NText>
                </NButton>
            </View>

            <Pressable style={styles.skipBtn} onPress={onSkip}>
                <NText style={[styles.skipText, { color: theme.textSubtle }]}>
                    {t("setup.skipStep")}
                </NText>
            </Pressable>
        </ScrollView>
    )
}

// ─── Step 2: Vehicle ──────────────────────────────────────────────────────────

function VehicleStep({
    onFinish,
    onSkip,
}: {
    onFinish: (vehicle: Omit<Vehicle, "id"> | null) => void
    onSkip: () => void
}) {
    const { t } = useTranslation()
    const { theme } = useTheme()

    const [modalVisible, setModalVisible] = useState(false)
    const [vehicleForm, setVehicleForm] =
        useState<Omit<Vehicle, "id">>(DEFAULT_VEHICLE_FORM)
    const [savedVehicle, setSavedVehicle] = useState<Omit<
        Vehicle,
        "id"
    > | null>(null)
    const { vinLoading, handleVinChange } = useVinDecoder(setVehicleForm)

    const updateVehicleField = <K extends keyof Omit<Vehicle, "id">>(
        key: K,
        value: Omit<Vehicle, "id">[K],
    ) => setVehicleForm((prev) => ({ ...prev, [key]: value }))

    const handleSaveVehicle = () => {
        const v = { ...vehicleForm, isPrimary: true }
        setSavedVehicle(v)
        setModalVisible(false)
    }

    const vehicleLabel = savedVehicle
        ? savedVehicle.nickname ||
          [savedVehicle.year, savedVehicle.make, savedVehicle.model]
              .filter(Boolean)
              .join(" ") ||
          t("setup.vehicleAdded")
        : null

    return (
        <View style={styles.stepContainer}>
            <View
                style={[
                    styles.iconCircle,
                    { backgroundColor: theme.accentSubtle },
                ]}
            >
                <Ionicons
                    name="car-sport"
                    size={72}
                    color={theme.accentIcon}
                />
            </View>

            <NText style={styles.stepTitle}>{t("setup.vehicleTitle")}</NText>
            <NText style={[styles.stepBody, { color: theme.textMuted }]}>
                {t("setup.vehicleBody")}
            </NText>

            {savedVehicle ? (
                <Animated.View
                    entering={FadeIn.duration(200)}
                    style={[
                        styles.vehicleChip,
                        { backgroundColor: theme.accentSubtle },
                    ]}
                >
                    <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={theme.accentSolid}
                    />
                    <NText
                        style={[
                            styles.vehicleChipText,
                            {
                                color: theme.accentSolid,
                                fontFamily: fonts.medium,
                            },
                        ]}
                    >
                        {vehicleLabel}
                    </NText>
                    <Pressable
                        onPress={() => {
                            setSavedVehicle(null)
                            setVehicleForm(DEFAULT_VEHICLE_FORM)
                        }}
                        hitSlop={8}
                    >
                        <Ionicons
                            name="close-circle"
                            size={18}
                            color={theme.accentSolid}
                        />
                    </Pressable>
                </Animated.View>
            ) : (
                <NButton
                    color={theme.accentSubtle}
                    style={styles.addVehicleBtn}
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons
                        name="add-circle-outline"
                        size={18}
                        color={theme.accentSolid}
                    />
                    <NText
                        style={[
                            styles.addVehicleBtnText,
                            {
                                color: theme.accentSolid,
                                fontFamily: fonts.medium,
                            },
                        ]}
                    >
                        {t("setup.addVehicle")}
                    </NText>
                </NButton>
            )}

            <View style={styles.navRow}>
                <NButton
                    style={styles.navBtnFull}
                    color={theme.accent}
                    onPress={() => onFinish(savedVehicle)}
                >
                    <NText style={styles.navBtnText}>
                        {t("setup.finish")}
                    </NText>
                </NButton>
            </View>

            <Pressable style={styles.skipBtn} onPress={onSkip}>
                <NText style={[styles.skipText, { color: theme.textSubtle }]}>
                    {t("setup.skipStep")}
                </NText>
            </Pressable>

            <NModal
                visible={modalVisible}
                onDismiss={() => setModalVisible(false)}
                title={t("profile.vehicleForm.add")}
                dismissLabel={t("profile.cancel")}
                confirmLabel={t("profile.vehicleForm.save")}
                onConfirm={handleSaveVehicle}
            >
                <VehicleFormContent
                    vehicleForm={vehicleForm}
                    updateVehicleField={updateVehicleField}
                    handleVinChange={handleVinChange}
                    vinLoading={vinLoading}
                />
            </NModal>
        </View>
    )
}

// ─── Root Setup Screen ────────────────────────────────────────────────────────

export default function SetupScreen() {
    const { t } = useTranslation()
    const { theme } = useTheme()
    const router = useRouter()
    const { userEmail } = useAuthContext()
    const { saveProfile, addVehicle } = useProfileContext()

    const [step, setStep] = useState(0)
    const TOTAL_STEPS = 3

    const finish = () => {
        if (userEmail) markSetupDone(userEmail)
        router.replace("/")
    }

    const handleSplashNext = () => setStep(1)

    const handleInfoNext = async (
        firstName: string,
        lastName: string,
        phone: string,
    ) => {
        if (firstName || lastName || phone) {
            await saveProfile({
                firstName,
                lastName,
                phoneNumber: phone,
            })
        }
        setStep(2)
    }

    const handleVehicleFinish = async (vehicle: Omit<Vehicle, "id"> | null) => {
        if (vehicle) {
            await addVehicle({ ...vehicle, isPrimary: true })
        }
        finish()
    }

    return (
        <View style={styles.root}>
            {/* Progress dots */}
            {step > 0 && (
                <View style={styles.dotsRow}>
                    {[1, 2].map((i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor:
                                        i <= step
                                            ? theme.accentSolid
                                            : theme.surfaceHigh,
                                    width: i === step ? 20 : 8,
                                },
                            ]}
                        />
                    ))}
                </View>
            )}

            <Animated.View
                key={step}
                entering={step === 0 ? FadeIn.duration(300) : SlideInRight.duration(250)}
                exiting={SlideOutLeft.duration(200)}
                style={styles.slideWrapper}
            >
                {step === 0 && (
                    <SplashStep onNext={handleSplashNext} onSkip={finish} />
                )}
                {step === 1 && (
                    <PersonalInfoStep
                        onNext={handleInfoNext}
                        onSkip={() => setStep(2)}
                    />
                )}
                {step === 2 && (
                    <VehicleStep
                        onFinish={handleVehicleFinish}
                        onSkip={finish}
                    />
                )}
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    dotsRow: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
        marginBottom: 16,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    slideWrapper: {
        flex: 1,
        width: "100%",
        alignItems: "center",
    },
    stepContainer: {
        flex: 1,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 16,
    },
    scrollStep: {
        flex: 1,
        width: "100%",
    },
    scrollStepContent: {
        alignItems: "center",
        paddingBottom: 32,
        paddingTop: 24,
    },
    iconCircle: {
        width: 148,
        height: 148,
        borderRadius: 74,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 28,
    },
    stepTitle: {
        fontSize: 22,
        fontFamily: fonts.bold,
        textAlign: "center",
        marginBottom: 12,
    },
    stepBody: {
        fontSize: 15,
        fontFamily: fonts.regular,
        textAlign: "center",
        lineHeight: 24,
        maxWidth: 340,
        marginBottom: 28,
    },
    twoCol: {
        flexDirection: "row",
        gap: 8,
        width: "100%",
    },
    flex1: {
        flex: 1,
    },
    navRow: {
        width: "100%",
        marginTop: 8,
    },
    navBtnFull: {
        width: "100%",
    },
    navBtnText: {
        fontSize: 15,
        fontFamily: fonts.medium,
        textAlign: "center",
    },
    skipBtn: {
        marginTop: 16,
        padding: 8,
    },
    skipText: {
        fontSize: 14,
        fontFamily: fonts.regular,
    },
    vehicleChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginBottom: 8,
        maxWidth: 320,
        width: "100%",
        justifyContent: "space-between",
    },
    vehicleChipText: {
        fontSize: 14,
        flex: 1,
    },
    addVehicleBtn: {
        flexDirection: "row",
        gap: 8,
        justifyContent: "center",
        width: "100%",
        marginBottom: 8,
    },
    addVehicleBtnText: {
        fontSize: 15,
    },
})
