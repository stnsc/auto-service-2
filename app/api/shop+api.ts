export interface ShopResult {
    title: string
    price: number
    currency: string
    seller: string
    rating: number | null
    reviews: number | null
    url: string
    image: string | null
    source: string
}

async function searchGoogleShopping(query: string): Promise<ShopResult[]> {
    const apiKey = process.env.SERPAPI_KEY
    if (!apiKey) {
        throw new Error("SERPAPI_KEY is not configured")
    }

    const params = new URLSearchParams({
        engine: "google_shopping",
        q: query,
        api_key: apiKey,
        hl: "en",
        gl: "ro",
        num: "30",
    })

    const res = await fetch(`https://serpapi.com/search.json?${params}`)
    if (!res.ok) {
        const text = await res.text()
        throw new Error(`SerpAPI HTTP ${res.status}: ${text}`)
    }

    const data = await res.json()
    const results: ShopResult[] = []

    if (data.shopping_results) {
        for (const item of data.shopping_results) {
            results.push({
                title: item.title || "",
                price: item.extracted_price ?? 0,
                currency: item.currency || "RON",
                seller: item.source || "Unknown",
                rating: item.rating ?? null,
                reviews: item.reviews ?? null,
                url: item.link || item.product_link || "",
                image: item.thumbnail || null,
                source: "Google Shopping",
            })
        }
    }

    return results
}

const AUTO_KEYWORDS = [
    // English
    "car", "auto", "vehicle", "motor", "engine", "brake", "tire", "tyre",
    "wheel", "oil", "filter", "spark", "plug", "clutch", "transmission",
    "battery", "exhaust", "radiator", "suspension", "steering", "alternator",
    "starter", "coolant", "fuse", "belt", "hose", "gasket", "piston",
    "caliper", "rotor", "pad", "muffler", "catalytic", "intake", "injector",
    "pump", "sensor", "axle", "bearing", "seal", "bulb", "wiper",
    "headlight", "taillight", "mirror", "bumper", "hood", "trunk", "part",
    "parts", "repair", "fluid", "shock", "strut", "cv", "timing",
    // Romanian
    "masina", "masin", "motor", "fran", "roat", "ulei", "filtru", "baterie",
    "transmisie", "ambreiaj", "curea", "furtun", "piesa", "reparati", "service",
    "senzor", "pompa",
]

function isAutoRelated(query: string): boolean {
    const lower = query.toLowerCase()
    return AUTO_KEYWORDS.some((kw) => lower.includes(kw))
}

export async function POST(request: Request) {
    const { query } = await request.json()

    if (!query || query.trim().length < 2) {
        return Response.json(
            { results: [], query: "", error: "Query too short" },
            { status: 400 },
        )
    }

    const trimmed = query.trim()

    if (!isAutoRelated(trimmed)) {
        return Response.json(
            {
                results: [],
                query: trimmed,
                error: "Please search for automotive parts or car-related items only.",
            },
            { status: 400 },
        )
    }

    try {
        const results = await searchGoogleShopping(trimmed)

        return Response.json({
            results,
            query: trimmed,
            ...(results.length === 0 && {
                error: "No results found for this query.",
            }),
        })
    } catch (err: any) {
        console.error("[Shop API] Error:", err.message)
        return Response.json(
            {
                results: [],
                query: trimmed,
                error: err.message?.includes("SERPAPI_KEY")
                    ? "Shop API is not configured. Please add SERPAPI_KEY to .env"
                    : "Failed to fetch results. Please try again.",
            },
            { status: 500 },
        )
    }
}
