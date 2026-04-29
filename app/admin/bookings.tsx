import React, { useState, useEffect, useCallback } from "react"
import { StyleSheet, View, ScrollView, Pressable } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../../components/replacements/NText"
import { fonts } from "../../theme"
import { useTranslation } from "react-i18next"
import type { Appointment } from "../api/appointments+api"
import { useAdminService } from "../../context/AdminServiceContext"
import "../../i18n"

type FilterKey = "all" | "today" | "upcoming" | "past"

const STATUS_COLORS: Record<string, string> = {
    pending: "rgba(245,158,11,0.85)",
    confirmed: "rgba(59,130,246,0.85)",
    completed: "rgba(33,168,112,0.85)",
    cancelled: "rgba(150,150,150,0.7)",
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
}: {
    booking: Appointment
    onStatusChange: (id: string, status: string) => void
}) {
    const { t } = useTranslation()
    const [updating, setUpdating] = useState(false)
    const statusColor = STATUS_COLORS[booking.status] ?? STATUS_COLORS.pending
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

    const handleCancel = async () => {
        if (booking.status === "cancelled") return
        setUpdating(true)
        try {
            const res = await fetch("/api/appointments", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appointmentId: booking.appointmentId,
                    serviceId: booking.serviceId,
                    status: "cancelled",
                }),
            })
            if (res.ok) onStatusChange(booking.appointmentId, "cancelled")
        } catch {}
        setUpdating(false)
    }

    return (
        <View style={styles.cardWrapper}>
            <LinearGradient
                colors={["rgba(255,255,255,0.12)", "rgba(255,255,255,0.04)"]}
                style={styles.cardGradient}
            >
                <BlurView intensity={20} tint="dark" style={styles.cardInner}>
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
                                { backgroundColor: statusColor },
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

                    {/* Actions */}
                    {booking.status !== "completed" &&
                        booking.status !== "cancelled" && (
                            <View style={styles.actions}>
                                {next && (
                                    <Pressable
                                        onPress={handleAdvance}
                                        disabled={updating}
                                        style={[
                                            styles.actionBtn,
                                            styles.advanceBtn,
                                            updating && { opacity: 0.5 },
                                        ]}
                                    >
                                        <NText
                                            style={[
                                                styles.actionBtnText,
                                                { fontFamily: fonts.medium },
                                            ]}
                                        >
                                            {t(`bookings.advanceTo.${next}`)}
                                        </NText>
                                    </Pressable>
                                )}
                                <Pressable
                                    onPress={handleCancel}
                                    disabled={updating}
                                    style={[
                                        styles.actionBtn,
                                        styles.cancelBtn,
                                        updating && { opacity: 0.5 },
                                    ]}
                                >
                                    <NText
                                        style={[
                                            styles.actionBtnText,
                                            { fontFamily: fonts.medium },
                                        ]}
                                    >
                                        {t("bookings.cancel")}
                                    </NText>
                                </Pressable>
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

    return (
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
                            intensity={20}
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
                            intensity={20}
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
                        />
                    ))}
                </View>
            )}
        </ScrollView>
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
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
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
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: "center",
    },
    advanceBtn: {
        backgroundColor: "rgba(33,168,112,0.4)",
    },
    cancelBtn: {
        backgroundColor: "rgba(220,50,50,0.3)",
    },
    actionBtnText: {
        color: "#ffffff",
        fontSize: 13,
    },
})
