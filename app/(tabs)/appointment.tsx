import { View, StyleSheet, ScrollView, Pressable } from "react-native"
import { useState, useEffect, useMemo } from "react"
import { NInput } from "../../components/replacements/NInput"
import { NButton } from "../../components/replacements/NButton"
import { NText } from "../../components/replacements/NText"
import { validators, validateForm, hasErrors } from "../../utils/validation"
import { useChatContext } from "../../context/ChatContext"
import { CAR_SERVICES } from "../../data/carServicesMock"
import { useRouter } from "expo-router"
import {
    useAppointmentContext,
    AppointmentFormData,
} from "../../context/AppointmentContext"
import { fonts } from "../../theme"
import { WeeklyCalendar } from "../../components/appointment/WeeklyCalendar"

const STEPS = [
    "Vehicle Info",
    "Problem Description",
    "Service Center",
    "Appointment Details",
    "Contact & Additional Info",
    "Confirmation",
]

const VALIDATION_RULES = {
    // Step 1: Vehicle Info
    vehicleYear: [validators.required("Year"), validators.year()],
    vehicleMake: [validators.required("Make")],
    vehicleModel: [validators.required("Model")],
    vehiclePlate: [
        validators.required("License Plate"),
        validators.minLength(3),
    ],

    // Step 2: Problem Description
    problemDescription: [
        validators.required("Problem description"),
        validators.minLength(10),
    ],

    // Step 3: Service Center
    serviceCenterId: [validators.required("Service center")],

    // Step 4: Appointment Details
    preferredDate: [
        validators.required("Preferred date"),
        validators.date("YYYY-MM-DD"),
    ],
    preferredTime: [
        validators.required("Preferred time"),
        validators.time("HH:MM"),
    ],

    // Step 5: Contact & Additional Info
    customerName: [validators.required("Full name")],
    customerPhone: [validators.required("Phone number"), validators.phone()],
    customerEmail: [validators.required("Email"), validators.email()],
    additionalNotes: [],
}

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
    const router = useRouter()
    const [userLocation, setUserLocation] = useState(DEFAULT_CENTER)
    const {
        currentStep,
        setCurrentStep,
        formData,
        setFormData,
        errors,
        setErrors,
    } = useAppointmentContext()

    // Get vehicle info from chat context
    const { vehicleInfo, summary } = useChatContext()

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
        return [...CAR_SERVICES].sort((a, b) => {
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
    }, [userLocation.latitude, userLocation.longitude])

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

    const handleSubmit = () => {
        console.log("Form submitted:", formData)
    }

    const selectedServiceCenter = CAR_SERVICES.find(
        (service) => service.id === formData.serviceCenterId,
    )

    const mapTargetService =
        selectedServiceCenter ?? servicesByDistance[0] ?? CAR_SERVICES[0]

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Vehicle Info
                return (
                    <View>
                        <NInput
                            placeholder="Year"
                            value={formData.vehicleYear}
                            onChangeText={(text) =>
                                updateField("vehicleYear", text)
                            }
                            containerStyle={styles.input}
                            failed={!!errors.vehicleYear}
                            failedText={errors.vehicleYear || ""}
                        />
                        <NInput
                            placeholder="Make"
                            value={formData.vehicleMake}
                            onChangeText={(text) =>
                                updateField("vehicleMake", text)
                            }
                            containerStyle={styles.input}
                            failed={!!errors.vehicleMake}
                            failedText={errors.vehicleMake || ""}
                        />
                        <NInput
                            placeholder="Model"
                            value={formData.vehicleModel}
                            onChangeText={(text) =>
                                updateField("vehicleModel", text)
                            }
                            containerStyle={styles.input}
                            failed={!!errors.vehicleModel}
                            failedText={errors.vehicleModel || ""}
                        />
                        <NInput
                            placeholder="License Plate"
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
                            placeholder="Describe the issue with your vehicle"
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
                        <NText style={styles.stepTitle}>
                            Choose where you want to schedule your service
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
                                        color: "white",
                                    }}
                                >
                                    Open Map for the the selected center
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
                                                    color: "white",
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
                                                    Nearest to you
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
                                                    style={styles.serviceMeta}
                                                >
                                                    {service.address}
                                                </NText>
                                                <NText
                                                    style={styles.serviceMeta}
                                                >
                                                    Rating:{" "}
                                                    {service.rating.toFixed(1)}
                                                </NText>
                                            </View>
                                            <View
                                                style={{
                                                    justifyContent: "flex-end",
                                                }}
                                            >
                                                <NText
                                                    style={styles.serviceMeta}
                                                >
                                                    Distance:{" "}
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
                            <NText style={styles.stepErrorText}>
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
                        />
                        {(!!errors.preferredDate ||
                            !!errors.preferredTime) && (
                            <NText style={styles.stepErrorText}>
                                {errors.preferredDate ||
                                    errors.preferredTime}
                            </NText>
                        )}
                    </View>
                )

            case 4: // Contact & Additional Info
                return (
                    <View>
                        <NInput
                            placeholder="Full Name"
                            value={formData.customerName}
                            onChangeText={(text) =>
                                updateField("customerName", text)
                            }
                            containerStyle={styles.input}
                            failed={!!errors.customerName}
                            failedText={errors.customerName || ""}
                        />
                        <NInput
                            placeholder="Phone Number"
                            value={formData.customerPhone}
                            onChangeText={(text) =>
                                updateField("customerPhone", text)
                            }
                            containerStyle={styles.input}
                            failed={!!errors.customerPhone}
                            failedText={errors.customerPhone || ""}
                        />
                        <NInput
                            placeholder="Email Address"
                            value={formData.customerEmail}
                            onChangeText={(text) =>
                                updateField("customerEmail", text)
                            }
                            containerStyle={styles.input}
                            failed={!!errors.customerEmail}
                            failedText={errors.customerEmail || ""}
                        />
                        <NInput
                            placeholder="Additional Notes"
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
                            color="rgba(255, 255, 255, 0.05)"
                        >
                            <View
                                style={{
                                    width: "100%",
                                    alignItems: "flex-start",
                                }}
                            >
                                <NText style={styles.confirmLabel}>
                                    Vehicle:
                                </NText>
                                <NText style={styles.confirmValue}>
                                    {formData.vehicleYear}{" "}
                                    {formData.vehicleMake}{" "}
                                    {formData.vehicleModel}
                                </NText>

                                <NText style={styles.confirmLabel}>
                                    Problem:
                                </NText>
                                <NText style={styles.confirmValue}>
                                    {formData.problemDescription}
                                </NText>

                                <NText style={styles.confirmLabel}>
                                    Service Center:
                                </NText>
                                <NText style={styles.confirmValue}>
                                    {selectedServiceCenter?.name ||
                                        "Not selected"}
                                </NText>
                                <NText style={styles.confirmValue}>
                                    {selectedServiceCenter?.address || ""}
                                </NText>

                                <NText style={styles.confirmLabel}>
                                    Appointment:
                                </NText>
                                <NText style={styles.confirmValue}>
                                    {formData.preferredDate} at{" "}
                                    {formData.preferredTime}
                                </NText>

                                <NText style={styles.confirmLabel}>
                                    Contact:
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
                                    index <= currentStep &&
                                        styles.progressDotActive,
                                ]}
                            >
                                <NText style={styles.progressNumber}>
                                    {index + 1}
                                </NText>
                            </View>
                            {index < STEPS.length - 1 && (
                                <View
                                    style={[
                                        styles.progressLine,
                                        index < currentStep &&
                                            styles.progressLineActive,
                                    ]}
                                />
                            )}
                        </View>
                    ))}
                </View>

                {/* Step Title */}
                <NText style={styles.currentStep}>
                    Step {currentStep + 1} of {STEPS.length}:{" "}
                    {STEPS[currentStep]}
                </NText>

                {/* Step Content */}
                {renderStepContent()}
            </ScrollView>

            {/* Navigation Buttons - fixed above tab bar */}
            <View style={styles.buttonContainer}>
                <NButton
                    onPress={handlePrev}
                    style={StyleSheet.flatten([
                        styles.button,
                        currentStep === 0 && styles.buttonDisabled,
                    ])}
                >
                    <NText style={styles.buttonText}>Previous</NText>
                </NButton>

                {currentStep === STEPS.length - 1 ? (
                    <NButton
                        onPress={handleSubmit}
                        style={styles.button}
                        color="rgba(33, 168, 112, 0.51)"
                    >
                        <NText style={styles.buttonText}>Submit</NText>
                    </NButton>
                ) : (
                    <NButton
                        onPress={handleNext}
                        style={styles.button}
                        color="rgba(33, 168, 112, 0.51)"
                    >
                        <NText style={styles.buttonText}>Next</NText>
                    </NButton>
                )}
            </View>
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
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1,
    },
    progressDotActive: {
        backgroundColor: "rgba(255, 255, 255, 0.3)",
    },
    progressNumber: {
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: 14,
        fontWeight: "600",
    },
    progressLine: {
        flex: 1,
        height: 2,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        marginHorizontal: 4,
    },
    progressLineActive: {
        backgroundColor: "rgba(255, 255, 255, 0.3)",
    },
    currentStep: {
        color: "white",
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 20,
    },
    stepTitle: {
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 20,
    },
    stepErrorText: {
        color: "rgba(255, 0, 0, 0.8)",
        marginTop: 10,
    },
    serviceMeta: {
        fontFamily: fonts.light,
        color: "rgba(255,255,255,0.7)",
    },
    input: {
        marginBottom: 15,
    },
    confirmationBox: {
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    confirmLabel: {
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: 12,
        fontWeight: "600",
        marginTop: 12,
        marginBottom: 4,
        textTransform: "uppercase",
    },
    confirmValue: {
        color: "white",
        fontSize: 14,
        marginBottom: 4,
    },
    buttonContainer: {
        backgroundColor: "rgba(0, 0, 0, 0.2)",
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
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
})
