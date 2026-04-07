import { View, StyleSheet, ScrollView } from "react-native"
import { useState, useEffect } from "react"
import { NInput } from "../../components/replacements/NInput"
import { NButton } from "../../components/replacements/NButton"
import { NText } from "../../components/replacements/NText"
import { validators, validateForm, hasErrors } from "../../utils/validation"
import { useChatContext } from "../../context/ChatContext"

interface FormData {
    // Step 1: Vehicle Info
    vehicleYear: string
    vehicleMake: string
    vehicleModel: string
    vehiclePlate: string

    // Step 2: Problem Description
    problemDescription: string

    // Step 3: Appointment Details
    preferredDate: string
    preferredTime: string

    // Step 4: Contact & Additional Info
    customerName: string
    customerPhone: string
    customerEmail: string
    additionalNotes: string
}

const STEPS = [
    "Vehicle Info",
    "Problem Description",
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

    // Step 3: Appointment Details
    preferredDate: [
        validators.required("Preferred date"),
        validators.date("YYYY-MM-DD"),
    ],
    preferredTime: [
        validators.required("Preferred time"),
        validators.time("HH:MM"),
    ],

    // Step 4: Contact & Additional Info
    customerName: [validators.required("Full name")],
    customerPhone: [validators.required("Phone number"), validators.phone()],
    customerEmail: [validators.required("Email"), validators.email()],
    additionalNotes: [],
}

export default function AppointmentScreen() {
    const [currentStep, setCurrentStep] = useState(0)
    const [formData, setFormData] = useState<FormData>({
        vehicleYear: "",
        vehicleMake: "",
        vehicleModel: "",
        vehiclePlate: "",
        problemDescription: "",
        preferredDate: "",
        preferredTime: "",
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        additionalNotes: "",
    })
    const [errors, setErrors] = useState<Record<string, string | null>>({})

    // Get vehicle info from chat context
    const { vehicleInfo, summary } = useChatContext()

    // Auto-populate fields from chat context on mount
    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            vehicleYear: vehicleInfo.year ? vehicleInfo.year.toString() : "",
            vehicleMake: vehicleInfo.make || "",
            vehicleModel: vehicleInfo.model || "",
            problemDescription: summary || "",
        }))
    }, [vehicleInfo.year, vehicleInfo.make, vehicleInfo.model, summary])

    const updateField = (field: keyof FormData, value: string) => {
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
        const fieldsToValidate: (keyof FormData)[] = {
            0: ["vehicleYear", "vehicleMake", "vehicleModel", "vehiclePlate"],
            1: ["problemDescription"],
            2: ["preferredDate", "preferredTime"],
            3: ["customerName", "customerPhone", "customerEmail"],
            4: [],
        }[currentStep] as (keyof FormData)[]

        // Validate current step fields
        const rulesMap = Object.entries(VALIDATION_RULES)
            .filter(([field]) =>
                fieldsToValidate.includes(field as keyof FormData),
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

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Vehicle Info
                return (
                    <View style={styles.stepContent}>
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
                    <View style={styles.stepContent}>
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

            case 2: // Appointment Details
                return (
                    <View style={styles.stepContent}>
                        <NInput
                            placeholder="Preferred Date (YYYY-MM-DD)"
                            value={formData.preferredDate}
                            onChangeText={(text) =>
                                updateField("preferredDate", text)
                            }
                            containerStyle={styles.input}
                            failed={!!errors.preferredDate}
                            failedText={errors.preferredDate || ""}
                        />
                        <NInput
                            placeholder="Preferred Time (HH:MM)"
                            value={formData.preferredTime}
                            onChangeText={(text) =>
                                updateField("preferredTime", text)
                            }
                            containerStyle={styles.input}
                            failed={!!errors.preferredTime}
                            failedText={errors.preferredTime || ""}
                        />
                    </View>
                )

            case 3: // Contact & Additional Info
                return (
                    <View style={styles.stepContent}>
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

            case 4: // Confirmation
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.confirmationBox}>
                            <NText style={styles.confirmLabel}>Vehicle:</NText>
                            <NText style={styles.confirmValue}>
                                {formData.vehicleYear} {formData.vehicleMake}{" "}
                                {formData.vehicleModel}
                            </NText>

                            <NText style={styles.confirmLabel}>Problem:</NText>
                            <NText style={styles.confirmValue}>
                                {formData.problemDescription}
                            </NText>

                            <NText style={styles.confirmLabel}>
                                Appointment:
                            </NText>
                            <NText style={styles.confirmValue}>
                                {formData.preferredDate} at{" "}
                                {formData.preferredTime}
                            </NText>

                            <NText style={styles.confirmLabel}>Contact:</NText>
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
                    </View>
                )

            default:
                return null
        }
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
        >
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
                {STEPS.map((step, index) => (
                    <View key={index} style={styles.progressItem}>
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
                Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
            </NText>

            {/* Step Content */}
            {renderStepContent()}

            {/* Navigation Buttons */}
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
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: "10%",
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
    },
    progressItem: {
        flex: 1,
        alignItems: "center",
        flexDirection: "row",
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
    stepContent: {
        marginBottom: 30,
    },
    stepTitle: {
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 20,
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
        flexDirection: "row",
        gap: 12,
        marginTop: 20,
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
