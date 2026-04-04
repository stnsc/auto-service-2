import { createContext, useContext, RefObject } from "react"
import { PanGesture } from "react-native-gesture-handler"

export const GestureContext = createContext<RefObject<PanGesture> | null>(null)

export const useCarouselGesture = () => useContext(GestureContext)
