import React from "react"
import { StyleSheet, View } from "react-native"
import { usePathname } from "expo-router"
import { NText } from "../replacements/NText"
import { NContextMenu, MenuAction } from "../replacements/NContextMenu"
import { Ionicons } from "@expo/vector-icons"
import { fonts } from "../../theme"
import { useTranslation } from "react-i18next"
import "../../i18n"

interface AdminTopBarProps {
    onAction?: (key: string) => void
}

export function AdminTopBar({ onAction }: AdminTopBarProps) {
    const { t } = useTranslation()
    const pathname = usePathname()

    const PAGE_TITLES: Record<string, string> = {
        "/admin/dashboard": t("adminNav.dashboard"),
        "/admin/bookings": t("adminNav.bookings"),
        "/admin/schedule": t("adminNav.schedule"),
        "/admin/settings": t("adminNav.settings"),
    }

    const ADMIN_CONTEXT: MenuAction[] = [
        {
            key: "profile",
            label: t("adminNav.serviceProfile"),
            icon: <Ionicons name="business-outline" size={18} color="white" />,
        },
        {
            key: "customer",
            label: t("adminNav.customerView"),
            icon: (
                <Ionicons
                    name="swap-horizontal-outline"
                    size={18}
                    color="white"
                />
            ),
        },
    ]

    const title = PAGE_TITLES[pathname] ?? t("adminNav.dashboard")

    return (
        <View style={styles.container}>
            <NText style={[styles.title, { fontFamily: fonts.bold }]}>
                {title}
            </NText>

            <View style={styles.right}>
                <NText style={[styles.badge, { fontFamily: fonts.light }]}>
                    {t("adminNav.adminBadge")}
                </NText>
                <NContextMenu
                    avatar={<Ionicons name="person" size={22} color="white" />}
                    onAction={(key) => onAction?.(key)}
                    actions={ADMIN_CONTEXT}
                />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    title: {
        color: "#ffffff",
        fontSize: 24,
    },
    right: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    badge: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 12,
    },
})
