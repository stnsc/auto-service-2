// map bundled for the web version only
import { use, useEffect, useRef } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { CarService } from "../app/types/CarService"
import { CAR_SERVICES, TYPE_COLORS } from "../data/carServicesMock"

interface MapProps {
    latitude?: number
    longitude?: number
    zoom?: number
    carServices?: CarService[]
    onServicePress?: (service: CarService) => void
}

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY ?? ""

export default function Map({
    latitude = 45.6427,
    longitude = 25.5887,
    zoom = 12,
}: MapProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<maplibregl.Map | null>(null)
    const markersRef = useRef<maplibregl.Marker[]>([])

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

    // fetch pins/markers
    useEffect(() => {
        if (!mapRef.current) return

        // clear existing markers
        markersRef.current.forEach((marker) => marker.remove())
        markersRef.current = []

        CAR_SERVICES.forEach((service) => {
            const el = document.createElement("div")
            el.style.cssText = `
                width: 24px;
                height: 24px;
                background-color: ${TYPE_COLORS[service.type]};
                border-radius: 50%;
                cursor: pointer;
            `

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([service.longitude, service.latitude])
                .setPopup(
                    new maplibregl.Popup({ offset: 12 }).setHTML(`
                        <strong>${service.name}</strong><br/>
                        ${service.address}<br/>
                        Rating: ${service.rating}*`),
                )
                .addTo(mapRef.current!)

            el.addEventListener("click", () => onServicePress?.(service))

            markersRef.current.push(marker)
        })
    }, [CAR_SERVICES])

    return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
}
function onServicePress(service: CarService): any {
    console.log("Service pressed:", service)
}
