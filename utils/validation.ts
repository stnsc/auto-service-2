export type ValidationRule = (value: string) => string | null

export const validators = {
    required: (fieldName: string = "This field", suffix: string = "is required"): ValidationRule => (value) => {
        return value.trim().length === 0 ? `${fieldName} ${suffix}` : null
    },

    email: (message = "Invalid email format"): ValidationRule => (value) => {
        if (value.trim().length === 0) return null
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return !emailRegex.test(value) ? message : null
    },

    phone: (message = "Invalid phone number"): ValidationRule => (value) => {
        if (value.trim().length === 0) return null
        const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/
        return !phoneRegex.test(value) ? message : null
    },

    minLength: (min: number, message?: string): ValidationRule => (value) => {
        return value.trim().length < min
            ? (message ?? `Must be at least ${min} characters`)
            : null
    },

    maxLength: (max: number, message?: string): ValidationRule => (value) => {
        return value.length > max
            ? (message ?? `Cannot exceed ${max} characters`)
            : null
    },

    date: (format: "YYYY-MM-DD" | "MM/DD/YYYY" = "YYYY-MM-DD", messages?: { invalidFormat?: string; invalid?: string }): ValidationRule => (value) => {
        if (value.trim().length === 0) return null

        let dateRegex: RegExp
        if (format === "YYYY-MM-DD") {
            dateRegex = /^\d{4}-\d{2}-\d{2}$/
        } else {
            dateRegex = /^\d{2}\/\d{2}\/\d{4}$/
        }

        if (!dateRegex.test(value)) {
            return messages?.invalidFormat ?? `Date must be in ${format} format`
        }

        const date = new Date(value)
        return isNaN(date.getTime()) ? (messages?.invalid ?? "Invalid date") : null
    },

    time: (format: "HH:MM" | "HH:MM:SS" = "HH:MM", message?: string): ValidationRule => (value) => {
        if (value.trim().length === 0) return null

        let timeRegex: RegExp
        if (format === "HH:MM") {
            timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
        } else {
            timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/
        }

        return !timeRegex.test(value) ? (message ?? `Time must be in ${format} format`) : null
    },

    numeric: (message = "Must be numeric"): ValidationRule => (value) => {
        return /^\d+$/.test(value) || value.trim().length === 0
            ? null
            : message
    },

    year: (messages?: { invalid?: string; outOfRange?: (min: number, max: number) => string }): ValidationRule => (value) => {
        if (value.trim().length === 0) return null
        const year = parseInt(value, 10)
        const currentYear = new Date().getFullYear()
        if (isNaN(year)) return messages?.invalid ?? "Must be a valid year"
        if (year < 1900 || year > currentYear + 1)
            return messages?.outOfRange
                ? messages.outOfRange(1900, currentYear + 1)
                : `Year must be between 1900 and ${currentYear + 1}`
        return null
    },

    password: (messages?: { minLength?: string; uppercase?: string; lowercase?: string; number?: string }): ValidationRule => (value) => {
        if (value.length === 0) return null
        if (value.length < 8) return messages?.minLength ?? "Must be at least 8 characters"
        if (!/[A-Z]/.test(value)) return messages?.uppercase ?? "Must include an uppercase letter"
        if (!/[a-z]/.test(value)) return messages?.lowercase ?? "Must include a lowercase letter"
        if (!/[0-9]/.test(value)) return messages?.number ?? "Must include a number"
        return null
    },

    matches: (otherValue: () => string, message: string = "Fields do not match"): ValidationRule => (_value) => {
        return _value !== otherValue() ? message : null
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
