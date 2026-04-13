import React from "react"
import { StyleSheet, View, ScrollView } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../../components/replacements/NText"
import { NInput } from "../../components/replacements/NInput"
import { fonts } from "../../theme"

function FieldRow({ label, icon }: { label: string; icon: keyof typeof Ionicons.glyphMap }) {
    return (
        <View style={styles.fieldRow}>
            <View style={styles.fieldLabel}>
                <Ionicons name={icon} size={18} color="rgba(255,255,255,0.5)" />
                <NText style={[styles.labelText, { fontFamily: fonts.medium }]}>
                    {label}
                </NText>
            </View>
            <NInput
                placeholder="Not configured"
                editable={false}
                style={styles.fieldInput}
            />
        </View>
    )
}

export default function SettingsScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <NText style={[styles.sectionTitle, { fontFamily: fonts.medium }]}>
                Service Profile
            </NText>
            <NText style={styles.subtitle}>
                Manage your service center information
            </NText>

            <View style={styles.cardWrapper}>
                <LinearGradient
                    colors={["rgba(255,255,255,0.15)", "rgba(255,255,255,0.05)"]}
                    style={styles.cardGradient}
                >
                    <BlurView intensity={20} tint="dark" style={styles.cardInner}>
                        <FieldRow label="Service Name" icon="business-outline" />
                        <View style={styles.separator} />
                        <FieldRow label="Address" icon="location-outline" />
                        <View style={styles.separator} />
                        <FieldRow label="Phone" icon="call-outline" />
                        <View style={styles.separator} />
                        <FieldRow label="Type" icon="construct-outline" />
                    </BlurView>
                </LinearGradient>
            </View>

            <NText style={[styles.sectionTitle, { fontFamily: fonts.medium, marginTop: 32 }]}>
                Location
            </NText>
            <NText style={styles.subtitle}>
                Service center coordinates
            </NText>

            <View style={styles.cardWrapper}>
                <LinearGradient
                    colors={["rgba(255,255,255,0.15)", "rgba(255,255,255,0.05)"]}
                    style={styles.cardGradient}
                >
                    <BlurView intensity={20} tint="dark" style={styles.cardInner}>
                        <View style={styles.coordRow}>
                            <View style={styles.coordItem}>
                                <NText style={[styles.coordLabel, { fontFamily: fonts.light }]}>
                                    Latitude
                                </NText>
                                <NText style={[styles.coordValue, { fontFamily: fonts.medium }]}>
                                    —
                                </NText>
                            </View>
                            <View style={styles.coordItem}>
                                <NText style={[styles.coordLabel, { fontFamily: fonts.light }]}>
                                    Longitude
                                </NText>
                                <NText style={[styles.coordValue, { fontFamily: fonts.medium }]}>
                                    —
                                </NText>
                            </View>
                        </View>
                    </BlurView>
                </LinearGradient>
            </View>

            {/* Save button (disabled placeholder) */}
            <View style={styles.saveWrapper}>
                <LinearGradient
                    colors={["rgba(33,168,112,0.4)", "rgba(33,168,112,0.15)"]}
                    style={styles.saveGradient}
                >
                    <BlurView intensity={20} tint="dark" style={styles.saveInner}>
                        <NText style={[styles.saveText, { fontFamily: fonts.medium }]}>
                            Save Changes
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
        marginBottom: 4,
    },
    subtitle: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 14,
        marginBottom: 16,
    },
    cardWrapper: {
        borderRadius: 20,
        overflow: "hidden",
    },
    cardGradient: {
        padding: 1.5,
        borderRadius: 20,
    },
    cardInner: {
        borderRadius: 18,
        overflow: "hidden",
        padding: 16,
    },
    fieldRow: {
        gap: 8,
        paddingVertical: 8,
    },
    fieldLabel: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    labelText: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 13,
    },
    fieldInput: {
        opacity: 0.6,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: "rgba(255,255,255,0.12)",
        marginVertical: 4,
    },
    coordRow: {
        flexDirection: "row",
        gap: 24,
    },
    coordItem: {
        flex: 1,
        gap: 4,
    },
    coordLabel: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 13,
    },
    coordValue: {
        color: "#ffffff",
        fontSize: 16,
    },
    saveWrapper: {
        marginTop: 32,
        borderRadius: 20,
        overflow: "hidden",
        opacity: 0.5,
    },
    saveGradient: {
        padding: 1.5,
        borderRadius: 20,
    },
    saveInner: {
        borderRadius: 18,
        overflow: "hidden",
        paddingVertical: 16,
        alignItems: "center",
    },
    saveText: {
        color: "#ffffff",
        fontSize: 16,
    },
})
