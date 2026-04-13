import { StyleSheet, View } from "react-native"
import Map, { MapHandle } from "../../components/Map.web"
import { CAR_SERVICES } from "../../data/carServicesMock"
import HorizontalCarousel from "../../components/bundle/HorizontalCarousel"
import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { CarService } from "../../app/types/CarService"
import { useLocalSearchParams } from "expo-router"

// Haversine distance in km between two lat/lng points
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function sortByDistance(lat: number, lon: number, services: CarService[]) {
    return services
        .map((s) => ({
            ...s,
            distance: distanceKm(lat, lon, s.latitude, s.longitude),
        }))
        .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
}

export default function MapScreen() {
    const params = useLocalSearchParams<{
        serviceId?: string
        latitude?: string
        longitude?: string
    }>()

    const initialLatitude = useMemo(() => {
        const parsed = Number(params.latitude)
        return Number.isFinite(parsed) ? parsed : 45.6427 //fallback, set to a random spot in Brasov
    }, [params.latitude])

    const initialLongitude = useMemo(() => {
        const parsed = Number(params.longitude)
        return Number.isFinite(parsed) ? parsed : 25.5887 //fallback, set to a random spot in Brasov
    }, [params.longitude])

    const mapRef = useRef<MapHandle>(null)
    const isFlyingRef = useRef(false) // Track if a flyTo animation is in progress
    const shouldFlyRef = useRef(false) // Track if we should fly to the active service after sorting
    const hasAppliedRouteFocusRef = useRef(false)

    const [sortedServices, setSortedServices] = useState<CarService[]>(
        // Initial sort uses route coordinates when provided.
        sortByDistance(initialLatitude, initialLongitude, CAR_SERVICES),
    )
    const [activeIndex, setActiveIndex] = useState(0)

    useEffect(() => {
        setSortedServices(
            sortByDistance(initialLatitude, initialLongitude, CAR_SERVICES),
        )
        hasAppliedRouteFocusRef.current = false
    }, [initialLatitude, initialLongitude])

    useEffect(() => {
        if (hasAppliedRouteFocusRef.current) return
        hasAppliedRouteFocusRef.current = true

        const selectedServiceId =
            typeof params.serviceId === "string" ? params.serviceId : ""
        if (!selectedServiceId) return

        const index = sortedServices.findIndex(
            (s) => s.id === selectedServiceId,
        )
        if (index === -1) return
        setActiveIndex(index)
        shouldFlyRef.current = true
    }, [params.serviceId, sortedServices])

    // Called whenever the map is panned/zoomed — re-sort by new center
    const handleCenterChange = useCallback((lat: number, lon: number) => {
        if (isFlyingRef.current) {
            isFlyingRef.current = false
            return
        }
        // User panned the map manually — re-sort but do NOT fly
        // shouldFlyRef is intentionally NOT set here
        setSortedServices(sortByDistance(lat, lon, CAR_SERVICES))
        setActiveIndex(0)
    }, [])

    // Called when a marker is tapped — find that service in the sorted list
    const handleServicePress = useCallback(
        (service: CarService) => {
            const index = sortedServices.findIndex((s) => s.id === service.id)
            if (index === -1) return
            shouldFlyRef.current = true // explicit user action, fly to it
            setActiveIndex(index)
        },
        [sortedServices],
    )

    // Wrap setActiveIndex for the carousel so we can set the fly flag
    const handleIndexChange = useCallback((index: number) => {
        shouldFlyRef.current = true // explicit user action, fly to it
        setActiveIndex(index)
    }, [])

    useEffect(() => {
        // Only fly if the user explicitly chose a service
        if (!shouldFlyRef.current) return
        shouldFlyRef.current = false

        const service = sortedServices[activeIndex]
        if (!service) return
        isFlyingRef.current = true
        mapRef.current?.flyTo(service.latitude, service.longitude)
    }, [activeIndex, sortedServices])

    return (
        <View style={styles.container}>
            <View style={styles.mapClip}>
                <Map
                    ref={mapRef}
                    latitude={initialLatitude}
                    longitude={initialLongitude}
                    zoom={14}
                    carServices={CAR_SERVICES}
                    onServicePress={handleServicePress}
                    onCenterChange={handleCenterChange}
                />
            </View>
            <View style={styles.carousel}>
                <HorizontalCarousel
                    services={sortedServices}
                    activeIndex={activeIndex}
                    onIndexChange={handleIndexChange}
                />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    mapClip: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 20,
        overflow: "hidden",
    },
    carousel: {
        position: "absolute",
        bottom: 20,
        left: 0,
        right: 0,
    },
})
