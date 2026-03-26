import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';

const KNOWN_ALIASES = ['suggestions', 'questions', 'results', 'options', 'items'];

function extractSuggestions(text: string): string[] | null {
  // Strip markdown code fences if the model wraps its output
  const cleaned = text.replace(/```(?:json)?/g, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Model didn't return valid JSON at all
    return null;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

  const obj = parsed as Record<string, unknown>;

  // Try known keys in priority order
  for (const key of KNOWN_ALIASES) {
    if (Array.isArray(obj[key]) && (obj[key] as unknown[]).length > 0) {
      return (obj[key] as unknown[])
        .filter((s): s is string => typeof s === 'string')
        .slice(0, 4);
    }
  }

  // Last resort: first array value found
  for (const value of Object.values(obj)) {
    if (Array.isArray(value) && value.length > 0) {
      return (value as unknown[])
        .filter((s): s is string => typeof s === 'string')
        .slice(0, 4);
    }
  }

  return null;
}

async function fetchSuggestions(query: string): Promise<string[]> {
  const { text } = await generateText({
    model: groq('llama-3.1-8b-instant'),
    prompt: `
      You are an assistant for an auto repair service app.
      Given the user input below, return 3 to 4 short auto-service questions
      a customer might ask. Each must be under 60 characters.

      User input: "${query}"

      Respond with ONLY a raw JSON object like this (no markdown, no explanation):
      {"suggestions": ["...", "...", "..."]}
    `,
  });

  const suggestions = extractSuggestions(text);
  if (!suggestions || suggestions.length < 1) {
    throw new Error(`Could not parse suggestions from: ${text}`);
  }

  return suggestions;
}

export async function POST(request: Request) {
  const { query } = await request.json();

  if (!query || query.trim().length < 3) {
    return Response.json({ suggestions: [] });
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const suggestions = await fetchSuggestions(query);
      return Response.json({ suggestions });
    } catch (error) {
      console.error(`AI attempt ${attempt} failed:`, error);
      if (attempt === 2) {
        return Response.json({ suggestions: [] }, { status: 500 });
      }
    }
  }
}