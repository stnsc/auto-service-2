import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
} from "react"
import { Platform } from "react-native"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudyCovariates {
    priorAppExperience: boolean
    ageGroup: string
    serviceTaskFrequency: string
}

export interface StudyTransition {
    route: string
    timestamp: number
}

export type StudyGroup = "A" | "B"
export type StudyStatus = "idle" | "running" | "completed" | "abandoned"

export interface StudySession {
    participantId: string
    group: StudyGroup
    startTime: number
    endTime: number | null
    status: StudyStatus
    transitions: StudyTransition[]
    susAnswers: number[] | null
    covariates: StudyCovariates
}

export interface StudyMetrics {
    totalTransitions: number
    uniqueScreens: string[]
    timeToBookingSeconds: number | null
    taskSuccess: boolean
    susScore: number | null
}

interface StudyContextType {
    session: StudySession | null
    isRunning: boolean
    startSession: (
        group: StudyGroup,
        participantId: string,
        covariates: StudyCovariates,
    ) => void
    recordTransition: (route: string) => void
    completeSession: () => void
    abandonSession: () => void
    saveSusAnswers: (answers: number[]) => void
    computeMetrics: () => StudyMetrics | null
    exportData: () => string
    clearSession: () => void
}

// ─── Storage key ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "study_session"

function loadSession(): StudySession | null {
    if (Platform.OS !== "web") return null
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? (JSON.parse(raw) as StudySession) : null
    } catch {
        return null
    }
}

function saveSession(session: StudySession | null) {
    if (Platform.OS !== "web") return
    try {
        if (session) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
        } else {
            localStorage.removeItem(STORAGE_KEY)
        }
    } catch {}
}

// ─── SUS scoring ─────────────────────────────────────────────────────────────

/**
 * SUS scoring per Brooke (1996):
 * - Odd-numbered questions (index 0,2,4,6,8): answer − 1
 * - Even-numbered questions (index 1,3,5,7,9): 5 − answer
 * - Sum all 10 converted scores (range 0–4 each), multiply by 2.5 → 0–100
 */
export function computeSusScore(answers: number[]): number {
    if (answers.length !== 10) return 0
    let sum = 0
    for (let i = 0; i < 10; i++) {
        if (i % 2 === 0) {
            sum += answers[i] - 1
        } else {
            sum += 5 - answers[i]
        }
    }
    return Math.round(sum * 2.5)
}

export function susScoreLabel(score: number): string {
    if (score >= 90) return "Excellent (A)"
    if (score >= 80) return "Good (B)"
    if (score >= 68) return "Okay (C)"
    if (score >= 51) return "Poor (D)"
    return "Awful (F)"
}

// ─── Context ──────────────────────────────────────────────────────────────────

const StudyContext = createContext<StudyContextType | undefined>(undefined)

export function StudyProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<StudySession | null>(() =>
        loadSession(),
    )
    // Avoid recording the same route twice in a row
    const lastRouteRef = useRef<string | null>(null)

    // Persist whenever session changes
    useEffect(() => {
        saveSession(session)
    }, [session])

    const isRunning = session?.status === "running"

    const startSession = useCallback(
        (
            group: StudyGroup,
            participantId: string,
            covariates: StudyCovariates,
        ) => {
            const newSession: StudySession = {
                participantId,
                group,
                startTime: Date.now(),
                endTime: null,
                status: "running",
                transitions: [],
                susAnswers: null,
                covariates,
            }
            lastRouteRef.current = null
            setSession(newSession)
        },
        [],
    )

    const recordTransition = useCallback((route: string) => {
        setSession((prev) => {
            if (!prev || prev.status !== "running") return prev
            // Skip consecutive duplicates
            const last = prev.transitions[prev.transitions.length - 1]
            if (last && last.route === route) return prev
            return {
                ...prev,
                transitions: [
                    ...prev.transitions,
                    { route, timestamp: Date.now() },
                ],
            }
        })
    }, [])

    const completeSession = useCallback(() => {
        setSession((prev) => {
            if (!prev || prev.status !== "running") return prev
            return { ...prev, status: "completed", endTime: Date.now() }
        })
    }, [])

    const abandonSession = useCallback(() => {
        setSession((prev) => {
            if (!prev || prev.status !== "running") return prev
            return { ...prev, status: "abandoned", endTime: Date.now() }
        })
    }, [])

    const saveSusAnswers = useCallback((answers: number[]) => {
        setSession((prev) => {
            if (!prev) return prev
            return { ...prev, susAnswers: answers }
        })
    }, [])

    const computeMetrics = useCallback((): StudyMetrics | null => {
        if (!session) return null
        const routes = session.transitions.map((t) => t.route)
        const uniqueScreens = [...new Set(routes)]
        const totalTransitions = session.transitions.length
        const timeToBookingSeconds =
            session.endTime && session.status === "completed"
                ? Math.round((session.endTime - session.startTime) / 1000)
                : null
        const taskSuccess = session.status === "completed"
        const susScore =
            session.susAnswers ? computeSusScore(session.susAnswers) : null
        return {
            totalTransitions,
            uniqueScreens,
            timeToBookingSeconds,
            taskSuccess,
            susScore,
        }
    }, [session])

    const exportData = useCallback((): string => {
        if (!session) return "{}"
        const metrics = computeMetrics()
        return JSON.stringify(
            {
                participantId: session.participantId,
                group: session.group,
                covariates: session.covariates,
                startTime: new Date(session.startTime).toISOString(),
                endTime: session.endTime
                    ? new Date(session.endTime).toISOString()
                    : null,
                status: session.status,
                metrics,
                transitions: session.transitions.map((t) => ({
                    route: t.route,
                    secondsFromStart: Math.round(
                        (t.timestamp - session.startTime) / 1000,
                    ),
                })),
                susAnswers: session.susAnswers,
            },
            null,
            2,
        )
    }, [session, computeMetrics])

    const clearSession = useCallback(() => {
        lastRouteRef.current = null
        setSession(null)
    }, [])

    return (
        <StudyContext.Provider
            value={{
                session,
                isRunning,
                startSession,
                recordTransition,
                completeSession,
                abandonSession,
                saveSusAnswers,
                computeMetrics,
                exportData,
                clearSession,
            }}
        >
            {children}
        </StudyContext.Provider>
    )
}

export function useStudyContext() {
    const ctx = useContext(StudyContext)
    if (!ctx) throw new Error("useStudyContext must be used within StudyProvider")
    return ctx
}
