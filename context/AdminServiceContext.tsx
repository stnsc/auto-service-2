import React, { createContext, useContext, useState } from "react"

interface AdminServiceContextType {
    serviceId: string | null
    serviceName: string | null
    setService: (id: string, name: string) => void
    clearService: () => void
}

const AdminServiceContext = createContext<AdminServiceContextType>({
    serviceId: null,
    serviceName: null,
    setService: () => {},
    clearService: () => {},
})

export function AdminServiceProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const [serviceId, setServiceId] = useState<string | null>(null)
    const [serviceName, setServiceName] = useState<string | null>(null)

    const setService = (id: string, name: string) => {
        setServiceId(id)
        setServiceName(name)
    }

    const clearService = () => {
        setServiceId(null)
        setServiceName(null)
    }

    return (
        <AdminServiceContext.Provider
            value={{ serviceId, serviceName, setService, clearService }}
        >
            {children}
        </AdminServiceContext.Provider>
    )
}

export const useAdminService = () => useContext(AdminServiceContext)
