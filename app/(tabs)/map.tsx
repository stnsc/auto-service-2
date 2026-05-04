import { StyleSheet, View, TextInput, Pressable } from "react-native"
import Map, { MapHandle } from "../../components/Map.web"
import HorizontalCarousel from "../../components/bundle/HorizontalCarousel"
import MapFilterBar from "../../components/bundle/MapFilterBar"
import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { CarService, ServiceType } from "../../app/types/CarService"
import { useLocalSearchParams, useFocusEffect } from "expo-router"
import { useCarServices } from "../../hooks/useCarServices"
import { useTranslation } from "react-i18next"
import { NText } from "../../components/replacements/NText"
import { useTheme } from "../../context/ThemeContext"
import { BlurView } from "expo-blur"
import { fonts } from "../../theme"
import { Ionicons } from "@expo/vector-icons"
import "../../i18n"

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY ?? ""

interface GeoResult {
    placeName: string
    lat: number
    lon: number
}

async function geocodeSearch(query: string): Promise<GeoResult[]> {
    try {
        const res = await fetch(
            `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}&limit=5`,
        )
        const data = await res.json()
        return (data.features ?? []).map((f: any) => ({
            placeName: f.place_name ?? f.text ?? "",
            lat: f.center[1],
            lon: f.center[0],
        }))
    } catch {
        return []
    }
}

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
    const { t } = useTranslation()
    const { theme, colorScheme } = useTheme()

    // Search state
    const [searchQuery, setSearchQuery] = useState("")
    const [searchSuggestions, setSearchSuggestions] = useState<GeoResult[]>([])
    const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
    const searchTimeoutRef = useRef<any>(null)

    const handleSearchChange = useCallback((text: string) => {
        setSearchQuery(text)
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
        if (!text.trim()) {
            setSearchSuggestions([])
            setShowSearchSuggestions(false)
            return
        }
        searchTimeoutRef.current = setTimeout(async () => {
            const results = await geocodeSearch(text)
            setSearchSuggestions(results)
            setShowSearchSuggestions(results.length > 0)
        }, 400)
    }, [])

    const handleSearchSelect = useCallback((result: GeoResult) => {
        mapRef.current?.flyTo(result.lat, result.lon)
        setShowSearchSuggestions(false)
        setSearchQuery("")
    }, [])

    const initialLatitude = useMemo(() => {
        const parsed = Number(params.latitude)
        return Number.isFinite(parsed) ? parsed : 45.6427 //fallback, set to a random spot in Brasov
    }, [params.latitude])

    const initialLongitude = useMemo(() => {
        const parsed = Number(params.longitude)
        return Number.isFinite(parsed) ? parsed : 25.5887 //fallback, set to a random spot in Brasov
    }, [params.longitude])

    const { services, refresh } = useCarServices()
    useFocusEffect(
        useCallback(() => {
            refresh()
        }, [refresh]),
    )

    const [activeFilter, setActiveFilter] = useState<ServiceType | null>(null)

    const filteredServices = useMemo(
        () =>
            activeFilter
                ? services.filter((s) => s.type.includes(activeFilter))
                : services,
        [services, activeFilter],
    )

    const servicesRef = useRef<CarService[]>(filteredServices)
    useEffect(() => {
        servicesRef.current = filteredServices
    }, [filteredServices])

    const mapRef = useRef<MapHandle>(null)
    const isFlyingRef = useRef(false) // Track if a flyTo animation is in progress
    const shouldFlyRef = useRef(false) // Track if we should fly to the active service after sorting
    const hasAppliedRouteFocusRef = useRef(false)

    const [sortedServices, setSortedServices] = useState<CarService[]>(
        // Initial sort uses route coordinates when provided.
        sortByDistance(initialLatitude, initialLongitude, filteredServices),
    )
    const [activeIndex, setActiveIndex] = useState(0)

    useEffect(() => {
        setSortedServices(
            sortByDistance(initialLatitude, initialLongitude, filteredServices),
        )
        setActiveIndex(0)
        hasAppliedRouteFocusRef.current = false
    }, [initialLatitude, initialLongitude, filteredServices])

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
        setSortedServices(sortByDistance(lat, lon, servicesRef.current))
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
                    carServices={filteredServices}
                    onServicePress={handleServicePress}
                    onCenterChange={handleCenterChange}
                />
            </View>

            {/* Search bar */}
            <View style={styles.searchBarWrapper}>
                <BlurView
                    intensity={60}
                    tint={colorScheme === "dark" ? "dark" : "light"}
                    style={styles.searchBarBlur}
                >
                    <Ionicons
                        name="search-outline"
                        size={16}
                        color={theme.textMuted}
                        style={styles.searchIcon}
                    />
                    <TextInput
                        style={[
                            styles.searchInput,
                            {
                                color: theme.text,
                                fontFamily: fonts.regular,
                                outline: "none",
                            } as any,
                        ]}
                        placeholder={t("map.searchPlaceholder")}
                        placeholderTextColor={theme.textMuted}
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                    />
                    {searchQuery ? (
                        <Pressable
                            onPress={() => {
                                setSearchQuery("")
                                setShowSearchSuggestions(false)
                            }}
                            style={styles.searchClear}
                        >
                            <Ionicons
                                name="close-circle"
                                size={16}
                                color={theme.textMuted}
                            />
                        </Pressable>
                    ) : null}
                </BlurView>
                {showSearchSuggestions && searchSuggestions.length > 0 && (
                    <BlurView
                        intensity={60}
                        tint={colorScheme === "dark" ? "dark" : "light"}
                        style={styles.suggestionsBox}
                    >
                        {searchSuggestions.map((s, i) => (
                            <Pressable
                                key={i}
                                onPress={() => handleSearchSelect(s)}
                                style={[
                                    styles.suggestionItem,
                                    i > 0 && {
                                        borderTopWidth:
                                            StyleSheet.hairlineWidth,
                                        borderTopColor: theme.surfaceMid,
                                    },
                                ]}
                            >
                                <Ionicons
                                    name="location-outline"
                                    size={14}
                                    color={theme.textMuted}
                                />
                                <NText
                                    numberOfLines={1}
                                    style={{
                                        fontSize: 13,
                                        color: theme.text,
                                        fontFamily: fonts.light,
                                        flex: 1,
                                        marginLeft: 8,
                                    }}
                                >
                                    {s.placeName}
                                </NText>
                            </Pressable>
                        ))}
                    </BlurView>
                )}
            </View>

            <View style={styles.filterBar}>
                <MapFilterBar
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                />
            </View>
            <View style={styles.carousel}>
                {sortedServices.length === 0 ? (
                    <NText
                        style={[styles.noResults, { color: theme.textMuted }]}
                    >
                        {t("map.noResults")}
                    </NText>
                ) : (
                    <HorizontalCarousel
                        services={sortedServices}
                        activeIndex={activeIndex}
                        onIndexChange={handleIndexChange}
                    />
                )}
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
    searchBarWrapper: {
        paddingTop: 12,
        position: "absolute",
        top: 60,
        left: 12,
        right: 12,
        zIndex: 20,
    },
    searchBarBlur: {
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        overflow: "hidden",
    },
    searchIcon: {
        marginLeft: 12,
    },
    searchInput: {
        flex: 1,
        height: 44,
        paddingHorizontal: 10,
        fontSize: 14,
    },
    searchClear: {
        padding: 12,
    },
    suggestionsBox: {
        marginTop: 4,
        borderRadius: 12,
        overflow: "hidden",
    },
    suggestionItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
    },
    filterBar: {
        position: "absolute",
        top: 116,
        left: 0,
        right: 0,
    },
    carousel: {
        position: "absolute",
        bottom: 35,
        left: 0,
        right: 0,
    },
    noResults: {
        textAlign: "center",
        fontSize: 14,
        paddingVertical: 16,
    },
})
