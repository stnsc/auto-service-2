import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { fonts } from "../theme"
import { useTheme } from "../context/ThemeContext"
import { useTranslation } from "react-i18next"
import "../i18n"

interface LocationPickerProps {
    latitude: string
    longitude: string
    onLocationChange: (lat: number, lon: number) => void
    addressHint?: string
}

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY ?? ""

const MAP_STYLES = {
    dark: `https://api.maptiler.com/maps/hybrid-v4-dark/style.json?key=${MAPTILER_KEY}`,
    light: `https://api.maptiler.com/maps/hybrid-v4/style.json?key=${MAPTILER_KEY}`,
} as const

interface GeoResult {
    placeName: string
    lat: number
    lon: number
}

async function geocode(query: string): Promise<GeoResult[]> {
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

export default function LocationPicker({
    latitude,
    longitude,
    onLocationChange,
    addressHint,
}: LocationPickerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<maplibregl.Map | null>(null)
    const markerRef = useRef<maplibregl.Marker | null>(null)
    const placeMarkerRef = useRef<((lat: number, lon: number) => void) | null>(null)
    const onLocationChangeRef = useRef(onLocationChange)
    const addressHintRef = useRef(addressHint)
    const [mapLoaded, setMapLoaded] = useState(false)
    const { theme, colorScheme } = useTheme()
    const { t } = useTranslation()

    // Search state
    const [searchQuery, setSearchQuery] = useState("")
    const [suggestions, setSuggestions] = useState<GeoResult[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const searchTimeoutRef = useRef<any>(null)

    useEffect(() => {
        onLocationChangeRef.current = onLocationChange
    }, [onLocationChange])

    useEffect(() => {
        addressHintRef.current = addressHint
    }, [addressHint])

    const hasInitialLat = latitude && !isNaN(parseFloat(latitude))
    const hasInitialLon = longitude && !isNaN(parseFloat(longitude))
    const hasInitial = !!(hasInitialLat && hasInitialLon)
    const initialLat = hasInitial ? parseFloat(latitude) : 45.9442
    const initialLon = hasInitial ? parseFloat(longitude) : 24.9668

    useEffect(() => {
        if (typeof window === "undefined" || !containerRef.current || mapRef.current) return

        mapRef.current = new maplibregl.Map({
            container: containerRef.current,
            style: MAP_STYLES[colorScheme],
            center: [initialLon, initialLat],
            zoom: hasInitial ? 14 : 6,
        })

        const placeMarker = (lat: number, lon: number) => {
            if (markerRef.current) {
                markerRef.current.setLngLat([lon, lat])
            } else {
                const m = new maplibregl.Marker({ color: "#21a870", draggable: true })
                    .setLngLat([lon, lat])
                    .addTo(mapRef.current!)
                m.on("dragend", () => {
                    const lngLat = m.getLngLat()
                    onLocationChangeRef.current(lngLat.lat, lngLat.lng)
                })
                markerRef.current = m
            }
        }

        placeMarkerRef.current = placeMarker

        mapRef.current.on("load", () => {
            setMapLoaded(true)
            if (hasInitial) {
                placeMarker(initialLat, initialLon)
            } else if (addressHintRef.current?.trim()) {
                // Auto-geocode the address from step 1
                geocode(addressHintRef.current).then((results) => {
                    if (results.length > 0 && mapRef.current) {
                        const { lat, lon } = results[0]
                        mapRef.current.flyTo({ center: [lon, lat], zoom: 15 })
                        placeMarker(lat, lon)
                        onLocationChangeRef.current(lat, lon)
                    }
                })
            }
        })

        mapRef.current.on("click", (e) => {
            placeMarker(e.lngLat.lat, e.lngLat.lng)
            onLocationChangeRef.current(e.lngLat.lat, e.lngLat.lng)
        })

        return () => {
            mapRef.current?.remove()
            mapRef.current = null
            markerRef.current = null
            placeMarkerRef.current = null
        }
    }, [])

    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return
        mapRef.current.setStyle(MAP_STYLES[colorScheme])
    }, [colorScheme, mapLoaded])

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
        if (!value.trim()) {
            setSuggestions([])
            setShowSuggestions(false)
            return
        }
        searchTimeoutRef.current = setTimeout(async () => {
            const results = await geocode(value)
            setSuggestions(results)
            setShowSuggestions(results.length > 0)
        }, 400)
    }

    const handleSuggestionClick = (result: GeoResult) => {
        if (mapRef.current) {
            mapRef.current.flyTo({ center: [result.lon, result.lat], zoom: 15 })
        }
        placeMarkerRef.current?.(result.lat, result.lon)
        onLocationChangeRef.current(result.lat, result.lon)
        setShowSuggestions(false)
        setSearchQuery("")
    }

    const hasLocation = !!(
        latitude &&
        longitude &&
        !isNaN(parseFloat(latitude)) &&
        !isNaN(parseFloat(longitude))
    )

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: 360,
                borderRadius: 16,
                overflow: "hidden",
            }}
        >
            <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

            {/* Search bar */}
            <div
                style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    right: 10,
                    zIndex: 10,
                }}
            >
                <div
                    style={{
                        background: theme.overlayBg,
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        borderRadius: 12,
                        overflow: "visible",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <span style={{ padding: "0 10px 0 12px", color: theme.textMuted, fontSize: 15 }}>⌕</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder={t("map.searchPlaceholder")}
                            style={{
                                flex: 1,
                                background: "transparent",
                                border: "none",
                                outline: "none",
                                padding: "10px 12px 10px 0",
                                fontFamily: fonts.regular,
                                color: theme.text,
                                fontSize: 14,
                                width: "100%",
                            }}
                        />
                        {searchQuery ? (
                            <button
                                onClick={() => { setSearchQuery(""); setShowSuggestions(false) }}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "0 12px",
                                    color: theme.textMuted,
                                    fontSize: 16,
                                    lineHeight: 1,
                                }}
                            >
                                ×
                            </button>
                        ) : null}
                    </div>
                    {showSuggestions && suggestions.length > 0 && (
                        <div
                            style={{
                                borderTop: `1px solid ${theme.surfaceMid}`,
                                borderRadius: "0 0 12px 12px",
                                overflow: "hidden",
                            }}
                        >
                            {suggestions.map((s, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleSuggestionClick(s)}
                                    style={{
                                        padding: "9px 14px",
                                        cursor: "pointer",
                                        fontFamily: fonts.light,
                                        color: theme.text,
                                        fontSize: 13,
                                        borderTop: i > 0 ? `1px solid ${theme.surfaceMid}` : "none",
                                        background: "transparent",
                                        transition: "background 0.1s",
                                    }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.background = theme.surfaceMid)
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.background = "transparent")
                                    }
                                >
                                    {s.placeName}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Coordinate badge */}
            {mapLoaded && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 10,
                        left: 0,
                        right: 0,
                        display: "flex",
                        justifyContent: "center",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            background: theme.overlayBg,
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                            padding: "5px 14px",
                            borderRadius: 20,
                        }}
                    >
                        <span
                            style={{
                                fontFamily: fonts.light,
                                color: theme.textMuted,
                                fontSize: 13,
                            }}
                        >
                            {hasLocation
                                ? `${parseFloat(latitude).toFixed(5)}, ${parseFloat(longitude).toFixed(5)}`
                                : t("registerService.tapToSetLocation")}
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}
