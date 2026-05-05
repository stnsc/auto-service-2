import React, { useRef } from "react"
import { StyleSheet } from "react-native"
import { ServiceType } from "../../app/types/CarService"
import { TYPE_COLORS } from "../../data/carServicesMock"
import { useTheme } from "../../context/ThemeContext"
import { useTranslation } from "react-i18next"
import { FilterChip } from "./FilterChip"
import "../../i18n"

const SERVICE_TYPES: ServiceType[] = [
    "mechanic",
    "tire_shop",
    "car_wash",
    "body_shop",
    "oil_change",
    "towing",
]

interface MapFilterBarProps {
    activeFilter: ServiceType | null
    onFilterChange: (filter: ServiceType | null) => void
}

export default function MapFilterBar({
    activeFilter,
    onFilterChange,
}: MapFilterBarProps) {
    const { theme } = useTheme()
    const { t } = useTranslation()
    const scrollRef = useRef<HTMLDivElement>(null)

    const typeLabels: Record<ServiceType, string> = {
        mechanic: t("map.typeMechanic"),
        tire_shop: t("map.typeTireShop"),
        car_wash: t("map.typeCarWash"),
        body_shop: t("map.typeBodyShop"),
        oil_change: t("map.typeOilChange"),
        towing: t("map.typeTowing"),
    }

    const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (scrollRef.current) {
            e.preventDefault()
            scrollRef.current.scrollLeft += e.deltaX !== 0 ? e.deltaX : e.deltaY
        }
    }

    return (
        <div
            ref={scrollRef}
            onWheel={onWheel}
            style={
                {
                    display: "flex",
                    flexDirection: "row",
                    overflowX: "auto",
                    overflowY: "hidden",
                    paddingLeft: 16,
                    paddingTop: 8,
                    paddingBottom: 8,
                    gap: 8,
                    alignItems: "center",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    width: "100%",
                    boxSizing: "border-box",
                } as React.CSSProperties
            }
        >
            <FilterChip
                label={t("map.filterAll")}
                active={activeFilter === null}
                color={theme.accentSolid}
                onPress={() => onFilterChange(null)}
            />
            {SERVICE_TYPES.map((type) => (
                <FilterChip
                    key={type}
                    label={typeLabels[type]}
                    active={activeFilter === type}
                    color={TYPE_COLORS[type]}
                    onPress={() =>
                        onFilterChange(activeFilter === type ? null : type)
                    }
                />
            ))}
            <div style={{ flexShrink: 0, width: 14 }} />
        </div>
    )
}

const styles = StyleSheet.create({
    chipOuter: {
        flexShrink: 0,
    },
})
