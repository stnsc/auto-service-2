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
import { useTheme } from "../../context/ThemeContext"
import LocationPicker from "../../components/LocationPicker"
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
    const { theme } = useTheme()

    return (
        <View style={styles.fieldRow}>
            <View style={styles.fieldLabel}>
                <Ionicons name={icon} size={18} color={theme.iconMuted} />
                <NText
                    style={[
                        styles.labelText,
                        { color: theme.text, fontFamily: fonts.medium },
                    ]}
                >
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
    const { theme } = useTheme()
    const { serviceId } = useAdminService()

    const [name, setName] = useState("")
    const [address, setAddress] = useState("")
    const [phone, setPhone] = useState("")
    const [types, setTypes] = useState<string[]>([])
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
                setTypes(
                    Array.isArray(config.type)
                        ? config.type
                        : config.type
                          ? [config.type as unknown as string]
                          : [],
                )
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
                    type: types,
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
            <NText
                style={[
                    styles.sectionTitle,
                    { color: theme.text, fontFamily: fonts.medium },
                ]}
            >
                {t("settings.serviceProfile")}
            </NText>
            <NText
                style={[
                    styles.subtitle,
                    { color: theme.textMuted, fontFamily: fonts.regular },
                ]}
            >
                {t("settings.serviceProfileDesc")}
            </NText>

            <View style={styles.cardWrapper}>
                <LinearGradient
                    colors={[theme.surfaceHigh, theme.surface]}
                    style={styles.cardGradient}
                >
                    <BlurView
                        intensity={40}
                        tint={theme.blurTint}
                        style={styles.cardInner}
                    >
                        <FieldRow
                            label={t("settings.serviceName")}
                            icon="business-outline"
                            placeholder={t("settings.notConfigured")}
                            value={name}
                            onChangeText={setName}
                        />
                        <View
                            style={[
                                styles.separator,
                                { backgroundColor: theme.surfaceMid },
                            ]}
                        />
                        <FieldRow
                            label={t("settings.address")}
                            icon="location-outline"
                            placeholder={t("settings.notConfigured")}
                            value={address}
                            onChangeText={setAddress}
                        />
                        <View
                            style={[
                                styles.separator,
                                { backgroundColor: theme.surfaceMid },
                            ]}
                        />
                        <FieldRow
                            label={t("settings.phone")}
                            icon="call-outline"
                            placeholder={t("settings.notConfigured")}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                        <View
                            style={[
                                styles.separator,
                                { backgroundColor: theme.surfaceMid },
                            ]}
                        />
                        <View style={styles.fieldRow}>
                            <View style={styles.fieldLabel}>
                                <Ionicons
                                    name="construct-outline"
                                    size={18}
                                    color={theme.iconMuted}
                                />
                                <NText
                                    style={[
                                        styles.labelText,
                                        {
                                            color: theme.text,
                                            fontFamily: fonts.medium,
                                        },
                                    ]}
                                >
                                    {t("settings.type")}
                                </NText>
                            </View>
                            <View style={styles.typeChipRow}>
                                {SERVICE_TYPES.map((st) => {
                                    const isActive = types.includes(st)

                                    return (
                                        <Pressable
                                            key={st}
                                            onPress={() =>
                                                setTypes((prev) =>
                                                    prev.includes(st)
                                                        ? prev.filter((t) => t !== st)
                                                        : [...prev, st],
                                                )
                                            }
                                            style={[
                                                styles.typeChip,
                                                {
                                                    backgroundColor: isActive
                                                        ? theme.accentSubtle
                                                        : theme.surfaceMid,
                                                },
                                            ]}
                                        >
                                            <NText
                                                style={[
                                                    styles.typeChipText,
                                                    {
                                                        color: isActive
                                                            ? theme.text
                                                            : theme.textMuted,
                                                        fontFamily: isActive
                                                            ? fonts.medium
                                                            : fonts.regular,
                                                    },
                                                ]}
                                            >
                                                {t(`settings.types.${st}`)}
                                            </NText>
                                        </Pressable>
                                    )
                                })}
                            </View>
                        </View>
                    </BlurView>
                </LinearGradient>
            </View>

            <NText
                style={[
                    styles.sectionTitle,
                    {
                        color: theme.text,
                        fontFamily: fonts.medium,
                        marginTop: 32,
                    },
                ]}
            >
                {t("settings.location")}
            </NText>
            <NText
                style={[
                    styles.subtitle,
                    { color: theme.textMuted, fontFamily: fonts.regular },
                ]}
            >
                {t("settings.locationDesc")}
            </NText>

            <LocationPicker
                latitude={latitude}
                longitude={longitude}
                onLocationChange={(lat, lon) => {
                    setLatitude(String(lat))
                    setLongitude(String(lon))
                }}
                addressHint={address}
            />

            {/* Save button */}
            <Pressable
                onPress={handleSave}
                disabled={isSaving}
                style={[styles.saveWrapper, isSaving && { opacity: 0.5 }]}
            >
                <LinearGradient
                    colors={
                        saveStatus === "ok"
                            ? [theme.accentIcon, theme.accentSubtle]
                            : saveStatus === "err"
                              ? ["rgba(220,50,50,0.5)", "rgba(220,50,50,0.2)"]
                              : [theme.accent, theme.accentSubtle]
                    }
                    style={styles.saveGradient}
                >
                    <BlurView
                        intensity={40}
                        tint={theme.blurTint}
                        style={styles.saveInner}
                    >
                        <NText
                            style={[
                                styles.saveText,
                                { color: theme.text, fontFamily: fonts.medium },
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
        fontSize: 18,
        marginBottom: 4,
    },
    subtitle: {
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
        fontSize: 13,
    },
    fieldInput: {},
    separator: {
        height: StyleSheet.hairlineWidth,
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
    },
    typeChipActive: {},
    typeChipText: {
        fontSize: 12,
    },
    typeChipTextActive: {},
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
        fontSize: 16,
    },
})
