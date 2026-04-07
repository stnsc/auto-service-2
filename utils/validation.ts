export type ValidationRule = (value: string) => string | null

export const validators = {
    required: (fieldName: string = "This field"): ValidationRule => (value) => {
        return value.trim().length === 0 ? `${fieldName} is required` : null
    },

    email: (): ValidationRule => (value) => {
        if (value.trim().length === 0) return null
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return !emailRegex.test(value) ? "Invalid email format" : null
    },

    phone: (): ValidationRule => (value) => {
        if (value.trim().length === 0) return null
        const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/
        return !phoneRegex.test(value) ? "Invalid phone number" : null
    },

    minLength: (min: number): ValidationRule => (value) => {
        return value.trim().length < min
            ? `Must be at least ${min} characters`
            : null
    },

    maxLength: (max: number): ValidationRule => (value) => {
        return value.length > max
            ? `Cannot exceed ${max} characters`
            : null
    },

    date: (format: "YYYY-MM-DD" | "MM/DD/YYYY" = "YYYY-MM-DD"): ValidationRule => (value) => {
        if (value.trim().length === 0) return null

        let dateRegex: RegExp
        if (format === "YYYY-MM-DD") {
            dateRegex = /^\d{4}-\d{2}-\d{2}$/
        } else {
            dateRegex = /^\d{2}\/\d{2}\/\d{4}$/
        }

        if (!dateRegex.test(value)) {
            return `Date must be in ${format} format`
        }

        const date = new Date(value)
        return isNaN(date.getTime()) ? "Invalid date" : null
    },

    time: (format: "HH:MM" | "HH:MM:SS" = "HH:MM"): ValidationRule => (value) => {
        if (value.trim().length === 0) return null

        let timeRegex: RegExp
        if (format === "HH:MM") {
            timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
        } else {
            timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/
        }

        return !timeRegex.test(value) ? `Time must be in ${format} format` : null
    },

    numeric: (): ValidationRule => (value) => {
        return /^\d+$/.test(value) || value.trim().length === 0
            ? null
            : "Must be numeric"
    },

    year: (): ValidationRule => (value) => {
        if (value.trim().length === 0) return null
        const year = parseInt(value, 10)
        const currentYear = new Date().getFullYear()
        if (isNaN(year)) return "Must be a valid year"
        if (year < 1900 || year > currentYear + 1)
            return `Year must be between 1900 and ${currentYear + 1}`
        return null
    },

    custom: (validator: (value: string) => boolean, message: string): ValidationRule => (value) => {
        return value.trim().length === 0 || validator(value) ? null : message
    },
}

export const validateField = (
    value: string,
    rules: ValidationRule[]
): string | null => {
    for (const rule of rules) {
        const error = rule(value)
        if (error) return error
    }
    return null
}

export const validateForm = (
    data: Record<string, string>,
    rulesMap: Record<string, ValidationRule[]>
): Record<string, string | null> => {
    const errors: Record<string, string | null> = {}

    Object.entries(rulesMap).forEach(([field, rules]) => {
        errors[field] = validateField(data[field] || "", rules)
    })

    return errors
}

export const hasErrors = (errors: Record<string, string | null>): boolean => {
    return Object.values(errors).some((error) => error !== null)
}
