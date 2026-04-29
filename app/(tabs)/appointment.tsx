import { View, StyleSheet, ScrollView, Pressable } from "react-native"
import { useState, useEffect, useMemo } from "react"
import { NInput } from "../../components/replacements/NInput"
import { NButton } from "../../components/replacements/NButton"
import { NText } from "../../components/replacements/NText"
import { NModal } from "../../components/replacements/NModal"
import { validators, validateForm, hasErrors } from "../../utils/validation"
import { useChatContext } from "../../context/ChatContext"
import { useCarServices } from "../../hooks/useCarServices"
import { useRouter } from "expo-router"
import {
    useAppointmentContext,
    AppointmentFormData,
} from "../../context/AppointmentContext"
import { useProfileContext } from "../../context/ProfileContext"
import { useAuthContext } from "../../context/AuthContext"
import { fonts } from "../../theme"
import { WeeklyCalendar } from "../../components/appointment/WeeklyCalendar"
import { useAlphaNotice } from "../../hooks/useAlphaNotice"
import { useInfoNotice } from "../../context/InfoNoticeContext"
import { useTranslation } from "react-i18next"
import { useTheme } from "../../context/ThemeContext"
import type { ServiceConfig } from "../api/service-config+api"
import "../../i18n"

const STEPS_KEYS = [
    "vehicleInfo",
    "problemDescription",
    "serviceCenter",
    "appointmentDetails",
    "contactInfo",
    "confirmation",
] as const

const DEFAULT_CENTER = { latitude: 45.6427, longitude: 25.5887 }

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function AppointmentScreen() {
    const { t } = useTranslation()
    const STEPS = t("appointment.steps", { returnObjects: true }) as string[]
    const req = t("common.isRequired")
    const { theme } = useTheme()
    const VALIDATION_RULES = {
        vehicleYear: [
            validators.required(t("appointment.year"), req),
            validators.year({
                invalid: t("validation.invalidYear"),
                outOfRange: (min, max) =>
                    t("validation.yearRange", { min, max }),
            }),
        ],
        vehicleMake: [validators.required(t("appointment.make"), req)],
        vehicleModel: [validators.required(t("appointment.model"), req)],
        vehiclePlate: [
            validators.required(t("appointment.plate"), req),
            validators.minLength(3, t("validation.minLength", { min: 3 })),
        ],
        problemDescription: [
            validators.required(t("appointment.problemField"), req),
            validators.minLength(10, t("validation.minLength", { min: 10 })),
        ],
        serviceCenterId: [
            validators.required(t("appointment.centerField"), req),
        ],
        preferredDate: [
            validators.required(t("appointment.dateField"), req),
            validators.date("YYYY-MM-DD", {
                invalidFormat: t("validation.invalidDateFormat", {
                    format: "YYYY-MM-DD",
                }),
                invalid: t("validation.invalidDate"),
            }),
        ],
        preferredTime: [
            validators.required(t("appointment.timeField"), req),
            validators.time(
                "HH:MM",
                t("validation.invalidTimeFormat", { format: "HH:MM" }),
            ),
        ],
        customerName: [validators.required(t("appointment.nameField"), req)],
        customerPhone: [
            validators.required(t("appointment.phoneField"), req),
            validators.phone(t("validation.invalidPhone")),
        ],
        customerEmail: [
            validators.required(t("appointment.emailField"), req),
            validators.email(t("validation.invalidEmail")),
        ],
        additionalNotes: [] as any[],
    }
    const router = useRouter()
    const [userLocation, setUserLocation] = useState(DEFAULT_CENTER)
    const { services } = useCarServices()
    const appointmentNotice = useAlphaNotice("appointment-alpha")
    const { register } = useInfoNotice()
    const [serviceConfig, setServiceConfig] = useState<ServiceConfig | null>(
        null,
    )
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitSuccess, setSubmitSuccess] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    useEffect(() => {
        register(appointmentNotice.show)
        return () => register(null)
    }, [])

    // Fetch service schedule config for the calendar
    useEffect(() => {
        fetch("/api/service-config")
            .then((r) => r.json())
            .then(setServiceConfig)
            .catch(() => {})
    }, [])
    const {
        currentStep,
        setCurrentStep,
        formData,
        setFormData,
        errors,
        setErrors,
        resetAppointment,
    } = useAppointmentContext()

    // Get vehicle info from chat context
    const { vehicleInfo, summary } = useChatContext()
    const { profile } = useProfileContext()

    // Auto-populate fields from chat context on mount
    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            vehicleYear:
                prev.vehicleYear ||
                (vehicleInfo.year ? vehicleInfo.year.toString() : ""),
            vehicleMake: prev.vehicleMake || vehicleInfo.make || "",
            vehicleModel: prev.vehicleModel || vehicleInfo.model || "",
            problemDescription: prev.problemDescription || summary || "",
        }))
    }, [vehicleInfo.year, vehicleInfo.make, vehicleInfo.model, summary])

    // Auto-populate from profile's primary vehicle (lower priority than chat context)
    const { userEmail, user } = useAuthContext()
    useEffect(() => {
        const primary = profile?.vehicles.find((v) => v.isPrimary)
        setFormData((prev) => ({
            ...prev,
            ...(primary && {
                vehicleYear: prev.vehicleYear || primary.year,
                vehicleMake: prev.vehicleMake || primary.make,
                vehicleModel: prev.vehicleModel || primary.model,
                vehiclePlate: prev.vehiclePlate || primary.licensePlate,
            }),
            customerName:
                prev.customerName ||
                [profile?.firstName, profile?.lastName]
                    .filter(Boolean)
                    .join(" ") ||
                "",
            customerPhone: prev.customerPhone || profile?.phoneNumber || "",
            customerEmail: prev.customerEmail || userEmail || "",
        }))
    }, [profile, userEmail])

    // Use geolocation when available so the nearest center is shown first.
    useEffect(() => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                })
            },
            () => {
                setUserLocation(DEFAULT_CENTER)
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
            },
        )
    }, [])

    const servicesByDistance = useMemo(() => {
        return [...services].sort((a, b) => {
            const aDistance = distanceKm(
                userLocation.latitude,
                userLocation.longitude,
                a.latitude,
                a.longitude,
            )
            const bDistance = distanceKm(
                userLocation.latitude,
                userLocation.longitude,
                b.latitude,
                b.longitude,
            )
            return aDistance - bDistance
        })
    }, [userLocation.latitude, userLocation.longitude, services])

    const updateField = (field: keyof AppointmentFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        // Validate field as user types
        const fieldRules = VALIDATION_RULES[field]
        if (fieldRules) {
            const error = fieldRules.reduce((err: string | null, rule: any) => {
                if (err) return err
                return typeof rule === "function" ? rule(value) : null
            }, null)
            setErrors((prev) => ({ ...prev, [field]: error }))
        }
    }

    const handleNext = () => {
        // Determine which fields to validate based on current step
        const fieldsToValidate: (keyof AppointmentFormData)[] = {
            0: ["vehicleYear", "vehicleMake", "vehicleModel", "vehiclePlate"],
            1: ["problemDescription"],
            2: ["serviceCenterId"],
            3: ["preferredDate", "preferredTime"],
            4: ["customerName", "customerPhone", "customerEmail"],
            5: [],
        }[currentStep] as (keyof AppointmentFormData)[]

        // Validate current step fields
        const rulesMap = Object.entries(VALIDATION_RULES)
            .filter(([field]) =>
                fieldsToValidate.includes(field as keyof AppointmentFormData),
            )
            .reduce(
                (acc, [field, rules]) => {
                    acc[field] = rules
                    return acc
                },
                {} as Record<string, any>,
            )

        const newErrors = validateForm(
            formData as unknown as Record<string, string>,
            rulesMap,
        )
        setErrors((prev) => ({ ...prev, ...newErrors }))

        // Check if current step has errors
        if (hasErrors(newErrors)) {
            return
        }

        // Proceed to next step
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        setSubmitError(null)
        try {
            const response = await fetch("/api/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user?.getUsername() ?? userEmail ?? "anonymous",
                    serviceId: formData.serviceCenterId,
                    serviceName: services.find((s) => s.id === formData.serviceCenterId)?.name ?? "",
                    customerName: formData.customerName,
                    customerPhone: formData.customerPhone,
                    customerEmail: formData.customerEmail,
                    vehicleYear: formData.vehicleYear,
                    vehicleMake: formData.vehicleMake,
                    vehicleModel: formData.vehicleModel,
                    vehiclePlate: formData.vehiclePlate,
                    problemDescription: formData.problemDescription,
                    preferredDate: formData.preferredDate,
                    preferredTime: formData.preferredTime,
                    additionalNotes: formData.additionalNotes,
                }),
            })
            if (!response.ok) throw new Error("Failed to submit")
            setSubmitSuccess(true)
        } catch {
            setSubmitError(t("appointment.submitError"))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSuccessDismiss = () => {
        setSubmitSuccess(false)
        resetAppointment()
    }

    const selectedServiceCenter = services.find(
        (service) => service.id === formData.serviceCenterId,
    )

    const mapTargetService =
        selectedServiceCenter ?? servicesByDistance[0] ?? services[0]

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Vehicle Info
                return (
                    <View>
                        <NInput
                            placeholder={t("appointment.year")}
                            value={formData.vehicleYear}
                            onChangeText={(text) =>
                                updateField("vehicleYear", text)
                            }
                            containerStyle={styles.input}
                            failed={!!errors.vehicleYear}
                            failedText={errors.vehicleYear || ""}
                        />
                        <NInput
                            placeholder={t("appointment.make")}
                            value={formData.vehicleMake}
                            onChangeText={(text) =>
                                updateField("vehicleMake", text)
                            }
                            containerStyle={styles.input}
                            failed={!!errors.vehicleMake}
                            failedText={errors.vehicleMake || ""}
                        />
                        <NInput
                            placeholder={t("appointment.model")}
                            value={formData.vehicleModel}
                            onChangeText={(text) =>
                                updateField("vehicleModel", text)
                            }
                            containerStyle={styles.input}
                            failed={!!errors.vehicleModel}
                            failedText={errors.vehicleModel || ""}
                        />
                        <NInput
                            placeholder={t("appointment.plate")}
                            value={formData.vehiclePlate}
                            onChangeText={(text) =>
                                updateField("vehiclePlate", text)
                            }
                            containerStyle={styles.input}
                            failed={!!errors.vehiclePlate}
                            failedText={errors.vehiclePlate || ""}
                        />
                    </View>
                )

            case 1: // Problem Description
                return (
                    <View>
                        <NInput
                            placeholder={t("appointment.problemPlaceholder")}
                            value={formData.problemDescription}
                            onChangeText={(text) =>
                                updateField("problemDescription", text)
                            }
                            containerStyle={styles.input}
                            multiline
                            failed={!!errors.problemDescription}
                            failedText={errors.problemDescription || ""}
                        />
                    </View>
                )

            case 2: // Service Center
                return (
                    <View>
                        <NText
                            style={[
                                styles.stepTitle,
                                { color: theme.textMuted },
                            ]}
                        >
                            {t("appointment.chooseServiceCenter")}
                        </NText>
                        <View style={{ marginBottom: 15 }}>
                            <NButton
                                onPress={() =>
                                    router.push({
                                        pathname: "/map",
                                        params: {
                                            serviceId: mapTargetService.id,
                                            latitude:
                                                mapTargetService.latitude.toString(),
                                            longitude:
                                                mapTargetService.longitude.toString(),
                                        },
                                    })
                                }
                                color="rgba(33, 168, 112, 0.51)"
                            >
                                <NText
                                    style={{
                                        fontFamily: fonts.bold,
                                    }}
                                >
                                    {t("appointment.openMap")}
                                </NText>
                            </NButton>
                        </View>
                        {servicesByDistance.map((service, index) => {
                            const isSelected =
                                formData.serviceCenterId === service.id
                            return (
                                <NButton
                                    key={service.id}
                                    color={
                                        isSelected
                                            ? "rgba(30, 212, 157, 0.4)"
                                            : "rgba(0, 0, 0, 0.4)"
                                    }
                                    onPress={() =>
                                        updateField(
                                            "serviceCenterId",
                                            service.id,
                                        )
                                    }
                                    style={{ marginBottom: 10 }}
                                >
                                    <View style={{ flex: 1, width: "100%" }}>
                                        <View
                                            style={{
                                                flex: 1,
                                                flexDirection: "row",
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            <NText
                                                style={{
                                                    fontFamily: fonts.bold,
                                                    fontSize: 20,
                                                    marginBottom: 5,
                                                }}
                                            >
                                                {service.name}
                                            </NText>
                                            {index === 0 && (
                                                <NText
                                                    style={{
                                                        fontFamily: fonts.bold,
                                                        fontSize: 16,
                                                        color: "rgb(30, 212, 157)",
                                                    }}
                                                >
                                                    {t("appointment.nearest")}
                                                </NText>
                                            )}
                                        </View>
                                        <View
                                            style={{
                                                flex: 1,
                                                flexDirection: "row",
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            <View>
                                                <NText
                                                    style={[
                                                        styles.serviceMeta,
                                                        {
                                                            color: theme.textMuted,
                                                        },
                                                    ]}
                                                >
                                                    {service.address}
                                                </NText>
                                                <NText
                                                    style={[
                                                        styles.serviceMeta,
                                                        {
                                                            color: theme.textMuted,
                                                        },
                                                    ]}
                                                >
                                                    {t("appointment.rating")}:{" "}
                                                    {service.rating.toFixed(1)}
                                                </NText>
                                            </View>
                                            <View
                                                style={{
                                                    justifyContent: "flex-end",
                                                }}
                                            >
                                                <NText
                                                    style={[
                                                        styles.serviceMeta,
                                                        {
                                                            color: theme.textMuted,
                                                        },
                                                    ]}
                                                >
                                                    {t("appointment.distance")}:{" "}
                                                    {distanceKm(
                                                        userLocation.latitude,
                                                        userLocation.longitude,
                                                        service.latitude,
                                                        service.longitude,
                                                    ).toFixed(1)}{" "}
                                                    km
                                                </NText>
                                            </View>
                                        </View>
                                    </View>
                                </NButton>
                            )
                        })}

                        {!!errors.serviceCenterId && (
                            <NText
                                style={[
                                    styles.stepErrorText,
                                    { color: theme.error },
                                ]}
                            >
                                {errors.serviceCenterId}
                            </NText>
                        )}
                    </View>
                )

            case 3: // Appointment Details
                return (
                    <View>
                        <WeeklyCalendar
                            serviceCenterId={formData.serviceCenterId}
                            selectedDate={formData.preferredDate}
                            selectedTime={formData.preferredTime}
                            onSelectSlot={(date, time) => {
                                updateField("preferredDate", date)
                                updateField("preferredTime", time)
                            }}
                            schedule={serviceConfig?.schedule}
                            slotDuration={serviceConfig?.slotDuration ?? 30}
                            bookingWindowWeeks={
                                serviceConfig?.bookingWindowWeeks ?? 8
                            }
                        />
                        {(!!errors.preferredDate || !!errors.preferredTime) && (
                            <NText
                                style={[
                                    styles.stepErrorText,
                                    { color: theme.error },
                                ]}
                            >
                                {errors.preferredDate || errors.preferredTime}
                            </NText>
                        )}
                    </View>
                )

            case 4: // Contact & Additional Info
                return (
                    <View>
                        <NInput
                            placeholder={t("appointment.fullName")}
                            value={formData.customerName}
                            onChangeText={(text) =>
                                updateField("customerName", text)
                            }
                            containerStyle={styles.input}
                            failed={!!errors.customerName}
                            failedText={errors.customerName || ""}
                        />
                        <NInput
                            placeholder={t("appointment.phone")}
                            value={formData.customerPhone}
                            onChangeText={(text) =>
                                updateField("customerPhone", text)
                            }
                            containerStyle={styles.input}
                            failed={!!errors.customerPhone}
                            failedText={errors.customerPhone || ""}
                        />
                        <NInput
                            placeholder={t("appointment.email")}
                            value={formData.customerEmail}
                            onChangeText={(text) =>
                                updateField("customerEmail", text)
                            }
                            containerStyle={styles.input}
                            failed={!!errors.customerEmail}
                            failedText={errors.customerEmail || ""}
                        />
                        <NInput
                            placeholder={t("appointment.additionalNotes")}
                            value={formData.additionalNotes}
                            onChangeText={(text) =>
                                updateField("additionalNotes", text)
                            }
                            containerStyle={styles.input}
                            multiline
                        />
                    </View>
                )

            case 5: // Confirmation
                return (
                    <View>
                        <NButton
                            style={{
                                width: "100%",
                                justifyContent: "flex-start",
                            }}
                            color={theme.surface}
                        >
                            <View
                                style={{
                                    width: "100%",
                                    alignItems: "flex-start",
                                }}
                            >
                                <NText
                                    style={[
                                        styles.confirmLabel,
                                        { color: theme.textSubtle },
                                    ]}
                                >
                                    {t("appointment.confirmVehicle")}:
                                </NText>
                                <NText style={styles.confirmValue}>
                                    {formData.vehicleYear}{" "}
                                    {formData.vehicleMake}{" "}
                                    {formData.vehicleModel}
                                </NText>

                                <NText
                                    style={[
                                        styles.confirmLabel,
                                        { color: theme.textSubtle },
                                    ]}
                                >
                                    {t("appointment.confirmProblem")}:
                                </NText>
                                <NText style={styles.confirmValue}>
                                    {formData.problemDescription}
                                </NText>

                                <NText
                                    style={[
                                        styles.confirmLabel,
                                        { color: theme.textSubtle },
                                    ]}
                                >
                                    {t("appointment.confirmServiceCenter")}:
                                </NText>
                                <NText style={styles.confirmValue}>
                                    {selectedServiceCenter?.name ||
                                        t("appointment.notSelected")}
                                </NText>
                                <NText style={styles.confirmValue}>
                                    {selectedServiceCenter?.address || ""}
                                </NText>

                                <NText
                                    style={[
                                        styles.confirmLabel,
                                        { color: theme.textSubtle },
                                    ]}
                                >
                                    {t("appointment.confirmAppointment")}:
                                </NText>
                                <NText style={styles.confirmValue}>
                                    {formData.preferredDate} at{" "}
                                    {formData.preferredTime}
                                </NText>

                                <NText
                                    style={[
                                        styles.confirmLabel,
                                        { color: theme.textSubtle },
                                    ]}
                                >
                                    {t("appointment.confirmContact")}:
                                </NText>
                                <NText style={styles.confirmValue}>
                                    {formData.customerName}
                                </NText>
                                <NText style={styles.confirmValue}>
                                    {formData.customerPhone}
                                </NText>
                                <NText style={styles.confirmValue}>
                                    {formData.customerEmail}
                                </NText>
                            </View>
                        </NButton>
                    </View>
                )

            default:
                return null
        }
    }

    return (
        <View style={styles.root}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
            >
                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                    {STEPS.map((step, index) => (
                        <View
                            key={index}
                            style={[
                                styles.progressItem,
                                index < STEPS.length - 1 &&
                                    styles.progressItemWithLine,
                            ]}
                        >
                            <View
                                style={[
                                    styles.progressDot,
                                    { backgroundColor: theme.surfaceMid },
                                    index <= currentStep && {
                                        backgroundColor: theme.surfaceHigh,
                                    },
                                ]}
                            >
                                <NText
                                    style={[
                                        styles.progressNumber,
                                        { color: theme.textMuted },
                                    ]}
                                >
                                    {index + 1}
                                </NText>
                            </View>
                            {index < STEPS.length - 1 && (
                                <View
                                    style={[
                                        styles.progressLine,
                                        { backgroundColor: theme.surfaceMid },
                                        index < currentStep && {
                                            backgroundColor: theme.surfaceHigh,
                                        },
                                    ]}
                                />
                            )}
                        </View>
                    ))}
                </View>

                {/* Step Title */}
                <NText style={[styles.currentStep, { color: theme.text }]}>
                    {t("appointment.stepProgress", {
                        current: currentStep + 1,
                        total: STEPS.length,
                        name: STEPS[currentStep],
                    })}
                </NText>

                {/* Step Content */}
                {renderStepContent()}
            </ScrollView>

            {/* Navigation Buttons - fixed above tab bar */}
            <View
                style={[
                    styles.buttonContainer,
                    { backgroundColor: theme.surface },
                ]}
            >
                <NButton
                    onPress={handlePrev}
                    style={StyleSheet.flatten([
                        styles.button,
                        currentStep === 0 && styles.buttonDisabled,
                    ])}
                >
                    <NText style={styles.buttonText}>
                        {t("appointment.previous")}
                    </NText>
                </NButton>

                {currentStep === STEPS.length - 1 ? (
                    <NButton
                        onPress={handleSubmit}
                        style={[
                            styles.button,
                            isSubmitting && styles.buttonDisabled,
                        ]}
                        color="rgba(33, 168, 112, 0.51)"
                    >
                        <NText style={styles.buttonText}>
                            {isSubmitting
                                ? t("appointment.submitting")
                                : t("appointment.submit")}
                        </NText>
                    </NButton>
                ) : (
                    <NButton
                        onPress={handleNext}
                        style={styles.button}
                        color="rgba(33, 168, 112, 0.51)"
                    >
                        <NText style={styles.buttonText}>
                            {t("appointment.next")}
                        </NText>
                    </NButton>
                )}
            </View>

            <NModal
                visible={appointmentNotice.visible}
                onDismiss={appointmentNotice.dismiss}
                title={t("appointment.modalTitle")}
            >
                <NText style={styles.noticeText}>
                    {t("appointment.modalLine1")}
                </NText>
                <NText style={styles.noticeText}>
                    {t("appointment.modalLine2")}
                </NText>
            </NModal>

            <NModal
                visible={submitSuccess}
                onDismiss={handleSuccessDismiss}
                title={t("appointment.submitSuccessTitle")}
            >
                <NText style={styles.noticeText}>
                    {t("appointment.submitSuccessMessage")}
                </NText>
            </NModal>

            <NModal
                visible={!!submitError}
                onDismiss={() => setSubmitError(null)}
                title={t("appointment.submitErrorTitle")}
            >
                <NText style={styles.noticeText}>{submitError}</NText>
            </NModal>
        </View>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        marginTop: "10%",
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    progressContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 30,
        marginTop: 20,
    },
    progressItem: {
        alignItems: "center",
        flexDirection: "row",
    },
    progressItemWithLine: {
        flex: 1,
    },
    progressDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1,
    },
    progressDotActive: {},
    progressNumber: {
        fontSize: 14,
        fontWeight: "600",
    },
    progressLine: {
        flex: 1,
        height: 2,
        marginHorizontal: 4,
    },
    progressLineActive: {},
    currentStep: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 20,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 20,
    },
    stepErrorText: {
        marginTop: 10,
    },
    serviceMeta: {
        fontFamily: fonts.light,
    },
    input: {
        marginBottom: 15,
    },
    confirmationBox: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
    },
    confirmLabel: {
        fontSize: 12,
        fontWeight: "600",
        marginTop: 12,
        marginBottom: 4,
        textTransform: "uppercase",
    },
    confirmValue: {
        fontSize: 14,
        marginBottom: 4,
    },
    buttonContainer: {
        padding: 15,
        marginHorizontal: 20,
        marginBottom: 100,
        borderRadius: 30,
        flexDirection: "row",
        gap: 12,
    },
    button: {
        flex: 1,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    noticeText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 10,
    },
})
