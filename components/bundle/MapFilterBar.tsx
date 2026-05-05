import React from "react"
import { ScrollView, StyleSheet } from "react-native"
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

    const typeLabels: Record<ServiceType, string> = {
        mechanic: t("map.typeMechanic"),
        tire_shop: t("map.typeTireShop"),
        car_wash: t("map.typeCarWash"),
        body_shop: t("map.typeBodyShop"),
        oil_change: t("map.typeOilChange"),
        towing: t("map.typeTowing"),
    }

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
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
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
        flexDirection: "row",
        alignItems: "center",
    },
})
