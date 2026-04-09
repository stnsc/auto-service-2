import { createContext, useContext, useState, ReactNode } from "react"

export interface AppointmentFormData {
    vehicleYear: string
    vehicleMake: string
    vehicleModel: string
    vehiclePlate: string
    problemDescription: string
    serviceCenterId: string
    preferredDate: string
    preferredTime: string
    customerName: string
    customerPhone: string
    customerEmail: string
    additionalNotes: string
}

const INITIAL_FORM_DATA: AppointmentFormData = {
    vehicleYear: "",
    vehicleMake: "",
    vehicleModel: "",
    vehiclePlate: "",
    problemDescription: "",
    serviceCenterId: "",
    preferredDate: "",
    preferredTime: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    additionalNotes: "",
}

interface AppointmentContextType {
    currentStep: number
    setCurrentStep: (step: number) => void
    formData: AppointmentFormData
    setFormData: (
        updater: (prev: AppointmentFormData) => AppointmentFormData,
    ) => void
    errors: Record<string, string | null>
    setErrors: (
        updater: (
            prev: Record<string, string | null>,
        ) => Record<string, string | null>,
    ) => void
    resetAppointment: () => void
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(
    undefined,
)

export function AppointmentProvider({ children }: { children: ReactNode }) {
    const [currentStep, setCurrentStep] = useState(0)
    const [formData, setFormDataState] =
        useState<AppointmentFormData>(INITIAL_FORM_DATA)
    const [errors, setErrorsState] = useState<Record<string, string | null>>({})

    const setFormData = (
        updater: (prev: AppointmentFormData) => AppointmentFormData,
    ) => {
        setFormDataState((prev) => updater(prev))
    }

    const setErrors = (
        updater: (
            prev: Record<string, string | null>,
        ) => Record<string, string | null>,
    ) => {
        setErrorsState((prev) => updater(prev))
    }

    const resetAppointment = () => {
        setCurrentStep(0)
        setFormDataState(INITIAL_FORM_DATA)
        setErrorsState({})
    }

    return (
        <AppointmentContext.Provider
            value={{
                currentStep,
                setCurrentStep,
                formData,
                setFormData,
                errors,
                setErrors,
                resetAppointment,
            }}
        >
            {children}
        </AppointmentContext.Provider>
    )
}

export function useAppointmentContext() {
    const context = useContext(AppointmentContext)
    if (!context) {
        throw new Error(
            "useAppointmentContext must be used within AppointmentProvider",
        )
    }
    return context
}
