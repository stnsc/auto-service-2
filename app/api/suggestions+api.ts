import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';

interface AIResponse {
  intent: 'map' | 'appointment' | 'shop' | 'chat';
  confidence: number;
  suggestions: string[];
}

function parseAIResponse(text: string): AIResponse | null {
  const cleaned = text.replace(/```(?:json)?/g, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

  const obj = parsed as Record<string, unknown>;

  const KNOWN_ALIASES = ['suggestions', 'questions', 'results', 'options', 'items'];
  let suggestions: string[] = [];

  for (const key of KNOWN_ALIASES) {
    if (Array.isArray(obj[key]) && (obj[key] as unknown[]).length > 0) {
      suggestions = (obj[key] as unknown[])
        .filter((s): s is string => typeof s === 'string')
        .slice(0, 4);
      break;
    }
  }

  if (suggestions.length === 0) return null;

  return {
    intent: (obj.intent as AIResponse['intent']) ?? 'chat',
    confidence: typeof obj.confidence === 'number' ? obj.confidence : 0,
    suggestions,
  };
}

async function fetchSuggestions(query: string): Promise<AIResponse>  {
  const { text } = await generateText({
    model: groq('llama-3.1-8b-instant'),
    prompt: `
      You are an assistant for an auto repair service app.

      Given what the user typed, return ONLY a raw JSON object  (no markdown, no explanation) with:
      - intent: one of "map", "appointment", "shop", "chat"
      - confidence: 0.0 to 1.0
      - suggestions: return 3 short auto-service questions a customer might ask. Each must be under 60 characters.

      Intents mean:
      - map: user wants to find a nearby garage, shop, or service center
      - appointment: user wants to book, schedule, or cancel a service
      - shop: user wants to browse or purchase auto parts or accessories
      - chat: general question, diagnosis, advice — stay in the chatbot

      User input: "${query}"
    `,
  });

  const result = parseAIResponse(text);
  if (!result) throw new Error(`Could not parse response from: ${text}`);

  return result;
}

export async function POST(request: Request) {
  const { query } = await request.json();

  if (!query || query.trim().length < 3) {
    return Response.json({ intent: 'chat', confidence: 0, suggestions: [] });
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await fetchSuggestions(query);
      return Response.json(result); // { intent, confidence, suggestions }
    } catch (error) {
      console.error(`AI attempt ${attempt} failed:`, error);
      if (attempt === 2) {
        return Response.json({ intent: 'chat', confidence: 0, suggestions: [] }, { status: 500 });
      }
    }
  }
}