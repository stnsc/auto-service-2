import React from "react"
import { StyleSheet, View, useWindowDimensions } from "react-native"
import { Slot, usePathname, useRouter } from "expo-router"
import { AdminSidebar, SidebarItem } from "../../components/admin/AdminSidebar"
import { AdminTopBar } from "../../components/admin/AdminTopBar"
import { NModal } from "../../components/replacements/NModal"
import { NText } from "../../components/replacements/NText"
import { useAlphaNotice } from "../../hooks/useAlphaNotice"

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
    const router = useRouter()
    const pathname = usePathname()
    const { width } = useWindowDimensions()

    const adminNotice = useAlphaNotice("admin-notice")

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

    return (
        <View style={styles.container}>
            <AdminSidebar
                items={ADMIN_TABS}
                activeKey={activeKey}
                onNavigate={handleNavigate}
                collapsed={collapsed}
            />
            <View style={styles.content}>
                <AdminTopBar onAction={handleTopBarAction} />
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
})
