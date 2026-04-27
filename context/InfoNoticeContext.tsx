import { createContext, useContext, useRef, useState } from "react"

interface InfoNoticeContextValue {
    register: (fn: (() => void) | null) => void
    replay: () => void
    hasReplay: boolean
}

const InfoNoticeContext = createContext<InfoNoticeContextValue>({
    register: () => {},
    replay: () => {},
    hasReplay: false,
})

export function InfoNoticeProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const replayRef = useRef<(() => void) | null>(null)
    const [hasReplay, setHasReplay] = useState(false)

    const register = (fn: (() => void) | null) => {
        replayRef.current = fn
        setHasReplay(fn !== null)
    }

    const replay = () => {
        replayRef.current?.()
    }

    return (
        <InfoNoticeContext.Provider value={{ register, replay, hasReplay }}>
            {children}
        </InfoNoticeContext.Provider>
    )
}

export function useInfoNotice() {
    return useContext(InfoNoticeContext)
}
