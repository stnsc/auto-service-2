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
import { useTheme } from "../../context/ThemeContext"
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
    const { theme } = useTheme()

    return (
        <View>
            <View style={styles.scheduleRow}>
                <NText
                    style={[
                        styles.dayName,
                        { color: theme.text, fontFamily: fonts.medium },
                    ]}
                >
                    {dayLabel}
                </NText>
                <View style={styles.hoursSection}>
                    {config.isOpen ? (
                        <NText
                            style={[
                                styles.hoursText,
                                { color: theme.text, fontFamily: fonts.light },
                            ]}
                        >
                            {config.open} – {config.close}
                        </NText>
                    ) : (
                        <NText
                            style={[
                                styles.closedText,
                                {
                                    color: theme.textSubtle,
                                    fontFamily: fonts.light,
                                },
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
                            isEditing ? theme.accentIcon : theme.textSubtle
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
                                {
                                    color: theme.textMuted,
                                    fontFamily: fonts.medium,
                                },
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
                                false: theme.surfaceHigh,
                                true: theme.accentIcon,
                            }}
                            thumbColor={theme.text}
                        />
                    </View>
                    {config.isOpen && (
                        <View style={styles.editTimeRow}>
                            <View style={styles.editTimeField}>
                                <NText
                                    style={[
                                        styles.editLabel,
                                        {
                                            color: theme.textMuted,
                                            fontFamily: fonts.light,
                                        },
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
                                        {
                                            color: theme.textMuted,
                                            fontFamily: fonts.light,
                                        },
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
    const { theme } = useTheme()
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
            <NText
                style={[
                    styles.sectionTitle,
                    { color: theme.text, fontFamily: fonts.medium },
                ]}
            >
                {t("schedule.operatingHours")}
            </NText>
            <NText
                style={[
                    styles.subtitle,
                    { color: theme.textMuted, fontFamily: fonts.regular },
                ]}
            >
                {t("schedule.operatingHoursDesc")}
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
                                    <View
                                        style={[
                                            styles.separator,
                                            { backgroundColor: theme.surfaceMid },
                                        ]}
                                    />
                                )}
                            </React.Fragment>
                        ))}
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
                {t("schedule.slotConfiguration")}
            </NText>
            <NText
                style={[
                    styles.subtitle,
                    { color: theme.textMuted, fontFamily: fonts.regular },
                ]}
            >
                {t("schedule.slotConfigurationDesc")}
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
                        <View style={styles.configSection}>
                            <NText
                                style={[
                                    styles.configLabel,
                                    { color: theme.text, fontFamily: fonts.medium },
                                ]}
                            >
                                {t("schedule.slotDuration")}
                            </NText>
                            <NText
                                style={[
                                    styles.configDesc,
                                    {
                                        color: theme.textMuted,
                                        fontFamily: fonts.regular,
                                    },
                                ]}
                            >
                                {t("schedule.slotDurationDesc")}
                            </NText>
                            <View style={styles.chipRow}>
                                {SLOT_OPTIONS.map((opt) => {
                                    const isActive = slotDuration === opt

                                    return (
                                        <Pressable
                                            key={opt}
                                            onPress={() => setSlotDuration(opt)}
                                            style={[
                                                styles.chip,
                                                {
                                                    backgroundColor: isActive
                                                        ? theme.accentSubtle
                                                        : theme.surfaceMid,
                                                },
                                            ]}
                                        >
                                            <NText
                                                style={[
                                                    styles.chipText,
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
                                                {opt} {t("schedule.min")}
                                            </NText>
                                        </Pressable>
                                    )
                                })}
                            </View>
                        </View>
                        <View
                            style={[
                                styles.separator,
                                { backgroundColor: theme.surfaceMid },
                            ]}
                        />
                        <View style={styles.configSection}>
                            <NText
                                style={[
                                    styles.configLabel,
                                    { color: theme.text, fontFamily: fonts.medium },
                                ]}
                            >
                                {t("schedule.bookingWindow")}
                            </NText>
                            <NText
                                style={[
                                    styles.configDesc,
                                    {
                                        color: theme.textMuted,
                                        fontFamily: fonts.regular,
                                    },
                                ]}
                            >
                                {t("schedule.bookingWindowDesc")}
                            </NText>
                            <View style={styles.chipRow}>
                                {WINDOW_OPTIONS.map((opt) => {
                                    const isActive = bookingWindowWeeks === opt

                                    return (
                                        <Pressable
                                            key={opt}
                                            onPress={() =>
                                                setBookingWindowWeeks(opt)
                                            }
                                            style={[
                                                styles.chip,
                                                {
                                                    backgroundColor: isActive
                                                        ? theme.accentSubtle
                                                        : theme.surfaceMid,
                                                },
                                            ]}
                                        >
                                            <NText
                                                style={[
                                                    styles.chipText,
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
                                                {opt} {t("schedule.weeks")}
                                            </NText>
                                        </Pressable>
                                    )
                                })}
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
        padding: 8,
    },
    scheduleRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 12,
    },
    dayName: {
        fontSize: 15,
        width: 110,
    },
    hoursSection: {
        flex: 1,
    },
    hoursText: {
        fontSize: 14,
    },
    closedText: {
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
        marginHorizontal: 12,
    },
    configSection: {
        paddingVertical: 14,
        paddingHorizontal: 12,
        gap: 8,
    },
    configLabel: {
        fontSize: 15,
    },
    configDesc: {
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
    },
    chipActive: {},
    chipText: {
        fontSize: 13,
    },
    chipTextActive: {},
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
