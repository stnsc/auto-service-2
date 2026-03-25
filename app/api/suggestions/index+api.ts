import { generateText, Output } from 'ai';
import { groq } from '@ai-sdk/groq';
import { z } from 'zod';

export async function POST(request: Request) {
  const { query } = await request.json();

  if (!query || query.trim().length < 3) {
    return Response.json({ suggestions: [] });
  }

  try {
    // We use generateText with the 'output' helper. 
    // This is more stable for Groq than 'generateObject'.
    const { output } = await generateText({
      model: groq('llama-3.1-8b-instant'),
      
      // THIS IS THE CRITICAL PART:
      providerOptions: {
        groq: {
          structuredOutputs: false, // Forces 'json_object' instead of 'json_schema'
        },
      },

      output: Output.object({
        schema: z.object({
          suggestions: z.array(z.string()).min(3).max(4),
        }),
      }),

      prompt: `
        You are an assistant for an auto repair service app.
        Suggest 3-4 short, relevant auto-service questions based on user input.
        Keep each suggestion under 60 characters.
        
        User input: "${query}"

        IMPORTANT: You must respond with a valid JSON object.
      `,
    });

    return Response.json(output);
  } catch (error) {
    console.error("AI Error:", error);
    return Response.json({ suggestions: [] }, { status: 500 });
  }
}