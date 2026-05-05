import { View, ActivityIndicator, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { NInput } from "../replacements/NInput"
import { NButton } from "../replacements/NButton"
import { NText } from "../replacements/NText"
import { useTheme } from "../../context/ThemeContext"
import { fonts } from "../../theme"
import type { FuelType, Transmission, Vehicle } from "../../app/types/UserProfile"

export const FUEL_TYPES: FuelType[] = [
    "gasoline",
    "diesel",
    "electric",
    "hybrid",
    "plug-in-hybrid",
    "LPG",
]
export const TRANSMISSIONS: Transmission[] = ["automatic", "manual", "cvt"]

export const DEFAULT_VEHICLE_FORM: Omit<Vehicle, "id"> = {
    nickname: "",
    year: "",
    make: "",
    model: "",
    trim: "",
    vin: "",
    licensePlate: "",
    color: "",
    currentMileage: "",
    engineSize: "",
    fuelType: "gasoline",
    transmission: "automatic",
    isPrimary: false,
    notes: "",
}

interface VehicleFormContentProps {
    vehicleForm: Omit<Vehicle, "id">
    updateVehicleField: <K extends keyof Omit<Vehicle, "id">>(
        key: K,
        value: Omit<Vehicle, "id">[K],
    ) => void
    handleVinChange: (raw: string) => void
    vinLoading: boolean
}

export function VehicleFormContent({
    vehicleForm,
    updateVehicleField,
    handleVinChange,
    vinLoading,
}: VehicleFormContentProps) {
    const { t } = useTranslation()
    const { theme } = useTheme()

    const fuelLabel = (type: FuelType) =>
        t(`profile.vehicleForm.fuel_${type.replace(/-/g, "_")}` as any)
    const transLabel = (type: Transmission) =>
        t(`profile.vehicleForm.trans_${type}` as any)

    return (
        <>
            <NInput
                placeholder={t("profile.vehicleForm.nicknamePlaceholder")}
                value={vehicleForm.nickname}
                onChangeText={(v) => updateVehicleField("nickname", v)}
            />

            <View style={styles.vinRow}>
                <View style={styles.vinInfoRow}>
                    <Ionicons
                        name="information-circle-outline"
                        size={24}
                        color={theme.iconMuted}
                    />
                    <NText style={styles.vinInfo}>
                        {t("profile.vehicleForm.vinInfo")}
                    </NText>
                </View>
                <NInput
                    placeholder={t("profile.vehicleForm.vinPlaceholder")}
                    value={vehicleForm.vin}
                    onChangeText={handleVinChange}
                    containerStyle={styles.flex1}
                    autoCapitalize="characters"
                    editable={!vinLoading}
                />
                {vinLoading && (
                    <ActivityIndicator
                        size="small"
                        color={theme.accentSolid}
                        style={styles.vinSpinner}
                    />
                )}
            </View>

            <View style={styles.twoCol}>
                <NInput
                    placeholder={t("profile.vehicleForm.year")}
                    value={vehicleForm.year}
                    onChangeText={(v) => updateVehicleField("year", v)}
                    containerStyle={styles.flex1}
                    keyboardType="numeric"
                />
                <NInput
                    placeholder={t("profile.vehicleForm.make")}
                    value={vehicleForm.make}
                    onChangeText={(v) => updateVehicleField("make", v)}
                    containerStyle={styles.flex1}
                />
            </View>

            <View style={styles.twoCol}>
                <NInput
                    placeholder={t("profile.vehicleForm.model")}
                    value={vehicleForm.model}
                    onChangeText={(v) => updateVehicleField("model", v)}
                    containerStyle={styles.flex1}
                />
                <NInput
                    placeholder={t("profile.vehicleForm.trimPlaceholder")}
                    value={vehicleForm.trim}
                    onChangeText={(v) => updateVehicleField("trim", v)}
                    containerStyle={styles.flex1}
                />
            </View>

            <View style={styles.twoCol}>
                <NInput
                    placeholder={t("profile.vehicleForm.licensePlate")}
                    value={vehicleForm.licensePlate}
                    onChangeText={(v) => updateVehicleField("licensePlate", v)}
                    containerStyle={styles.flex1}
                    autoCapitalize="characters"
                />
                <NInput
                    placeholder={t("profile.vehicleForm.color")}
                    value={vehicleForm.color}
                    onChangeText={(v) => updateVehicleField("color", v)}
                    containerStyle={styles.flex1}
                />
            </View>

            <View style={styles.twoCol}>
                <NInput
                    placeholder={t("profile.vehicleForm.mileage")}
                    value={vehicleForm.currentMileage}
                    onChangeText={(v) => updateVehicleField("currentMileage", v)}
                    containerStyle={styles.flex1}
                    keyboardType="numeric"
                />
                <NInput
                    placeholder={t("profile.vehicleForm.engineSizePlaceholder")}
                    value={vehicleForm.engineSize}
                    onChangeText={(v) => updateVehicleField("engineSize", v)}
                    containerStyle={styles.flex1}
                />
            </View>

            <NText
                style={[
                    styles.chipLabel,
                    { color: theme.textMuted, fontFamily: fonts.medium },
                ]}
            >
                {t("profile.vehicleForm.fuelType")}
            </NText>
            <View style={styles.chipRow}>
                {FUEL_TYPES.map((type) => (
                    <NButton
                        key={type}
                        color={
                            vehicleForm.fuelType === type
                                ? theme.accentSubtle
                                : theme.surface
                        }
                        style={styles.chip}
                        onPress={() => updateVehicleField("fuelType", type)}
                    >
                        <NText
                            style={[
                                styles.chipText,
                                {
                                    fontFamily:
                                        vehicleForm.fuelType === type
                                            ? fonts.bold
                                            : fonts.light,
                                },
                            ]}
                        >
                            {fuelLabel(type)}
                        </NText>
                    </NButton>
                ))}
            </View>

            <NText
                style={[
                    styles.chipLabel,
                    { color: theme.textMuted, fontFamily: fonts.medium },
                ]}
            >
                {t("profile.vehicleForm.transmission")}
            </NText>
            <View style={styles.chipRow}>
                {TRANSMISSIONS.map((type) => (
                    <NButton
                        key={type}
                        color={
                            vehicleForm.transmission === type
                                ? theme.accentSubtle
                                : theme.surface
                        }
                        style={styles.chip}
                        onPress={() => updateVehicleField("transmission", type)}
                    >
                        <NText
                            style={[
                                styles.chipText,
                                {
                                    fontFamily:
                                        vehicleForm.transmission === type
                                            ? fonts.bold
                                            : fonts.light,
                                },
                            ]}
                        >
                            {transLabel(type)}
                        </NText>
                    </NButton>
                ))}
            </View>

            <NInput
                placeholder={t("profile.vehicleForm.notesPlaceholder")}
                value={vehicleForm.notes}
                onChangeText={(v) => updateVehicleField("notes", v)}
                multiline
            />

            <NButton
                color={
                    vehicleForm.isPrimary ? theme.accentSubtle : theme.surface
                }
                style={styles.primaryToggle}
                onPress={() =>
                    updateVehicleField("isPrimary", !vehicleForm.isPrimary)
                }
            >
                <Ionicons
                    name={vehicleForm.isPrimary ? "star" : "star-outline"}
                    size={16}
                    color={
                        vehicleForm.isPrimary
                            ? theme.accentSolid
                            : theme.textMuted
                    }
                />
                <NText
                    style={[
                        styles.chipText,
                        {
                            fontFamily: vehicleForm.isPrimary
                                ? fonts.bold
                                : fonts.light,
                            color: vehicleForm.isPrimary
                                ? theme.accentSolid
                                : theme.textMuted,
                        },
                    ]}
                >
                    {t("profile.vehicleForm.isPrimary")}
                </NText>
            </NButton>
        </>
    )
}

const styles = StyleSheet.create({
    vinRow: {
        position: "relative",
    },
    vinInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 12,
    },
    vinInfo: {
        fontSize: 12,
        marginTop: 4,
        marginBottom: 8,
        flex: 1,
    },
    vinSpinner: {
        position: "absolute",
        right: 16,
        top: 0,
        bottom: 0,
        justifyContent: "center",
    },
    twoCol: {
        flexDirection: "row",
        gap: 8,
    },
    flex1: {
        flex: 1,
    },
    chipLabel: {
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 8,
        marginTop: 4,
    },
    chipRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginBottom: 12,
    },
    chip: {
        paddingHorizontal: 4,
    },
    chipText: {
        fontSize: 13,
    },
    primaryToggle: {
        flexDirection: "row",
        gap: 6,
        justifyContent: "center",
        marginBottom: 10,
    },
})
