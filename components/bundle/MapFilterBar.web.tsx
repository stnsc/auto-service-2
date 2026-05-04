import React, { useRef } from "react"
import { StyleSheet, View } from "react-native"
import { NButton } from "../replacements/NButton"
import { NText } from "../replacements/NText"
import { ServiceType } from "../../app/types/CarService"
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
                <View
                    style={[
                        styles.dot,
                        { backgroundColor: color, opacity: active ? 1 : 0.5 },
                    ]}
                />
                <NText
                    style={[
                        styles.chipLabel,
                        { color: active ? theme.text : theme.textMuted },
                    ]}
                >
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
        alignSelf: "flex-start",
        flexShrink: 0,
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
