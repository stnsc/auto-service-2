import React, { useEffect, useState } from "react"
import { StyleSheet, View, ScrollView } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../../components/replacements/NText"
import { fonts } from "../../theme"
import type { ServiceApplication } from "../api/service-applications+api"
import type { Appointment } from "../api/appointments+api"

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

export default function MasterAdminOverview() {
    const [applications, setApplications] = useState<ServiceApplication[]>([])
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            fetch("/api/service-applications").then((r) => r.json()),
            fetch("/api/appointments?scan=true").then((r) => r.json()),
        ])
            .then(([apps, appts]) => {
                setApplications(Array.isArray(apps) ? apps : [])
                setAppointments(Array.isArray(appts) ? appts : [])
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const pendingApps = applications.filter(
        (a) => a.status === "pending",
    ).length
    const approvedApps = applications.filter(
        (a) => a.status === "approved",
    ).length
    const totalAppts = appointments.length
    const pendingAppts = appointments.filter(
        (a) => a.status === "pending",
    ).length

    const recentApplications = applications.slice(0, 5)

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            <NText style={[styles.sectionTitle, { fontFamily: fonts.medium }]}>
                Platform Stats
            </NText>

            <View style={styles.statsRow}>
                <StatCard
                    icon="document-text-outline"
                    label="Pending Applications"
                    value={loading ? "…" : String(pendingApps)}
                    color={
                        pendingApps > 0
                            ? "rgba(245,158,11,0.3)"
                            : "rgba(33,168,112,0.3)"
                    }
                />
                <StatCard
                    icon="business-outline"
                    label="Active Services"
                    value={loading ? "…" : String(approvedApps)}
                    color="rgba(33,168,112,0.3)"
                />
                <StatCard
                    icon="calendar-outline"
                    label="Total Appointments"
                    value={loading ? "…" : String(totalAppts)}
                    color="rgba(59,130,246,0.3)"
                />
                <StatCard
                    icon="time-outline"
                    label="Pending Appointments"
                    value={loading ? "…" : String(pendingAppts)}
                    color="rgba(245,158,11,0.3)"
                />
            </View>

            <NText
                style={[
                    styles.sectionTitle,
                    { fontFamily: fonts.medium, marginTop: 32 },
                ]}
            >
                Recent Applications
            </NText>

            {recentApplications.length === 0 ? (
                <View style={styles.emptyCard}>
                    <LinearGradient
                        colors={[
                            "rgba(255,255,255,0.15)",
                            "rgba(255,255,255,0.05)",
                        ]}
                        style={styles.cardGradient}
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
                                {loading ? "Loading…" : "No applications yet"}
                            </NText>
                        </BlurView>
                    </LinearGradient>
                </View>
            ) : (
                <View style={styles.listCard}>
                    <LinearGradient
                        colors={[
                            "rgba(255,255,255,0.15)",
                            "rgba(255,255,255,0.05)",
                        ]}
                        style={styles.cardGradient}
                    >
                        <BlurView
                            intensity={20}
                            tint="dark"
                            style={styles.listInner}
                        >
                            {recentApplications.map((app, i) => (
                                <React.Fragment key={app.applicationId}>
                                    <View style={styles.appRow}>
                                        <View style={styles.appMain}>
                                            <NText
                                                style={[
                                                    styles.appName,
                                                    {
                                                        fontFamily:
                                                            fonts.medium,
                                                    },
                                                ]}
                                            >
                                                {app.serviceName}
                                            </NText>
                                            <NText
                                                style={[
                                                    styles.appMeta,
                                                    { fontFamily: fonts.light },
                                                ]}
                                            >
                                                {app.userEmail} · {app.address}
                                            </NText>
                                        </View>
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                {
                                                    backgroundColor:
                                                        STATUS_COLORS[
                                                            app.status
                                                        ] ??
                                                        STATUS_COLORS.pending,
                                                },
                                            ]}
                                        >
                                            <NText
                                                style={[
                                                    styles.statusText,
                                                    {
                                                        fontFamily:
                                                            fonts.medium,
                                                    },
                                                ]}
                                            >
                                                {app.status}
                                            </NText>
                                        </View>
                                    </View>
                                    {i < recentApplications.length - 1 && (
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

const STATUS_COLORS: Record<string, string> = {
    pending: "rgba(245,158,11,0.85)",
    approved: "rgba(33,168,112,0.85)",
    rejected: "rgba(220,50,50,0.75)",
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingBottom: 40 },
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
        minWidth: 140,
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
        textAlign: "center",
    },
    emptyCard: { borderRadius: 20, overflow: "hidden" },
    cardGradient: { padding: 1.5, borderRadius: 20 },
    emptyInner: {
        borderRadius: 18,
        overflow: "hidden",
        padding: 32,
        alignItems: "center",
    },
    emptyText: { color: "rgba(255,255,255,0.4)", fontSize: 15 },
    listCard: { borderRadius: 20, overflow: "hidden" },
    listInner: {
        borderRadius: 18,
        overflow: "hidden",
        padding: 8,
    },
    appRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    appMain: { flex: 1, gap: 2 },
    appName: { color: "#ffffff", fontSize: 15 },
    appMeta: { color: "rgba(255,255,255,0.5)", fontSize: 13 },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statusText: { color: "#ffffff", fontSize: 12 },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: "rgba(255,255,255,0.12)",
        marginHorizontal: 12,
    },
})
