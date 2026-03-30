import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';

export async function POST(request: Request) {
    const { messages } = await request.json();

    if (!messages || messages.length === 0) {
        return Response.json({ error: "No messages provided" }, { status: 400 });
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
`,
            messages, // the full conversation history from the user
        });

        return Response.json({ reply: text });
    } catch (error) {
        console.error('Chat API error:', error);
        return Response.json(
            { error: 'Failed to generate response' },
            { status: 500 }
        );
    }
}