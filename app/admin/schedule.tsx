import React, { useEffect, useState } from "react"
import { StyleSheet, View, ScrollView, Pressable, Switch } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../../components/replacements/NText"
import { NInput } from "../../components/replacements/NInput"
import { fonts } from "../../theme"
import { useTranslation } from "react-i18next"
import type {
    ServiceConfig,
    WeekSchedule,
    DayKey,
    DayConfig,
} from "../api/service-config+api"
import { useAdminService } from "../../context/AdminServiceContext"
import "../../i18n"

const SCHEDULE_DAYS: DayKey[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
]

const SLOT_OPTIONS = [15, 30, 45, 60]
const WINDOW_OPTIONS = [1, 2, 4, 6, 8, 12]

function DayRow({
    dayKey,
    dayLabel,
    config,
    isEditing,
    onEdit,
    onChange,
}: {
    dayKey: DayKey
    dayLabel: string
    config: DayConfig
    isEditing: boolean
    onEdit: () => void
    onChange: (updated: DayConfig) => void
}) {
    const { t } = useTranslation()
    return (
        <View>
            <View style={styles.scheduleRow}>
                <NText style={[styles.dayName, { fontFamily: fonts.medium }]}>
                    {dayLabel}
                </NText>
                <View style={styles.hoursSection}>
                    {config.isOpen ? (
                        <NText
                            style={[
                                styles.hoursText,
                                { fontFamily: fonts.light },
                            ]}
                        >
                            {config.open} – {config.close}
                        </NText>
                    ) : (
                        <NText
                            style={[
                                styles.closedText,
                                { fontFamily: fonts.light },
                            ]}
                        >
                            {t("schedule.closed")}
                        </NText>
                    )}
                </View>
                <Pressable onPress={onEdit} style={styles.editIconBtn}>
                    <Ionicons
                        name={isEditing ? "checkmark-circle" : "create-outline"}
                        size={18}
                        color={
                            isEditing
                                ? "rgba(33,168,112,0.9)"
                                : "rgba(255,255,255,0.3)"
                        }
                    />
                </Pressable>
            </View>

            {isEditing && (
                <View style={styles.editArea}>
                    <View style={styles.editToggleRow}>
                        <NText
                            style={[
                                styles.editLabel,
                                { fontFamily: fonts.medium },
                            ]}
                        >
                            {config.isOpen
                                ? t("schedule.dayOpen")
                                : t("schedule.dayClosed")}
                        </NText>
                        <Switch
                            value={config.isOpen}
                            onValueChange={(val) =>
                                onChange({ ...config, isOpen: val })
                            }
                            trackColor={{
                                false: "rgba(255,255,255,0.15)",
                                true: "rgba(33,168,112,0.7)",
                            }}
                            thumbColor="#ffffff"
                        />
                    </View>
                    {config.isOpen && (
                        <View style={styles.editTimeRow}>
                            <View style={styles.editTimeField}>
                                <NText
                                    style={[
                                        styles.editLabel,
                                        { fontFamily: fonts.light },
                                    ]}
                                >
                                    {t("schedule.openTime")}
                                </NText>
                                <NInput
                                    value={config.open}
                                    onChangeText={(val) =>
                                        onChange({ ...config, open: val })
                                    }
                                    placeholder="09:00"
                                    style={styles.timeInput}
                                />
                            </View>
                            <View style={styles.editTimeField}>
                                <NText
                                    style={[
                                        styles.editLabel,
                                        { fontFamily: fonts.light },
                                    ]}
                                >
                                    {t("schedule.closeTime")}
                                </NText>
                                <NInput
                                    value={config.close}
                                    onChangeText={(val) =>
                                        onChange({ ...config, close: val })
                                    }
                                    placeholder="17:00"
                                    style={styles.timeInput}
                                />
                            </View>
                        </View>
                    )}
                </View>
            )}
        </View>
    )
}

export default function ScheduleScreen() {
    const { t } = useTranslation()
    const { serviceId } = useAdminService()
    const DAYS = t("schedule.days", { returnObjects: true }) as string[]

    const [schedule, setSchedule] = useState<WeekSchedule | null>(null)
    const [slotDuration, setSlotDuration] = useState(30)
    const [bookingWindowWeeks, setBookingWindowWeeks] = useState(8)
    const [editingDay, setEditingDay] = useState<DayKey | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState<"idle" | "ok" | "err">("idle")

    useEffect(() => {
        if (!serviceId) return
        fetch(`/api/service-config?serviceId=${serviceId}`)
            .then((r) => r.json())
            .then((config: ServiceConfig) => {
                setSchedule(config.schedule)
                setSlotDuration(config.slotDuration ?? 30)
                setBookingWindowWeeks(config.bookingWindowWeeks ?? 8)
            })
            .catch(() => {})
    }, [serviceId])

    const handleDayChange = (dayKey: DayKey, updated: DayConfig) => {
        setSchedule((prev) => (prev ? { ...prev, [dayKey]: updated } : prev))
    }

    const handleSave = async () => {
        if (!schedule) return
        setIsSaving(true)
        setSaveStatus("idle")
        try {
            // Fetch current config to merge with
            const current = await fetch(`/api/service-config?serviceId=${serviceId}`).then((r) =>
                r.json(),
            )
            const res = await fetch("/api/service-config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...current,
                    serviceId,
                    schedule,
                    slotDuration,
                    bookingWindowWeeks,
                }),
            })
            setSaveStatus(res.ok ? "ok" : "err")
        } catch {
            setSaveStatus("err")
        } finally {
            setIsSaving(false)
            setEditingDay(null)
            setTimeout(() => setSaveStatus("idle"), 3000)
        }
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            <NText style={[styles.sectionTitle, { fontFamily: fonts.medium }]}>
                {t("schedule.operatingHours")}
            </NText>
            <NText style={styles.subtitle}>
                {t("schedule.operatingHoursDesc")}
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
                        {SCHEDULE_DAYS.map((dayKey, index) => (
                            <React.Fragment key={dayKey}>
                                <DayRow
                                    dayKey={dayKey}
                                    dayLabel={DAYS[index]}
                                    config={
                                        schedule?.[dayKey] ?? {
                                            isOpen: false,
                                            open: "09:00",
                                            close: "17:00",
                                        }
                                    }
                                    isEditing={editingDay === dayKey}
                                    onEdit={() =>
                                        setEditingDay(
                                            editingDay === dayKey
                                                ? null
                                                : dayKey,
                                        )
                                    }
                                    onChange={(updated) =>
                                        handleDayChange(dayKey, updated)
                                    }
                                />
                                {index < SCHEDULE_DAYS.length - 1 && (
                                    <View style={styles.separator} />
                                )}
                            </React.Fragment>
                        ))}
                    </BlurView>
                </LinearGradient>
            </View>

            <NText
                style={[
                    styles.sectionTitle,
                    { fontFamily: fonts.medium, marginTop: 32 },
                ]}
            >
                {t("schedule.slotConfiguration")}
            </NText>
            <NText style={styles.subtitle}>
                {t("schedule.slotConfigurationDesc")}
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
                        <View style={styles.configSection}>
                            <NText
                                style={[
                                    styles.configLabel,
                                    { fontFamily: fonts.medium },
                                ]}
                            >
                                {t("schedule.slotDuration")}
                            </NText>
                            <NText style={styles.configDesc}>
                                {t("schedule.slotDurationDesc")}
                            </NText>
                            <View style={styles.chipRow}>
                                {SLOT_OPTIONS.map((opt) => (
                                    <Pressable
                                        key={opt}
                                        onPress={() => setSlotDuration(opt)}
                                        style={[
                                            styles.chip,
                                            slotDuration === opt &&
                                                styles.chipActive,
                                        ]}
                                    >
                                        <NText
                                            style={[
                                                styles.chipText,
                                                slotDuration === opt &&
                                                    styles.chipTextActive,
                                                {
                                                    fontFamily:
                                                        slotDuration === opt
                                                            ? fonts.medium
                                                            : fonts.regular,
                                                },
                                            ]}
                                        >
                                            {opt} {t("schedule.min")}
                                        </NText>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.configSection}>
                            <NText
                                style={[
                                    styles.configLabel,
                                    { fontFamily: fonts.medium },
                                ]}
                            >
                                {t("schedule.bookingWindow")}
                            </NText>
                            <NText style={styles.configDesc}>
                                {t("schedule.bookingWindowDesc")}
                            </NText>
                            <View style={styles.chipRow}>
                                {WINDOW_OPTIONS.map((opt) => (
                                    <Pressable
                                        key={opt}
                                        onPress={() =>
                                            setBookingWindowWeeks(opt)
                                        }
                                        style={[
                                            styles.chip,
                                            bookingWindowWeeks === opt &&
                                                styles.chipActive,
                                        ]}
                                    >
                                        <NText
                                            style={[
                                                styles.chipText,
                                                bookingWindowWeeks === opt &&
                                                    styles.chipTextActive,
                                                {
                                                    fontFamily:
                                                        bookingWindowWeeks ===
                                                        opt
                                                            ? fonts.medium
                                                            : fonts.regular,
                                                },
                                            ]}
                                        >
                                            {opt} {t("schedule.weeks")}
                                        </NText>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    </BlurView>
                </LinearGradient>
            </View>

            {/* Save button */}
            <Pressable
                onPress={handleSave}
                disabled={isSaving || !schedule}
                style={[
                    styles.saveWrapper,
                    (isSaving || !schedule) && { opacity: 0.5 },
                ]}
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
                                ? t("schedule.savingChanges")
                                : saveStatus === "ok"
                                  ? t("schedule.saved")
                                  : saveStatus === "err"
                                    ? t("schedule.saveError")
                                    : t("schedule.saveChanges")}
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
        padding: 8,
    },
    scheduleRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 12,
    },
    dayName: {
        color: "#ffffff",
        fontSize: 15,
        width: 110,
    },
    hoursSection: {
        flex: 1,
    },
    hoursText: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 14,
    },
    closedText: {
        color: "rgba(255,255,255,0.3)",
        fontSize: 14,
    },
    editIconBtn: {
        padding: 4,
        marginLeft: 8,
    },
    editArea: {
        paddingHorizontal: 12,
        paddingBottom: 14,
        gap: 12,
    },
    editToggleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    editLabel: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 13,
    },
    editTimeRow: {
        flexDirection: "row",
        gap: 12,
    },
    editTimeField: {
        flex: 1,
        gap: 4,
    },
    timeInput: {
        fontSize: 14,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: "rgba(255,255,255,0.12)",
        marginHorizontal: 12,
    },
    configSection: {
        paddingVertical: 14,
        paddingHorizontal: 12,
        gap: 8,
    },
    configLabel: {
        color: "#ffffff",
        fontSize: 15,
    },
    configDesc: {
        color: "rgba(255,255,255,0.45)",
        fontSize: 13,
    },
    chipRow: {
        flexDirection: "row",
        gap: 8,
        flexWrap: "wrap",
        marginTop: 4,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    chipActive: {
        backgroundColor: "rgba(33,168,112,0.45)",
    },
    chipText: {
        color: "rgba(255,255,255,0.55)",
        fontSize: 13,
    },
    chipTextActive: {
        color: "#ffffff",
    },
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
