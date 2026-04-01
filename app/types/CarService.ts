export interface CarService {
    id: string
    name: string
    latitude: number
    longitude: number
    type: "mechanic" | "car_wash" | "tire_shop"
    rating: number
    address: string
    phone: string
}