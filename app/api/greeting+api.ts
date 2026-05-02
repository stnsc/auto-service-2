import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(request: Request) {
    const { firstName, vehicle, language } = await request.json()

    const vehicleDesc =
        vehicle?.make && vehicle?.model
            ? `${vehicle.year ? vehicle.year + " " : ""}${vehicle.make} ${vehicle.model}`
            : null

    const isRo = language === "ro"

    const prompt = vehicleDesc
        ? isRo
            ? `Ești un asistent auto prietenos. Generează o singură întrebare scurtă de salut (sub 60 de caractere, fără ghilimele) adresată unui client care deține un ${vehicleDesc}. Reguli stricte: întotdeauna o întrebare (termină cu ?), pozitivă și utilă, adresată clientului (nu mașinii), fă referire natural la modelul mașinii. Exemple bune: "Cu ce te pot ajuta cu Golf-ul tău?", "Ce lucrări are nevoie Dacia ta?", "Cum pot ajuta cu ${vehicleDesc}-ul tău azi?". Variază de fiecare dată.`
            : `You are a friendly assistant inside an app that helps users find and book auto services faster. Generate a single short greeting question (under 60 characters, no quotes) for a user who owns a ${vehicleDesc}. Rules: always a question (end with ?), positive and helpful, addressed to the user (not the car), reference the car model naturally, never say "our service" or imply the app itself is a service. Good examples: "How can I help with your Golf today?", "What does your ${vehicleDesc} need?", "Looking after your ${vehicleDesc} today?". Vary it each time.`
        : isRo
            ? `Ești un asistent auto prietenos. Generează o singură întrebare scurtă de salut (sub 60 de caractere, fără ghilimele) care variază de fiecare dată. Reguli: întotdeauna o întrebare (termină cu ?), pozitivă. Exemple: "Cu ce te pot ajuta?", "Cum te pot ajuta azi?", "Ce pot face pentru tine?".`
            : `You are a friendly assistant inside an app that helps users find and book auto services faster. Generate a single short greeting question (under 60 characters, no quotes) that varies each time. Rules: always a question (end with ?), positive, never say "our service" or imply the app itself is a service. Examples: "How can I help you today?", "What can I do for you?", "What are you looking for today?".`

    try {
        const { text } = await generateText({
            model: groq("llama-3.1-8b-instant"),
            prompt,
        })
        const cleaned = text.replace(/^["'`]|["'`]$/g, "").trim()
        return Response.json({ text: cleaned })
    } catch {
        return Response.json({ text: null }, { status: 500 })
    }
}
