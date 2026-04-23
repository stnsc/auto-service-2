import React from "react"
import { StyleSheet, View, ScrollView } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../../components/replacements/NText"
import { fonts } from "../../theme"
import { useTranslation } from "react-i18next"
import "../../i18n"

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

export default function DashboardScreen() {
    const { t } = useTranslation()
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
                    value="—"
                    color="rgba(33,168,112,0.3)"
                />
                <StatCard
                    icon="star"
                    label={t("dashboard.rating")}
                    value="—"
                    color="rgba(59,130,246,0.3)"
                />
                <StatCard
                    icon="time"
                    label={t("dashboard.status")}
                    value="—"
                    color="rgba(245,158,11,0.3)"
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
})
