import React, { useEffect } from "react"
import { StyleSheet, View, useWindowDimensions } from "react-native"
import { Slot, usePathname, useRouter } from "expo-router"
import { AdminSidebar, SidebarItem } from "../../components/admin/AdminSidebar"
import { NText } from "../../components/replacements/NText"
import { useAuthContext } from "../../context/AuthContext"
import { fonts } from "../../theme"

const TABS: SidebarItem[] = [
    { key: "index", label: "Overview", icon: "grid-outline" },
    {
        key: "applications",
        label: "Applications",
        icon: "document-text-outline",
    },
    { key: "appointments", label: "Appointments", icon: "calendar-outline" },
]

const ROUTES: Record<string, string> = {
    index: "/master-admin",
    applications: "/master-admin/applications",
    appointments: "/master-admin/appointments",
}

const PAGE_TITLES: Record<string, string> = {
    "/master-admin": "Overview",
    "/master-admin/applications": "Applications",
    "/master-admin/appointments": "Appointments",
}

export default function MasterAdminLayout() {
    const router = useRouter()
    const pathname = usePathname()
    const { width } = useWindowDimensions()
    const { userEmail } = useAuthContext()

    const masterAdminEmail = process.env.EXPO_PUBLIC_MASTER_ADMIN_EMAIL

    useEffect(() => {
        if (masterAdminEmail && userEmail !== masterAdminEmail) {
            router.replace("/" as any)
        }
    }, [userEmail, masterAdminEmail])

    if (masterAdminEmail && userEmail !== masterAdminEmail) {
        return null
    }

    const collapsed = width < 768

    const activeKey =
        Object.entries(ROUTES).find(([, route]) => pathname === route)?.[0] ??
        "index"

    const handleNavigate = (key: string) => {
        if (key === "__customer__") {
            router.push("/" as any)
            return
        }
        if (ROUTES[key]) {
            router.push(ROUTES[key] as any)
        }
    }

    const title = PAGE_TITLES[pathname] ?? "Master Admin"

    return (
        <View style={styles.container}>
            <AdminSidebar
                items={TABS}
                activeKey={activeKey}
                onNavigate={handleNavigate}
                collapsed={collapsed}
            />
            <View style={styles.content}>
                <View style={styles.topBar}>
                    <NText
                        style={[styles.pageTitle, { fontFamily: fonts.bold }]}
                    >
                        {title}
                    </NText>
                    <NText style={[styles.badge, { fontFamily: fonts.light }]}>
                        MASTER ADMIN
                    </NText>
                </View>
                <View style={styles.page}>
                    <Slot />
                </View>
            </View>
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
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    pageTitle: {
        color: "#ffffff",
        fontSize: 24,
    },
    badge: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 12,
    },
    page: {
        flex: 1,
        paddingHorizontal: 24,
    },
})
