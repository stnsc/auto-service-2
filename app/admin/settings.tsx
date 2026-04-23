import React from "react"
import { StyleSheet, View, ScrollView } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../../components/replacements/NText"
import { NInput } from "../../components/replacements/NInput"
import { fonts } from "../../theme"
import { useTranslation } from "react-i18next"
import "../../i18n"

function FieldRow({
    label,
    icon,
    placeholder,
}: {
    label: string
    icon: keyof typeof Ionicons.glyphMap
    placeholder: string
}) {
    return (
        <View style={styles.fieldRow}>
            <View style={styles.fieldLabel}>
                <Ionicons name={icon} size={18} color="rgba(255,255,255,0.5)" />
                <NText style={[styles.labelText, { fontFamily: fonts.medium }]}>
                    {label}
                </NText>
            </View>
            <NInput
                placeholder={placeholder}
                editable={false}
                style={styles.fieldInput}
            />
        </View>
    )
}

export default function SettingsScreen() {
    const { t } = useTranslation()
    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            <NText style={[styles.sectionTitle, { fontFamily: fonts.medium }]}>
                {t("settings.serviceProfile")}
            </NText>
            <NText style={styles.subtitle}>
                {t("settings.serviceProfileDesc")}
            </NText>

            <View style={styles.cardWrapper}>
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
                        style={styles.cardInner}
                    >
                        <FieldRow
                            label={t("settings.serviceName")}
                            icon="business-outline"
                            placeholder={t("settings.notConfigured")}
                        />
                        <View style={styles.separator} />
                        <FieldRow
                            label={t("settings.address")}
                            icon="location-outline"
                            placeholder={t("settings.notConfigured")}
                        />
                        <View style={styles.separator} />
                        <FieldRow
                            label={t("settings.phone")}
                            icon="call-outline"
                            placeholder={t("settings.notConfigured")}
                        />
                        <View style={styles.separator} />
                        <FieldRow
                            label={t("settings.type")}
                            icon="construct-outline"
                            placeholder={t("settings.notConfigured")}
                        />
                    </BlurView>
                </LinearGradient>
            </View>

            <NText
                style={[
                    styles.sectionTitle,
                    { fontFamily: fonts.medium, marginTop: 32 },
                ]}
            >
                {t("settings.location")}
            </NText>
            <NText style={styles.subtitle}>{t("settings.locationDesc")}</NText>

            <View style={styles.cardWrapper}>
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
                        style={styles.cardInner}
                    >
                        <View style={styles.coordRow}>
                            <View style={styles.coordItem}>
                                <NText
                                    style={[
                                        styles.coordLabel,
                                        { fontFamily: fonts.light },
                                    ]}
                                >
                                    {t("settings.latitude")}
                                </NText>
                                <NText
                                    style={[
                                        styles.coordValue,
                                        { fontFamily: fonts.medium },
                                    ]}
                                >
                                    —
                                </NText>
                            </View>
                            <View style={styles.coordItem}>
                                <NText
                                    style={[
                                        styles.coordLabel,
                                        { fontFamily: fonts.light },
                                    ]}
                                >
                                    {t("settings.longitude")}
                                </NText>
                                <NText
                                    style={[
                                        styles.coordValue,
                                        { fontFamily: fonts.medium },
                                    ]}
                                >
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
                    <BlurView
                        intensity={20}
                        tint="dark"
                        style={styles.saveInner}
                    >
                        <NText
                            style={[
                                styles.saveText,
                                { fontFamily: fonts.medium },
                            ]}
                        >
                            {t("settings.saveChanges")}
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
