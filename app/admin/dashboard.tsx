import React, { useEffect, useState } from "react"
import { StyleSheet, View, ScrollView, Pressable } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../../components/replacements/NText"
import { fonts } from "../../theme"
import { useTranslation } from "react-i18next"
import type { Appointment } from "../api/appointments+api"
import type { ServiceConfig } from "../api/service-config+api"
import type { WeekSchedule } from "../../data/serviceAvailability"
import { useAdminService } from "../../context/AdminServiceContext"
import "../../i18n"

function isOpenNow(schedule: WeekSchedule): boolean {
    const now = new Date()
    const keys: (keyof WeekSchedule)[] = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
    ]
    const day = schedule[keys[now.getDay()]]
    if (!day?.isOpen) return false
    const [oh, om] = day.open.split(":").map(Number)
    const [ch, cm] = day.close.split(":").map(Number)
    const nowMin = now.getHours() * 60 + now.getMinutes()
    return nowMin >= oh * 60 + om && nowMin < ch * 60 + cm
}

function StatCard({
    icon,
    label,
    value,
    color,
}: {
    icon: keyof typeof Ionicons.glyphMap
    label: string
    value: string
    color: string
}) {
    return (
        <View style={styles.statCard}>
            <LinearGradient
                colors={[color, "rgba(255,255,255,0.05)"]}
                style={styles.statGradient}
            >
                <BlurView intensity={30} tint="dark" style={styles.statInner}>
                    <Ionicons
                        name={icon}
                        size={24}
                        color="white"
                        style={{ opacity: 0.8 }}
                    />
                    <NText
                        style={[styles.statValue, { fontFamily: fonts.bold }]}
                    >
                        {value}
                    </NText>
                    <NText
                        style={[styles.statLabel, { fontFamily: fonts.light }]}
                    >
                        {label}
                    </NText>
                </BlurView>
            </LinearGradient>
        </View>
    )
}

const STATUS_COLORS: Record<string, string> = {
    pending: "rgba(245,158,11,0.85)",
    confirmed: "rgba(59,130,246,0.85)",
    completed: "rgba(33,168,112,0.85)",
    cancelled: "rgba(150,150,150,0.7)",
}

function BookingRow({ booking }: { booking: Appointment }) {
    const { t } = useTranslation()
    const statusColor = STATUS_COLORS[booking.status] ?? STATUS_COLORS.pending
    return (
        <View style={styles.bookingRow}>
            <View style={styles.bookingMain}>
                <NText
                    style={[styles.bookingName, { fontFamily: fonts.medium }]}
                >
                    {booking.customerName}
                </NText>
                <NText
                    style={[styles.bookingMeta, { fontFamily: fonts.light }]}
                >
                    {booking.vehicleYear} {booking.vehicleMake}{" "}
                    {booking.vehicleModel}
                </NText>
                <NText
                    style={[styles.bookingDate, { fontFamily: fonts.light }]}
                >
                    {booking.preferredDate} · {booking.preferredTime}
                </NText>
            </View>
            <View
                style={[styles.statusBadge, { backgroundColor: statusColor }]}
            >
                <NText
                    style={[styles.statusText, { fontFamily: fonts.medium }]}
                >
                    {t(`bookings.status.${booking.status}`)}
                </NText>
            </View>
        </View>
    )
}

export default function DashboardScreen() {
    const { t } = useTranslation()
    const { serviceId } = useAdminService()
    const [todayCount, setTodayCount] = useState<number | null>(null)
    const [serviceConfig, setServiceConfig] = useState<ServiceConfig | null>(
        null,
    )
    const [recentBookings, setRecentBookings] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!serviceId) return
        Promise.all([
            fetch(`/api/appointments?filter=today&serviceId=${serviceId}`).then((r) => r.json()),
            fetch(`/api/appointments?filter=all&serviceId=${serviceId}`).then((r) => r.json()),
            fetch(`/api/service-config?serviceId=${serviceId}`).then((r) => r.json()),
        ])
            .then(([today, all, config]) => {
                setTodayCount(Array.isArray(today) ? today.length : 0)
                setRecentBookings(Array.isArray(all) ? all.slice(0, 5) : [])
                setServiceConfig(config)
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [serviceId])

    const isOpen = serviceConfig?.schedule
        ? isOpenNow(serviceConfig.schedule)
        : null

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            <NText style={[styles.sectionTitle, { fontFamily: fonts.medium }]}>
                {t("dashboard.serviceOverview")}
            </NText>

            <View style={styles.statsRow}>
                <StatCard
                    icon="calendar"
                    label={t("dashboard.todaysBookings")}
                    value={loading ? "…" : String(todayCount ?? 0)}
                    color="rgba(33,168,112,0.3)"
                />
                <StatCard
                    icon="star"
                    label={t("dashboard.rating")}
                    value={
                        loading
                            ? "…"
                            : serviceConfig?.rating
                              ? serviceConfig.rating.toFixed(1)
                              : "—"
                    }
                    color="rgba(59,130,246,0.3)"
                />
                <StatCard
                    icon="time"
                    label={t("dashboard.status")}
                    value={
                        loading
                            ? "…"
                            : isOpen === null
                              ? "—"
                              : isOpen
                                ? t("dashboard.open")
                                : t("dashboard.closed")
                    }
                    color={
                        isOpen ? "rgba(33,168,112,0.3)" : "rgba(245,158,11,0.3)"
                    }
                />
            </View>

            <NText
                style={[
                    styles.sectionTitle,
                    { fontFamily: fonts.medium, marginTop: 32 },
                ]}
            >
                {t("dashboard.recentBookings")}
            </NText>

            {recentBookings.length === 0 ? (
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
                                {loading
                                    ? t("bookings.loading")
                                    : t("bookings.noBookings")}
                            </NText>
                        </BlurView>
                    </LinearGradient>
                </View>
            ) : (
                <View style={styles.bookingsList}>
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
                            style={styles.bookingsInner}
                        >
                            {recentBookings.map((b, i) => (
                                <React.Fragment key={b.appointmentId}>
                                    <BookingRow booking={b} />
                                    {i < recentBookings.length - 1 && (
                                        <View style={styles.separator} />
                                    )}
                                </React.Fragment>
                            ))}
                        </BlurView>
                    </LinearGradient>
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
    sectionTitle: {
        color: "#ffffff",
        fontSize: 18,
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: "row",
        gap: 16,
        flexWrap: "wrap",
    },
    statCard: {
        flex: 1,
        minWidth: 150,
        borderRadius: 20,
        overflow: "hidden",
    },
    statGradient: {
        padding: 1.5,
        borderRadius: 20,
    },
    statInner: {
        borderRadius: 18,
        overflow: "hidden",
        padding: 20,
        alignItems: "center",
        gap: 8,
    },
    statValue: {
        color: "#ffffff",
        fontSize: 28,
    },
    statLabel: {
        color: "rgba(255,255,255,0.55)",
        fontSize: 13,
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
    bookingsList: {
        borderRadius: 20,
        overflow: "hidden",
    },
    bookingsInner: {
        borderRadius: 18,
        overflow: "hidden",
        padding: 8,
    },
    bookingRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    bookingMain: {
        flex: 1,
        gap: 2,
    },
    bookingName: {
        color: "#ffffff",
        fontSize: 15,
    },
    bookingMeta: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 13,
    },
    bookingDate: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 12,
        marginTop: 2,
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
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: "rgba(255,255,255,0.12)",
        marginHorizontal: 12,
    },
})
