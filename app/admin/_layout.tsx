import React, { useEffect, useState } from "react"
import { StyleSheet, View, ScrollView, Pressable, useWindowDimensions } from "react-native"
import { Slot, usePathname, useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { AdminSidebar, SidebarItem } from "../../components/admin/AdminSidebar"
import { AdminTopBar } from "../../components/admin/AdminTopBar"
import { NModal } from "../../components/replacements/NModal"
import { NText } from "../../components/replacements/NText"
import { useAlphaNotice } from "../../hooks/useAlphaNotice"
import { useAuthContext } from "../../context/AuthContext"
import {
    AdminServiceProvider,
    useAdminService,
} from "../../context/AdminServiceContext"
import { fonts } from "../../theme"
import type { ServiceApplication } from "../api/service-applications+api"

const ADMIN_TABS: SidebarItem[] = [
    { key: "dashboard", label: "Dashboard", icon: "grid-outline" },
    { key: "bookings", label: "Bookings", icon: "calendar-outline" },
    { key: "schedule", label: "Schedule", icon: "time-outline" },
    { key: "settings", label: "Settings", icon: "settings-outline" },
]

const ADMIN_ROUTES: Record<string, string> = {
    dashboard: "/admin/dashboard",
    bookings: "/admin/bookings",
    schedule: "/admin/schedule",
    settings: "/admin/settings",
}

export default function AdminLayout() {
    return (
        <AdminServiceProvider>
            <AdminLayoutInner />
        </AdminServiceProvider>
    )
}

function AdminLayoutInner() {
    const router = useRouter()
    const pathname = usePathname()
    const { width } = useWindowDimensions()
    const { userEmail, user } = useAuthContext()
    const { serviceId, serviceName, setService, clearService } = useAdminService()

    const adminNotice = useAlphaNotice("admin-notice")

    const [approvedServices, setApprovedServices] = useState<
        ServiceApplication[]
    >([])
    const [loading, setLoading] = useState(true)
    const [accessDenied, setAccessDenied] = useState(false)

    useEffect(() => {
        if (!userEmail) return
        const uid = user?.getUsername() ?? userEmail
        fetch(`/api/service-applications?userId=${encodeURIComponent(uid)}`)
            .then((r) => r.json())
            .then((data: ServiceApplication[]) => {
                const approved = Array.isArray(data)
                    ? data.filter((a) => a.status === "approved")
                    : []
                setApprovedServices(approved)
                if (approved.length === 0) {
                    setAccessDenied(true)
                } else if (approved.length === 1 && !serviceId) {
                    setService(approved[0].applicationId, approved[0].serviceName)
                }
            })
            .catch(() => setAccessDenied(true))
            .finally(() => setLoading(false))
    }, [userEmail, user])

    useEffect(() => {
        if (accessDenied) {
            router.replace("/" as any)
        }
    }, [accessDenied])

    const collapsed = width < 768

    const activeKey =
        Object.entries(ADMIN_ROUTES).find(
            ([, route]) => pathname === route,
        )?.[0] ?? "dashboard"

    const handleNavigate = (key: string) => {
        if (key === "__customer__") {
            router.push("/" as any)
            return
        }
        if (ADMIN_ROUTES[key]) {
            router.push(ADMIN_ROUTES[key] as any)
        }
    }

    const handleTopBarAction = (key: string) => {
        if (key === "customer") {
            router.push("/" as any)
        }
    }

    if (loading) return null
    if (accessDenied) return null

    // Show service picker if multiple approved services and none selected yet
    if (!serviceId && approvedServices.length > 1) {
        return (
            <View style={styles.pickerContainer}>
                <ScrollView contentContainerStyle={styles.pickerContent}>
                    <NText
                        style={[styles.pickerTitle, { fontFamily: fonts.bold }]}
                    >
                        Select a Service
                    </NText>
                    <NText
                        style={[
                            styles.pickerSubtitle,
                            { fontFamily: fonts.light },
                        ]}
                    >
                        Choose which service you want to manage
                    </NText>
                    <View style={styles.serviceList}>
                        {approvedServices.map((svc) => (
                            <Pressable
                                key={svc.applicationId}
                                onPress={() =>
                                    setService(
                                        svc.applicationId,
                                        svc.serviceName,
                                    )
                                }
                                style={({ pressed }) => [
                                    styles.serviceCardWrapper,
                                    pressed && { opacity: 0.8 },
                                ]}
                            >
                                <LinearGradient
                                    colors={[
                                        "rgba(255,255,255,0.14)",
                                        "rgba(255,255,255,0.05)",
                                    ]}
                                    style={styles.serviceCardGradient}
                                >
                                    <BlurView
                                        intensity={20}
                                        tint="dark"
                                        style={styles.serviceCardInner}
                                    >
                                        <View style={styles.serviceCardIcon}>
                                            <Ionicons
                                                name="business-outline"
                                                size={28}
                                                color="rgba(255,255,255,0.8)"
                                            />
                                        </View>
                                        <View style={styles.serviceCardText}>
                                            <NText
                                                style={[
                                                    styles.serviceCardName,
                                                    { fontFamily: fonts.medium },
                                                ]}
                                            >
                                                {svc.serviceName}
                                            </NText>
                                            <NText
                                                style={[
                                                    styles.serviceCardAddress,
                                                    { fontFamily: fonts.light },
                                                ]}
                                            >
                                                {svc.address}
                                                {svc.type
                                                    ? ` · ${svc.type}`
                                                    : ""}
                                            </NText>
                                        </View>
                                        <Ionicons
                                            name="chevron-forward"
                                            size={18}
                                            color="rgba(255,255,255,0.4)"
                                        />
                                    </BlurView>
                                </LinearGradient>
                            </Pressable>
                        ))}
                    </View>
                </ScrollView>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <AdminSidebar
                items={ADMIN_TABS}
                activeKey={activeKey}
                onNavigate={handleNavigate}
                collapsed={collapsed}
            />
            <View style={styles.content}>
                <AdminTopBar
                    onAction={handleTopBarAction}
                    serviceName={serviceName ?? undefined}
                    onSwitchService={
                        approvedServices.length > 1 ? clearService : undefined
                    }
                />
                <View style={styles.page}>
                    <Slot />
                </View>
            </View>

            <NModal
                visible={adminNotice.visible}
                onDismiss={adminNotice.dismiss}
                title="Admin Preview"
            >
                <NText style={styles.noticeText}>
                    This is only a skeleton admin panel that will be purposed
                    only for registered service centers
                </NText>

                <NText style={styles.noticeText}>
                    You can go back by hitting the "Customer View" button.
                </NText>
            </NModal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "row",
    },
    content: {
        flex: 1,
    },
    page: {
        flex: 1,
        paddingHorizontal: 24,
    },
    noticeText: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 10,
    },
    pickerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    pickerContent: {
        padding: 40,
        alignItems: "center",
        width: "100%",
        maxWidth: 520,
        alignSelf: "center",
    },
    pickerTitle: {
        color: "#ffffff",
        fontSize: 28,
        marginBottom: 8,
        textAlign: "center",
    },
    pickerSubtitle: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 15,
        marginBottom: 32,
        textAlign: "center",
    },
    serviceList: {
        width: "100%",
        gap: 12,
    },
    serviceCardWrapper: {
        borderRadius: 20,
        overflow: "hidden",
    },
    serviceCardGradient: {
        padding: 1.5,
        borderRadius: 20,
    },
    serviceCardInner: {
        borderRadius: 18,
        overflow: "hidden",
        padding: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    serviceCardIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: "rgba(33,168,112,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    serviceCardText: {
        flex: 1,
        gap: 4,
    },
    serviceCardName: {
        color: "#ffffff",
        fontSize: 16,
    },
    serviceCardAddress: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 13,
    },
})
