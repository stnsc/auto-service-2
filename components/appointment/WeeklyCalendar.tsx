import React, { useState, useMemo, useCallback } from "react"
import { View, StyleSheet, Pressable } from "react-native"
import { NText } from "../replacements/NText"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { fonts } from "../../theme"
import {
    getSlotsForDay,
    formatDateStr,
    TimeSlot,
} from "../../data/serviceAvailability"
import { useTranslation } from "react-i18next"
import { useTheme } from "../../context/ThemeContext"
import "../../i18n"

function getMonday(date: Date): Date {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    return d
}

function getWeekDays(monday: Date): Date[] {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday)
        d.setDate(d.getDate() + i)
        return d
    })
}

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    )
}

function isDayPast(day: Date, today: Date): boolean {
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
    const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
    )
    return dayStart < todayStart
}

interface WeeklyCalendarProps {
    serviceCenterId: string
    selectedDate: string
    selectedTime: string
    onSelectSlot: (date: string, time: string) => void
}

export function WeeklyCalendar({
    serviceCenterId,
    selectedDate,
    selectedTime,
    onSelectSlot,
}: WeeklyCalendarProps) {
    const { t } = useTranslation()
    const { theme } = useTheme()
    const DAY_LABELS = t("calendar.dayLabels", {
        returnObjects: true,
    }) as string[]
    const MONTH_NAMES = t("calendar.monthNames", {
        returnObjects: true,
    }) as string[]
    const today = useMemo(() => new Date(), [])
    const todayMonday = useMemo(() => getMonday(today), [today])

    // Initialize to the week of the already-selected date, or current week
    const [weekStart, setWeekStart] = useState<Date>(() => {
        if (selectedDate) {
            const [y, m, d] = selectedDate.split("-").map(Number)
            return getMonday(new Date(y, m - 1, d))
        }
        return todayMonday
    })

    const [activeDayIndex, setActiveDayIndex] = useState<number>(() => {
        if (selectedDate) {
            const [y, m, d] = selectedDate.split("-").map(Number)
            const sel = new Date(y, m - 1, d)
            const monday = getMonday(sel)
            const diff = Math.round(
                (sel.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24),
            )
            return Math.max(0, Math.min(6, diff))
        }
        // Default to today's index within the week
        const day = today.getDay()
        return day === 0 ? 6 : day - 1
    })

    const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart])
    const activeDate = weekDays[activeDayIndex]
    const activeDateStr = formatDateStr(activeDate)

    const slots = useMemo(
        () => getSlotsForDay(serviceCenterId, activeDate),
        [serviceCenterId, activeDateStr],
    )

    const isCurrentWeek = weekStart.getTime() === todayMonday.getTime()

    const prevWeek = useCallback(() => {
        setWeekStart((prev) => {
            const newStart = new Date(prev)
            newStart.setDate(newStart.getDate() - 7)
            if (newStart < todayMonday) return prev
            setActiveDayIndex(0)
            return newStart
        })
    }, [todayMonday])

    const nextWeek = useCallback(() => {
        setWeekStart((prev) => {
            const maxDate = new Date(todayMonday)
            maxDate.setDate(maxDate.getDate() + 8 * 7)
            const newStart = new Date(prev)
            newStart.setDate(newStart.getDate() + 7)
            if (newStart > maxDate) return prev
            setActiveDayIndex(0)
            return newStart
        })
    }, [todayMonday])

    const weekLabel = `${MONTH_NAMES[weekDays[0].getMonth()]} ${weekDays[0].getDate()} - ${MONTH_NAMES[weekDays[6].getMonth()]} ${weekDays[6].getDate()}`

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[theme.borderStart, theme.borderEnd]}
                style={styles.gradientStroke}
            >
                <BlurView
                    intensity={30}
                    tint={theme.blurTint}
                    style={[
                        styles.innerContainer,
                        { backgroundColor: theme.surface },
                    ]}
                >
                    {/* Week Navigation */}
                    <View style={styles.weekNavRow}>
                        <Pressable
                            onPress={prevWeek}
                            style={[
                                styles.navArrow,
                                isCurrentWeek && styles.navArrowDisabled,
                            ]}
                            disabled={isCurrentWeek}
                        >
                            <NText
                                style={[
                                    styles.navArrowText,
                                    { color: theme.textMuted },
                                ]}
                            >
                                {"<"}
                            </NText>
                        </Pressable>
                        <NText style={styles.weekLabel}>{weekLabel}</NText>
                        <Pressable onPress={nextWeek} style={styles.navArrow}>
                            <NText
                                style={[
                                    styles.navArrowText,
                                    { color: theme.textMuted },
                                ]}
                            >
                                {">"}
                            </NText>
                        </Pressable>
                    </View>

                    {/* Day Selector */}
                    <View style={styles.dayRow}>
                        {weekDays.map((day, index) => {
                            const isActive = index === activeDayIndex
                            const past =
                                isDayPast(day, today) && !isSameDay(day, today)
                            const isToday = isSameDay(day, today)
                            const dateStr = formatDateStr(day)
                            const hasSelection = dateStr === selectedDate

                            return (
                                <Pressable
                                    key={index}
                                    onPress={() => setActiveDayIndex(index)}
                                    disabled={past}
                                    style={styles.dayPillWrapper}
                                >
                                    <View
                                        style={[
                                            styles.dayPill,
                                            {
                                                backgroundColor:
                                                    theme.surfaceMid,
                                            },
                                            isActive && {
                                                backgroundColor: theme.accent,
                                            },
                                            past && styles.dayPillPast,
                                        ]}
                                    >
                                        <NText
                                            style={[
                                                styles.dayName,
                                                { color: theme.textMuted },
                                                isActive && {
                                                    color: theme.text,
                                                },
                                            ]}
                                        >
                                            {DAY_LABELS[index]}
                                        </NText>
                                        <NText
                                            style={[
                                                styles.dayNumber,
                                                isActive &&
                                                    styles.dayNumberActive,
                                            ]}
                                        >
                                            {day.getDate()}
                                        </NText>
                                        {isToday && (
                                            <View
                                                style={[
                                                    styles.todayDot,
                                                    {
                                                        backgroundColor:
                                                            theme.accentSolid,
                                                    },
                                                ]}
                                            />
                                        )}
                                        {hasSelection && !isActive && (
                                            <View
                                                style={[
                                                    styles.selectionDot,
                                                    {
                                                        backgroundColor:
                                                            theme.textMuted,
                                                    },
                                                ]}
                                            />
                                        )}
                                    </View>
                                </Pressable>
                            )
                        })}
                    </View>

                    {/* Time Slots */}
                    {slots.length === 0 ? (
                        <View style={styles.closedContainer}>
                            <NText
                                style={[
                                    styles.closedText,
                                    { color: theme.textSubtle },
                                ]}
                            >
                                {t("calendar.closed")}
                            </NText>
                        </View>
                    ) : (
                        <View style={styles.slotsGrid}>
                            {slots.map((slot) => {
                                const isSelected =
                                    activeDateStr === selectedDate &&
                                    slot.time === selectedTime
                                return (
                                    <SlotChip
                                        key={slot.time}
                                        slot={slot}
                                        isSelected={isSelected}
                                        onPress={() =>
                                            onSelectSlot(
                                                activeDateStr,
                                                slot.time,
                                            )
                                        }
                                    />
                                )
                            })}
                        </View>
                    )}

                    {/* Selection Summary */}
                    {selectedDate !== "" && selectedTime !== "" && (
                        <View
                            style={[
                                styles.selectionSummary,
                                { borderTopColor: theme.surfaceHigh },
                            ]}
                        >
                            <NText
                                style={[
                                    styles.selectionText,
                                    { color: theme.accentSolid },
                                ]}
                            >
                                {t("calendar.selected", {
                                    date: selectedDate,
                                    time: selectedTime,
                                })}
                            </NText>
                        </View>
                    )}
                </BlurView>
            </LinearGradient>
        </View>
    )
}

function SlotChip({
    slot,
    isSelected,
    onPress,
}: {
    slot: TimeSlot
    isSelected: boolean
    onPress: () => void
}) {
    const { theme } = useTheme()
    return (
        <Pressable
            onPress={onPress}
            disabled={!slot.available}
            style={styles.slotWrapper}
        >
            <View
                style={[
                    styles.slotChip,
                    { backgroundColor: theme.surfaceMid },
                    !slot.available && styles.slotChipDisabled,
                    isSelected && { backgroundColor: theme.accent },
                ]}
            >
                <NText
                    style={[
                        styles.slotText,
                        !slot.available && { color: theme.textMuted },
                    ]}
                >
                    {slot.time}
                </NText>
                {slot.isBooked && (
                    <NText
                        style={[
                            styles.bookedLabel,
                            { color: theme.textSubtle },
                        ]}
                    >
                        Booked
                    </NText>
                )}
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 25,
        overflow: "hidden",
    },
    gradientStroke: {
        padding: 1.5,
        borderRadius: 25,
    },
    innerContainer: {
        borderRadius: 23,
        overflow: "hidden",
        padding: 16,
    },

    // Week navigation
    weekNavRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    navArrow: {
        padding: 8,
    },
    navArrowDisabled: {
        opacity: 0.3,
    },
    navArrowText: {
        fontFamily: fonts.bold,
        fontSize: 18,
    },
    weekLabel: {
        fontFamily: fonts.bold,
        fontSize: 14,
    },

    // Day selector
    dayRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    dayPillWrapper: {
        flex: 1,
        alignItems: "center",
    },
    dayPill: {
        width: 44,
        height: 64,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
    },
    dayPillActive: {},
    dayPillPast: {
        opacity: 0.35,
    },
    dayName: {
        fontFamily: fonts.light,
        fontSize: 10,
    },
    dayNameActive: {},
    dayNumber: {
        fontFamily: fonts.bold,
        fontSize: 16,
    },
    dayNumberActive: {},
    todayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    selectionDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },

    // Closed message
    closedContainer: {
        paddingVertical: 30,
        alignItems: "center",
    },
    closedText: {
        fontFamily: fonts.regular,
        fontSize: 14,
    },

    // Time slots grid
    slotsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    slotWrapper: {
        flexBasis: "31%",
        flexGrow: 0,
    },
    slotChip: {
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 16,
        alignItems: "center",
    },
    slotChipDisabled: {
        opacity: 0.5,
    },
    slotChipSelected: {},
    slotText: {
        fontFamily: fonts.regular,
        fontSize: 14,
    },
    slotTextDisabled: {},
    slotTextSelected: {
        fontFamily: fonts.bold,
    },
    bookedLabel: {
        fontFamily: fonts.light,
        fontSize: 9,
        marginTop: 2,
    },

    // Selection summary
    selectionSummary: {
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "rgba(255,255,255,0.15)",
        alignItems: "center",
    },
    selectionText: {
        fontFamily: fonts.regular,
        fontSize: 13,
    },
})
