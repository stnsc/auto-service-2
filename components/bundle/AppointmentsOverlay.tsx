import React, { useEffect, useRef, useState, useCallback } from "react"
import {
    View,
    StyleSheet,
    Animated,
    Easing,
    Pressable,
    ScrollView,
    ActivityIndicator,
    Linking,
} from "react-native"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useTranslation } from "react-i18next"
import { useTheme } from "../../context/ThemeContext"
import { NText } from "../replacements/NText"
import { NInput } from "../replacements/NInput"
import { NButton } from "../replacements/NButton"
import { fonts } from "../../theme"
import type { Appointment } from "../../app/api/appointments+api"
import "../../i18n"

const STATUS_COLORS: Record<string, string> = {
    pending: "rgba(245,158,11,0.85)",
    confirmed: "rgba(59,130,246,0.85)",
    completed: "rgba(33,168,112,0.85)",
    cancelled: "rgba(150,150,150,0.7)",
}

export type AppointmentOverlayState = "menu" | "panel" | null

interface Props {
    state: AppointmentOverlayState
    onClose: () => void
    onMakeAppointment: () => void
    onShowPanel: () => void
    userEmail?: string | null
}

export function AppointmentsOverlay({
    state,
    onClose,
    onMakeAppointment,
    onShowPanel,
    userEmail,
}: Props) {
    const { t } = useTranslation()
    const { theme } = useTheme()

    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(false)
    const [cancellingId, setCancellingId] = useState<string | null>(null)
    const [cancelReason, setCancelReason] = useState("")
    const [cancelling, setCancelling] = useState(false)

    const backdropOpacity = useRef(new Animated.Value(0)).current
    const menuOpacity = useRef(new Animated.Value(0)).current
    const menuY = useRef(new Animated.Value(24)).current
    const panelOpacity = useRef(new Animated.Value(0)).current
    const panelY = useRef(new Animated.Value(40)).current

    // Animate backdrop
    useEffect(() => {
        Animated.timing(backdropOpacity, {
            toValue: state !== null ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start()
    }, [state])

    // Animate menu pill
    useEffect(() => {
        const show = state === "menu"
        Animated.parallel([
            Animated.timing(menuOpacity, {
                toValue: show ? 1 : 0,
                duration: show ? 220 : 150,
                useNativeDriver: true,
            }),
            Animated.timing(menuY, {
                toValue: show ? 0 : 24,
                duration: show ? 220 : 150,
                easing: show
                    ? Easing.out(Easing.quad)
                    : Easing.in(Easing.quad),
                useNativeDriver: true,
            }),
        ]).start()
    }, [state])

    // Animate appointments panel
    useEffect(() => {
        const show = state === "panel"
        Animated.parallel([
            Animated.timing(panelOpacity, {
                toValue: show ? 1 : 0,
                duration: show ? 250 : 180,
                useNativeDriver: true,
            }),
            Animated.timing(panelY, {
                toValue: show ? 0 : 40,
                duration: show ? 250 : 180,
                easing: show
                    ? Easing.out(Easing.cubic)
                    : Easing.in(Easing.quad),
                useNativeDriver: true,
            }),
        ]).start()
    }, [state])

    // Fetch appointments whenever the panel opens
    useEffect(() => {
        if (state === "panel" && userEmail) {
            setLoading(true)
            fetch(
                `/api/appointments?customerEmail=${encodeURIComponent(userEmail)}`,
            )
                .then((r) => r.json())
                .then((data) =>
                    setAppointments(Array.isArray(data) ? data : []),
                )
                .catch(() => setAppointments([]))
                .finally(() => setLoading(false))
        }
    }, [state, userEmail])

    // Animated close — fades everything out then calls onClose
    const handleClose = useCallback(() => {
        Animated.parallel([
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 160,
                useNativeDriver: true,
            }),
            Animated.timing(menuOpacity, {
                toValue: 0,
                duration: 140,
                useNativeDriver: true,
            }),
            Animated.timing(menuY, {
                toValue: 24,
                duration: 140,
                useNativeDriver: true,
            }),
            Animated.timing(panelOpacity, {
                toValue: 0,
                duration: 160,
                useNativeDriver: true,
            }),
            Animated.timing(panelY, {
                toValue: 40,
                duration: 160,
                useNativeDriver: true,
            }),
        ]).start(() => onClose())
    }, [onClose])

    // Animated navigate to make-appointment screen
    const handleMakeAppointment = useCallback(() => {
        Animated.parallel([
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 140,
                useNativeDriver: true,
            }),
            Animated.timing(menuOpacity, {
                toValue: 0,
                duration: 120,
                useNativeDriver: true,
            }),
            Animated.timing(menuY, {
                toValue: 24,
                duration: 120,
                useNativeDriver: true,
            }),
        ]).start(() => onMakeAppointment())
    }, [onMakeAppointment])

    // Build Google Calendar deep-link for an appointment (1 hour slot)
    const buildCalendarUrl = useCallback((appt: Appointment): string => {
        const [year, month, day] = appt.preferredDate.split("-")
        const [hh, mm] = appt.preferredTime.split(":")
        const paddedHH = (hh ?? "00").padStart(2, "0")
        const paddedMM = (mm ?? "00").padStart(2, "0")
        const startStr = `${year}${month}${day}T${paddedHH}${paddedMM}00`
        const endHour = String((parseInt(hh ?? "0", 10) + 1) % 24).padStart(2, "0")
        const endStr = `${year}${month}${day}T${endHour}${paddedMM}00`
        const title = encodeURIComponent(
            `${appt.serviceName || "Auto Service"} — ${appt.vehicleYear} ${appt.vehicleMake} ${appt.vehicleModel}`,
        )
        const details = encodeURIComponent(
            `Vehicle: ${appt.vehicleYear} ${appt.vehicleMake} ${appt.vehicleModel} (${appt.vehiclePlate})\nIssue: ${appt.problemDescription}`,
        )
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}`
    }, [])

    const handleAddToCalendar = useCallback((appt: Appointment) => {
        Linking.openURL(buildCalendarUrl(appt))
    }, [buildCalendarUrl])

    const handleCancelConfirm = useCallback(async (appt: Appointment) => {
        if (!cancelReason.trim()) return
        setCancelling(true)
        try {
            const res = await fetch("/api/appointments", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appointmentId: appt.appointmentId,
                    serviceId: appt.serviceId,
                    status: "cancelled",
                    cancellationReason: cancelReason.trim(),
                    cancelledBy: "user",
                }),
            })
            if (res.ok) {
                setAppointments((prev) =>
                    prev.map((a) =>
                        a.appointmentId === appt.appointmentId
                            ? { ...a, status: "cancelled", cancellationReason: cancelReason.trim(), cancelledBy: "user" }
                            : a,
                    ),
                )
                setCancellingId(null)
                setCancelReason("")
            }
        } catch {}
        setCancelling(false)
    }, [cancelReason])

    if (state === null) return null

    return (
        <>
            {/* Blurred backdrop — covers content, below the navbar (zIndex 90) */}
            <Animated.View
                style={[styles.backdrop, { opacity: backdropOpacity }]}
            >
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={handleClose}
                >
                    <BlurView
                        intensity={22}
                        tint={theme.blurTint}
                        style={StyleSheet.absoluteFill}
                    />
                </Pressable>
            </Animated.View>

            {/* Two-option popup menu */}
            <Animated.View
                style={[
                    styles.menuContainer,
                    {
                        opacity: menuOpacity,
                        transform: [{ translateY: menuY }],
                    },
                ]}
                pointerEvents={state === "menu" ? "auto" : "none"}
            >
                <LinearGradient
                    colors={[theme.borderStart, theme.borderEnd]}
                    style={styles.menuBorder}
                >
                    <BlurView
                        intensity={40}
                        tint={theme.blurTint}
                        style={[
                            styles.menuInner,
                            { backgroundColor: theme.surfaceMid },
                        ]}
                    >
                        <Pressable
                            style={styles.menuItem}
                            onPress={onShowPanel}
                        >
                            <Ionicons
                                name="list"
                                size={20}
                                color={theme.text}
                            />
                            <NText
                                style={[
                                    styles.menuLabel,
                                    {
                                        fontFamily: fonts.medium,
                                        color: theme.text,
                                    },
                                ]}
                            >
                                {t("appointmentMenu.viewAppointments")}
                            </NText>
                        </Pressable>
                        <View
                            style={[
                                styles.divider,
                                { backgroundColor: theme.borderEnd },
                            ]}
                        />
                        <Pressable
                            style={styles.menuItem}
                            onPress={handleMakeAppointment}
                        >
                            <Ionicons
                                name="calendar"
                                size={20}
                                color={theme.text}
                            />
                            <NText
                                style={[
                                    styles.menuLabel,
                                    {
                                        fontFamily: fonts.medium,
                                        color: theme.text,
                                    },
                                ]}
                            >
                                {t("appointmentMenu.makeAppointment")}
                            </NText>
                        </Pressable>
                    </BlurView>
                </LinearGradient>
            </Animated.View>

            {/* Appointments list panel */}
            <Animated.View
                style={[
                    styles.panelContainer,
                    {
                        opacity: panelOpacity,
                        transform: [{ translateY: panelY }],
                    },
                ]}
                pointerEvents={state === "panel" ? "auto" : "none"}
            >
                <LinearGradient
                    colors={[theme.borderStart, theme.borderEnd]}
                    style={styles.panelBorder}
                >
                    <BlurView
                        intensity={40}
                        tint={theme.blurTint}
                        style={[
                            styles.panelInner,
                            { backgroundColor: theme.surfaceMid },
                        ]}
                    >
                        <View style={styles.panelHeader}>
                            <NText
                                style={[
                                    styles.panelTitle,
                                    {
                                        fontFamily: fonts.bold,
                                        color: theme.text,
                                    },
                                ]}
                            >
                                {t("profile.myAppointments")}
                            </NText>
                            <Pressable onPress={handleClose}>
                                <Ionicons
                                    name="close"
                                    size={22}
                                    color={theme.iconMuted}
                                />
                            </Pressable>
                        </View>

                        {loading ? (
                            <ActivityIndicator
                                size="small"
                                color={theme.accentSolid}
                                style={{ marginVertical: 24 }}
                            />
                        ) : appointments.length === 0 ? (
                            <NText
                                style={[
                                    styles.emptyText,
                                    {
                                        color: theme.textMuted,
                                        fontFamily: fonts.light,
                                    },
                                ]}
                            >
                                {t("profile.noAppointments")}
                            </NText>
                        ) : (
                            <ScrollView
                                style={styles.apptList}
                                showsVerticalScrollIndicator={false}
                            >
                                {appointments.map((appt) => {
                                    const isCancelling = cancellingId === appt.appointmentId
                                    const canCancel = appt.status === "pending" || appt.status === "confirmed"
                                    const canCalendar = appt.status === "confirmed"
                                    const displayStatus =
                                        appt.status === "cancelled" && appt.cancelledBy === "user"
                                            ? "cancelled_by_user"
                                            : appt.status

                                    return (
                                        <View
                                            key={appt.appointmentId}
                                            style={[styles.apptCard, { backgroundColor: theme.surfaceMid }]}
                                        >
                                            <View style={styles.apptCardHeader}>
                                                <NText
                                                    style={[
                                                        styles.apptService,
                                                        { fontFamily: fonts.medium, color: theme.text },
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {appt.serviceName ||
                                                        t("profile.unknownService")}
                                                </NText>
                                                <View
                                                    style={[
                                                        styles.apptBadge,
                                                        {
                                                            backgroundColor:
                                                                STATUS_COLORS[
                                                                    appt.status
                                                                ] ??
                                                                STATUS_COLORS.pending,
                                                        },
                                                    ]}
                                                >
                                                    <NText
                                                        style={[
                                                            styles.apptBadgeText,
                                                            {
                                                                fontFamily:
                                                                    fonts.medium,
                                                            },
                                                        ]}
                                                    >
                                                        {t(`bookings.status.${displayStatus}`)}
                                                    </NText>
                                                </View>
                                            </View>
                                            <NText
                                                style={[
                                                    styles.apptMeta,
                                                    {
                                                        color: theme.textMuted,
                                                        fontFamily: fonts.light,
                                                    },
                                                ]}
                                            >
                                                {appt.preferredDate} ·{" "}
                                                {appt.preferredTime}
                                            </NText>
                                            <NText
                                                style={[
                                                    styles.apptMeta,
                                                    {
                                                        color: theme.textMuted,
                                                        fontFamily: fonts.light,
                                                    },
                                                ]}
                                            >
                                                {appt.vehicleYear} {appt.vehicleMake}{" "}
                                                {appt.vehicleModel}
                                            </NText>

                                            {/* Service cancellation reason */}
                                            {appt.status === "cancelled" &&
                                                appt.cancellationReason &&
                                                appt.cancelledBy !== "user" && (
                                                <View style={styles.serviceCancelBox}>
                                                    <View style={styles.serviceCancelHeader}>
                                                        <Ionicons name="information-circle-outline" size={13} color={theme.text} />
                                                        <NText style={[styles.serviceCancelLabel, { fontFamily: fonts.medium, color: theme.text }]}>
                                                            {t("appointmentMenu.serviceCancelLabel")}
                                                        </NText>
                                                    </View>
                                                    <NText style={[styles.serviceCancelText, { fontFamily: fonts.light, color: theme.text }]}>
                                                        {appt.cancellationReason}
                                                    </NText>
                                                </View>
                                            )}

                                            {/* Action buttons */}
                                            {(canCalendar || canCancel) && !isCancelling && (
                                                <View style={styles.apptActions}>
                                                    {canCalendar && (
                                                        <Pressable
                                                            style={[styles.actionBtn, styles.actionBtnCalendar]}
                                                            onPress={() => handleAddToCalendar(appt)}
                                                        >
                                                            <Ionicons name="calendar-outline" size={13} color={theme.text} />
                                                            <NText style={[styles.actionBtnText, { color: theme.text, fontFamily: fonts.medium }]}>
                                                                {t("appointmentMenu.addToCalendar")}
                                                            </NText>
                                                        </Pressable>
                                                    )}
                                                    {canCancel && (
                                                        <Pressable
                                                            style={[styles.actionBtn, styles.actionBtnCancel]}
                                                            onPress={() => {
                                                                setCancellingId(appt.appointmentId)
                                                                setCancelReason("")
                                                            }}
                                                        >
                                                            <Ionicons name="close-circle-outline" size={13} color={theme.text} />
                                                            <NText style={[styles.actionBtnText, { color: theme.text, fontFamily: fonts.medium }]}>
                                                                {t("appointmentMenu.cancelAppointment")}
                                                            </NText>
                                                        </Pressable>
                                                    )}
                                                </View>
                                            )}

                                            {/* Inline cancel form */}
                                            {isCancelling && (
                                                <View style={styles.cancelForm}>
                                                    <NText style={[styles.cancelFormTitle, { color: theme.textMuted, fontFamily: fonts.medium }]}>
                                                        {t("appointmentMenu.cancelTitle")}
                                                    </NText>
                                                    <NInput
                                                        placeholder={t("appointmentMenu.cancelReasonPlaceholder")}
                                                        value={cancelReason}
                                                        onChangeText={setCancelReason}
                                                        multiline
                                                        numberOfLines={2}
                                                        editable={!cancelling}
                                                        containerStyle={styles.cancelFormInput}
                                                    />
                                                    <View style={styles.cancelFormActions}>
                                                        <NButton
                                                            onPress={() => { setCancellingId(null); setCancelReason("") }}
                                                            disabled={cancelling}
                                                            color="rgba(255,255,255,0.08)"
                                                            intensity={20}
                                                            style={styles.cancelFormBtn}
                                                        >
                                                            <NText style={[styles.cancelFormBtnText, { fontFamily: fonts.medium }]}>
                                                                {t("appointmentMenu.keepAppointment")}
                                                            </NText>
                                                        </NButton>
                                                        <NButton
                                                            onPress={() => handleCancelConfirm(appt)}
                                                            disabled={!cancelReason.trim() || cancelling}
                                                            color="rgba(248,113,113,0.25)"
                                                            intensity={20}
                                                            style={styles.cancelFormBtn}
                                                        >
                                                            <NText style={[styles.cancelFormBtnText, { color: "#f87171", fontFamily: fonts.medium }]}>
                                                                {cancelling ? t("appointmentMenu.cancelling") : t("appointmentMenu.cancelConfirm")}
                                                            </NText>
                                                        </NButton>
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    )
                                })}
                            </ScrollView>
                        )}
                    </BlurView>
                </LinearGradient>
            </Animated.View>
        </>
    )
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 90,
    },

    // ── Popup menu ──────────────────────────────────────────────────────────────
    menuContainer: {
        position: "absolute",
        bottom: 76,
        alignSelf: "center",
        minWidth: 240,
        zIndex: 95,
    },
    menuBorder: {
        borderRadius: 16,
        padding: 1.5,
    },
    menuInner: {
        borderRadius: 14,
        overflow: "hidden",
        paddingVertical: 4,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    menuLabel: {
        fontSize: 15,
    },
    divider: {
        height: 1,
        marginHorizontal: 16,
    },

    // ── Appointments panel ───────────────────────────────────────────────────────
    panelContainer: {
        position: "absolute",
        bottom: 76,
        left: 16,
        right: 16,
        zIndex: 95,
    },
    panelBorder: {
        borderRadius: 20,
        padding: 1.5,
    },
    panelInner: {
        borderRadius: 18,
        overflow: "hidden",
        padding: 16,
    },
    panelHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    panelTitle: {
        fontSize: 16,
        letterSpacing: 0.5,
    },
    apptList: {
        maxHeight: 340,
    },
    emptyText: {
        fontSize: 14,
        textAlign: "center",
        paddingVertical: 20,
    },

    // ── Appointment card ─────────────────────────────────────────────────────────
    apptCard: {
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        gap: 3,
    },
    apptCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 2,
    },
    apptService: {
        fontSize: 14,
        flex: 1,
        marginRight: 8,
    },
    apptBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    apptBadgeText: {
        color: "#ffffff",
        fontSize: 11,
    },
    apptMeta: {
        fontSize: 12,
    },

    // ── Appointment action buttons ────────────────────────────────────────────────
    apptActions: {
        flexDirection: "row",
        gap: 6,
        marginTop: 8,
        flexWrap: "wrap",
    },
    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    actionBtnCalendar: {
        backgroundColor: "rgba(96,165,250,0.20)",
        borderWidth: 1,
        borderColor: "rgba(96,165,250,0.5)",
    },
    actionBtnCancel: {
        backgroundColor: "rgba(248,113,113,0.28)",
        borderWidth: 1,
        borderColor: "rgba(248,113,113,0.7)",
    },
    actionBtnText: {
        fontSize: 11,
    },

    // ── Inline cancel form ────────────────────────────────────────────────────────
    cancelForm: {
        marginTop: 10,
        gap: 8,
    },
    cancelFormTitle: {
        fontSize: 12,
    },
    cancelFormInput: {
        marginBottom: 2,
    },
    cancelFormActions: {
        flexDirection: "row",
        gap: 8,
    },
    cancelFormBtn: {
        flex: 1,
    },
    cancelFormBtnText: {
        fontSize: 12,
        color: "#ffffff",
    },

    // ── Service cancellation reason ───────────────────────────────────────────────
    serviceCancelBox: {
        marginTop: 8,
        backgroundColor: "rgba(248,113,113,0.08)",
        borderLeftWidth: 2,
        borderLeftColor: "rgba(248,113,113,0.5)",
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
        gap: 4,
    },
    serviceCancelHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    serviceCancelLabel: {
        fontSize: 11,
        letterSpacing: 0.3,
    },
    serviceCancelText: {
        fontSize: 12,
        opacity: 0.85,
    },
})
