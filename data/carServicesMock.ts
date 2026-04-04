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
  {
    id: "2",
    name: "Danove Auto",
    latitude: 45.6380,
    longitude: 25.5910,
    type: "tire_shop",
    rating: 4.0,
    address: "Str. Mihai Viteazul 5",
    phone: "0268 456 789",
  },
  {
    id: "3",
    name: "Instant Car Fix",
    latitude: 44.4299,
    longitude: 26.1089,
    type: "mechanic",
    rating: 5.0,
    address: "J. Street 45",
    phone: "0267 676 767",
  }
]

export const TYPE_COLORS: Record<CarService["type"], string> = {
  mechanic:   "#3B82F6",
  car_wash:   "#06B6D4",
  tire_shop:  "#F59E0B",
}