import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from "react-native"
import { useState, useEffect } from "react"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

import { NInput } from "../../components/replacements/NInput"
import { NButton } from "../../components/replacements/NButton"
import { NText } from "../../components/replacements/NText"
import { NModal } from "../../components/replacements/NModal"
import { AccentPicker } from "../../components/AccentPicker"
import {
    VehicleFormContent,
    DEFAULT_VEHICLE_FORM,
} from "../../components/bundle/VehicleFormContent"
import { useVinDecoder } from "../../hooks/useVinDecoder"
import { useAuthContext } from "../../context/AuthContext"
import { useProfileContext } from "../../context/ProfileContext"
import { useTheme } from "../../context/ThemeContext"
import { fonts } from "../../theme"
import { Vehicle } from "../types/UserProfile"
import type { ServiceApplication } from "../api/service-applications+api"
import "../../i18n"

const DEFAULT_FORM = DEFAULT_VEHICLE_FORM

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
                        ? theme.accentSubtle
                        : theme.overlayBg
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
                                            backgroundColor: theme.accentSubtle,
                                        },
                                    ]}
                                >
                                    <NText
                                        style={[
                                            styles.primaryBadgeText,
                                            {
                                                color: theme.accentSolid,
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
    const { theme, accentKey, setAccentKey, colorScheme } = useTheme()
    const { userEmail, user, signOut } = useAuthContext()
    const {
        profile,
        saveProfile,
        addVehicle,
        updateVehicle,
        removeVehicle,
        setPrimaryVehicle,
    } = useProfileContext()
    const router = useRouter()

    const [serviceApps, setServiceApps] = useState<ServiceApplication[]>([])

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
    const { vinLoading, handleVinChange } = useVinDecoder(setVehicleForm)

    // Delete confirm modal
    const [deleteVehicle, setDeleteVehicle] = useState<Vehicle | null>(null)

    useEffect(() => {
        if (!userEmail) return
        const uid = user?.getUsername() ?? userEmail
        fetch(`/api/service-applications?userId=${encodeURIComponent(uid)}`)
            .then((r) => r.json())
            .then((data) => {
                setServiceApps(Array.isArray(data) ? data : [])
            })
            .catch(() => {})
    }, [userEmail, user])

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

        if (
            firstName.trim() &&
            (firstName.trim().length < 2 || !nameRegex.test(firstName.trim()))
        ) {
            errors.firstName = t("validation.invalidName")
        }
        if (
            lastName.trim() &&
            (lastName.trim().length < 2 || !nameRegex.test(lastName.trim()))
        ) {
            errors.lastName = t("validation.invalidName")
        }
        if (
            phoneNumber.trim() &&
            !/^[+\d\s\-(). ]{7,}$/.test(phoneNumber.trim())
        ) {
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
                        onChangeText={(v) => {
                            setFirstName(v)
                            setFieldErrors((e) => ({
                                ...e,
                                firstName: undefined,
                            }))
                        }}
                        containerStyle={[styles.modalInput, styles.flex1]}
                        failed={!!fieldErrors.firstName}
                        failedText={fieldErrors.firstName}
                    />
                    <NInput
                        placeholder={t("profile.lastName")}
                        value={lastName}
                        onChangeText={(v) => {
                            setLastName(v)
                            setFieldErrors((e) => ({
                                ...e,
                                lastName: undefined,
                            }))
                        }}
                        containerStyle={[styles.modalInput, styles.flex1]}
                        failed={!!fieldErrors.lastName}
                        failedText={fieldErrors.lastName}
                    />
                </View>

                <NInput
                    placeholder={t("profile.phoneNumber")}
                    value={phoneNumber}
                    onChangeText={(v) => {
                        setPhoneNumber(v)
                        setFieldErrors((e) => ({
                            ...e,
                            phoneNumber: undefined,
                        }))
                    }}
                    keyboardType="phone-pad"
                    failed={!!fieldErrors.phoneNumber}
                    failedText={fieldErrors.phoneNumber}
                />

                <NButton
                    color={theme.surface}
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
                            ? theme.accent
                            : theme.accentSubtle
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
                    color={theme.accentSubtle}
                    style={styles.addVehicleBtn}
                    onPress={openAddVehicle}
                >
                    <Ionicons
                        name="add-circle-outline"
                        size={18}
                        color={theme.accentSolid}
                    />
                    <NText
                        style={[
                            styles.addVehicleBtnText,
                            {
                                color: theme.accentSolid,
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

                {/* - Appearance - */}
                <SectionHeader label={t("profile.appearance")} />
                <NText
                    style={[
                        styles.emptyText,
                        { color: theme.textMuted, fontFamily: fonts.light },
                    ]}
                >
                    {t("profile.accentColor")}
                </NText>
                <AccentPicker
                    accentKey={accentKey}
                    colorScheme={colorScheme}
                    onSelect={setAccentKey}
                />

                {/* - Register Your Service - */}
                <SectionHeader label={t("profile.registerServiceBanner")} />
                <NText
                    style={[
                        styles.emptyText,
                        { color: theme.textMuted, fontFamily: fonts.light },
                    ]}
                >
                    {t("profile.registerServiceDesc")}
                </NText>

                {serviceApps.map((app) => (
                    <View key={app.applicationId} style={[styles.apptCard, { backgroundColor: theme.surface }]}>
                        <View style={styles.apptHeader}>
                            <NText
                                style={[
                                    styles.apptService,
                                    { fontFamily: fonts.medium, color: theme.text },
                                ]}
                            >
                                {app.serviceName}
                            </NText>
                            <View
                                style={[
                                    styles.apptBadge,
                                    {
                                        backgroundColor:
                                            app.status === "approved"
                                                ? "rgba(33,168,112,0.85)"
                                                : app.status === "rejected"
                                                  ? "rgba(220,50,50,0.75)"
                                                  : "rgba(245,158,11,0.85)",
                                    },
                                ]}
                            >
                                <NText
                                    style={[
                                        styles.apptBadgeText,
                                        { fontFamily: fonts.medium },
                                    ]}
                                >
                                    {t(`applications.status.${app.status}`)}
                                </NText>
                            </View>
                        </View>
                        {app.status === "rejected" && app.rejectionReason ? (
                            <NText
                                style={[
                                    styles.apptMeta,
                                    {
                                        color: "rgba(220,100,100,0.8)",
                                        fontFamily: fonts.light,
                                    },
                                ]}
                            >
                                {app.rejectionReason}
                            </NText>
                        ) : null}
                    </View>
                ))}

                <NButton
                    color={theme.accentSubtle}
                    style={styles.addVehicleBtn}
                    onPress={() => router.push("/register-service" as any)}
                >
                    <Ionicons
                        name="business-outline"
                        size={18}
                        color={theme.accentSolid}
                    />
                    <NText
                        style={[
                            styles.addVehicleBtnText,
                            {
                                color: theme.accentSolid,
                                fontFamily: fonts.medium,
                            },
                        ]}
                    >
                        {t("profile.registerServiceBtn")}
                    </NText>
                </NButton>

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
                <VehicleFormContent
                    vehicleForm={vehicleForm}
                    updateVehicleField={updateVehicleField}
                    handleVinChange={handleVinChange}
                    vinLoading={vinLoading}
                />
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
    apptCard: {
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        gap: 3,
    },
    apptHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 2,
    },
    apptService: {
        fontSize: 14,
        flex: 1,
        marginRight: 8,
    },
    apptBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    apptBadgeText: {
        color: "#ffffff",
        fontSize: 11,
    },
    apptMeta: {
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
