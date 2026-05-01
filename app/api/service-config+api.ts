import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    UpdateCommand,
} from "@aws-sdk/lib-dynamodb"

const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})
const docClient = DynamoDBDocumentClient.from(ddbClient)

const TABLE = process.env.DYNAMODB_SERVICE_CONFIG_TABLE_NAME!
const SERVICE_ID = process.env.SERVICE_ID ?? "default"

export type DayKey =
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday"

export type DayConfig = { isOpen: boolean; open: string; close: string }
export type WeekSchedule = Record<DayKey, DayConfig>

export interface ServiceConfig {
    serviceId: string
    name: string
    address: string
    phone: string
    type: string
    latitude: number | null
    longitude: number | null
    schedule: WeekSchedule
    slotDuration: number
    bookingWindowWeeks: number
    updatedAt: string
}

const DEFAULT_SCHEDULE: WeekSchedule = {
    monday: { isOpen: true, open: "09:00", close: "17:00" },
    tuesday: { isOpen: true, open: "09:00", close: "17:00" },
    wednesday: { isOpen: true, open: "09:00", close: "17:00" },
    thursday: { isOpen: true, open: "09:00", close: "17:00" },
    friday: { isOpen: true, open: "09:00", close: "17:00" },
    saturday: { isOpen: false, open: "09:00", close: "14:00" },
    sunday: { isOpen: false, open: "09:00", close: "14:00" },
}

export const DEFAULT_CONFIG: ServiceConfig = {
    serviceId: SERVICE_ID,
    name: "",
    address: "",
    phone: "",
    type: "",
    latitude: null,
    longitude: null,
    schedule: DEFAULT_SCHEDULE,
    slotDuration: 30,
    bookingWindowWeeks: 8,
    updatedAt: new Date().toISOString(),
}

export async function GET(request: Request) {
    const url = new URL(request.url)
    const serviceId = url.searchParams.get("serviceId") ?? SERVICE_ID

    if (!TABLE) {
        return Response.json({ ...DEFAULT_CONFIG, serviceId })
    }
    try {
        const result = await docClient.send(
            new GetCommand({
                TableName: TABLE,
                Key: { serviceId },
            }),
        )
        const item = result.Item as ServiceConfig | undefined
        const defaults = { ...DEFAULT_CONFIG, serviceId }
        if (!item) return Response.json(defaults)
        // Ensure schedule has all days (handles partial configs)
        return Response.json({
            ...defaults,
            ...item,
            schedule: { ...DEFAULT_SCHEDULE, ...item.schedule },
        })
    } catch (err) {
        console.error("Failed to fetch service config:", err)
        return Response.json({ ...DEFAULT_CONFIG, serviceId })
    }
}

export async function PUT(request: Request) {
    if (!TABLE) {
        return Response.json(
            { error: "Service config table not configured" },
            { status: 503 },
        )
    }

    const body = await request.json()
    const resolvedServiceId = body.serviceId ?? SERVICE_ID
    const item: ServiceConfig = {
        ...DEFAULT_CONFIG,
        ...body,
        serviceId: resolvedServiceId,
        updatedAt: new Date().toISOString(),
    }

    try {
        await docClient.send(new PutCommand({ TableName: TABLE, Item: item }))

        // Sync basic info to car-services table — use UpdateCommand so we
        // don't overwrite the rating that is managed by the review system
        const servicesTable = process.env.DYNAMODB_SERVICES_TABLE_NAME
        if (servicesTable && item.name) {
            try {
                await docClient.send(
                    new UpdateCommand({
                        TableName: servicesTable,
                        Key: { id: resolvedServiceId },
                        UpdateExpression:
                            "SET #n = :name, address = :addr, phone = :phone, #t = :type, latitude = :lat, longitude = :lon",
                        ExpressionAttributeNames: {
                            "#n": "name",
                            "#t": "type",
                        },
                        ExpressionAttributeValues: {
                            ":name": item.name,
                            ":addr": item.address,
                            ":phone": item.phone,
                            ":type": item.type,
                            ":lat": item.latitude ?? 0,
                            ":lon": item.longitude ?? 0,
                        },
                    }),
                )
            } catch (syncErr) {
                console.error("Failed to sync to car-services:", syncErr)
                // Non-fatal
            }
        }

        return Response.json(item)
    } catch (err) {
        console.error("Failed to save service config:", err)
        return Response.json({ error: "Failed to save" }, { status: 500 })
    }
}
