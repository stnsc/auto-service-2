import React, { useState, useEffect, useCallback } from "react"
import { StyleSheet, View, ScrollView, Pressable } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../../components/replacements/NText"
import { NInput } from "../../components/replacements/NInput"
import { NModal } from "../../components/replacements/NModal"
import { fonts } from "../../theme"
import { useTranslation } from "react-i18next"
import type { Appointment } from "../api/appointments+api"
import { useAdminService } from "../../context/AdminServiceContext"
import "../../i18n"
import { NButton } from "../../components/replacements/NButton"

type FilterKey = "all" | "today" | "upcoming" | "past"

const STATUS_COLORS: Record<string, string> = {
    pending: "#d97706",
    confirmed: "#2563eb",
    completed: "#16a34a",
    cancelled: "#6b7280",
}

const STATUS_BORDER_COLORS: Record<string, string> = {
    pending: "#f59e0b",
    confirmed: "#60a5fa",
    completed: "#4ade80",
    cancelled: "#9ca3af",
}

const NEXT_STATUS: Record<string, string | null> = {
    pending: "confirmed",
    confirmed: "completed",
    completed: null,
    cancelled: null,
}

function BookingCard({
    booking,
    onStatusChange,
    onCancelPress,
}: {
    booking: Appointment
    onStatusChange: (id: string, status: string) => void
    onCancelPress: (booking: Appointment) => void
}) {
    const { t } = useTranslation()
    const [updating, setUpdating] = useState(false)
    const statusColor = STATUS_COLORS[booking.status] ?? STATUS_COLORS.pending
    const statusBorderColor = STATUS_BORDER_COLORS[booking.status] ?? STATUS_BORDER_COLORS.pending
    const next = NEXT_STATUS[booking.status]

    const handleAdvance = async () => {
        if (!next) return
        setUpdating(true)
        try {
            const res = await fetch("/api/appointments", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appointmentId: booking.appointmentId,
                    serviceId: booking.serviceId,
                    status: next,
                }),
            })
            if (res.ok) onStatusChange(booking.appointmentId, next)
        } catch {}
        setUpdating(false)
    }

    return (
        <View style={styles.cardWrapper}>
            <LinearGradient
                colors={["rgba(255,255,255,0.12)", "rgba(255,255,255,0.04)"]}
                style={styles.cardGradient}
            >
                <BlurView intensity={40} tint="dark" style={styles.cardInner}>
                    {/* Header */}
                    <View style={styles.cardHeader}>
                        <NText
                            style={[
                                styles.customerName,
                                { fontFamily: fonts.medium },
                            ]}
                        >
                            {booking.customerName}
                        </NText>
                        <View
                            style={[
                                styles.statusBadge,
                                {
                                    backgroundColor: statusColor,
                                    borderColor: statusBorderColor,
                                },
                            ]}
                        >
                            <NText
                                style={[
                                    styles.statusText,
                                    { fontFamily: fonts.medium },
                                ]}
                            >
                                {t(`bookings.status.${booking.status}`)}
                            </NText>
                        </View>
                    </View>

                    {/* Vehicle */}
                    <NText
                        style={[styles.metaLine, { fontFamily: fonts.light }]}
                    >
                        {booking.vehicleYear} {booking.vehicleMake}{" "}
                        {booking.vehicleModel}
                        {booking.vehiclePlate
                            ? ` · ${booking.vehiclePlate}`
                            : ""}
                    </NText>

                    {/* Date & time */}
                    <NText
                        style={[styles.metaLine, { fontFamily: fonts.light }]}
                    >
                        {booking.preferredDate} · {booking.preferredTime}
                    </NText>

                    {/* Problem */}
                    {booking.problemDescription ? (
                        <NText
                            style={[
                                styles.problemText,
                                { fontFamily: fonts.light },
                            ]}
                            numberOfLines={2}
                        >
                            {booking.problemDescription}
                        </NText>
                    ) : null}

                    {/* Contact */}
                    <NText
                        style={[
                            styles.contactLine,
                            { fontFamily: fonts.light },
                        ]}
                    >
                        {booking.customerPhone}
                        {booking.customerEmail
                            ? ` · ${booking.customerEmail}`
                            : ""}
                    </NText>

                    {/* Rating */}
                    {booking.rating != null && (
                        <View style={styles.ratingRow}>
                            <NText style={[styles.ratingStars, { fontFamily: fonts.regular }]}>
                                {"★".repeat(booking.rating)}{"☆".repeat(5 - booking.rating)}
                            </NText>
                            {booking.ratingComment ? (
                                <NText style={[styles.ratingComment, { fontFamily: fonts.light }]}>
                                    "{booking.ratingComment}"
                                </NText>
                            ) : null}
                        </View>
                    )}

                    {/* Actions */}
                    {booking.status !== "completed" &&
                        booking.status !== "cancelled" && (
                            <View style={styles.actions}>
                                {next && (
                                    <NButton
                                        onPress={handleAdvance}
                                        disabled={updating}
                                        color="rgba(33,168,112,0.5)"
                                        style={styles.actionBtn}
                                    >
                                        <NText
                                            style={[
                                                styles.actionBtnText,
                                                { fontFamily: fonts.medium },
                                            ]}
                                        >
                                            {t(`bookings.advanceTo.${next}`)}
                                        </NText>
                                    </NButton>
                                )}
                                <NButton
                                    onPress={() => onCancelPress(booking)}
                                    disabled={updating}
                                    color="rgba(220,50,50,0.45)"
                                    style={styles.actionBtn}
                                >
                                    <NText
                                        style={[
                                            styles.actionBtnText,
                                            { fontFamily: fonts.medium },
                                        ]}
                                    >
                                        {t("bookings.cancel")}
                                    </NText>
                                </NButton>
                            </View>
                        )}
                </BlurView>
            </LinearGradient>
        </View>
    )
}

export default function BookingsScreen() {
    const { t } = useTranslation()
    const { serviceId } = useAdminService()
    const FILTERS: { key: FilterKey; label: string }[] = [
        { key: "all", label: t("bookings.filterAll") },
        { key: "today", label: t("bookings.filterToday") },
        { key: "upcoming", label: t("bookings.filterUpcoming") },
        { key: "past", label: t("bookings.filterPast") },
    ]
    const [activeFilter, setActiveFilter] = useState<FilterKey>("all")
    const [bookings, setBookings] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)
    const [cancelReason, setCancelReason] = useState("")
    const [cancelling, setCancelling] = useState(false)

    const fetchBookings = useCallback(async (filter: FilterKey) => {
        if (!serviceId) return
        setLoading(true)
        try {
            const res = await fetch(`/api/appointments?filter=${filter}&serviceId=${serviceId}`)
            const data = await res.json()
            setBookings(Array.isArray(data) ? data : [])
        } catch {
            setBookings([])
        } finally {
            setLoading(false)
        }
    }, [serviceId])

    useEffect(() => {
        fetchBookings(activeFilter)
    }, [activeFilter, serviceId])

    const handleStatusChange = (appointmentId: string, status: string) => {
        setBookings((prev) =>
            prev.map((b) =>
                b.appointmentId === appointmentId
                    ? { ...b, status: status as Appointment["status"] }
                    : b,
            ),
        )
    }

    const handleCancelPress = (booking: Appointment) => {
        setCancelTarget(booking)
        setCancelReason("")
    }

    const handleCancelConfirm = async () => {
        if (!cancelTarget || !cancelReason.trim()) return
        setCancelling(true)
        try {
            const res = await fetch("/api/appointments", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appointmentId: cancelTarget.appointmentId,
                    serviceId: cancelTarget.serviceId,
                    status: "cancelled",
                    cancellationReason: cancelReason.trim(),
                }),
            })
            if (res.ok) {
                handleStatusChange(cancelTarget.appointmentId, "cancelled")
                setCancelTarget(null)
                setCancelReason("")
            }
        } catch {}
        setCancelling(false)
    }

    return (
        <View style={{ flex: 1 }}>
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            {/* Filter pills */}
            <View style={styles.filterRow}>
                {FILTERS.map((f) => (
                    <Pressable
                        key={f.key}
                        onPress={() => setActiveFilter(f.key)}
                        style={[
                            styles.filterPill,
                            activeFilter === f.key && styles.filterPillActive,
                        ]}
                    >
                        <NText
                            style={[
                                styles.filterText,
                                activeFilter === f.key &&
                                    styles.filterTextActive,
                                {
                                    fontFamily:
                                        activeFilter === f.key
                                            ? fonts.medium
                                            : fonts.regular,
                                },
                            ]}
                        >
                            {f.label}
                        </NText>
                    </Pressable>
                ))}
            </View>

            {loading ? (
                <View style={styles.emptyState}>
                    <LinearGradient
                        colors={[
                            "rgba(255,255,255,0.15)",
                            "rgba(255,255,255,0.05)",
                        ]}
                        style={styles.emptyGradient}
                    >
                        <BlurView
                            intensity={40}
                            tint="dark"
                            style={styles.emptyInner}
                        >
                            <NText
                                style={[
                                    styles.emptyText,
                                    { fontFamily: fonts.light },
                                ]}
                            >
                                {t("bookings.loading")}
                            </NText>
                        </BlurView>
                    </LinearGradient>
                </View>
            ) : bookings.length === 0 ? (
                <View style={styles.emptyState}>
                    <LinearGradient
                        colors={[
                            "rgba(255,255,255,0.15)",
                            "rgba(255,255,255,0.05)",
                        ]}
                        style={styles.emptyGradient}
                    >
                        <BlurView
                            intensity={40}
                            tint="dark"
                            style={styles.emptyInner}
                        >
                            <Ionicons
                                name="calendar-outline"
                                size={32}
                                color="rgba(255,255,255,0.3)"
                            />
                            <NText
                                style={[
                                    styles.emptyText,
                                    { fontFamily: fonts.light },
                                ]}
                            >
                                {t("bookings.noBookings")}
                            </NText>
                        </BlurView>
                    </LinearGradient>
                </View>
            ) : (
                <View style={styles.list}>
                    {bookings.map((b) => (
                        <BookingCard
                            key={b.appointmentId}
                            booking={b}
                            onStatusChange={handleStatusChange}
                            onCancelPress={handleCancelPress}
                        />
                    ))}
                </View>
            )}
        </ScrollView>

        <NModal
            visible={!!cancelTarget}
            onDismiss={() => { setCancelTarget(null); setCancelReason("") }}
            title={t("bookings.cancelReasonTitle")}
        >
            <NText style={styles.cancelReasonDesc}>
                {t("bookings.cancelReasonDesc")}
            </NText>
            <NInput
                placeholder={t("bookings.cancelReasonPlaceholder")}
                value={cancelReason}
                onChangeText={setCancelReason}
                multiline
                containerStyle={styles.cancelReasonInput}
            />
            <NButton
                onPress={handleCancelConfirm}
                disabled={!cancelReason.trim() || cancelling}
                color="rgba(220,50,50,0.45)"
                style={{ width: "100%" }}
            >
                <NText style={[styles.confirmCancelText, { fontFamily: fonts.medium }]}>
                    {cancelling
                        ? t("bookings.cancelling")
                        : t("bookings.confirmCancel")}
                </NText>
            </NButton>
        </NModal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingBottom: 40,
    },
    filterRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 20,
        flexWrap: "wrap",
    },
    filterPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.08)",
    },
    filterPillActive: {
        backgroundColor: "rgba(33,168,112,0.4)",
    },
    filterText: {
        color: "rgba(255,255,255,0.55)",
        fontSize: 14,
    },
    filterTextActive: {
        color: "#ffffff",
    },
    emptyState: {
        borderRadius: 20,
        overflow: "hidden",
    },
    emptyGradient: {
        padding: 1.5,
        borderRadius: 20,
    },
    emptyInner: {
        borderRadius: 18,
        overflow: "hidden",
        padding: 40,
        alignItems: "center",
        gap: 12,
    },
    emptyText: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 15,
    },
    list: {
        gap: 12,
    },
    cardWrapper: {
        borderRadius: 20,
        overflow: "hidden",
    },
    cardGradient: {
        padding: 1.5,
        borderRadius: 20,
    },
    cardInner: {
        borderRadius: 18,
        overflow: "hidden",
        padding: 16,
        gap: 6,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    customerName: {
        color: "#ffffff",
        fontSize: 16,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
    },
    statusText: {
        color: "#ffffff",
        fontSize: 12,
    },
    metaLine: {
        color: "rgba(255,255,255,0.55)",
        fontSize: 13,
    },
    problemText: {
        color: "rgba(255,255,255,0.45)",
        fontSize: 13,
        marginTop: 4,
    },
    contactLine: {
        color: "rgba(255,255,255,0.35)",
        fontSize: 12,
        marginTop: 2,
    },
    actions: {
        flexDirection: "row",
        gap: 8,
        marginTop: 10,
        flexWrap: "wrap",
    },
    actionBtn: {
        alignSelf: "flex-start",
    },
    actionBtnText: {
        color: "#ffffff",
        fontSize: 13,
    },
    cancelReasonDesc: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 14,
        marginBottom: 12,
        lineHeight: 20,
    },
    cancelReasonInput: {
        marginBottom: 16,
    },
    confirmCancelText: {
        color: "#ffffff",
        fontSize: 15,
    },
    ratingRow: {
        marginTop: 4,
        gap: 2,
    },
    ratingStars: {
        color: "#f59e0b",
        fontSize: 14,
        letterSpacing: 1,
    },
    ratingComment: {
        color: "rgba(255,255,255,0.45)",
        fontSize: 13,
        fontStyle: "italic",
    },
})
