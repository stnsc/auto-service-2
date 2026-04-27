import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react"
import { UserProfile, Vehicle } from "../app/types/UserProfile"
import { useAuthContext } from "./AuthContext"

interface ProfileContextType {
    profile: UserProfile | null
    isLoading: boolean
    saveProfile: (
        updates: Partial<Omit<UserProfile, "userId">>,
    ) => Promise<void>
    addVehicle: (vehicle: Omit<Vehicle, "id">) => Promise<void>
    updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>
    removeVehicle: (id: string) => Promise<void>
    setPrimaryVehicle: (id: string) => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: ReactNode }) {
    const { userEmail, isAuthenticated } = useAuthContext()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!isAuthenticated || !userEmail) return

        setIsLoading(true)
        fetch(`/api/profile?userId=${encodeURIComponent(userEmail)}`)
            .then((r) => r.json())
            .then((data) => {
                setProfile(
                    data ?? {
                        userId: userEmail,
                        firstName: "",
                        lastName: "",
                        phoneNumber: "",
                        vehicles: [],
                        updatedAt: new Date().toISOString(),
                    },
                )
            })
            .catch(() => {
                setProfile({
                    userId: userEmail,
                    firstName: "",
                    lastName: "",
                    phoneNumber: "",
                    vehicles: [],
                    updatedAt: new Date().toISOString(),
                })
            })
            .finally(() => setIsLoading(false))
    }, [isAuthenticated, userEmail])

    const saveProfile = useCallback(
        async (updates: Partial<Omit<UserProfile, "userId">>) => {
            if (!userEmail) return
            const updated: UserProfile = {
                userId: userEmail,
                firstName: "",
                lastName: "",
                phoneNumber: "",
                vehicles: [],
                ...profile,
                ...updates,
            }
            await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updated),
            })
            setProfile(updated)
        },
        [profile, userEmail],
    )

    const addVehicle = useCallback(
        async (vehicleData: Omit<Vehicle, "id">) => {
            const vehicle: Vehicle = {
                ...vehicleData,
                id:
                    typeof crypto !== "undefined" && crypto.randomUUID
                        ? crypto.randomUUID()
                        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            }
            const existing = profile?.vehicles ?? []
            const vehicles = vehicleData.isPrimary
                ? [
                      ...existing.map((v) => ({ ...v, isPrimary: false })),
                      vehicle,
                  ]
                : [...existing, vehicle]
            await saveProfile({ vehicles })
        },
        [profile, saveProfile],
    )

    const updateVehicle = useCallback(
        async (id: string, updates: Partial<Vehicle>) => {
            const vehicles = (profile?.vehicles ?? []).map((v) =>
                v.id === id ? { ...v, ...updates } : v,
            )
            const finalVehicles = updates.isPrimary
                ? vehicles.map((v) =>
                      v.id === id ? v : { ...v, isPrimary: false },
                  )
                : vehicles
            await saveProfile({ vehicles: finalVehicles })
        },
        [profile, saveProfile],
    )

    const removeVehicle = useCallback(
        async (id: string) => {
            const vehicles = (profile?.vehicles ?? []).filter(
                (v) => v.id !== id,
            )
            await saveProfile({ vehicles })
        },
        [profile, saveProfile],
    )

    const setPrimaryVehicle = useCallback(
        async (id: string) => {
            const vehicles = (profile?.vehicles ?? []).map((v) => ({
                ...v,
                isPrimary: v.id === id,
            }))
            await saveProfile({ vehicles })
        },
        [profile, saveProfile],
    )

    return (
        <ProfileContext.Provider
            value={{
                profile,
                isLoading,
                saveProfile,
                addVehicle,
                updateVehicle,
                removeVehicle,
                setPrimaryVehicle,
            }}
        >
            {children}
        </ProfileContext.Provider>
    )
}

export function useProfileContext() {
    const context = useContext(ProfileContext)
    if (!context) {
        throw new Error("useProfileContext must be used within ProfileProvider")
    }
    return context
}
