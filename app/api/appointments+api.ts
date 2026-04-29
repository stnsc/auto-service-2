import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
    DynamoDBDocumentClient,
    PutCommand,
    QueryCommand,
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

const TABLE = process.env.DYNAMODB_APPOINTMENTS_TABLE_NAME!
const SERVICE_ID = process.env.SERVICE_ID ?? "default"

export interface Appointment {
    serviceId: string
    appointmentId: string
    userId: string
    serviceName?: string
    customerName: string
    customerPhone: string
    customerEmail: string
    vehicleYear: string
    vehicleMake: string
    vehicleModel: string
    vehiclePlate: string
    problemDescription: string
    preferredDate: string
    preferredTime: string
    additionalNotes: string
    status: "pending" | "confirmed" | "completed" | "cancelled"
    ratingToken?: string
    rating?: number
    ratingComment?: string
    ratedAt?: string
    createdAt: string
    updatedAt: string
}

// ── Notification helper ───────────────────────────────────────────────────────
async function sendCompletionNotifications(
    appointment: Appointment,
    ratingToken: string,
) {
    const appUrl = process.env.APP_URL ?? ""
    const ratingUrl = `${appUrl}/rate?t=${ratingToken}`
    const fromEmail = process.env.AWS_SES_FROM_EMAIL

    if (!fromEmail) return

    // Email via SES
    if (appointment.customerEmail) {
        try {
            const { SESClient, SendEmailCommand } = await import(
                "@aws-sdk/client-ses"
            )
            const ses = new SESClient({
                region: process.env.AWS_REGION,
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
                },
            })
            const serviceName =
                appointment.serviceName ?? "our service"
            await ses.send(
                new SendEmailCommand({
                    Source: fromEmail,
                    Destination: {
                        ToAddresses: [appointment.customerEmail],
                    },
                    Message: {
                        Subject: {
                            Data: "How was your AutoService appointment?",
                        },
                        Body: {
                            Html: {
                                Data: `
<p>Hi ${appointment.customerName},</p>
<p>Your appointment at <strong>${serviceName}</strong> on ${appointment.preferredDate} at ${appointment.preferredTime} has been marked as completed.</p>
<p>We'd love to hear how it went! Please take a moment to rate your experience:</p>
<p><a href="${ratingUrl}" style="background:#21a870;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Rate Your Experience</a></p>
<p>Or copy this link: ${ratingUrl}</p>
<br><p>Thank you,<br>AutoService Team</p>
                                `.trim(),
                            },
                            Text: {
                                Data: `Hi ${appointment.customerName}, your appointment at ${serviceName} is complete. Rate your experience: ${ratingUrl}`,
                            },
                        },
                    },
                }),
            )
        } catch (err) {
            console.error("SES send failed:", err)
        }
    }

    // SMS via SNS (opt-in, phone must be in E.164 format)
    if (
        process.env.ENABLE_SMS_NOTIFICATIONS === "true" &&
        appointment.customerPhone?.match(/^\+[1-9]\d{7,14}$/)
    ) {
        try {
            const { SNSClient, PublishCommand } = await import(
                "@aws-sdk/client-sns"
            )
            const sns = new SNSClient({
                region: process.env.AWS_REGION,
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
                },
            })
            await sns.send(
                new PublishCommand({
                    PhoneNumber: appointment.customerPhone,
                    Message: `Hi ${appointment.customerName}, your AutoService appointment is complete. Rate us: ${ratingUrl}`,
                }),
            )
        } catch (err) {
            console.error("SNS send failed:", err)
        }
    }
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
    const url = new URL(request.url)
    const filter = url.searchParams.get("filter") ?? "all"
    const date = url.searchParams.get("date")
    const userId = url.searchParams.get("userId")
    const customerEmail = url.searchParams.get("customerEmail")
    const serviceId = url.searchParams.get("serviceId") ?? SERVICE_ID
    const scan = url.searchParams.get("scan") === "true"

    if (!TABLE) {
        return Response.json(date ? { bookedTimes: [] } : [])
    }

    try {
        // Master admin: full table scan (all services)
        if (scan) {
            const result = await docClient.send(
                new ScanCommand({ TableName: TABLE }),
            )
            const items = (result.Items ?? []) as Appointment[]
            items.sort((a, b) =>
                (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
            )
            return Response.json(items)
        }

        // Customer: fetch own appointments by customerEmail
        if (customerEmail) {
            const result = await docClient.send(
                new ScanCommand({
                    TableName: TABLE,
                    FilterExpression: "customerEmail = :email",
                    ExpressionAttributeValues: { ":email": customerEmail },
                }),
            )
            const items = (result.Items ?? []) as Appointment[]
            items.sort((a, b) =>
                (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
            )
            return Response.json(items)
        }

        // Legacy: fetch by userId
        if (userId) {
            const result = await docClient.send(
                new ScanCommand({
                    TableName: TABLE,
                    FilterExpression: "userId = :uid",
                    ExpressionAttributeValues: { ":uid": userId },
                }),
            )
            const items = (result.Items ?? []) as Appointment[]
            items.sort((a, b) =>
                (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
            )
            return Response.json(items)
        }

        // Admin / availability: query by serviceId
        const result = await docClient.send(
            new QueryCommand({
                TableName: TABLE,
                KeyConditionExpression: "serviceId = :sid",
                ExpressionAttributeValues: { ":sid": serviceId },
            }),
        )
        const items = (result.Items ?? []) as Appointment[]

        // Booked times for a specific date
        if (date) {
            const bookedTimes = items
                .filter(
                    (item) =>
                        item.preferredDate === date &&
                        item.status !== "cancelled",
                )
                .map((item) => item.preferredTime)
            return Response.json({ bookedTimes })
        }

        // Admin filtered list
        const today = new Date().toISOString().slice(0, 10)
        let filtered: Appointment[]
        switch (filter) {
            case "today":
                filtered = items.filter((item) => item.preferredDate === today)
                break
            case "upcoming":
                filtered = items.filter((item) => item.preferredDate > today)
                break
            case "past":
                filtered = items.filter((item) => item.preferredDate < today)
                break
            default:
                filtered = items
        }

        filtered.sort((a, b) =>
            (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
        )
        return Response.json(filtered)
    } catch (err) {
        console.error("Failed to fetch appointments:", err)
        return Response.json(
            { error: String(err), table: TABLE ?? "NOT_SET" },
            { status: 500 },
        )
    }
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
    if (!TABLE) {
        return Response.json(
            { error: "Appointments table not configured" },
            { status: 503 },
        )
    }

    const body = await request.json()
    const {
        userId,
        serviceId,
        serviceName,
        customerName,
        customerPhone,
        customerEmail,
        vehicleYear,
        vehicleMake,
        vehicleModel,
        vehiclePlate,
        problemDescription,
        preferredDate,
        preferredTime,
        additionalNotes,
    } = body

    if (!preferredDate || !preferredTime || !customerName) {
        return Response.json(
            { error: "Missing required fields" },
            { status: 400 },
        )
    }

    const appointmentId = randomUUID()
    const item: Appointment = {
        serviceId: serviceId ?? SERVICE_ID,
        appointmentId,
        userId: userId ?? "anonymous",
        serviceName: serviceName ?? "",
        customerName,
        customerPhone: customerPhone ?? "",
        customerEmail: customerEmail ?? "",
        vehicleYear: vehicleYear ?? "",
        vehicleMake: vehicleMake ?? "",
        vehicleModel: vehicleModel ?? "",
        vehiclePlate: vehiclePlate ?? "",
        problemDescription: problemDescription ?? "",
        preferredDate,
        preferredTime,
        additionalNotes: additionalNotes ?? "",
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }

    try {
        await docClient.send(new PutCommand({ TableName: TABLE, Item: item }))
        return Response.json(item, { status: 201 })
    } catch (err) {
        console.error("Failed to create appointment:", err)
        return Response.json(
            { error: "Failed to create appointment" },
            { status: 500 },
        )
    }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(request: Request) {
    if (!TABLE) {
        return Response.json(
            { error: "Appointments table not configured" },
            { status: 503 },
        )
    }

    const body = await request.json()
    const { appointmentId, serviceId, status } = body

    if (!appointmentId || !status) {
        return Response.json(
            { error: "Missing required fields" },
            { status: 400 },
        )
    }

    const validStatuses = ["pending", "confirmed", "completed", "cancelled"]
    if (!validStatuses.includes(status)) {
        return Response.json({ error: "Invalid status" }, { status: 400 })
    }

    const sid = serviceId ?? SERVICE_ID

    try {
        const result = await docClient.send(
            new QueryCommand({
                TableName: TABLE,
                KeyConditionExpression:
                    "serviceId = :sid AND appointmentId = :aid",
                ExpressionAttributeValues: {
                    ":sid": sid,
                    ":aid": appointmentId,
                },
            }),
        )

        const existing = result.Items?.[0] as Appointment | undefined
        if (!existing) {
            return Response.json(
                { error: "Appointment not found" },
                { status: 404 },
            )
        }

        const isCompletingNow =
            status === "completed" && existing.status !== "completed"
        const ratingToken =
            isCompletingNow
                ? (existing.ratingToken ?? randomUUID())
                : existing.ratingToken

        const updated: Appointment = {
            ...(existing as Appointment),
            status,
            ratingToken,
            updatedAt: new Date().toISOString(),
        }

        await docClient.send(
            new PutCommand({ TableName: TABLE, Item: updated }),
        )

        // Send notifications when first completing the appointment
        if (isCompletingNow && ratingToken) {
            sendCompletionNotifications(updated, ratingToken).catch(
                console.error,
            )
        }

        return Response.json(updated)
    } catch (err) {
        console.error("Failed to update appointment:", err)
        return Response.json(
            { error: "Failed to update appointment" },
            { status: 500 },
        )
    }
}
