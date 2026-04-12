import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';

export async function POST(request: Request) {
    const { messages, vehicleInfo } = await request.json();

    if (!messages || messages.length === 0) {
        return new Response(
            JSON.stringify({ error: "No messages provided" }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Filter out any messages without content to prevent validation errors
    const validMessages = messages.filter(
        (msg: any) => msg && msg.role && msg.content && msg.content.trim().length > 0
    );

    if (validMessages.length === 0) {
        return new Response(
            JSON.stringify({ error: "No valid messages provided" }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    try {
        const { text } = await generateText({
            model: groq('llama-3.3-70b-versatile'),
            system: `
                You are an expert automotive technician assistant helping users self-diagnose car problems.
                Be concise, practical, and safety-conscious.
                - Ask clarifying questions if needed (make, model, year, symptoms)
                - Suggest likely causes ranked by probability
                - Indicate clearly when a problem requires immediate professional attention
                - Keep responses clear and jargon-free

                IMPORTANT: You must respond with ONLY valid JSON in this exact format:
                {
                    "response": "Your assistant reply here",
                    "summary": "Brief 1-2 sentence summary of key issue or diagnosis so far",
                    "vehicleInfo": {
                        "make": "string or null if not mentioned",
                        "model": "string or null if not mentioned",
                        "year": "number or null if not mentioned",
                        "mileage": "number or null if not mentioned",
                        "warningLights": "boolean or null if not mentioned"
                    },
                    "partQuery": "A concise marketplace search query for a car part the user needs, including vehicle details if known (e.g., 'brake pads 2015 Honda Civic'). Return null if the user is not asking about buying or replacing a specific part."
                }

                Current known vehicle info: ${JSON.stringify(vehicleInfo)}

                Extract or update any vehicle details mentioned in the conversation. Keep existing values if not updated.
                The response should be your main answer to the user.
                The summary should capture the vehicle issue and any important details mentioned for them to
                be reported to a service center.
                ALWAYS include the partQuery field. If the user mentions needing, wanting to buy, or replacing
                any car part or accessory, set partQuery to a short search string like "brake pads 2015 Honda Civic".
                If the user is NOT talking about buying a part, set partQuery to null.
`,
            messages: validMessages,
        });

        // Parse and validate the JSON response from the AI
        // The LLM sometimes outputs text before the JSON block, so extract it
        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch {
            // Try to extract JSON object from the text
            const jsonMatch = text.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                try {
                    parsed = JSON.parse(jsonMatch[0])
                } catch {
                    console.error('Failed to parse extracted JSON:', text);
                    return new Response(
                        JSON.stringify({ error: 'Invalid response format from AI' }),
                        { status: 500, headers: { 'Content-Type': 'application/json' } }
                    );
                }
            } else {
                console.error('No JSON found in AI response:', text);
                return new Response(
                    JSON.stringify({ error: 'Invalid response format from AI' }),
                    { status: 500, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }

        // Validate required fields exist
        if (!parsed.response || typeof parsed.response !== 'string') {
            console.error('Missing or invalid response field:', parsed);
            return new Response(
                JSON.stringify({ error: 'Invalid response structure' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const body = JSON.stringify({
            reply: parsed.response,
            summary: parsed.summary || '',
            intent: parsed.intent || null,
            confidence: parsed.confidence || 0,
            vehicleInfo: parsed.vehicleInfo || {},
            partQuery: parsed.partQuery || null,
        });

        return new Response(body, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': String(Buffer.byteLength(body)),
            },
        });
    } catch (error) {
        console.error('Chat API error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to generate response' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}
