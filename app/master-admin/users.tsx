import React, { useState, useEffect, useCallback } from "react"
import {
    StyleSheet,
    View,
    ScrollView,
    Pressable,
    TextInput,
    ActivityIndicator,
} from "react-native"
import type { CognitoUser, ActivityLog } from "../api/auth/users+api"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../../components/replacements/NText"
import { fonts } from "../../theme"
import { NModal } from "../../components/replacements/NModal"

function formatDate(iso: string) {
    if (!iso) return "—"
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

function parseUserAgent(ua: string): string {
    if (!ua) return "Unknown device"
    if (ua.includes("iPhone") || ua.includes("iOS")) return "iPhone / iOS"
    if (ua.includes("iPad")) return "iPad / iOS"
    if (ua.includes("Android")) return "Android"
    if (ua.includes("Windows")) return "Windows"
    if (ua.includes("Mac OS X")) return "macOS"
    if (ua.includes("Linux")) return "Linux"
    return ua.slice(0, 48)
}

function ActivityModal({
    user,
    onClose,
}: {
    user: CognitoUser | null
    onClose: () => void
}) {
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!user) return
        setLoading(true)
        setLogs([])
        fetch(`/api/auth/users?email=${encodeURIComponent(user.email)}`)
            .then((r) => r.json())
            .then((data) => setLogs(Array.isArray(data) ? data : []))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [user?.email])

    return (
        <NModal
            visible={!!user}
            onDismiss={onClose}
            title={user?.email ?? ""}
            dismissLabel="Close"
            style={{ width: "92%", maxWidth: 640 }}
        >
            <NText style={[styles.modalSub, { fontFamily: fonts.light }]}>
                Joined {formatDate(user?.createdAt ?? "")}
            </NText>

            <NText style={[styles.sectionLabel, { fontFamily: fonts.medium }]}>
                Login History
            </NText>

            {loading ? (
                <View style={styles.loadingRow}>
                    <ActivityIndicator color="rgba(255,255,255,0.5)" size="small" />
                </View>
            ) : logs.length === 0 ? (
                <NText style={[styles.emptyText, { fontFamily: fonts.light }]}>
                    No login activity recorded.
                </NText>
            ) : (
                logs.map((log, i) => (
                    <View key={i} style={styles.logEntry}>
                        <View style={styles.logLeft}>
                            <Ionicons
                                name={
                                    log.payload?.provider === "google"
                                        ? "logo-google"
                                        : "log-in-outline"
                                }
                                size={16}
                                color="rgba(255,255,255,0.5)"
                            />
                        </View>
                        <View style={styles.logBody}>
                            <NText style={[styles.logTime, { fontFamily: fonts.medium }]}>
                                {formatDate(log.timestamp)}
                            </NText>
                            <NText style={[styles.logMeta, { fontFamily: fonts.light }]}>
                                {parseUserAgent(log.payload?.userAgent ?? "")}
                                {log.payload?.ip ? ` · ${log.payload.ip}` : ""}
                                {log.payload?.location?.country &&
                                log.payload.location.country !== "unknown"
                                    ? ` · ${log.payload.location.country}`
                                    : ""}
                            </NText>
                        </View>
                    </View>
                ))
            )}
        </NModal>
    )
}

function UserRow({
    user,
    onPress,
}: {
    user: CognitoUser
    onPress: (u: CognitoUser) => void
}) {
    const isDisabled = !user.enabled

    return (
        <Pressable onPress={() => onPress(user)} style={styles.userRow}>
            <View style={styles.userAvatar}>
                <NText
                    style={[styles.avatarLetter, { fontFamily: fonts.bold }]}
                >
                    {(user.email[0] ?? "?").toUpperCase()}
                </NText>
            </View>
            <View style={styles.userInfo}>
                <NText
                    style={[styles.userEmail, { fontFamily: fonts.medium }]}
                >
                    {user.email}
                </NText>
                <NText style={[styles.userMeta, { fontFamily: fonts.light }]}>
                    Joined {formatDate(user.createdAt)}
                </NText>
            </View>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                {isDisabled && (
                    <View style={styles.disabledBadge}>
                        <NText
                            style={[
                                styles.badgeText,
                                { fontFamily: fonts.medium },
                            ]}
                        >
                            disabled
                        </NText>
                    </View>
                )}
                <Ionicons
                    name="chevron-forward"
                    size={16}
                    color="rgba(255,255,255,0.3)"
                />
            </View>
        </Pressable>
    )
}

export default function UsersPage() {
    const [users, setUsers] = useState<CognitoUser[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [selectedUser, setSelectedUser] = useState<CognitoUser | null>(null)

    useEffect(() => {
        fetch("/api/auth/users")
            .then(async (r) => {
                const data = await r.json()
                if (!r.ok || data?.error) {
                    setError(data?.error ?? `HTTP ${r.status}`)
                    return
                }
                setUsers(Array.isArray(data) ? data : [])
            })
            .catch((e) => setError(String(e)))
            .finally(() => setLoading(false))
    }, [])

    const filtered = search.trim()
        ? users.filter((u) =>
              u.email.toLowerCase().includes(search.toLowerCase()),
          )
        : users

    return (
        <View style={styles.container}>
            {/* Search */}
            <View style={styles.searchWrapper}>
                <LinearGradient
                    colors={[
                        "rgba(255,255,255,0.1)",
                        "rgba(255,255,255,0.04)",
                    ]}
                    style={styles.searchGradient}
                >
                    <BlurView
                        intensity={20}
                        tint="dark"
                        style={styles.searchInner}
                    >
                        <Ionicons
                            name="search-outline"
                            size={16}
                            color="rgba(255,255,255,0.4)"
                        />
                        <TextInput
                            style={[
                                styles.searchInput,
                                { fontFamily: fonts.regular },
                            ]}
                            placeholder="Search by email…"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={search}
                            onChangeText={setSearch}
                        />
                        {search.length > 0 && (
                            <Pressable onPress={() => setSearch("")}>
                                <Ionicons
                                    name="close-circle"
                                    size={16}
                                    color="rgba(255,255,255,0.4)"
                                />
                            </Pressable>
                        )}
                    </BlurView>
                </LinearGradient>
            </View>

            {/* List */}
            <View style={styles.listCard}>
                <LinearGradient
                    colors={[
                        "rgba(255,255,255,0.12)",
                        "rgba(255,255,255,0.04)",
                    ]}
                    style={styles.cardGradient}
                >
                    <BlurView
                        intensity={20}
                        tint="dark"
                        style={styles.listInner}
                    >
                        {loading ? (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator
                                    color="rgba(255,255,255,0.5)"
                                    size="small"
                                />
                                <NText
                                    style={[
                                        styles.emptyText,
                                        { fontFamily: fonts.light },
                                    ]}
                                >
                                    Loading users…
                                </NText>
                            </View>
                        ) : error ? (
                            <View style={styles.loadingRow}>
                                <Ionicons name="alert-circle-outline" size={18} color="rgba(220,80,80,0.8)" />
                                <NText style={[styles.emptyText, { fontFamily: fonts.light, color: "rgba(220,80,80,0.8)" }]}>
                                    {error}
                                </NText>
                            </View>
                        ) : filtered.length === 0 ? (
                            <NText
                                style={[
                                    styles.emptyText,
                                    { fontFamily: fonts.light },
                                ]}
                            >
                                {search ? "No users match." : "No users found."}
                            </NText>
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {filtered.map((user, i) => (
                                    <React.Fragment key={user.userId}>
                                        <UserRow
                                            user={user}
                                            onPress={setSelectedUser}
                                        />
                                        {i < filtered.length - 1 && (
                                            <View style={styles.separator} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </ScrollView>
                        )}
                    </BlurView>
                </LinearGradient>
            </View>

            <ActivityModal
                user={selectedUser}
                onClose={() => setSelectedUser(null)}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    searchWrapper: {
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 16,
    },
    searchGradient: { padding: 1.5, borderRadius: 14 },
    searchInner: {
        borderRadius: 12,
        overflow: "hidden",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        color: "#ffffff",
        fontSize: 14,
        outlineStyle: "none",
    } as any,

    listCard: { flex: 1, borderRadius: 20, overflow: "hidden" },
    cardGradient: { flex: 1, padding: 1.5, borderRadius: 20 },
    listInner: {
        flex: 1,
        borderRadius: 18,
        overflow: "hidden",
        padding: 8,
    },

    userRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 12,
        gap: 12,
    },
    userAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarLetter: { color: "#ffffff", fontSize: 16 },
    userInfo: { flex: 1, gap: 2 },
    userEmail: { color: "#ffffff", fontSize: 14 },
    userMeta: { color: "rgba(255,255,255,0.45)", fontSize: 12 },
    disabledBadge: {
        backgroundColor: "rgba(220,50,50,0.6)",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    badgeText: { color: "#ffffff", fontSize: 11 },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: "rgba(255,255,255,0.1)",
        marginHorizontal: 12,
    },
    loadingRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: 32,
        gap: 12,
        justifyContent: "center",
    },
    emptyText: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 14,
        textAlign: "center",
        padding: 32,
    },

    logScroll: { maxHeight: 380 },
    modalSub: { color: "rgba(255,255,255,0.45)", fontSize: 12, marginBottom: 16 },
    sectionLabel: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 12,
        textTransform: "uppercase" as const,
        letterSpacing: 1,
        marginBottom: 12,
    },
    logEntry: {
        flexDirection: "row",
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "rgba(255,255,255,0.08)",
    },
    logLeft: {
        width: 24,
        alignItems: "center",
        paddingTop: 2,
    },
    logBody: { flex: 1, gap: 3 },
    logTime: { color: "#ffffff", fontSize: 13 },
    logMeta: { color: "rgba(255,255,255,0.45)", fontSize: 12 },
})
