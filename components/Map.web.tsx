// map bundled for the web version only
import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react"
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
    onCenterChange?: (lat: number, lon: number) => void
}

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY ?? ""

export interface MapHandle {
    flyTo: (lat: number, lon: number) => void
}

const Map = forwardRef<MapHandle, MapProps>(function Map(
    {
        latitude = 45.6427,
        longitude = 25.5887,
        zoom = 12,
        carServices = CAR_SERVICES,
        onServicePress,
        onCenterChange,
    }: MapProps,
    ref,
) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<maplibregl.Map | null>(null)
    const markersRef = useRef<maplibregl.Marker[]>([])
    const [mapLoaded, setMapLoaded] = useState(false)

    // Always-current refs so event listeners never capture stale callbacks
    const onServicePressRef = useRef(onServicePress)
    const onCenterChangeRef = useRef(onCenterChange)
    useEffect(() => {
        onServicePressRef.current = onServicePress
    }, [onServicePress])

    useEffect(() => {
        onCenterChangeRef.current = onCenterChange
    }, [onCenterChange])

    // Map init — runs once, refs keep callbacks fresh without recreating the map
    useEffect(() => {
        if (
            typeof window === "undefined" ||
            !containerRef.current ||
            mapRef.current
        )
            return

        mapRef.current = new maplibregl.Map({
            container: containerRef.current,
            style: `https://api.maptiler.com/maps/019d49f9-3b3c-7cee-991d-87e447e8578e/style.json?key=${MAPTILER_KEY}`,
            center: [longitude, latitude],
            zoom,
            pitch: 15,
            bearing: -17,
            maxPitch: 50,
        })

        mapRef.current.on("load", () => setMapLoaded(true))

        // Reads from ref at call time — always has the latest onCenterChange
        mapRef.current.on("moveend", () => {
            const center = mapRef.current!.getCenter()
            onCenterChangeRef.current?.(center.lat, center.lng)
        })

        return () => {
            mapRef.current?.remove()
            mapRef.current = null
            setMapLoaded(false)
        }
    }, []) // empty — map created once, refs handle callback freshness

    // Markers — recreated only when the services list changes, not on callback changes
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
                className: "service-marker",
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

            el.addEventListener("click", (e) => {
                // Prevent the map's own click handler from firing and
                // competing with the marker press
                e.stopPropagation()
                onServicePressRef.current?.(service)
            })

            markersRef.current.push(marker)
        })
    }, [mapLoaded, carServices]) // onServicePress intentionally omitted — ref handles it

    useImperativeHandle(ref, () => ({
        flyTo: (lat: number, lon: number) => {
            mapRef.current?.flyTo({
                center: [lon, lat],
                zoom: 15,
                duration: 1000,
            })
        },
    }))

    return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
})

export default Map
