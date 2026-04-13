export interface CarService {
    id: string
    name: string
    latitude: number
    longitude: number
    type: "mechanic" | "tire_shop"
    rating: number
    address: string
    phone: string
    distance?: number // Optional field to store distance from user, calculated at runtime
}