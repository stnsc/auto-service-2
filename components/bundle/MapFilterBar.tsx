import React from "react"
import { ScrollView, StyleSheet, View } from "react-native"
import { NButton } from "../replacements/NButton"
import { NText } from "../replacements/NText"
import { CarService, ServiceType } from "../../app/types/CarService"
import { TYPE_COLORS } from "../../data/carServicesMock"
import { useTheme } from "../../context/ThemeContext"
import { useTranslation } from "react-i18next"
import { fonts } from "../../theme"
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

function FilterChip({
    label,
    active,
    color,
    onPress,
}: {
    label: string
    active: boolean
    color: string
    onPress: () => void
}) {
    const { theme } = useTheme()

    return (
        <NButton
            onPress={onPress}
            color={active ? color : theme.borderStart}
            intensity={50}
            style={styles.chipOuter}
            innerStyle={styles.chipInner}
        >
            <View style={styles.chipContent}>
                <View style={[styles.dot, { backgroundColor: color, opacity: active ? 1 : 0.5 }]} />
                <NText style={[styles.chipLabel, { color: active ? theme.text : theme.textMuted }]}>
                    {label}
                </NText>
            </View>
        </NButton>
    )
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
    chipOuter: {
        alignSelf: "flex-start",
    },
    chipInner: {
        paddingVertical: 7,
        paddingHorizontal: 13,
    },
    chipContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    chipLabel: {
        fontSize: 13,
        fontFamily: fonts.medium,
    },
})

