// map bundled for the web version only
import { useEffect, useRef, useState } from "react"
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

// Inject popup styles once into the document head
const POPUP_STYLE_ID = "maplibre-custom-popup-styles"

function injectPopupStyles() {
    if (document.getElementById(POPUP_STYLE_ID)) return

    const style = document.createElement("style")
    style.id = POPUP_STYLE_ID
    style.innerHTML = `
        /* Remove default MapLibre popup chrome */
        .service-marker.maplibregl-popup .maplibregl-popup-content {
            font-family: 'IosevkaCharon_400Regular';
            padding: 0;
            margin: 6px;
            border-radius: 24px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45);
            overflow: hidden;
            background: #31313185;
            backdrop-filter: blur(3px);
        }

        /* Hide the default close button */
        .service-marker.maplibregl-popup .maplibregl-popup-close-button {
            display: none;
        }

        /* Remove the tip/arrow */
        .service-marker.maplibregl-popup .maplibregl-popup-tip {
            display: none;
        }

        .popup-inner {
            padding: 12px 14px;
        }

        .popup-name {
            font-size: 14px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 4px;
        }

        .popup-address {
            font-size: 12px;
            color: #c0c0c0;
            margin-bottom: 6px;
            line-height: 1.4;
        }
    `
    document.head.appendChild(style)
}

export default function Map({
    latitude = 45.6427,
    longitude = 25.5887,
    zoom = 12,
    carServices = CAR_SERVICES,
    onServicePress,
}: MapProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<maplibregl.Map | null>(null)
    const markersRef = useRef<maplibregl.Marker[]>([])
    const [mapLoaded, setMapLoaded] = useState(false)

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return

        injectPopupStyles()

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
        mapRef.current.on("load", () => setMapLoaded(true))

        return () => {
            mapRef.current?.remove()
            mapRef.current = null
            setMapLoaded(false)
        }
    }, [])

    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return

        markersRef.current.forEach((marker) => marker.remove())
        markersRef.current = []

        carServices.forEach((service) => {
            const el = document.createElement("div")
            el.style.cssText = `
                width: 24px;
                height: 24px;
                background-color: ${TYPE_COLORS[service.type]};
                border-radius: 2em;
                cursor: pointer;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            `

            const popup = new maplibregl.Popup({
                offset: 14,
                className: "service-marker", // targets .service-marker.maplibregl-popup in CSS
            }).setHTML(`
                <div class="popup-inner">
                    <div class="popup-name">${service.name}</div>
                    <div class="popup-address">${service.address}</div>
                </div>
            `)

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([service.longitude, service.latitude])
                .setPopup(popup)
                .addTo(mapRef.current!)

            el.addEventListener("click", () => onServicePress?.(service))

            markersRef.current.push(marker)
        })
    }, [mapLoaded, carServices, onServicePress])

    return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
}
