import { createContext, useContext, useState, ReactNode } from "react"

interface Message {
    role: "user" | "assistant"
    content: string
}

interface VehicleInfo {
    make: string | null
    model: string | null
    year: number | null
    mileage: number | null
    warningLights: boolean | null
}

interface ChatContextType {
    messages: Message[]
    setMessages: (messages: Message[]) => void
    summary: string
    setSummary: (summary: string) => void
    vehicleInfo: VehicleInfo
    setVehicleInfo: (info: VehicleInfo) => void
    partQuery: string
    setPartQuery: (query: string) => void
    conversationId: string
    clearChat: () => void
}

const generateConversationId = () =>
    `conv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

const defaultVehicleInfo: VehicleInfo = {
    make: null,
    model: null,
    year: null,
    mileage: null,
    warningLights: null,
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
    const [messages, setMessages] = useState<Message[]>([])
    const [summary, setSummary] = useState("")
    const [partQuery, setPartQuery] = useState("")
    const [vehicleInfo, setVehicleInfo] =
        useState<VehicleInfo>(defaultVehicleInfo)
    const [conversationId, setConversationId] = useState(generateConversationId)

    const clearChat = () => {
        setMessages([])
        setSummary("")
        setPartQuery("")
        setVehicleInfo(defaultVehicleInfo)
        setConversationId(generateConversationId())
    }

    return (
        <ChatContext.Provider
            value={{
                messages,
                setMessages,
                summary,
                setSummary,
                vehicleInfo,
                setVehicleInfo,
                partQuery,
                setPartQuery,
                conversationId,
                clearChat,
            }}
        >
            {children}
        </ChatContext.Provider>
    )
}

export function useChatContext() {
    const context = useContext(ChatContext)
    if (!context) {
        throw new Error("useChatContext must be used within ChatProvider")
    }
    return context
}
