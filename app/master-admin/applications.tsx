import React, { useState, useEffect, useCallback } from "react"
import { StyleSheet, View, ScrollView, Pressable, TextInput } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../../components/replacements/NText"
import { fonts } from "../../theme"
import { useTranslation } from "react-i18next"
import type { ServiceApplication } from "../api/service-applications+api"
import "../../i18n"

type FilterKey = "all" | "pending" | "approved" | "rejected"

const STATUS_COLORS: Record<string, string> = {
    pending: "rgba(245,158,11,0.85)",
    approved: "rgba(33,168,112,0.85)",
    rejected: "rgba(220,50,50,0.75)",
}

function ApplicationCard({
    application,
    onStatusChange,
}: {
    application: ServiceApplication
    onStatusChange: (id: string, status: string) => void
}) {
    const { t } = useTranslation()
    const [updating, setUpdating] = useState(false)
    const [rejectReason, setRejectReason] = useState("")
    const [showReject, setShowReject] = useState(false)
    const statusColor =
        STATUS_COLORS[application.status] ?? STATUS_COLORS.pending

    const handleApprove = async () => {
        setUpdating(true)
        try {
            const res = await fetch("/api/service-applications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicationId: application.applicationId,
                    status: "approved",
                }),
            })
            if (res.ok) onStatusChange(application.applicationId, "approved")
        } catch {}
        setUpdating(false)
    }

    const handleReject = async () => {
        setUpdating(true)
        try {
            const res = await fetch("/api/service-applications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicationId: application.applicationId,
                    status: "rejected",
                    rejectionReason: rejectReason,
                }),
            })
            if (res.ok) {
                onStatusChange(application.applicationId, "rejected")
                setShowReject(false)
            }
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
                                styles.serviceName,
                                { fontFamily: fonts.medium },
                            ]}
                        >
                            {application.serviceName}
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
                                {t(`applications.status.${application.status}`)}
                            </NText>
                        </View>
                    </View>

                    {/* Address & type */}
                    <NText
                        style={[styles.metaLine, { fontFamily: fonts.light }]}
                    >
                        {application.address}
                        {application.type?.length > 0
                            ? ` · ${Array.isArray(application.type) ? application.type.join(", ") : application.type}`
                            : ""}
                    </NText>

                    {/* Applicant */}
                    <NText
                        style={[styles.metaLine, { fontFamily: fonts.light }]}
                    >
                        {application.userName}
                        {application.userEmail
                            ? ` · ${application.userEmail}`
                            : ""}
                    </NText>

                    {/* Phone */}
                    {application.phone ? (
                        <NText
                            style={[
                                styles.metaLine,
                                { fontFamily: fonts.light },
                            ]}
                        >
                            {application.phone}
                        </NText>
                    ) : null}

                    {/* Description */}
                    {application.description ? (
                        <NText
                            style={[
                                styles.description,
                                { fontFamily: fonts.light },
                            ]}
                            numberOfLines={3}
                        >
                            {application.description}
                        </NText>
                    ) : null}

                    {/* Rejection reason */}
                    {application.status === "rejected" &&
                    application.rejectionReason ? (
                        <NText
                            style={[
                                styles.rejectionNote,
                                { fontFamily: fonts.light },
                            ]}
                        >
                            {t("applications.rejectedBecause")}:{" "}
                            {application.rejectionReason}
                        </NText>
                    ) : null}

                    {/* Actions */}
                    {application.status === "pending" && (
                        <View>
                            {showReject ? (
                                <View style={styles.rejectBox}>
                                    <NText
                                        style={[
                                            styles.rejectLabel,
                                            { fontFamily: fonts.light },
                                        ]}
                                    >
                                        {t("applications.rejectReasonLabel")}
                                    </NText>
                                    <TextInput
                                        value={rejectReason}
                                        onChangeText={setRejectReason}
                                        placeholder={t("applications.rejectReasonLabel")}
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        multiline
                                        style={styles.rejectInput}
                                    />
                                    <View style={styles.rejectActions}>
                                        <Pressable
                                            onPress={handleReject}
                                            disabled={updating}
                                            style={[
                                                styles.actionBtn,
                                                styles.rejectConfirmBtn,
                                                updating && { opacity: 0.5 },
                                            ]}
                                        >
                                            <NText
                                                style={[
                                                    styles.actionBtnText,
                                                    {
                                                        fontFamily:
                                                            fonts.medium,
                                                    },
                                                ]}
                                            >
                                                {t(
                                                    "applications.confirmReject",
                                                )}
                                            </NText>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => setShowReject(false)}
                                            style={[
                                                styles.actionBtn,
                                                styles.cancelBtn,
                                            ]}
                                        >
                                            <NText
                                                style={[
                                                    styles.actionBtnText,
                                                    {
                                                        fontFamily:
                                                            fonts.medium,
                                                    },
                                                ]}
                                            >
                                                {t("applications.back")}
                                            </NText>
                                        </Pressable>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.actions}>
                                    <Pressable
                                        onPress={handleApprove}
                                        disabled={updating}
                                        style={[
                                            styles.actionBtn,
                                            styles.approveBtn,
                                            updating && { opacity: 0.5 },
                                        ]}
                                    >
                                        <NText
                                            style={[
                                                styles.actionBtnText,
                                                { fontFamily: fonts.medium },
                                            ]}
                                        >
                                            {t("applications.approve")}
                                        </NText>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => setShowReject(true)}
                                        disabled={updating}
                                        style={[
                                            styles.actionBtn,
                                            styles.rejectBtn,
                                            updating && { opacity: 0.5 },
                                        ]}
                                    >
                                        <NText
                                            style={[
                                                styles.actionBtnText,
                                                { fontFamily: fonts.medium },
                                            ]}
                                        >
                                            {t("applications.reject")}
                                        </NText>
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    )}
                </BlurView>
            </LinearGradient>
        </View>
    )
}

export default function ApplicationsScreen() {
    const { t } = useTranslation()
    const FILTERS: { key: FilterKey; label: string }[] = [
        { key: "all", label: t("applications.filterAll") },
        { key: "pending", label: t("applications.filterPending") },
        { key: "approved", label: t("applications.filterApproved") },
        { key: "rejected", label: t("applications.filterRejected") },
    ]
    const [activeFilter, setActiveFilter] = useState<FilterKey>("all")
    const [applications, setApplications] = useState<ServiceApplication[]>([])
    const [loading, setLoading] = useState(true)

    const fetchApplications = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/service-applications")
            const data = await res.json()
            setApplications(Array.isArray(data) ? data : [])
        } catch {
            setApplications([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchApplications()
    }, [])

    const handleStatusChange = (applicationId: string, status: string) => {
        setApplications((prev) =>
            prev.map((a) =>
                a.applicationId === applicationId
                    ? {
                          ...a,
                          status: status as ServiceApplication["status"],
                      }
                    : a,
            ),
        )
    }

    const filtered =
        activeFilter === "all"
            ? applications
            : applications.filter((a) => a.status === activeFilter)

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
                                {t("applications.loading")}
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
                                name="document-text-outline"
                                size={32}
                                color="rgba(255,255,255,0.3)"
                            />
                            <NText
                                style={[
                                    styles.emptyText,
                                    { fontFamily: fonts.light },
                                ]}
                            >
                                {t("applications.noApplications")}
                            </NText>
                        </BlurView>
                    </LinearGradient>
                </View>
            ) : (
                <View style={styles.list}>
                    {filtered.map((a) => (
                        <ApplicationCard
                            key={a.applicationId}
                            application={a}
                            onStatusChange={handleStatusChange}
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
        gap: 6,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    serviceName: { color: "#ffffff", fontSize: 16, flex: 1, marginRight: 8 },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statusText: { color: "#ffffff", fontSize: 12 },
    metaLine: { color: "rgba(255,255,255,0.55)", fontSize: 13 },
    description: {
        color: "rgba(255,255,255,0.45)",
        fontSize: 13,
        marginTop: 4,
    },
    rejectionNote: {
        color: "rgba(220,100,100,0.8)",
        fontSize: 12,
        marginTop: 4,
    },
    actions: { flexDirection: "row", gap: 8, marginTop: 10 },
    actionBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: "center",
    },
    approveBtn: { backgroundColor: "rgba(33,168,112,0.4)" },
    rejectBtn: { backgroundColor: "rgba(220,50,50,0.3)" },
    rejectConfirmBtn: { backgroundColor: "rgba(220,50,50,0.4)" },
    cancelBtn: { backgroundColor: "rgba(255,255,255,0.1)" },
    actionBtnText: { color: "#ffffff", fontSize: 13 },
    rejectBox: { marginTop: 10, gap: 8 },
    rejectLabel: { color: "rgba(255,255,255,0.5)", fontSize: 13 },
    rejectInput: {
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 8,
        padding: 10,
        color: "#ffffff",
        fontSize: 13,
        minHeight: 60,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(255,255,255,0.15)",
    },
    rejectActions: { flexDirection: "row", gap: 8 },
})
