// data/carServices.ts
import { CarService } from "../app/types/CarService"

export const CAR_SERVICES: CarService[] = [
  {
    id: "1",
    name: "AutoFix Brasov",
    latitude: 45.6500,
    longitude: 25.6000,
    type: "mechanic",
    rating: 4.5,
    address: "Str. Republicii 12",
    phone: "0268 123 456",
  },
]

export const TYPE_COLORS: Record<CarService["type"], string> = {
  mechanic:   "#3B82F6",
  tire_shop:  "#F59E0B",
  car_wash:   "#06B6D4",
  body_shop:  "#8B5CF6",
  oil_change: "#10B981",
  towing:     "#EF4444",
}