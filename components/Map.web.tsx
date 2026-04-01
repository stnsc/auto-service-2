// map bundled for the web version only
import { useEffect, useRef } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

interface MapProps {
    latitude?: number
    longitude?: number
    zoom?: number
}

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY ?? ""

export default function Map({
    latitude = 45.6427,
    longitude = 25.5887,
    zoom = 12,
}: MapProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<maplibregl.Map | null>(null)

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return

        mapRef.current = new maplibregl.Map({
            container: containerRef.current,
            style: `https://api.maptiler.com/maps/019d49f9-3b3c-7cee-991d-87e447e8578e/style.json?key=${MAPTILER_KEY}`,
            center: [longitude, latitude],
            zoom,
            pitch: 15,
            bearing: -17,
            maxPitch: 50,
        })

        mapRef.current.addControl(new maplibregl.NavigationControl())

        return () => {
            mapRef.current?.remove()
            mapRef.current = null
        }
    }, [])

    return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
}
