interface DaySchedule {
    open: string
    close: string
}

interface ServiceSchedule {
    operatingHours: Record<number, DaySchedule | null> // 0=Sun, 1=Mon, ..., 6=Sat
}

export interface TimeSlot {
    time: string
    available: boolean
    isBooked: boolean
}

const SCHEDULES: Record<string, ServiceSchedule> = {
    "1": {
        // AutoFix Brasov: Mon-Fri 08-17, Sat 09-14, Sun closed
        operatingHours: {
            0: null,
            1: { open: "08:00", close: "17:00" },
            2: { open: "08:00", close: "17:00" },
            3: { open: "08:00", close: "17:00" },
            4: { open: "08:00", close: "17:00" },
            5: { open: "08:00", close: "17:00" },
            6: { open: "09:00", close: "14:00" },
        },
    },
    "2": {
        // Danove Auto: Mon-Fri 08:30-18, Sat 08:30-13, Sun closed
        operatingHours: {
            0: null,
            1: { open: "08:30", close: "18:00" },
            2: { open: "08:30", close: "18:00" },
            3: { open: "08:30", close: "18:00" },
            4: { open: "08:30", close: "18:00" },
            5: { open: "08:30", close: "18:00" },
            6: { open: "08:30", close: "13:00" },
        },
    },
    "3": {
        // Instant Car Fix: Mon-Fri 07-19, Fri 07-16, Sat 09-15, Sun 10-14
        operatingHours: {
            0: { open: "10:00", close: "14:00" },
            1: { open: "07:00", close: "19:00" },
            2: { open: "07:00", close: "19:00" },
            3: { open: "07:00", close: "19:00" },
            4: { open: "07:00", close: "19:00" },
            5: { open: "07:00", close: "16:00" },
            6: { open: "09:00", close: "15:00" },
        },
    },
}

const DEFAULT_SCHEDULE: ServiceSchedule = {
    operatingHours: {
        0: null,
        1: { open: "09:00", close: "17:00" },
        2: { open: "09:00", close: "17:00" },
        3: { open: "09:00", close: "17:00" },
        4: { open: "09:00", close: "17:00" },
        5: { open: "09:00", close: "17:00" },
        6: null,
    },
}

function simpleHash(str: string): number {
    let hash = 5381
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) + hash + str.charCodeAt(i)
        hash = hash & hash
    }
    return Math.abs(hash)
}

function isSlotBooked(
    centerId: string,
    dateStr: string,
    timeStr: string,
): boolean {
    return simpleHash(centerId + dateStr + timeStr) % 100 < 27
}

function parseTime(time: string): number {
    const [h, m] = time.split(":").map(Number)
    return h * 60 + m
}

function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function formatDateStr(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}

export function getSlotsForDay(
    serviceCenterId: string,
    date: Date,
): TimeSlot[] {
    const schedule = SCHEDULES[serviceCenterId] ?? DEFAULT_SCHEDULE
    const daySchedule = schedule.operatingHours[date.getDay()]

    if (!daySchedule) return []

    const openMin = parseTime(daySchedule.open)
    const closeMin = parseTime(daySchedule.close)
    const dateStr = formatDateStr(date)

    const now = new Date()
    const todayStr = formatDateStr(now)
    const isToday = dateStr === todayStr
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const slots: TimeSlot[] = []

    for (let min = openMin; min < closeMin; min += 30) {
        const time = minutesToTime(min)
        const isPast = isToday && min <= currentMinutes
        const booked = isSlotBooked(serviceCenterId, dateStr, time)

        slots.push({
            time,
            available: !isPast && !booked,
            isBooked: booked,
        })
    }

    return slots
}
