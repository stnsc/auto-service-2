import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
    DynamoDBDocumentClient,
    PutCommand,
    QueryCommand,
    ScanCommand,
} from "@aws-sdk/lib-dynamodb"
import { randomUUID } from "crypto"
import en from "../../i18n/locales/en"
import ro from "../../i18n/locales/ro"

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
    servicePhone?: string
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
    language?: string
    cancellationReason?: string
    ratingToken?: string
    rating?: number
    ratingComment?: string
    ratedAt?: string
    createdAt: string
    updatedAt: string
}

// ── Email helpers ─────────────────────────────────────────────────────────────
function emailLocale(lang?: string) {
    return lang === "ro" ? ro.email : en.email
}

function ipl(template: string, vars: Record<string, string>) {
    return Object.entries(vars).reduce(
        (s, [k, v]) => s.replaceAll(`{{${k}}}`, v),
        template,
    )
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

    const serviceName = appointment.serviceName ?? "the service center"
    const loc = emailLocale(appointment.language)
    const sc = loc.completed

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
            await ses.send(
                new SendEmailCommand({
                    Source: fromEmail,
                    Destination: {
                        ToAddresses: [appointment.customerEmail],
                    },
                    Message: {
                        Subject: { Data: ipl(sc.subject, { service: serviceName }) },
                        Body: {
                            Html: {
                                Data: `
<p>${ipl(loc.hi, { name: appointment.customerName })}</p>
<p>${ipl(sc.intro, { service: serviceName, date: appointment.preferredDate, time: appointment.preferredTime })}</p>
<p>${sc.ratePrompt}</p>
<p><a href="${ratingUrl}" style="background:#21a870;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">${sc.rateButton}</a></p>
<p>${ipl(sc.rateLink, { url: ratingUrl })}</p>
<br><p>${loc.thanks.replace("\n", "<br>")}</p>
<p style="color:#888;font-style:italic;font-size:12px;">${loc.automated}</p>
                                `.trim(),
                            },
                            Text: {
                                Data: `${ipl(loc.hi, { name: appointment.customerName })} ${ipl(sc.intro, { service: serviceName, date: appointment.preferredDate, time: appointment.preferredTime }).replace(/<[^>]+>/g, "")} ${sc.rateButton}: ${ratingUrl}`,
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
                    Message: `${ipl(sc.intro, { service: serviceName, date: appointment.preferredDate, time: appointment.preferredTime }).replace(/<[^>]+>/g, "")} ${sc.rateButton}: ${ratingUrl}`,
                }),
            )
        } catch (err) {
            console.error("SNS send failed:", err)
        }
    }
}

// ── Booking confirmation notification ────────────────────────────────────────
async function sendBookingConfirmation(appointment: Appointment) {
    const fromEmail = process.env.AWS_SES_FROM_EMAIL
    if (!fromEmail) return

    const serviceName = appointment.serviceName ?? "the service center"
    const loc = emailLocale(appointment.language)
    const sb = loc.booking

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
            await ses.send(
                new SendEmailCommand({
                    Source: fromEmail,
                    Destination: { ToAddresses: [appointment.customerEmail] },
                    Message: {
                        Subject: { Data: ipl(sb.subject, { service: serviceName }) },
                        Body: {
                            Html: {
                                Data: `
<p>${ipl(loc.hi, { name: appointment.customerName })}</p>
<p>${ipl(sb.intro, { service: serviceName })}</p>
<table style="border-collapse:collapse;width:100%;max-width:500px">
  <tr><td style="padding:8px;color:#888;font-size:12px;text-transform:uppercase">${loc.tableService}</td><td style="padding:8px"><strong>${serviceName}</strong></td></tr>
  <tr><td style="padding:8px;color:#888;font-size:12px;text-transform:uppercase">${loc.tableDatetime}</td><td style="padding:8px"><strong>${appointment.preferredDate} at ${appointment.preferredTime}</strong></td></tr>
  <tr><td style="padding:8px;color:#888;font-size:12px;text-transform:uppercase">${loc.tableVehicle}</td><td style="padding:8px">${appointment.vehicleYear} ${appointment.vehicleMake} ${appointment.vehicleModel}${appointment.vehiclePlate ? ` · ${appointment.vehiclePlate}` : ""}</td></tr>
  <tr><td style="padding:8px;color:#888;font-size:12px;text-transform:uppercase">${loc.tableProblem}</td><td style="padding:8px">${appointment.problemDescription}</td></tr>
  ${appointment.servicePhone ? `<tr><td style="padding:8px;color:#888;font-size:12px;text-transform:uppercase">${loc.tablePhone}</td><td style="padding:8px">${appointment.servicePhone}</td></tr>` : ""}
</table>
<p>${ipl(sb.footer, { service: serviceName })}</p>
<br><p>${loc.thanks.replace("\n", "<br>")}</p>
<p style="color:#888;font-style:italic;font-size:12px;">${loc.automated}</p>
                                `.trim(),
                            },
                            Text: {
                                Data: `${ipl(loc.hi, { name: appointment.customerName })} ${ipl(sb.intro, { service: serviceName }).replace(/<[^>]+>/g, "")} ${serviceName}, ${appointment.preferredDate} at ${appointment.preferredTime}. ${appointment.vehicleYear} ${appointment.vehicleMake} ${appointment.vehicleModel}.${appointment.servicePhone ? ` ${loc.tablePhone}: ${appointment.servicePhone}` : ""}`,
                            },
                        },
                    },
                }),
            )
        } catch (err) {
            console.error("SES booking confirmation failed:", err)
        }
    }

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
                    Message: `${ipl(loc.hi, { name: appointment.customerName })} ${sb.intro} ${serviceName}, ${appointment.preferredDate} at ${appointment.preferredTime}.`,
                }),
            )
        } catch (err) {
            console.error("SNS booking confirmation failed:", err)
        }
    }
}

// ── Cancellation notification ─────────────────────────────────────────────────
async function sendCancellationNotification(
    appointment: Appointment,
    reason: string,
) {
    const fromEmail = process.env.AWS_SES_FROM_EMAIL
    if (!fromEmail) return

    const serviceName = appointment.serviceName ?? "the service center"
    const loc = emailLocale(appointment.language)
    const sc = loc.cancelled

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
            await ses.send(
                new SendEmailCommand({
                    Source: fromEmail,
                    Destination: { ToAddresses: [appointment.customerEmail] },
                    Message: {
                        Subject: { Data: ipl(sc.subject, { service: serviceName }) },
                        Body: {
                            Html: {
                                Data: `
<p>${ipl(loc.hi, { name: appointment.customerName })}</p>
<p>${ipl(sc.intro, { service: serviceName, date: appointment.preferredDate, time: appointment.preferredTime })}</p>
<p><strong>${sc.reasonLabel}</strong> ${reason}</p>
<p>${sc.footer}</p>
<br><p>${sc.thankYou.replace("\n", "<br>")}</p>
<p style="color:#888;font-style:italic;font-size:12px;">${loc.automated}</p>
                                `.trim(),
                            },
                            Text: {
                                Data: `${ipl(loc.hi, { name: appointment.customerName })} ${ipl(sc.intro, { service: serviceName, date: appointment.preferredDate, time: appointment.preferredTime }).replace(/<[^>]+>/g, "")} ${sc.reasonLabel} ${reason}`,
                            },
                        },
                    },
                }),
            )
        } catch (err) {
            console.error("SES cancellation notification failed:", err)
        }
    }

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
                    Message: `${ipl(loc.hi, { name: appointment.customerName })} ${ipl(sc.intro, { service: serviceName, date: appointment.preferredDate, time: appointment.preferredTime }).replace(/<[^>]+>/g, "")} ${sc.reasonLabel} ${reason}`,
                }),
            )
        } catch (err) {
            console.error("SNS cancellation notification failed:", err)
        }
    }
}

// ── Status-confirmed notification ────────────────────────────────────────────
async function sendStatusConfirmedNotification(appointment: Appointment) {
    const fromEmail = process.env.AWS_SES_FROM_EMAIL
    if (!fromEmail) return

    const serviceName = appointment.serviceName ?? "the service center"
    const loc = emailLocale(appointment.language)
    const sc = loc.confirmed

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
            await ses.send(
                new SendEmailCommand({
                    Source: fromEmail,
                    Destination: { ToAddresses: [appointment.customerEmail] },
                    Message: {
                        Subject: { Data: ipl(sc.subject, { service: serviceName }) },
                        Body: {
                            Html: {
                                Data: `
<p>${ipl(loc.hi, { name: appointment.customerName })}</p>
<p>${ipl(sc.intro, { service: serviceName })}</p>
<table style="border-collapse:collapse;width:100%;max-width:500px">
  <tr><td style="padding:8px;color:#888;font-size:12px;text-transform:uppercase">${loc.tableDatetime}</td><td style="padding:8px"><strong>${appointment.preferredDate} at ${appointment.preferredTime}</strong></td></tr>
  <tr><td style="padding:8px;color:#888;font-size:12px;text-transform:uppercase">${loc.tableVehicle}</td><td style="padding:8px">${appointment.vehicleYear} ${appointment.vehicleMake} ${appointment.vehicleModel}${appointment.vehiclePlate ? ` · ${appointment.vehiclePlate}` : ""}</td></tr>
  ${appointment.servicePhone ? `<tr><td style="padding:8px;color:#888;font-size:12px;text-transform:uppercase">${loc.tablePhone}</td><td style="padding:8px">${appointment.servicePhone}</td></tr>` : ""}
</table>
<p>${sc.footer}</p>
<br><p>${loc.thanks.replace("\n", "<br>")}</p>
<p style="color:#888;font-style:italic;font-size:12px;">${loc.automated}</p>
                                `.trim(),
                            },
                            Text: {
                                Data: `${ipl(loc.hi, { name: appointment.customerName })} ${ipl(sc.intro, { service: serviceName }).replace(/<[^>]+>/g, "")} ${appointment.preferredDate} at ${appointment.preferredTime}.${appointment.servicePhone ? ` ${loc.tablePhone}: ${appointment.servicePhone}` : ""}`,
                            },
                        },
                    },
                }),
            )
        } catch (err) {
            console.error("SES status-confirmed notification failed:", err)
        }
    }

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
                    Message: `${ipl(loc.hi, { name: appointment.customerName })} ${ipl(sc.intro, { service: serviceName }).replace(/<[^>]+>/g, "")} ${appointment.preferredDate} at ${appointment.preferredTime}.`,
                }),
            )
        } catch (err) {
            console.error("SNS status-confirmed notification failed:", err)
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
        const now = new Date()
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
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
        servicePhone,
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
        language,
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
        servicePhone: servicePhone ?? "",
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
        language: language ?? "en",
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }

    try {
        await docClient.send(new PutCommand({ TableName: TABLE, Item: item }))
        sendBookingConfirmation(item).catch(console.error)
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
    const { appointmentId, serviceId, status, cancellationReason } = body

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

        const isCancellingNow =
            status === "cancelled" && existing.status !== "cancelled"
        const isConfirmingNow =
            status === "confirmed" && existing.status !== "confirmed"
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
            ...(isCancellingNow && cancellationReason
                ? { cancellationReason }
                : {}),
            updatedAt: new Date().toISOString(),
        }

        await docClient.send(
            new PutCommand({ TableName: TABLE, Item: updated }),
        )

        if (isConfirmingNow) {
            sendStatusConfirmedNotification(updated).catch(console.error)
        }

        if (isCompletingNow && ratingToken) {
            sendCompletionNotifications(updated, ratingToken).catch(
                console.error,
            )
        }

        if (isCancellingNow && cancellationReason) {
            sendCancellationNotification(updated, cancellationReason).catch(
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
