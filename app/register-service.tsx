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
import { useTheme } from "../context/ThemeContext"
import { useTranslation } from "react-i18next"
import "../i18n"
import { NButton } from "../components/replacements/NButton"
import LocationPicker from "../components/LocationPicker"
import {
    validators,
    validateForm,
    hasErrors,
    ValidationRule,
} from "../utils/validation"

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
    const { theme } = useTheme()
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
    const [errors, setErrors] = useState<Record<string, string | null>>({})

    // Step 1
    const [serviceName, setServiceName] = useState("")
    const [phone, setPhone] = useState("")
    const [address, setAddress] = useState("")
    const [description, setDescription] = useState("")

    // Step 2
    const [types, setTypes] = useState<string[]>([])
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
                    const active = data.find((a: any) => a.status === "pending")
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

    const handleNext = () => {
        if (step === 1) {
            const rules: Record<string, ValidationRule[]> = {
                serviceName: [validators.required(t("registerService.serviceNamePlaceholder"), t("common.isRequired"))],
                address: [validators.required(t("registerService.addressPlaceholder"), t("common.isRequired"))],
                phone: [validators.required(t("registerService.phonePlaceholder"), t("common.isRequired")), validators.phone(t("validation.invalidPhone"))],
                description: [validators.required(t("registerService.descriptionPlaceholder"), t("common.isRequired"))],
            }
            const newErrors = validateForm({ serviceName, address, phone, description }, rules)
            setErrors(newErrors)
            if (hasErrors(newErrors)) return
        }
        if (step === 2 && types.length === 0) {
            setErrors({ types: t("registerService.serviceTypeRequired") })
            return
        }
        setErrors({})
        setStep((s) => s + 1)
    }

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
                    type: types,
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
            <ActivityIndicator color={theme.accentIcon} />
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
                        color={theme.accentIcon}
                    />
                    <NText
                        style={[
                            styles.successTitle,
                            { fontFamily: fonts.medium, color: theme.text },
                        ]}
                    >
                        {t("registerService.successTitle")}
                    </NText>
                    <NText
                        style={[styles.successSub, { fontFamily: fonts.light, color: theme.textMuted }]}
                    >
                        {t("registerService.successDesc")}
                    </NText>
                    <NButton
                        onPress={() => router.push("/profile" as any)}
                        color={theme.accent}
                        style={styles.backBtn}
                    >
                        <NText
                            style={[
                                styles.backBtnText,
                                { fontFamily: fonts.medium, color: theme.text },
                            ]}
                        >
                            {t("registerService.backToProfile")}
                        </NText>
                    </NButton>
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
                                ? theme.accentIcon
                                : "rgba(245,158,11,0.9)"
                        }
                    />
                    <NText
                        style={[
                            styles.successTitle,
                            { fontFamily: fonts.medium, color: theme.text },
                        ]}
                    >
                        {isApproved
                            ? t("registerService.alreadyApproved")
                            : t("registerService.alreadyPending")}
                    </NText>
                    <NText
                        style={[styles.successSub, { fontFamily: fonts.light, color: theme.textMuted }]}
                    >
                        {existingApp.serviceName}
                    </NText>
                    <NButton
                        onPress={() => router.back()}
                        style={styles.backBtn}
                    >
                        <NText
                            style={[
                                styles.backBtnText,
                                { fontFamily: fonts.medium, color: theme.text },
                            ]}
                        >
                            {t("registerService.backToProfile")}
                        </NText>
                    </NButton>
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
                                s === step && { backgroundColor: theme.accent },
                                s < step && { backgroundColor: theme.accentSubtle },
                            ]}
                        >
                            {s < step ? (
                                <Ionicons
                                    name="checkmark"
                                    size={12}
                                    color={theme.text}
                                />
                            ) : (
                                <NText
                                    style={[
                                        styles.stepDotText,
                                        { fontFamily: fonts.medium, color: theme.textMuted },
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
                                    { backgroundColor: theme.surfaceMid },
                                    s < step && { backgroundColor: theme.accentSubtle },
                                ]}
                            />
                        )}
                    </View>
                ))}
            </View>

            <NText style={[styles.stepTitle, { fontFamily: fonts.medium, color: theme.text }]}>
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
                        onChangeText={(v) => { setServiceName(v); setErrors((e) => ({ ...e, serviceName: null })) }}
                        failed={!!errors.serviceName}
                        failedText={errors.serviceName || ""}
                    />
                    <NInput
                        placeholder={t("registerService.addressPlaceholder")}
                        value={address}
                        onChangeText={(v) => { setAddress(v); setErrors((e) => ({ ...e, address: null })) }}
                        failed={!!errors.address}
                        failedText={errors.address || ""}
                    />
                    <NInput
                        placeholder={t("registerService.phonePlaceholder")}
                        value={phone}
                        onChangeText={(v) => { setPhone(v); setErrors((e) => ({ ...e, phone: null })) }}
                        keyboardType="phone-pad"
                        failed={!!errors.phone}
                        failedText={errors.phone || ""}
                    />
                    <NInput
                        placeholder={t(
                            "registerService.descriptionPlaceholder",
                        )}
                        value={description}
                        onChangeText={(v) => { setDescription(v); setErrors((e) => ({ ...e, description: null })) }}
                        multiline
                        failed={!!errors.description}
                        failedText={errors.description || ""}
                    />
                </View>
            )}

            {/* Step 2: Type & Location */}
            {step === 2 && (
                <View style={styles.formGroup}>
                    <NText
                        style={[styles.fieldLabel, { fontFamily: fonts.light, color: theme.textMuted }]}
                    >
                        {t("registerService.serviceTypeLabel")}
                    </NText>
                    <View style={styles.typeChipRow}>
                        {SERVICE_TYPES.map((st) => {
                            const active = types.includes(st)
                            return (
                                <Pressable
                                    key={st}
                                    onPress={() => {
                                        setErrors((e) => ({ ...e, types: null }))
                                        setTypes((prev) =>
                                            prev.includes(st)
                                                ? prev.filter((t) => t !== st)
                                                : [...prev, st],
                                        )
                                    }}
                                    style={[
                                        styles.typeChip,
                                        { backgroundColor: active ? theme.accent : theme.surfaceMid },
                                    ]}
                                >
                                    <NText
                                        style={[
                                            styles.typeChipText,
                                            { fontFamily: active ? fonts.medium : fonts.regular, color: theme.text },
                                        ]}
                                    >
                                        {t(`settings.types.${st}`)}
                                    </NText>
                                </Pressable>
                            )
                        })}
                    </View>
                    {errors.types ? (
                        <NText style={[styles.errorText, { fontFamily: fonts.light, color: theme.error }]}>
                            {errors.types}
                        </NText>
                    ) : null}

                    <NText
                        style={[
                            styles.fieldLabel,
                            { fontFamily: fonts.light, marginTop: 16, color: theme.textMuted },
                        ]}
                    >
                        {t("registerService.locationLabel")}
                    </NText>
                    <LocationPicker
                        latitude={latitude}
                        longitude={longitude}
                        addressHint={address}
                        onLocationChange={(lat, lon) => {
                            setLatitude(lat.toFixed(6))
                            setLongitude(lon.toFixed(6))
                        }}
                    />
                </View>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
                <View style={styles.reviewCard}>
                    <LinearGradient
                        colors={[
                            theme.borderStart,
                            theme.borderEnd,
                        ]}
                        style={styles.reviewGradient}
                    >
                        <BlurView
                            intensity={20}
                            tint={theme.blurTint}
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
                                    types.length > 0
                                        ? types
                                              .map((ty) =>
                                                  t(
                                                      `settings.types.${ty}` as any,
                                                  ),
                                              )
                                              .join(", ")
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
                <NText style={[styles.errorText, { fontFamily: fonts.light, color: theme.error }]}>
                    {submitError}
                </NText>
            ) : null}

            {/* Navigation buttons */}
            <View style={styles.navRow}>
                {step > 1 && (
                    <NButton
                        onPress={() => { setErrors({}); setStep((s) => s - 1) }}
                        style={[styles.navBtn, styles.navBtnBack]}
                    >
                        <NText
                            style={[
                                styles.navBtnText,
                                { fontFamily: fonts.medium, color: theme.text },
                            ]}
                        >
                            {t("registerService.back")}
                        </NText>
                    </NButton>
                )}

                <NButton
                    onPress={step < 3 ? handleNext : handleSubmit}
                    disabled={submitting}
                    color={theme.accent}
                    style={[styles.navBtn, styles.navBtnNext]}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color={theme.text} />
                    ) : (
                        <NText
                            style={[
                                styles.navBtnText,
                                { fontFamily: fonts.medium, color: theme.text },
                            ]}
                        >
                            {step < 3
                                ? t("registerService.next")
                                : t("registerService.submit")}
                        </NText>
                    )}
                </NButton>
            </View>
        </ScrollView>
    )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
    const { theme } = useTheme()
    return (
        <View style={styles.reviewRow}>
            <NText style={[styles.reviewLabel, { fontFamily: fonts.light, color: theme.textSubtle }]}>
                {label}
            </NText>
            <NText style={[styles.reviewValue, { fontFamily: fonts.regular, color: theme.text }]}>
                {value || "—"}
            </NText>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 24, paddingBottom: 60, paddingTop: 80 },
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
        fontSize: 20,
        textAlign: "center",
    },
    successSub: {
        fontSize: 15,
        textAlign: "center",
    },
    backBtn: {
        marginTop: 16,
        alignSelf: "stretch",
    },
    backBtnText: { fontSize: 15 },
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
        alignItems: "center",
        justifyContent: "center",
    },
    stepDotText: { fontSize: 13 },
    stepLine: {
        width: 40,
        height: 2,
        marginHorizontal: 4,
    },
    stepTitle: {
        fontSize: 18,
        marginBottom: 20,
        textAlign: "center",
    },
    formGroup: { gap: 10 },
    fieldLabel: {
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
    },
    typeChipText: {
        fontSize: 13,
    },
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
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    reviewValue: { fontSize: 14 },
    errorText: {
        fontSize: 13,
        textAlign: "center",
        marginBottom: 8,
    },
    navRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 24,
    },
    navBtn: { flex: 1 },
    navBtnBack: {},
    navBtnNext: {},
    navBtnText: { fontSize: 15 },
})
