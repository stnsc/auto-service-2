import React, { useState, useEffect } from "react"
import {
    View,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { NText } from "../components/replacements/NText"
import { NInput } from "../components/replacements/NInput"
import { useAuthContext } from "../context/AuthContext"
import { useProfileContext } from "../context/ProfileContext"
import { fonts } from "../theme"
import { useTranslation } from "react-i18next"
import "../i18n"

const SERVICE_TYPES = [
    "mechanic",
    "tire_shop",
    "car_wash",
    "body_shop",
    "oil_change",
    "towing",
]

export default function RegisterServiceScreen() {
    const { t } = useTranslation()
    const { user, userEmail } = useAuthContext()
    const { profile } = useProfileContext()
    const router = useRouter()

    const [step, setStep] = useState(1)
    const [submitting, setSubmitting] = useState(false)
    const [existingApp, setExistingApp] = useState<null | {
        status: string
        serviceName: string
    }>(null)
    const [checkingExisting, setCheckingExisting] = useState(true)
    const [submitError, setSubmitError] = useState("")
    const [submitSuccess, setSubmitSuccess] = useState(false)

    // Step 1
    const [serviceName, setServiceName] = useState("")
    const [phone, setPhone] = useState("")
    const [address, setAddress] = useState("")
    const [description, setDescription] = useState("")

    // Step 2
    const [type, setType] = useState("")
    const [latitude, setLatitude] = useState("")
    const [longitude, setLongitude] = useState("")

    const userId = user?.getUsername() ?? userEmail ?? ""
    const userName = profile
        ? `${profile.firstName} ${profile.lastName}`.trim()
        : ""

    useEffect(() => {
        if (!userId) return
        setCheckingExisting(true)
        fetch(`/api/service-applications?userId=${encodeURIComponent(userId)}`)
            .then((r) => r.json())
            .then((data) => {
                if (Array.isArray(data) && data.length > 0) {
                    const active = data.find(
                        (a: any) => a.status === "pending",
                    )
                    if (active) {
                        setExistingApp({
                            status: active.status,
                            serviceName: active.serviceName,
                        })
                    }
                }
            })
            .catch(() => {})
            .finally(() => setCheckingExisting(false))
    }, [userId])

    const handleSubmit = async () => {
        setSubmitting(true)
        setSubmitError("")
        try {
            const res = await fetch("/api/service-applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    userEmail: userEmail ?? "",
                    userName,
                    serviceName,
                    address,
                    phone,
                    type,
                    latitude: latitude ? parseFloat(latitude) : null,
                    longitude: longitude ? parseFloat(longitude) : null,
                    description,
                }),
            })
            if (res.ok) {
                setSubmitSuccess(true)
            } else {
                const err = await res.json()
                setSubmitError(err.error ?? t("registerService.submitError"))
            }
        } catch {
            setSubmitError(t("registerService.submitError"))
        } finally {
            setSubmitting(false)
        }
    }

    if (checkingExisting) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color="rgba(33,168,112,0.8)" />
            </View>
        )
    }

    if (submitSuccess) {
        return (
            <View style={styles.center}>
                <View style={styles.successBox}>
                    <Ionicons
                        name="checkmark-circle-outline"
                        size={48}
                        color="rgba(33,168,112,0.9)"
                    />
                    <NText
                        style={[
                            styles.successTitle,
                            { fontFamily: fonts.medium },
                        ]}
                    >
                        {t("registerService.successTitle")}
                    </NText>
                    <NText
                        style={[styles.successSub, { fontFamily: fonts.light }]}
                    >
                        {t("registerService.successDesc")}
                    </NText>
                    <Pressable
                        onPress={() => router.push("/profile" as any)}
                        style={styles.backBtn}
                    >
                        <LinearGradient
                            colors={[
                                "rgba(33,168,112,0.4)",
                                "rgba(33,168,112,0.15)",
                            ]}
                            style={styles.backBtnGradient}
                        >
                            <BlurView
                                intensity={20}
                                tint="dark"
                                style={styles.backBtnInner}
                            >
                                <NText
                                    style={[
                                        styles.backBtnText,
                                        { fontFamily: fonts.medium },
                                    ]}
                                >
                                    {t("registerService.backToProfile")}
                                </NText>
                            </BlurView>
                        </LinearGradient>
                    </Pressable>
                </View>
            </View>
        )
    }

    if (existingApp) {
        const isApproved = existingApp.status === "approved"
        return (
            <View style={styles.center}>
                <View style={styles.successBox}>
                    <Ionicons
                        name={
                            isApproved
                                ? "checkmark-circle-outline"
                                : "time-outline"
                        }
                        size={48}
                        color={
                            isApproved
                                ? "rgba(33,168,112,0.9)"
                                : "rgba(245,158,11,0.9)"
                        }
                    />
                    <NText
                        style={[
                            styles.successTitle,
                            { fontFamily: fonts.medium },
                        ]}
                    >
                        {isApproved
                            ? t("registerService.alreadyApproved")
                            : t("registerService.alreadyPending")}
                    </NText>
                    <NText
                        style={[styles.successSub, { fontFamily: fonts.light }]}
                    >
                        {existingApp.serviceName}
                    </NText>
                    <Pressable
                        onPress={() => router.back()}
                        style={styles.backBtn}
                    >
                        <LinearGradient
                            colors={[
                                "rgba(255,255,255,0.15)",
                                "rgba(255,255,255,0.05)",
                            ]}
                            style={styles.backBtnGradient}
                        >
                            <BlurView
                                intensity={20}
                                tint="dark"
                                style={styles.backBtnInner}
                            >
                                <NText
                                    style={[
                                        styles.backBtnText,
                                        { fontFamily: fonts.medium },
                                    ]}
                                >
                                    {t("registerService.backToProfile")}
                                </NText>
                            </BlurView>
                        </LinearGradient>
                    </Pressable>
                </View>
            </View>
        )
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            {/* Step indicator */}
            <View style={styles.stepRow}>
                {[1, 2, 3].map((s) => (
                    <View key={s} style={styles.stepItem}>
                        <View
                            style={[
                                styles.stepDot,
                                s === step && styles.stepDotActive,
                                s < step && styles.stepDotDone,
                            ]}
                        >
                            {s < step ? (
                                <Ionicons
                                    name="checkmark"
                                    size={12}
                                    color="#fff"
                                />
                            ) : (
                                <NText
                                    style={[
                                        styles.stepDotText,
                                        { fontFamily: fonts.medium },
                                    ]}
                                >
                                    {s}
                                </NText>
                            )}
                        </View>
                        {s < 3 && (
                            <View
                                style={[
                                    styles.stepLine,
                                    s < step && styles.stepLineDone,
                                ]}
                            />
                        )}
                    </View>
                ))}
            </View>

            <NText style={[styles.stepTitle, { fontFamily: fonts.medium }]}>
                {step === 1
                    ? t("registerService.step1Title")
                    : step === 2
                      ? t("registerService.step2Title")
                      : t("registerService.step3Title")}
            </NText>

            {/* Step 1: Basic Info */}
            {step === 1 && (
                <View style={styles.formGroup}>
                    <NInput
                        placeholder={t(
                            "registerService.serviceNamePlaceholder",
                        )}
                        value={serviceName}
                        onChangeText={setServiceName}
                    />
                    <NInput
                        placeholder={t("registerService.addressPlaceholder")}
                        value={address}
                        onChangeText={setAddress}
                    />
                    <NInput
                        placeholder={t("registerService.phonePlaceholder")}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />
                    <NInput
                        placeholder={t(
                            "registerService.descriptionPlaceholder",
                        )}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                    />
                </View>
            )}

            {/* Step 2: Type & Location */}
            {step === 2 && (
                <View style={styles.formGroup}>
                    <NText
                        style={[styles.fieldLabel, { fontFamily: fonts.light }]}
                    >
                        {t("registerService.serviceTypeLabel")}
                    </NText>
                    <View style={styles.typeChipRow}>
                        {SERVICE_TYPES.map((st) => (
                            <Pressable
                                key={st}
                                onPress={() => setType(st)}
                                style={[
                                    styles.typeChip,
                                    type === st && styles.typeChipActive,
                                ]}
                            >
                                <NText
                                    style={[
                                        styles.typeChipText,
                                        type === st &&
                                            styles.typeChipTextActive,
                                        {
                                            fontFamily:
                                                type === st
                                                    ? fonts.medium
                                                    : fonts.regular,
                                        },
                                    ]}
                                >
                                    {t(`settings.types.${st}`)}
                                </NText>
                            </Pressable>
                        ))}
                    </View>

                    <NText
                        style={[
                            styles.fieldLabel,
                            { fontFamily: fonts.light, marginTop: 16 },
                        ]}
                    >
                        {t("registerService.locationLabel")}
                    </NText>
                    <View style={styles.coordRow}>
                        <NInput
                            placeholder={t("settings.latitude")}
                            value={latitude}
                            onChangeText={setLatitude}
                            keyboardType="decimal-pad"
                            style={styles.flex1}
                        />
                        <NInput
                            placeholder={t("settings.longitude")}
                            value={longitude}
                            onChangeText={setLongitude}
                            keyboardType="decimal-pad"
                            style={styles.flex1}
                        />
                    </View>
                </View>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
                <View style={styles.reviewCard}>
                    <LinearGradient
                        colors={[
                            "rgba(255,255,255,0.12)",
                            "rgba(255,255,255,0.04)",
                        ]}
                        style={styles.reviewGradient}
                    >
                        <BlurView
                            intensity={20}
                            tint="dark"
                            style={styles.reviewInner}
                        >
                            <ReviewRow
                                label={t("settings.serviceName")}
                                value={serviceName}
                            />
                            <ReviewRow
                                label={t("settings.address")}
                                value={address}
                            />
                            <ReviewRow
                                label={t("settings.phone")}
                                value={phone}
                            />
                            <ReviewRow
                                label={t("settings.type")}
                                value={
                                    type
                                        ? t(`settings.types.${type}` as any)
                                        : "—"
                                }
                            />
                            {latitude || longitude ? (
                                <ReviewRow
                                    label={t("registerService.location")}
                                    value={`${latitude || "?"}, ${longitude || "?"}`}
                                />
                            ) : null}
                            {description ? (
                                <ReviewRow
                                    label={t(
                                        "registerService.descriptionLabel",
                                    )}
                                    value={description}
                                />
                            ) : null}
                        </BlurView>
                    </LinearGradient>
                </View>
            )}

            {submitError ? (
                <NText style={[styles.errorText, { fontFamily: fonts.light }]}>
                    {submitError}
                </NText>
            ) : null}

            {/* Navigation buttons */}
            <View style={styles.navRow}>
                {step > 1 && (
                    <Pressable
                        onPress={() => setStep((s) => s - 1)}
                        style={[styles.navBtn, styles.navBtnBack]}
                    >
                        <LinearGradient
                            colors={[
                                "rgba(255,255,255,0.12)",
                                "rgba(255,255,255,0.04)",
                            ]}
                            style={styles.navBtnGradient}
                        >
                            <BlurView
                                intensity={20}
                                tint="dark"
                                style={styles.navBtnInner}
                            >
                                <NText
                                    style={[
                                        styles.navBtnText,
                                        { fontFamily: fonts.medium },
                                    ]}
                                >
                                    {t("registerService.back")}
                                </NText>
                            </BlurView>
                        </LinearGradient>
                    </Pressable>
                )}

                <Pressable
                    onPress={
                        step < 3 ? () => setStep((s) => s + 1) : handleSubmit
                    }
                    disabled={
                        submitting ||
                        (step === 1 && (!serviceName || !address)) ||
                        (step === 2 && !type)
                    }
                    style={[
                        styles.navBtn,
                        styles.navBtnNext,
                        (submitting ||
                            (step === 1 && (!serviceName || !address)) ||
                            (step === 2 && !type)) && { opacity: 0.45 },
                    ]}
                >
                    <LinearGradient
                        colors={[
                            "rgba(33,168,112,0.5)",
                            "rgba(33,168,112,0.2)",
                        ]}
                        style={styles.navBtnGradient}
                    >
                        <BlurView
                            intensity={20}
                            tint="dark"
                            style={styles.navBtnInner}
                        >
                            {submitting ? (
                                <ActivityIndicator
                                    size="small"
                                    color="#ffffff"
                                />
                            ) : (
                                <NText
                                    style={[
                                        styles.navBtnText,
                                        { fontFamily: fonts.medium },
                                    ]}
                                >
                                    {step < 3
                                        ? t("registerService.next")
                                        : t("registerService.submit")}
                                </NText>
                            )}
                        </BlurView>
                    </LinearGradient>
                </Pressable>
            </View>
        </ScrollView>
    )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.reviewRow}>
            <NText style={[styles.reviewLabel, { fontFamily: fonts.light }]}>
                {label}
            </NText>
            <NText style={[styles.reviewValue, { fontFamily: fonts.regular }]}>
                {value || "—"}
            </NText>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 24, paddingBottom: 60 },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
    },
    successBox: {
        alignItems: "center",
        gap: 12,
        maxWidth: 360,
        width: "100%",
    },
    successTitle: {
        color: "#ffffff",
        fontSize: 20,
        textAlign: "center",
    },
    successSub: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 15,
        textAlign: "center",
    },
    backBtn: {
        marginTop: 16,
        borderRadius: 16,
        overflow: "hidden",
        alignSelf: "stretch",
    },
    backBtnGradient: { padding: 1.5, borderRadius: 16 },
    backBtnInner: {
        borderRadius: 14,
        overflow: "hidden",
        paddingVertical: 14,
        alignItems: "center",
    },
    backBtnText: { color: "#ffffff", fontSize: 15 },
    stepRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 28,
        gap: 0,
    },
    stepItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    stepDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
    stepDotActive: { backgroundColor: "rgba(33,168,112,0.5)" },
    stepDotDone: { backgroundColor: "rgba(33,168,112,0.3)" },
    stepDotText: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
    stepLine: {
        width: 40,
        height: 2,
        backgroundColor: "rgba(255,255,255,0.1)",
        marginHorizontal: 4,
    },
    stepLineDone: { backgroundColor: "rgba(33,168,112,0.4)" },
    stepTitle: {
        color: "#ffffff",
        fontSize: 18,
        marginBottom: 20,
        textAlign: "center",
    },
    formGroup: { gap: 10 },
    fieldLabel: {
        color: "rgba(255,255,255,0.55)",
        fontSize: 13,
        marginBottom: 6,
    },
    typeChipRow: {
        flexDirection: "row",
        gap: 8,
        flexWrap: "wrap",
    },
    typeChip: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    typeChipActive: { backgroundColor: "rgba(33,168,112,0.45)" },
    typeChipText: {
        color: "rgba(255,255,255,0.55)",
        fontSize: 13,
    },
    typeChipTextActive: { color: "#ffffff" },
    coordRow: { flexDirection: "row", gap: 10 },
    flex1: { flex: 1 },
    reviewCard: { borderRadius: 20, overflow: "hidden", marginBottom: 16 },
    reviewGradient: { padding: 1.5, borderRadius: 20 },
    reviewInner: {
        borderRadius: 18,
        overflow: "hidden",
        padding: 16,
        gap: 12,
    },
    reviewRow: { gap: 2 },
    reviewLabel: {
        color: "rgba(255,255,255,0.45)",
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    reviewValue: { color: "#ffffff", fontSize: 14 },
    errorText: {
        color: "rgba(220,80,80,0.9)",
        fontSize: 13,
        textAlign: "center",
        marginBottom: 8,
    },
    navRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 24,
    },
    navBtn: { flex: 1, borderRadius: 16, overflow: "hidden" },
    navBtnBack: {},
    navBtnNext: {},
    navBtnGradient: { padding: 1.5, borderRadius: 16 },
    navBtnInner: {
        borderRadius: 14,
        overflow: "hidden",
        paddingVertical: 14,
        alignItems: "center",
    },
    navBtnText: { color: "#ffffff", fontSize: 15 },
})
