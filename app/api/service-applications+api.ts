import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
    DynamoDBDocumentClient,
    PutCommand,
    ScanCommand,
} from "@aws-sdk/lib-dynamodb"
import { randomUUID } from "crypto"

const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})
const docClient = DynamoDBDocumentClient.from(ddbClient)

const TABLE = process.env.DYNAMODB_SERVICE_APPLICATIONS_TABLE_NAME!

export interface ServiceApplication {
    applicationId: string
    userId: string
    userEmail: string
    userName: string
    serviceName: string
    address: string
    phone: string
    type: string[]
    latitude: number | null
    longitude: number | null
    description: string
    status: "pending" | "approved" | "rejected"
    rejectionReason?: string
    createdAt: string
    updatedAt: string
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")

    if (!TABLE) {
        return Response.json([])
    }

    try {
        if (userId) {
            // User fetching their own applications
            const result = await docClient.send(
                new ScanCommand({
                    TableName: TABLE,
                    FilterExpression: "userId = :uid",
                    ExpressionAttributeValues: { ":uid": userId },
                }),
            )
            const items = (result.Items ?? []) as ServiceApplication[]
            items.sort((a, b) =>
                (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
            )
            return Response.json(items)
        }

        // Admin: fetch all applications
        const result = await docClient.send(
            new ScanCommand({ TableName: TABLE }),
        )
        const items = (result.Items ?? []) as ServiceApplication[]
        items.sort((a, b) =>
            (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
        )
        return Response.json(items)
    } catch (err) {
        console.error("Failed to fetch service applications:", err)
        return Response.json([])
    }
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
    if (!TABLE) {
        return Response.json(
            { error: "Applications table not configured" },
            { status: 503 },
        )
    }

    const body = await request.json()
    const {
        userId,
        userEmail,
        userName,
        serviceName,
        address,
        phone,
        type,
        latitude,
        longitude,
        description,
    } = body

    if (!userId || !serviceName || !address) {
        return Response.json(
            { error: "Missing required fields" },
            { status: 400 },
        )
    }

    // Check for existing pending application from this user (approved is fine — they can register more)
    try {
        const existing = await docClient.send(
            new ScanCommand({
                TableName: TABLE,
                FilterExpression: "userId = :uid AND #s = :pending",
                ExpressionAttributeNames: { "#s": "status" },
                ExpressionAttributeValues: {
                    ":uid": userId,
                    ":pending": "pending",
                },
            }),
        )
        if ((existing.Items?.length ?? 0) > 0) {
            return Response.json(
                { error: "You already have a pending application" },
                { status: 409 },
            )
        }
    } catch (err) {
        console.error("Failed to check existing applications:", err)
    }

    const applicationId = randomUUID()
    const item: ServiceApplication = {
        applicationId,
        userId,
        userEmail: userEmail ?? "",
        userName: userName ?? "",
        serviceName,
        address,
        phone: phone ?? "",
        type: Array.isArray(type) ? type : type ? [type] : [],
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        description: description ?? "",
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }

    try {
        await docClient.send(new PutCommand({ TableName: TABLE, Item: item }))
        return Response.json(item, { status: 201 })
    } catch (err) {
        console.error("Failed to create application:", err)
        return Response.json(
            { error: "Failed to create application" },
            { status: 500 },
        )
    }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(request: Request) {
    if (!TABLE) {
        return Response.json(
            { error: "Applications table not configured" },
            { status: 503 },
        )
    }

    const body = await request.json()
    const { applicationId, status, rejectionReason } = body

    if (!applicationId || !status) {
        return Response.json(
            { error: "Missing required fields" },
            { status: 400 },
        )
    }

    if (!["approved", "rejected"].includes(status)) {
        return Response.json({ error: "Invalid status" }, { status: 400 })
    }

    try {
        // Fetch existing application
        const result = await docClient.send(
            new ScanCommand({
                TableName: TABLE,
                FilterExpression: "applicationId = :aid",
                ExpressionAttributeValues: { ":aid": applicationId },
            }),
        )

        const existing = result.Items?.[0] as ServiceApplication | undefined
        if (!existing) {
            return Response.json(
                { error: "Application not found" },
                { status: 404 },
            )
        }

        const updated: ServiceApplication = {
            ...existing,
            status,
            rejectionReason:
                status === "rejected" ? (rejectionReason ?? "") : undefined,
            updatedAt: new Date().toISOString(),
        }

        await docClient.send(
            new PutCommand({ TableName: TABLE, Item: updated }),
        )

        // On approval, provision the service in service-config and car-services
        if (status === "approved") {
            const provisionErrors = await provisionService(updated)
            if (
                provisionErrors.configError ||
                provisionErrors.servicesError
            ) {
                return Response.json(
                    { ...updated, provisionErrors },
                    { status: 207 },
                )
            }
        }

        return Response.json(updated)
    } catch (err) {
        console.error("Failed to update application:", err)
        return Response.json(
            { error: "Failed to update application" },
            { status: 500 },
        )
    }
}

// ── Provision approved service ────────────────────────────────────────────────
async function provisionService(
    app: ServiceApplication,
): Promise<{ configError?: string; servicesError?: string }> {
    const configTable = process.env.DYNAMODB_SERVICE_CONFIG_TABLE_NAME
    const servicesTable = process.env.DYNAMODB_SERVICES_TABLE_NAME
    const newServiceId = app.applicationId
    const errors: { configError?: string; servicesError?: string } = {}

    const DEFAULT_SCHEDULE = {
        monday: { isOpen: true, open: "09:00", close: "17:00" },
        tuesday: { isOpen: true, open: "09:00", close: "17:00" },
        wednesday: { isOpen: true, open: "09:00", close: "17:00" },
        thursday: { isOpen: true, open: "09:00", close: "17:00" },
        friday: { isOpen: true, open: "09:00", close: "17:00" },
        saturday: { isOpen: false, open: "09:00", close: "14:00" },
        sunday: { isOpen: false, open: "09:00", close: "14:00" },
    }

    if (configTable) {
        try {
            await docClient.send(
                new PutCommand({
                    TableName: configTable,
                    Item: {
                        serviceId: newServiceId,
                        name: app.serviceName,
                        address: app.address,
                        phone: app.phone,
                        type: app.type,
                        latitude: app.latitude,
                        longitude: app.longitude,
                        schedule: DEFAULT_SCHEDULE,
                        slotDuration: 30,
                        bookingWindowWeeks: 8,
                        rating: 0,
                        updatedAt: new Date().toISOString(),
                    },
                }),
            )
        } catch (err) {
            console.error("Failed to provision service config:", err)
            errors.configError = String(err)
        }
    } else {
        errors.configError = "DYNAMODB_SERVICE_CONFIG_TABLE_NAME not set"
    }

    if (servicesTable) {
        try {
            await docClient.send(
                new PutCommand({
                    TableName: servicesTable,
                    Item: {
                        id: newServiceId,
                        name: app.serviceName,
                        address: app.address,
                        phone: app.phone,
                        type: app.type,
                        latitude: app.latitude ?? 0,
                        longitude: app.longitude ?? 0,
                        rating: 0,
                    },
                }),
            )
        } catch (err) {
            console.error("Failed to provision car service entry:", err)
            errors.servicesError = String(err)
        }
    } else {
        errors.servicesError = "DYNAMODB_SERVICES_TABLE_NAME not set"
    }

    return errors
}
