import React, { useState, useCallback } from "react"
import { StyleSheet, View, ScrollView } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../../components/replacements/NText"
import { fonts } from "../../theme"
import { useTranslation } from "react-i18next"
import type { Appointment } from "../api/appointments+api"
import type { ServiceConfig } from "../api/service-config+api"
import type { CarService } from "../types/CarService"
import type { WeekSchedule } from "../../data/serviceAvailability"
import { useAdminService } from "../../context/AdminServiceContext"
import { useTheme } from "../../context/ThemeContext"
import { useFocusEffect } from "expo-router"
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
    const { theme } = useTheme()

    return (
        <View style={styles.statCard}>
            <LinearGradient colors={[color, theme.surface]} style={styles.statGradient}>
                <BlurView
                    intensity={40}
                    tint={theme.blurTint}
                    style={styles.statInner}
                >
                    <Ionicons
                        name={icon}
                        size={24}
                        color={theme.icon}
                        style={{ opacity: 0.8 }}
                    />
                    <NText
                        style={[
                            styles.statValue,
                            { color: theme.text, fontFamily: fonts.bold },
                        ]}
                    >
                        {value}
                    </NText>
                    <NText
                        style={[
                            styles.statLabel,
                            { color: theme.textMuted, fontFamily: fonts.light },
                        ]}
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
    const { theme } = useTheme()
    const statusColor = STATUS_COLORS[booking.status] ?? STATUS_COLORS.pending

    return (
        <View style={styles.bookingCardWrapper}>
            <LinearGradient
                colors={[theme.surfaceMid, theme.borderEnd]}
                style={styles.bookingCardGradient}
            >
                <BlurView
                    intensity={40}
                    tint={theme.blurTint}
                    style={styles.bookingCardInner}
                >
                    <View style={styles.bookingRow}>
                        <View style={styles.bookingMain}>
                            <NText
                                style={[
                                    styles.bookingName,
                                    { color: theme.text, fontFamily: fonts.medium },
                                ]}
                            >
                                {booking.customerName}
                            </NText>
                            <NText
                                style={[
                                    styles.bookingMeta,
                                    {
                                        color: theme.textMuted,
                                        fontFamily: fonts.light,
                                    },
                                ]}
                            >
                                {booking.vehicleYear} {booking.vehicleMake}{" "}
                                {booking.vehicleModel}
                            </NText>
                            <NText
                                style={[
                                    styles.bookingDate,
                                    {
                                        color: theme.textSubtle,
                                        fontFamily: fonts.light,
                                    },
                                ]}
                            >
                                {booking.preferredDate} · {booking.preferredTime}
                            </NText>
                            {booking.rating != null && (
                                <View style={styles.ratingRow}>
                                    <NText
                                        style={[
                                            styles.ratingStars,
                                            { fontFamily: fonts.regular },
                                        ]}
                                    >
                                        {"★".repeat(booking.rating)}{"☆".repeat(5 - booking.rating)}
                                    </NText>
                                    {booking.ratingComment ? (
                                        <NText
                                            style={[
                                                styles.ratingComment,
                                                {
                                                    color: theme.textMuted,
                                                    fontFamily: fonts.light,
                                                },
                                            ]}
                                        >
                                            "{booking.ratingComment}"
                                        </NText>
                                    ) : null}
                                </View>
                            )}
                        </View>
                        <View
                            style={[styles.statusBadge, { backgroundColor: statusColor }]}
                        >
                            <NText
                                style={[
                                    styles.statusText,
                                    { color: theme.text, fontFamily: fonts.medium },
                                ]}
                            >
                                {t(`bookings.status.${booking.status}`)}
                            </NText>
                        </View>
                    </View>
                </BlurView>
            </LinearGradient>
        </View>
    )
}

export default function DashboardScreen() {
    const { t } = useTranslation()
    const { theme } = useTheme()
    const { serviceId } = useAdminService()
    const [todayCount, setTodayCount] = useState<number | null>(null)
    const [serviceConfig, setServiceConfig] = useState<ServiceConfig | null>(null)
    const [carService, setCarService] = useState<CarService | null>(null)
    const [recentBookings, setRecentBookings] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)

    useFocusEffect(
        useCallback(() => {
            if (!serviceId) return
            setLoading(true)
            Promise.all([
                fetch(`/api/appointments?filter=today&serviceId=${serviceId}`).then((r) => r.json()),
                fetch(`/api/appointments?filter=all&serviceId=${serviceId}`).then((r) => r.json()),
                fetch(`/api/service-config?serviceId=${serviceId}`).then((r) => r.json()),
                fetch(`/api/services`).then((r) => r.json()),
            ])
                .then(([today, all, config, allServices]) => {
                    setTodayCount(Array.isArray(today) ? today.length : 0)
                    setRecentBookings(Array.isArray(all) ? all.slice(0, 5) : [])
                    setServiceConfig(config)
                    const match = Array.isArray(allServices)
                        ? (allServices as CarService[]).find((s) => s.id === serviceId) ?? null
                        : null
                    setCarService(match)
                })
                .catch(() => {})
                .finally(() => setLoading(false))
        }, [serviceId])
    )

    const isOpen = serviceConfig?.schedule
        ? isOpenNow(serviceConfig.schedule)
        : null

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            <NText
                style={[
                    styles.sectionTitle,
                    { color: theme.text, fontFamily: fonts.medium },
                ]}
            >
                {t("dashboard.serviceOverview")}
            </NText>

            <View style={styles.statsRow}>
                <StatCard
                    icon="calendar"
                    label={t("dashboard.todaysBookings")}
                    value={loading ? "…" : String(todayCount ?? 0)}
                    color={theme.accentSubtle}
                />
                <StatCard
                    icon="star"
                    label={t("dashboard.rating")}
                    value={
                        loading
                            ? "…"
                            : carService?.rating
                              ? carService.rating.toFixed(1)
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
                        isOpen ? theme.accentSubtle : "rgba(245,158,11,0.3)"
                    }
                />
            </View>

            <NText
                style={[
                    styles.sectionTitle,
                    {
                        color: theme.text,
                        fontFamily: fonts.medium,
                        marginTop: 32,
                    },
                ]}
            >
                {t("dashboard.recentBookings")}
            </NText>

            {recentBookings.length === 0 ? (
                <View style={styles.emptyState}>
                    <LinearGradient
                        colors={[theme.surfaceHigh, theme.surface]}
                        style={styles.emptyGradient}
                    >
                        <BlurView
                            intensity={40}
                            tint={theme.blurTint}
                            style={styles.emptyInner}
                        >
                            <Ionicons
                                name="calendar-outline"
                                size={32}
                                color={theme.textSubtle}
                            />
                            <NText
                                style={[
                                    styles.emptyText,
                                    {
                                        color: theme.textSubtle,
                                        fontFamily: fonts.light,
                                    },
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
                    {recentBookings.map((b) => (
                        <BookingRow key={b.appointmentId} booking={b} />
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
    sectionTitle: {
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
        fontSize: 28,
    },
    statLabel: {
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
        fontSize: 15,
    },
    bookingsList: {
        gap: 12,
    },
    bookingCardWrapper: {
        borderRadius: 20,
        overflow: "hidden",
    },
    bookingCardGradient: {
        padding: 1.5,
        borderRadius: 20,
    },
    bookingCardInner: {
        borderRadius: 18,
        overflow: "hidden",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    bookingRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    bookingMain: {
        flex: 1,
        gap: 2,
    },
    bookingName: {
        fontSize: 15,
    },
    bookingMeta: {
        fontSize: 13,
    },
    bookingDate: {
        fontSize: 12,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 12,
    },
    ratingRow: {
        marginTop: 4,
        gap: 2,
    },
    ratingStars: {
        color: "#f59e0b",
        fontSize: 13,
        letterSpacing: 1,
    },
    ratingComment: {
        fontSize: 12,
        fontStyle: "italic",
    },
})
