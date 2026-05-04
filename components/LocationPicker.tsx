import { View, StyleSheet } from "react-native"
import { NInput } from "./replacements/NInput"
import { useTranslation } from "react-i18next"
import "../i18n"

interface LocationPickerProps {
    latitude: string
    longitude: string
    onLocationChange: (lat: number, lon: number) => void
    addressHint?: string
}

export default function LocationPicker({
    latitude,
    longitude,
    onLocationChange,
}: LocationPickerProps) {
    const { t } = useTranslation()

    return (
        <View style={styles.row}>
            <NInput
                placeholder={t("settings.latitude")}
                value={latitude}
                onChangeText={(v) => {
                    const lon = parseFloat(longitude)
                    onLocationChange(parseFloat(v), isNaN(lon) ? 0 : lon)
                }}
                keyboardType="decimal-pad"
                style={styles.flex1}
            />
            <NInput
                placeholder={t("settings.longitude")}
                value={longitude}
                onChangeText={(v) => {
                    const lat = parseFloat(latitude)
                    onLocationChange(isNaN(lat) ? 0 : lat, parseFloat(v))
                }}
                keyboardType="decimal-pad"
                style={styles.flex1}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    row: { flexDirection: "row", gap: 10 },
    flex1: { flex: 1 },
})
