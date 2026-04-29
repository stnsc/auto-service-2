import React, { useEffect, useState } from "react"
import { StyleSheet, View, ScrollView, Pressable } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../../components/replacements/NText"
import { NInput } from "../../components/replacements/NInput"
import { fonts } from "../../theme"
import { useTranslation } from "react-i18next"
import type { ServiceConfig } from "../api/service-config+api"
import { useAdminService } from "../../context/AdminServiceContext"
import "../../i18n"

const SERVICE_TYPES = [
    "mechanic",
    "tire_shop",
    "car_wash",
    "body_shop",
    "oil_change",
    "towing",
]

function FieldRow({
    label,
    icon,
    placeholder,
    value,
    onChangeText,
    keyboardType,
}: {
    label: string
    icon: keyof typeof Ionicons.glyphMap
    placeholder: string
    value: string
    onChangeText: (text: string) => void
    keyboardType?: "default" | "phone-pad" | "decimal-pad"
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
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType ?? "default"}
                style={styles.fieldInput}
            />
        </View>
    )
}

export default function SettingsScreen() {
    const { t } = useTranslation()
    const { serviceId } = useAdminService()

    const [name, setName] = useState("")
    const [address, setAddress] = useState("")
    const [phone, setPhone] = useState("")
    const [type, setType] = useState("")
    const [latitude, setLatitude] = useState("")
    const [longitude, setLongitude] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState<"idle" | "ok" | "err">("idle")
    const [currentConfig, setCurrentConfig] = useState<ServiceConfig | null>(
        null,
    )

    useEffect(() => {
        if (!serviceId) return
        fetch(`/api/service-config?serviceId=${serviceId}`)
            .then((r) => r.json())
            .then((config: ServiceConfig) => {
                setCurrentConfig(config)
                setName(config.name ?? "")
                setAddress(config.address ?? "")
                setPhone(config.phone ?? "")
                setType(config.type ?? "")
                setLatitude(
                    config.latitude != null ? String(config.latitude) : "",
                )
                setLongitude(
                    config.longitude != null ? String(config.longitude) : "",
                )
            })
            .catch(() => {})
    }, [serviceId])

    const handleSave = async () => {
        setIsSaving(true)
        setSaveStatus("idle")
        try {
            const res = await fetch("/api/service-config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...currentConfig,
                    serviceId,
                    name,
                    address,
                    phone,
                    type,
                    latitude: latitude ? parseFloat(latitude) : null,
                    longitude: longitude ? parseFloat(longitude) : null,
                }),
            })
            if (res.ok) {
                const updated = await res.json()
                setCurrentConfig(updated)
                setSaveStatus("ok")
            } else {
                setSaveStatus("err")
            }
        } catch {
            setSaveStatus("err")
        } finally {
            setIsSaving(false)
            setTimeout(() => setSaveStatus("idle"), 3000)
        }
    }

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
                            value={name}
                            onChangeText={setName}
                        />
                        <View style={styles.separator} />
                        <FieldRow
                            label={t("settings.address")}
                            icon="location-outline"
                            placeholder={t("settings.notConfigured")}
                            value={address}
                            onChangeText={setAddress}
                        />
                        <View style={styles.separator} />
                        <FieldRow
                            label={t("settings.phone")}
                            icon="call-outline"
                            placeholder={t("settings.notConfigured")}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                        <View style={styles.separator} />
                        <View style={styles.fieldRow}>
                            <View style={styles.fieldLabel}>
                                <Ionicons
                                    name="construct-outline"
                                    size={18}
                                    color="rgba(255,255,255,0.5)"
                                />
                                <NText
                                    style={[
                                        styles.labelText,
                                        { fontFamily: fonts.medium },
                                    ]}
                                >
                                    {t("settings.type")}
                                </NText>
                            </View>
                            <View style={styles.typeChipRow}>
                                {SERVICE_TYPES.map((st) => (
                                    <Pressable
                                        key={st}
                                        onPress={() => setType(st)}
                                        style={[
                                            styles.typeChip,
                                            type === st &&
                                                styles.typeChipActive,
                                        ]}
                                    >
                                        <NText
                                            style={[
                                                styles.typeChipText,
                                                type === st &&
                                                    styles.typeChipTextActive,
                                                {
                                                    fontFamily:
                                                        type === st
                                                            ? fonts.medium
                                                            : fonts.regular,
                                                },
                                            ]}
                                        >
                                            {t(`settings.types.${st}`)}
                                        </NText>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
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
                                <NInput
                                    placeholder="45.0000"
                                    value={latitude}
                                    onChangeText={setLatitude}
                                    keyboardType="decimal-pad"
                                    style={styles.coordInput}
                                />
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
                                <NInput
                                    placeholder="25.0000"
                                    value={longitude}
                                    onChangeText={setLongitude}
                                    keyboardType="decimal-pad"
                                    style={styles.coordInput}
                                />
                            </View>
                        </View>
                    </BlurView>
                </LinearGradient>
            </View>

            {/* Save button */}
            <Pressable
                onPress={handleSave}
                disabled={isSaving}
                style={[styles.saveWrapper, isSaving && { opacity: 0.5 }]}
            >
                <LinearGradient
                    colors={
                        saveStatus === "ok"
                            ? ["rgba(33,168,112,0.6)", "rgba(33,168,112,0.3)"]
                            : saveStatus === "err"
                              ? ["rgba(220,50,50,0.5)", "rgba(220,50,50,0.2)"]
                              : [
                                    "rgba(33,168,112,0.4)",
                                    "rgba(33,168,112,0.15)",
                                ]
                    }
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
                            {isSaving
                                ? t("settings.saving")
                                : saveStatus === "ok"
                                  ? t("settings.saved")
                                  : saveStatus === "err"
                                    ? t("settings.saveError")
                                    : t("settings.saveChanges")}
                        </NText>
                    </BlurView>
                </LinearGradient>
            </Pressable>
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
    fieldInput: {},
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: "rgba(255,255,255,0.12)",
        marginVertical: 4,
    },
    typeChipRow: {
        flexDirection: "row",
        gap: 8,
        flexWrap: "wrap",
    },
    typeChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    typeChipActive: {
        backgroundColor: "rgba(33,168,112,0.45)",
    },
    typeChipText: {
        color: "rgba(255,255,255,0.55)",
        fontSize: 12,
    },
    typeChipTextActive: {
        color: "#ffffff",
    },
    coordRow: {
        flexDirection: "row",
        gap: 16,
    },
    coordItem: {
        flex: 1,
        gap: 6,
    },
    coordLabel: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 13,
    },
    coordInput: {},
    saveWrapper: {
        marginTop: 32,
        borderRadius: 20,
        overflow: "hidden",
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
