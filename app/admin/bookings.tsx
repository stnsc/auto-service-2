import React, { useState } from "react"
import { StyleSheet, View, ScrollView, Pressable } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../../components/replacements/NText"
import { fonts } from "../../theme"

type FilterKey = "all" | "today" | "upcoming" | "past"

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "today", label: "Today" },
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
]

export default function BookingsScreen() {
    const [activeFilter, setActiveFilter] = useState<FilterKey>("all")

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
                                activeFilter === f.key && styles.filterTextActive,
                                { fontFamily: activeFilter === f.key ? fonts.medium : fonts.regular },
                            ]}
                        >
                            {f.label}
                        </NText>
                    </Pressable>
                ))}
            </View>

            {/* Empty state */}
            <View style={styles.emptyState}>
                <LinearGradient
                    colors={["rgba(255,255,255,0.15)", "rgba(255,255,255,0.05)"]}
                    style={styles.emptyGradient}
                >
                    <BlurView intensity={20} tint="dark" style={styles.emptyInner}>
                        <Ionicons name="calendar-outline" size={32} color="rgba(255,255,255,0.3)" />
                        <NText style={[styles.emptyText, { fontFamily: fonts.light }]}>
                            No bookings yet
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
    filterRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 20,
    },
    filterPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.08)",
    },
    filterPillActive: {
        backgroundColor: "rgba(33,168,112,0.4)",
    },
    filterText: {
        color: "rgba(255,255,255,0.55)",
        fontSize: 14,
    },
    filterTextActive: {
        color: "#ffffff",
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
