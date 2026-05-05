import { useState, useCallback } from "react"
import * as Crypto from "expo-crypto"
import type { FuelType, Transmission, Vehicle } from "../app/types/UserProfile"

type VehicleFormState = Omit<Vehicle, "id">
type SetFormFn = React.Dispatch<React.SetStateAction<VehicleFormState>>

export function useVinDecoder(setVehicleForm: SetFormFn) {
    const [vinLoading, setVinLoading] = useState(false)

    const handleVinChange = useCallback(
        async (raw: string) => {
            const vin = raw
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "")
                .slice(0, 17)
            setVehicleForm((prev) => ({ ...prev, vin }))
            if (vin.length !== 17) return

            const apiKey = process.env.EXPO_PUBLIC_VINDECODER_API_KEY!
            const secretKey = process.env.EXPO_PUBLIC_VINDECODER_SECRET_KEY!

            setVinLoading(true)
            try {
                const hash = await Crypto.digestStringAsync(
                    Crypto.CryptoDigestAlgorithm.SHA1,
                    `${vin}|decode|${apiKey}|${secretKey}`,
                )
                const controlSum = hash.substring(0, 10)
                const res = await fetch(
                    `https://api.vindecoder.eu/3.2/${apiKey}/${controlSum}/decode/${vin}.json`,
                )
                const data = await res.json()
                const fields: { label: string; value: string }[] =
                    data.decode ?? []

                const get = (label: string) => {
                    const val = fields.find((f) => f.label === label)?.value
                    return val && val !== "0" && val !== "-" ? String(val) : ""
                }

                const year = get("Model Year")
                const make = get("Make")
                const model = get("Model")
                const trim = get("Trim Level") || get("Body")
                const engineL = get("Engine Displacement (L)")
                const engineCcm = get("Engine Displacement (ccm)")
                const fuelRaw = get("Fuel Type")
                const engineTypeRaw = get("Engine Type")
                const transRaw = get("Transmission")

                const titleCase = (s: string) =>
                    s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

                const mapFuel = (s: string): FuelType | null => {
                    const l = s.toLowerCase()
                    if (
                        l.includes("plug") ||
                        (l.includes("electric") && l.includes("gas"))
                    )
                        return "plug-in-hybrid"
                    if (l.includes("electric") || l.includes("bev"))
                        return "electric"
                    if (l.includes("hev") || l.includes("hybrid"))
                        return "hybrid"
                    if (
                        l.includes("diesel") ||
                        l.includes("tdi") ||
                        l.includes("t-di") ||
                        l.includes("cdi") ||
                        l.includes("hdi")
                    )
                        return "diesel"
                    if (
                        l.includes("gasoline") ||
                        l.includes("petrol") ||
                        l.includes("benzina") ||
                        l.includes("gdi") ||
                        l.includes("mpi") ||
                        l.includes("tsi") ||
                        l.includes("tfsi")
                    )
                        return "gasoline"
                    if (
                        l.includes("lpg") ||
                        l.includes("gpl") ||
                        l.includes("propane")
                    )
                        return "LPG"
                    return null
                }

                const mapTrans = (s: string): Transmission | null => {
                    const l = s.toLowerCase()
                    if (l.includes("cvt") || l.includes("continuously"))
                        return "cvt"
                    if (l.includes("automatic")) return "automatic"
                    if (l.includes("manual") || l.includes("standard"))
                        return "manual"
                    return null
                }

                const engineSize = engineL
                    ? `${parseFloat(engineL).toFixed(1)}L`
                    : engineCcm
                      ? `${(parseFloat(engineCcm) / 1000).toFixed(1)}L`
                      : ""

                setVehicleForm((prev) => {
                    const next = { ...prev }
                    if (year) next.year = String(year)
                    if (make) next.make = titleCase(make)
                    if (model) next.model = model
                    if (trim) next.trim = trim
                    if (engineSize) next.engineSize = engineSize
                    const fuel =
                        (fuelRaw ? mapFuel(fuelRaw) : null) ??
                        (engineTypeRaw ? mapFuel(engineTypeRaw) : null)
                    if (fuel) next.fuelType = fuel
                    const trans = transRaw ? mapTrans(transRaw) : null
                    if (trans) next.transmission = trans
                    return next
                })
            } catch {
                // silently fail — VIN decode is best-effort
            } finally {
                setVinLoading(false)
            }
        },
        [setVehicleForm],
    )

    return { vinLoading, handleVinChange }
}
