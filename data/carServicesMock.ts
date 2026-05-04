import { CarService, ServiceType } from "../app/types/CarService"

export const CAR_SERVICES: CarService[] = []

export const TYPE_COLORS: Record<ServiceType, string> = {
  mechanic:   "#3B82F6",
  tire_shop:  "#F59E0B",
  car_wash:   "#06B6D4",
  body_shop:  "#8B5CF6",
  oil_change: "#10B981",
  towing:     "#EF4444",
}