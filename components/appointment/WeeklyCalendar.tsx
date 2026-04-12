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

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
]

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
    const dayStart = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
    )
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
                colors={[
                    "rgba(255,255,255,0.3)",
                    "rgba(255,255,255,0.05)",
                ]}
                style={styles.gradientStroke}
            >
                <BlurView
                    intensity={30}
                    tint="dark"
                    style={styles.innerContainer}
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
                            <NText style={styles.navArrowText}>{"<"}</NText>
                        </Pressable>
                        <NText style={styles.weekLabel}>{weekLabel}</NText>
                        <Pressable
                            onPress={nextWeek}
                            style={styles.navArrow}
                        >
                            <NText style={styles.navArrowText}>{">"}</NText>
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
                                            isActive && styles.dayPillActive,
                                            past && styles.dayPillPast,
                                        ]}
                                    >
                                        <NText
                                            style={[
                                                styles.dayName,
                                                isActive &&
                                                    styles.dayNameActive,
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
                                            <View style={styles.todayDot} />
                                        )}
                                        {hasSelection && !isActive && (
                                            <View
                                                style={styles.selectionDot}
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
                            <NText style={styles.closedText}>
                                Closed on this day
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
                        <View style={styles.selectionSummary}>
                            <NText style={styles.selectionText}>
                                Selected: {selectedDate} at {selectedTime}
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
    return (
        <Pressable
            onPress={onPress}
            disabled={!slot.available}
            style={styles.slotWrapper}
        >
            <View
                style={[
                    styles.slotChip,
                    !slot.available && styles.slotChipDisabled,
                    isSelected && styles.slotChipSelected,
                ]}
            >
                <NText
                    style={[
                        styles.slotText,
                        !slot.available && styles.slotTextDisabled,
                        isSelected && styles.slotTextSelected,
                    ]}
                >
                    {slot.time}
                </NText>
                {slot.isBooked && (
                    <NText style={styles.bookedLabel}>Booked</NText>
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
        backgroundColor: "rgba(255,255,255,0.05)",
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
        color: "rgba(255,255,255,0.7)",
    },
    weekLabel: {
        fontFamily: fonts.bold,
        fontSize: 14,
        color: "white",
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
        backgroundColor: "rgba(255,255,255,0.08)",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
    },
    dayPillActive: {
        backgroundColor: "rgba(30, 212, 157, 0.35)",
    },
    dayPillPast: {
        opacity: 0.35,
    },
    dayName: {
        fontFamily: fonts.light,
        fontSize: 10,
        color: "rgba(255,255,255,0.6)",
    },
    dayNameActive: {
        color: "rgba(255,255,255,0.9)",
    },
    dayNumber: {
        fontFamily: fonts.bold,
        fontSize: 16,
        color: "white",
    },
    dayNumberActive: {
        color: "white",
    },
    todayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: "rgb(30, 212, 157)",
    },
    selectionDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: "rgba(255, 255, 255, 0.5)",
    },

    // Closed message
    closedContainer: {
        paddingVertical: 30,
        alignItems: "center",
    },
    closedText: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: "rgba(255,255,255,0.4)",
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
        backgroundColor: "rgba(255,255,255,0.1)",
        alignItems: "center",
    },
    slotChipDisabled: {
        backgroundColor: "rgba(255,255,255,0.03)",
        opacity: 0.5,
    },
    slotChipSelected: {
        backgroundColor: "rgba(33, 168, 112, 0.51)",
    },
    slotText: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: "white",
    },
    slotTextDisabled: {
        color: "rgba(255,255,255,0.5)",
    },
    slotTextSelected: {
        fontFamily: fonts.bold,
        color: "white",
    },
    bookedLabel: {
        fontFamily: fonts.light,
        fontSize: 9,
        color: "rgba(255,255,255,0.4)",
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
        color: "rgba(30, 212, 157, 0.9)",
    },
})
