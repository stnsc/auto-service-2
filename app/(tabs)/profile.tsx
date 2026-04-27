import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native"
import { useState, useEffect } from "react"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import * as Crypto from "expo-crypto"

import { NInput } from "../../components/replacements/NInput"
import { NButton } from "../../components/replacements/NButton"
import { NText } from "../../components/replacements/NText"
import { NModal } from "../../components/replacements/NModal"
import { useAuthContext } from "../../context/AuthContext"
import { useProfileContext } from "../../context/ProfileContext"
import { useTheme } from "../../context/ThemeContext"
import { fonts } from "../../theme"
import { Vehicle, FuelType, Transmission } from "../types/UserProfile"
import "../../i18n"

const FUEL_TYPES: FuelType[] = [
    "gasoline",
    "diesel",
    "electric",
    "hybrid",
    "plug-in-hybrid",
    "LPG",
]
const TRANSMISSIONS: Transmission[] = ["automatic", "manual", "cvt"]

const DEFAULT_FORM: Omit<Vehicle, "id"> = {
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

function SectionHeader({ label }: { label: string }) {
    const { theme } = useTheme()
    return (
        <NText
            style={[
                styles.sectionHeader,
                { color: theme.textMuted, fontFamily: fonts.bold },
            ]}
        >
            {label}
        </NText>
    )
}

function VehicleCard({
    vehicle,
    onEdit,
    onDelete,
    onSetPrimary,
}: {
    vehicle: Vehicle
    onEdit: () => void
    onDelete: () => void
    onSetPrimary: () => void
}) {
    const { t } = useTranslation()
    const { theme } = useTheme()

    const fuelKey =
        `profile.vehicleForm.fuel_${vehicle.fuelType.replace(/-/g, "_")}` as any
    const transKey = `profile.vehicleForm.trans_${vehicle.transmission}` as any

    return (
        <View style={styles.vehicleCardWrapper}>
            <NButton
                color={
                    vehicle.isPrimary
                        ? "rgba(33, 168, 112, 0.2)"
                        : "rgba(0,0,0,0.3)"
                }
                style={styles.vehicleCard}
                onPress={onEdit}
            >
                <View style={styles.vehicleCardInner}>
                    <View style={styles.vehicleCardTop}>
                        <View style={styles.vehicleCardTitle}>
                            {vehicle.isPrimary && (
                                <View
                                    style={[
                                        styles.primaryBadge,
                                        {
                                            backgroundColor:
                                                "rgba(33,168,112,0.3)",
                                        },
                                    ]}
                                >
                                    <NText
                                        style={[
                                            styles.primaryBadgeText,
                                            {
                                                color: "rgb(33,168,112)",
                                                fontFamily: fonts.bold,
                                            },
                                        ]}
                                    >
                                        {t("profile.primaryBadge")}
                                    </NText>
                                </View>
                            )}
                            <NText
                                style={[
                                    styles.vehicleNickname,
                                    { fontFamily: fonts.bold },
                                ]}
                            >
                                {vehicle.nickname ||
                                    `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                            </NText>
                        </View>
                    </View>

                    {(vehicle.year || vehicle.make || vehicle.model) && (
                        <NText
                            style={[
                                styles.vehicleLine,
                                { color: theme.text, fontFamily: fonts.medium },
                            ]}
                        >
                            {[
                                vehicle.year,
                                vehicle.make,
                                vehicle.model,
                                vehicle.trim,
                            ]
                                .filter(Boolean)
                                .join(" ")}
                        </NText>
                    )}

                    <View style={styles.vehicleMeta}>
                        {vehicle.currentMileage ? (
                            <NText
                                style={[
                                    styles.vehicleMetaText,
                                    {
                                        color: theme.textMuted,
                                        fontFamily: fonts.light,
                                    },
                                ]}
                            >
                                {vehicle.currentMileage} km
                            </NText>
                        ) : null}
                        <NText
                            style={[
                                styles.vehicleMetaText,
                                {
                                    color: theme.textMuted,
                                    fontFamily: fonts.light,
                                },
                            ]}
                        >
                            {t(fuelKey)}
                        </NText>
                        <NText
                            style={[
                                styles.vehicleMetaText,
                                {
                                    color: theme.textMuted,
                                    fontFamily: fonts.light,
                                },
                            ]}
                        >
                            {t(transKey)}
                        </NText>
                        {vehicle.licensePlate ? (
                            <NText
                                style={[
                                    styles.vehicleMetaText,
                                    {
                                        color: theme.textMuted,
                                        fontFamily: fonts.light,
                                    },
                                ]}
                            >
                                {vehicle.licensePlate}
                            </NText>
                        ) : null}
                    </View>

                    {vehicle.engineSize ? (
                        <NText
                            style={[
                                styles.vehicleMetaText,
                                {
                                    color: theme.textMuted,
                                    fontFamily: fonts.light,
                                },
                            ]}
                        >
                            {vehicle.engineSize}
                        </NText>
                    ) : null}
                </View>
            </NButton>

            {/* Action buttons sit outside NButton so they don't trigger onEdit */}
            <View style={styles.vehicleCardActions}>
                {!vehicle.isPrimary && (
                    <TouchableOpacity
                        onPress={onSetPrimary}
                        style={styles.actionBtn}
                        hitSlop={8}
                    >
                        <Ionicons
                            name="star-outline"
                            size={18}
                            color={theme.textMuted}
                        />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    onPress={onDelete}
                    style={styles.actionBtn}
                    hitSlop={8}
                >
                    <Ionicons
                        name="trash-outline"
                        size={18}
                        color={theme.error}
                    />
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default function ProfileScreen() {
    const { t } = useTranslation()
    const { theme } = useTheme()
    const { userEmail, signOut } = useAuthContext()
    const {
        profile,
        saveProfile,
        addVehicle,
        updateVehicle,
        removeVehicle,
        setPrimaryVehicle,
    } = useProfileContext()
    const router = useRouter()

    // Personal info state
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<{
        firstName?: string
        lastName?: string
        phoneNumber?: string
    }>({})

    // Vehicle modal state
    const [vehicleModalVisible, setVehicleModalVisible] = useState(false)
    const [editingVehicleId, setEditingVehicleId] = useState<string | null>(
        null,
    )
    const [vehicleForm, setVehicleForm] =
        useState<Omit<Vehicle, "id">>(DEFAULT_FORM)
    const [vinLoading, setVinLoading] = useState(false)

    // Delete confirm modal
    const [deleteVehicle, setDeleteVehicle] = useState<Vehicle | null>(null)

    useEffect(() => {
        if (profile) {
            setFirstName(profile.firstName)
            setLastName(profile.lastName)
            setPhoneNumber(profile.phoneNumber)
        }
    }, [profile])

    const handleSavePersonalInfo = async () => {
        const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/
        const errors: typeof fieldErrors = {}

        if (firstName.trim() && (firstName.trim().length < 2 || !nameRegex.test(firstName.trim()))) {
            errors.firstName = t("validation.invalidName")
        }
        if (lastName.trim() && (lastName.trim().length < 2 || !nameRegex.test(lastName.trim()))) {
            errors.lastName = t("validation.invalidName")
        }
        if (phoneNumber.trim() && !/^[+\d\s\-(). ]{7,}$/.test(phoneNumber.trim())) {
            errors.phoneNumber = t("validation.invalidPhone")
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            return
        }

        setFieldErrors({})
        setIsSaving(true)
        try {
            await saveProfile({ firstName, lastName, phoneNumber })
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 2000)
        } finally {
            setIsSaving(false)
        }
    }

    const openAddVehicle = () => {
        setEditingVehicleId(null)
        setVehicleForm(DEFAULT_FORM)
        setVehicleModalVisible(true)
    }

    const openEditVehicle = (vehicle: Vehicle) => {
        setEditingVehicleId(vehicle.id)
        setVehicleForm({
            nickname: vehicle.nickname,
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            trim: vehicle.trim,
            vin: vehicle.vin,
            licensePlate: vehicle.licensePlate,
            color: vehicle.color,
            currentMileage: vehicle.currentMileage,
            engineSize: vehicle.engineSize,
            fuelType: vehicle.fuelType,
            transmission: vehicle.transmission,
            isPrimary: vehicle.isPrimary,
            notes: vehicle.notes,
        })
        setVehicleModalVisible(true)
    }

    const handleSaveVehicle = async () => {
        if (editingVehicleId) {
            await updateVehicle(editingVehicleId, vehicleForm)
        } else {
            await addVehicle(vehicleForm)
        }
        setVehicleModalVisible(false)
    }

    const handleLogout = () => {
        signOut()
        router.replace("/(auth)/login")
    }

    const updateVehicleField = <K extends keyof Omit<Vehicle, "id">>(
        key: K,
        value: Omit<Vehicle, "id">[K],
    ) => {
        setVehicleForm((prev) => ({ ...prev, [key]: value }))
    }

    const handleVinChange = async (raw: string) => {
        const vin = raw
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 17)
        updateVehicleField("vin", vin)
        if (vin.length !== 17) return

        const apiKey = process.env.EXPO_PUBLIC_VINDECODER_API_KEY!
        const secretKey = process.env.EXPO_PUBLIC_VINDECODER_SECRET_KEY!

        setVinLoading(true)
        try {
            const hash = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA1,
                `${vin}|decode|${apiKey}|${secretKey}`,
            )
            const controlSum = hash.substring(0, 10)

            const res = await fetch(
                `https://api.vindecoder.eu/3.2/${apiKey}/${controlSum}/decode/${vin}.json`,
            )
            const data = await res.json()
            const fields: { label: string; value: string }[] = data.decode ?? []

            const get = (label: string) => {
                const val = fields.find((f) => f.label === label)?.value
                return val && val !== "0" && val !== "-" ? String(val) : ""
            }

            const year = get("Model Year")
            const make = get("Make")
            const model = get("Model")
            const trim = get("Trim Level") || get("Body")
            const engineL = get("Engine Displacement (L)")
            const engineCcm = get("Engine Displacement (ccm)")
            const fuelRaw = get("Fuel Type")
            const engineTypeRaw = get("Engine Type")
            const transRaw = get("Transmission")

            const titleCase = (s: string) =>
                s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

            const mapFuel = (s: string): FuelType | null => {
                const l = s.toLowerCase()
                if (
                    l.includes("plug") ||
                    (l.includes("electric") && l.includes("gas"))
                )
                    return "plug-in-hybrid"
                if (l.includes("electric") || l.includes("bev"))
                    return "electric"
                if (l.includes("hev") || l.includes("hybrid")) return "hybrid"
                if (
                    l.includes("diesel") ||
                    l.includes("tdi") ||
                    l.includes("t-di") ||
                    l.includes("cdi") ||
                    l.includes("hdi")
                )
                    return "diesel"
                if (
                    l.includes("gasoline") ||
                    l.includes("petrol") ||
                    l.includes("benzina") ||
                    l.includes("gdi") ||
                    l.includes("mpi") ||
                    l.includes("tsi") ||
                    l.includes("tfsi")
                )
                    return "gasoline"
                if (
                    l.includes("lpg") ||
                    l.includes("gpl") ||
                    l.includes("propane")
                )
                    return "LPG"
                return null
            }

            const mapTrans = (s: string): Transmission | null => {
                const l = s.toLowerCase()
                if (l.includes("cvt") || l.includes("continuously"))
                    return "cvt"
                if (l.includes("automatic")) return "automatic"
                if (l.includes("manual") || l.includes("standard"))
                    return "manual"
                return null
            }

            const engineSize = engineL
                ? `${parseFloat(engineL).toFixed(1)}L`
                : engineCcm
                  ? `${(parseFloat(engineCcm) / 1000).toFixed(1)}L`
                  : ""

            setVehicleForm((prev) => {
                const next = { ...prev }
                if (year) next.year = String(year)
                if (make) next.make = titleCase(make)
                if (model) next.model = model
                if (trim) next.trim = trim
                if (engineSize) next.engineSize = engineSize
                const fuel =
                    (fuelRaw ? mapFuel(fuelRaw) : null) ??
                    (engineTypeRaw ? mapFuel(engineTypeRaw) : null)
                if (fuel) next.fuelType = fuel
                const trans = transRaw ? mapTrans(transRaw) : null
                if (trans) next.transmission = trans
                return next
            })
        } catch {
            // silently fail — VIN decode is best-effort
        } finally {
            setVinLoading(false)
        }
    }

    const fuelLabel = (type: FuelType) =>
        t(`profile.vehicleForm.fuel_${type.replace(/-/g, "_")}` as any)
    const transLabel = (type: Transmission) =>
        t(`profile.vehicleForm.trans_${type}` as any)

    return (
        <View style={styles.root}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
            >
                {/* - Personal Info - */}
                <SectionHeader label={t("profile.personalInfo")} />

                <View style={{ flexDirection: "row", gap: 8 }}>
                    <NInput
                        placeholder={t("profile.firstName")}
                        value={firstName}
                        onChangeText={(v) => { setFirstName(v); setFieldErrors((e) => ({ ...e, firstName: undefined })) }}
                        containerStyle={[styles.modalInput, styles.flex1]}
                        failed={!!fieldErrors.firstName}
                        failedText={fieldErrors.firstName}
                    />
                    <NInput
                        placeholder={t("profile.lastName")}
                        value={lastName}
                        onChangeText={(v) => { setLastName(v); setFieldErrors((e) => ({ ...e, lastName: undefined })) }}
                        containerStyle={[styles.modalInput, styles.flex1]}
                        failed={!!fieldErrors.lastName}
                        failedText={fieldErrors.lastName}
                    />
                </View>

                <NInput
                    placeholder={t("profile.phoneNumber")}
                    value={phoneNumber}
                    onChangeText={(v) => { setPhoneNumber(v); setFieldErrors((e) => ({ ...e, phoneNumber: undefined })) }}
                    keyboardType="phone-pad"
                    failed={!!fieldErrors.phoneNumber}
                    failedText={fieldErrors.phoneNumber}
                />

                <NButton
                    color="rgba(255,255,255,0.06)"
                    style={{ marginBottom: 8 }}
                    onPress={() => {}}
                >
                    <Ionicons
                        name="mail-outline"
                        size={16}
                        color={theme.textMuted}
                    />
                    <NText
                        style={[
                            styles.emailText,
                            {
                                color: theme.textMuted,
                                fontFamily: fonts.light,
                            },
                        ]}
                    >
                        {userEmail}
                    </NText>
                </NButton>

                <NButton
                    color={
                        saveSuccess
                            ? "rgba(33,168,112,0.4)"
                            : "rgba(33,168,112,0.2)"
                    }
                    style={styles.saveBtn}
                    onPress={handleSavePersonalInfo}
                >
                    <NText
                        style={[styles.saveBtnText, { fontFamily: fonts.bold }]}
                    >
                        {isSaving
                            ? t("profile.saving")
                            : saveSuccess
                              ? t("profile.saved")
                              : t("profile.saveChanges")}
                    </NText>
                </NButton>

                {/* - My Vehicles - */}
                <SectionHeader label={t("profile.myVehicles")} />

                <NButton
                    color="rgba(33,168,112,0.15)"
                    style={styles.addVehicleBtn}
                    onPress={openAddVehicle}
                >
                    <Ionicons
                        name="add-circle-outline"
                        size={18}
                        color="rgb(33,168,112)"
                    />
                    <NText
                        style={[
                            styles.addVehicleBtnText,
                            {
                                color: "rgb(33,168,112)",
                                fontFamily: fonts.medium,
                            },
                        ]}
                    >
                        {t("profile.addVehicle")}
                    </NText>
                </NButton>

                {!profile?.vehicles.length && (
                    <NText
                        style={[
                            styles.emptyText,
                            {
                                color: theme.textMuted,
                                fontFamily: fonts.light,
                            },
                        ]}
                    >
                        {t("profile.noVehicles")}
                    </NText>
                )}

                {profile?.vehicles.map((v) => (
                    <VehicleCard
                        key={v.id}
                        vehicle={v}
                        onEdit={() => openEditVehicle(v)}
                        onDelete={() => setDeleteVehicle(v)}
                        onSetPrimary={() => setPrimaryVehicle(v.id)}
                    />
                ))}

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* - Vehicle Form Modal - */}
            <NModal
                visible={vehicleModalVisible}
                onDismiss={() => setVehicleModalVisible(false)}
                title={
                    editingVehicleId
                        ? t("profile.vehicleForm.edit")
                        : t("profile.vehicleForm.add")
                }
                dismissLabel={t("profile.cancel")}
                confirmLabel={t("profile.vehicleForm.save")}
                onConfirm={handleSaveVehicle}
            >
                <NInput
                    placeholder={t("profile.vehicleForm.nicknamePlaceholder")}
                    value={vehicleForm.nickname}
                    onChangeText={(v) => updateVehicleField("nickname", v)}
                />

                <View style={styles.vinRow}>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                            paddingHorizontal: 12,
                        }}
                    >
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
                        onChangeText={(v) =>
                            updateVehicleField("licensePlate", v)
                        }
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
                        onChangeText={(v) =>
                            updateVehicleField("currentMileage", v)
                        }
                        containerStyle={[styles.modalInput, styles.flex1]}
                        keyboardType="numeric"
                    />
                    <NInput
                        placeholder={t(
                            "profile.vehicleForm.engineSizePlaceholder",
                        )}
                        value={vehicleForm.engineSize}
                        onChangeText={(v) =>
                            updateVehicleField("engineSize", v)
                        }
                        containerStyle={[styles.modalInput, styles.flex1]}
                    />
                </View>

                {/* Fuel Type */}
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
                                    ? "rgba(33,168,112,0.45)"
                                    : "rgba(255,255,255,0.06)"
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

                {/* Transmission */}
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
                                    ? "rgba(33,168,112,0.45)"
                                    : "rgba(255,255,255,0.06)"
                            }
                            style={styles.chip}
                            onPress={() =>
                                updateVehicleField("transmission", type)
                            }
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
                    containerStyle={styles.modalInput}
                    multiline
                />

                {/* Primary toggle */}
                <NButton
                    color={
                        vehicleForm.isPrimary
                            ? "rgba(33,168,112,0.35)"
                            : "rgba(255,255,255,0.06)"
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
                                ? "rgb(33,168,112)"
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
                                    ? "rgb(33,168,112)"
                                    : theme.textMuted,
                            },
                        ]}
                    >
                        {t("profile.vehicleForm.isPrimary")}
                    </NText>
                </NButton>
            </NModal>

            {/* - Delete Confirm Modal - */}
            <NModal
                visible={!!deleteVehicle}
                onDismiss={() => setDeleteVehicle(null)}
                title={t("profile.confirmDelete")}
                dismissLabel={t("profile.cancel")}
                confirmLabel={t("profile.confirm")}
                onConfirm={async () => {
                    if (deleteVehicle) {
                        await removeVehicle(deleteVehicle.id)
                        setDeleteVehicle(null)
                    }
                }}
                color="rgba(255,80,80,0.2)"
            >
                <NText style={styles.deleteMsg}>
                    {t("profile.confirmDeleteMessage")}
                </NText>
            </NModal>
        </View>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        marginTop: "10%",
    },
    scroll: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 120,
    },
    sectionHeader: {
        fontSize: 12,
        letterSpacing: 1,
        textTransform: "uppercase",
        marginTop: 28,
        marginBottom: 12,
    },
    emailRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 12,
    },
    emailText: {
        fontSize: 14,
    },
    saveBtn: {
        marginBottom: 4,
    },
    saveBtnText: {
        fontSize: 15,
    },
    addVehicleBtn: {
        flexDirection: "row",
        gap: 8,
        justifyContent: "center",
        marginBottom: 12,
    },
    addVehicleBtnText: {
        fontSize: 15,
    },
    emptyText: {
        fontSize: 14,
        textAlign: "center",
        paddingVertical: 16,
    },
    vehicleCardWrapper: {
        marginBottom: 10,
        position: "relative",
    },
    vehicleCard: {
        justifyContent: "flex-start",
    },
    vehicleCardInner: {
        width: "100%",
        alignItems: "flex-start",
        paddingRight: 56,
    },
    vehicleCardTop: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 4,
    },
    vehicleCardTitle: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 6,
    },
    vehicleCardActions: {
        position: "absolute",
        top: 18,
        right: 18,
        flexDirection: "row",
        gap: 12,
        zIndex: 10,
    },
    actionBtn: {
        padding: 2,
    },
    primaryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    primaryBadgeText: {
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    vehicleNickname: {
        fontSize: 16,
    },
    vehicleLine: {
        fontSize: 14,
        marginBottom: 4,
    },
    vehicleMeta: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 2,
    },
    vehicleMetaText: {
        fontSize: 12,
    },
    logoutBtn: {
        flexDirection: "row",
        gap: 8,
        justifyContent: "center",
        marginBottom: 4,
    },
    logoutBtnText: {
        fontSize: 15,
    },
    bottomSpacer: {
        height: 20,
    },
    // Modal form styles
    modalInput: {
        marginBottom: 1,
    },
    twoCol: {
        flexDirection: "row",
        gap: 8,
    },
    flex1: {
        flex: 1,
    },
    vinRow: {
        position: "relative",
    },
    vinInfo: {
        fontSize: 12,
        marginTop: 4,
        marginBottom: 8,
    },
    vinSpinner: {
        position: "absolute",
        right: 16,
        top: 0,
        bottom: 0,
        justifyContent: "center",
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
    deleteMsg: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: "center",
        marginBottom: 8,
    },
})
