import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';

export async function POST(request: Request) {
    const { messages, vehicleInfo } = await request.json();

    if (!messages || messages.length === 0) {
        return Response.json({ error: "No messages provided" }, { status: 400 });
    }

    // Filter out any messages without content to prevent validation errors
    const validMessages = messages.filter(
        (msg: any) => msg && msg.role && msg.content && msg.content.trim().length > 0
    );

    if (validMessages.length === 0) {
        return Response.json({ error: "No valid messages provided" }, { status: 400 });
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
                    }
                }

                Current known vehicle info: ${JSON.stringify(vehicleInfo)}

                Extract or update any vehicle details mentioned in the conversation. Keep existing values if not updated.
                The response should be your main answer to the user.
                The summary should capture the vehicle issue and any important details mentioned for them to
                be reported to a service center.
`,
            messages: validMessages,
        });

        // Parse and validate the JSON response from the AI
        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch (parseError) {
            console.error('Failed to parse AI response:', text);
            return Response.json(
                { error: 'Invalid response format from AI' },
                { status: 500 }
            );
        }

        // Validate required fields exist
        if (!parsed.response || typeof parsed.response !== 'string') {
            console.error('Missing or invalid response field:', parsed);
            return Response.json(
                { error: 'Invalid response structure' },
                { status: 500 }
            );
        }

        return Response.json({
            reply: parsed.response,
            summary: parsed.summary || '',
            intent: parsed.intent || null,
            confidence: parsed.confidence || 0,
            vehicleInfo: parsed.vehicleInfo || {},
        });
    } catch (error) {
        console.error('Chat API error:', error);
        return Response.json(
            { error: 'Failed to generate response' },
            { status: 500 }
        );
    }
}
