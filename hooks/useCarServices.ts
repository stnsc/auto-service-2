import { useState, useEffect, useCallback } from "react"
import { CarService } from "../app/types/CarService"
import { CAR_SERVICES } from "../data/carServicesMock"

interface UseCarServicesResult {
    services: CarService[]
    loading: boolean
    error: string | null
    refresh: () => void
}

export function useCarServices(): UseCarServicesResult {
    const [services, setServices] = useState<CarService[]>(CAR_SERVICES)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [tick, setTick] = useState(0)

    const refresh = useCallback(() => setTick((t) => t + 1), [])

    useEffect(() => {
        let cancelled = false

        async function fetchServices() {
            setLoading(true)
            try {
                const res = await fetch("/api/services")
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                const data: CarService[] = await res.json()
                if (!cancelled) {
                    setServices(data.length > 0 ? data : CAR_SERVICES)
                    setLoading(false)
                }
            } catch (err) {
                if (!cancelled) {
                    console.warn("Falling back to mock services:", err)
                    setServices(CAR_SERVICES)
                    setError(
                        err instanceof Error ? err.message : "Unknown error",
                    )
                    setLoading(false)
                }
            }
        }

        fetchServices()
        return () => {
            cancelled = true
        }
    }, [tick])

    return { services, loading, error, refresh }
}
