import React, { useState, useEffect, useCallback } from "react"
import { StyleSheet, View, ScrollView, Pressable } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../../components/replacements/NText"
import { fonts } from "../../theme"
import type { Appointment } from "../api/appointments+api"

type FilterKey = "all" | "pending" | "confirmed" | "completed" | "cancelled"

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
]

const STATUS_COLORS: Record<string, string> = {
    pending: "rgba(245,158,11,0.85)",
    confirmed: "rgba(59,130,246,0.85)",
    completed: "rgba(33,168,112,0.85)",
    cancelled: "rgba(150,150,150,0.7)",
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
    const statusColor =
        STATUS_COLORS[appointment.status] ?? STATUS_COLORS.pending

    return (
        <View style={styles.cardWrapper}>
            <LinearGradient
                colors={["rgba(255,255,255,0.12)", "rgba(255,255,255,0.04)"]}
                style={styles.cardGradient}
            >
                <BlurView intensity={20} tint="dark" style={styles.cardInner}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                            <NText
                                style={[
                                    styles.customerName,
                                    { fontFamily: fonts.medium },
                                ]}
                            >
                                {appointment.customerName}
                            </NText>
                            {appointment.serviceName ? (
                                <NText
                                    style={[
                                        styles.serviceName,
                                        { fontFamily: fonts.light },
                                    ]}
                                >
                                    {appointment.serviceName}
                                </NText>
                            ) : null}
                        </View>
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
                                {appointment.status}
                            </NText>
                        </View>
                    </View>

                    <NText
                        style={[styles.metaLine, { fontFamily: fonts.light }]}
                    >
                        {appointment.preferredDate} ·{" "}
                        {appointment.preferredTime}
                    </NText>

                    <NText
                        style={[styles.metaLine, { fontFamily: fonts.light }]}
                    >
                        {appointment.vehicleYear} {appointment.vehicleMake}{" "}
                        {appointment.vehicleModel}
                        {appointment.vehiclePlate
                            ? ` · ${appointment.vehiclePlate}`
                            : ""}
                    </NText>

                    {appointment.customerEmail ? (
                        <NText
                            style={[
                                styles.metaLine,
                                { fontFamily: fonts.light },
                            ]}
                        >
                            {appointment.customerEmail}
                            {appointment.customerPhone
                                ? ` · ${appointment.customerPhone}`
                                : ""}
                        </NText>
                    ) : null}

                    {appointment.problemDescription ? (
                        <NText
                            style={[
                                styles.description,
                                { fontFamily: fonts.light },
                            ]}
                            numberOfLines={2}
                        >
                            {appointment.problemDescription}
                        </NText>
                    ) : null}

                    {appointment.rating ? (
                        <NText
                            style={[styles.rating, { fontFamily: fonts.light }]}
                        >
                            {"★".repeat(appointment.rating)}{" "}
                            {appointment.rating}/5
                            {appointment.ratingComment
                                ? ` — "${appointment.ratingComment}"`
                                : ""}
                        </NText>
                    ) : null}
                </BlurView>
            </LinearGradient>
        </View>
    )
}

export default function MasterAdminAppointments() {
    const [activeFilter, setActiveFilter] = useState<FilterKey>("all")
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)

    const fetchAppointments = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/appointments?scan=true")
            const data = await res.json()
            setAppointments(Array.isArray(data) ? data : [])
        } catch {
            setAppointments([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAppointments()
    }, [])

    const filtered =
        activeFilter === "all"
            ? appointments
            : appointments.filter((a) => a.status === activeFilter)

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >
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
                                Loading…
                            </NText>
                        </BlurView>
                    </LinearGradient>
                </View>
            ) : filtered.length === 0 ? (
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
                                No appointments
                            </NText>
                        </BlurView>
                    </LinearGradient>
                </View>
            ) : (
                <View style={styles.list}>
                    {filtered.map((a) => (
                        <AppointmentCard
                            key={a.appointmentId}
                            appointment={a}
                        />
                    ))}
                </View>
            )}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingBottom: 40 },
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
    filterPillActive: { backgroundColor: "rgba(33,168,112,0.4)" },
    filterText: { color: "rgba(255,255,255,0.55)", fontSize: 14 },
    filterTextActive: { color: "#ffffff" },
    emptyState: { borderRadius: 20, overflow: "hidden" },
    emptyGradient: { padding: 1.5, borderRadius: 20 },
    emptyInner: {
        borderRadius: 18,
        overflow: "hidden",
        padding: 40,
        alignItems: "center",
        gap: 12,
    },
    emptyText: { color: "rgba(255,255,255,0.4)", fontSize: 15 },
    list: { gap: 12 },
    cardWrapper: { borderRadius: 20, overflow: "hidden" },
    cardGradient: { padding: 1.5, borderRadius: 20 },
    cardInner: {
        borderRadius: 18,
        overflow: "hidden",
        padding: 16,
        gap: 5,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 4,
    },
    cardHeaderLeft: { flex: 1, marginRight: 8, gap: 2 },
    customerName: { color: "#ffffff", fontSize: 15 },
    serviceName: { color: "rgba(33,168,112,0.9)", fontSize: 13 },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statusText: { color: "#ffffff", fontSize: 12 },
    metaLine: { color: "rgba(255,255,255,0.55)", fontSize: 13 },
    description: { color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 2 },
    rating: { color: "rgba(255,210,50,0.8)", fontSize: 13, marginTop: 2 },
})
