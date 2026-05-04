export type ServiceType = "mechanic" | "tire_shop" | "car_wash" | "body_shop" | "oil_change" | "towing"

export interface CarService {
    id: string
    name: string
    latitude: number
    longitude: number
    type: ServiceType[]
    rating: number
    address: string
    phone: string
    distance?: number // Optional field to store distance from user, calculated at runtime
}