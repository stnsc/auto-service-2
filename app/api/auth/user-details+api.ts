import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
    DynamoDBDocumentClient,
    GetCommand,
    ScanCommand,
} from "@aws-sdk/lib-dynamodb"
import type { UserProfile } from "../../types/UserProfile"
import type { ServiceApplication } from "../service-applications+api"

const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})
const docClient = DynamoDBDocumentClient.from(ddbClient)

export interface UserDetails {
    profile: UserProfile | null
    appointmentCount: number
    applications: ServiceApplication[]
}

export async function GET(request: Request) {
    const url = new URL(request.url)
    const email = url.searchParams.get("email")

    if (!email) {
        return Response.json({ error: "email is required" }, { status: 400 })
    }

    const profileTable = process.env.DYNAMODB_USER_PROFILES_TABLE_NAME
    const appointmentsTable = process.env.DYNAMODB_APPOINTMENTS_TABLE_NAME
    const applicationsTable = process.env.DYNAMODB_SERVICE_APPLICATIONS_TABLE_NAME

    const [profileResult, appointmentsResult, applicationsResult] = await Promise.allSettled([
        profileTable
            ? docClient.send(new GetCommand({ TableName: profileTable, Key: { userId: email } }))
            : Promise.resolve(null),

        appointmentsTable
            ? docClient.send(
                new ScanCommand({
                    TableName: appointmentsTable,
                    FilterExpression: "customerEmail = :email",
                    ExpressionAttributeValues: { ":email": email },
                    Select: "COUNT",
                }),
            )
            : Promise.resolve(null),

        applicationsTable
            ? docClient.send(
                new ScanCommand({
                    TableName: applicationsTable,
                    FilterExpression: "userId = :uid",
                    ExpressionAttributeValues: { ":uid": email },
                }),
            )
            : Promise.resolve(null),
    ])

    const profile =
        profileResult.status === "fulfilled" && profileResult.value
            ? ((profileResult.value as any).Item as UserProfile | null) ?? null
            : null

    const appointmentCount =
        appointmentsResult.status === "fulfilled" && appointmentsResult.value
            ? ((appointmentsResult.value as any).Count as number | undefined) ?? 0
            : 0

    const applications: ServiceApplication[] =
        applicationsResult.status === "fulfilled" && applicationsResult.value
            ? (((applicationsResult.value as any).Items ?? []) as ServiceApplication[])
            : []

    applications.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))

    const details: UserDetails = { profile, appointmentCount, applications }

    return Response.json(details)
}
