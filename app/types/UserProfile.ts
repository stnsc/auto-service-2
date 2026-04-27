export type FuelType =
    | "gasoline"
    | "diesel"
    | "electric"
    | "hybrid"
    | "plug-in-hybrid"
    | "LPG"

export type Transmission = "automatic" | "manual" | "cvt"

export interface Vehicle {
    id: string
    nickname: string
    year: string
    make: string
    model: string
    trim: string
    vin: string
    licensePlate: string
    color: string
    currentMileage: string
    engineSize: string
    fuelType: FuelType
    transmission: Transmission
    isPrimary: boolean
    notes: string
}

export interface UserProfile {
    userId: string
    firstName: string
    lastName: string
    phoneNumber: string
    vehicles: Vehicle[]
    updatedAt: string
}
