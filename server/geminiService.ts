import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        "GEMINI_API_KEY environment variable is not configured. Please ensure your API key is set in Settings > Secrets or in the environment."
      );
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export async function generateStructuredJson(
  prompt: string,
  systemInstruction?: string,
  preferredModel?: string
): Promise<any> {
  const client = getGeminiClient();
  const candidateModels = [
    preferredModel || process.env.GEMINI_MODEL || "gemini-3.6-flash",
    "gemini-3.7-flash",
  ].filter(Boolean);

  // Deduplicate candidate models
  const modelsToTry = Array.from(new Set(candidateModels));
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[GeminiService] Calling Gemini model: ${model}`);
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || undefined,
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const text = response.text;
      if (!text || !text.trim()) {
        throw new Error(`Empty response returned by Gemini model ${model}`);
      }

      let rawText = text.trim();
      if (rawText.startsWith("```json")) {
        rawText = rawText.slice(7);
      }
      if (rawText.startsWith("```")) {
        rawText = rawText.slice(3);
      }
      if (rawText.endsWith("```")) {
        rawText = rawText.slice(0, -3);
      }
      rawText = rawText.trim();

      const parsed = JSON.parse(rawText);
      return { data: parsed, modelUsed: model };
    } catch (err: any) {
      console.error(`[GeminiService] Error with model ${model}:`, err.message || err);
      lastError = err;
      // If 503 (high demand) or 404, try next model in candidate list
      if (err?.message?.includes("503") || err?.message?.includes("404") || err?.status === 503 || err?.status === 404) {
        console.warn(`[GeminiService] Retrying with alternative model after ${model} error...`);
        continue;
      }
      // For authentication or invalid key errors, throw fast
      if (err?.message?.includes("API key not valid") || err?.message?.includes("INVALID_ARGUMENT") || err?.status === 400) {
        throw new Error("Invalid Gemini API Key provided. Please verify your GEMINI_API_KEY.");
      }
      if (err?.message?.includes("RESOURCE_EXHAUSTED") || err?.message?.includes("429") || err?.status === 429) {
        throw new Error("Gemini API rate limit or quota exceeded. Please try again in a moment.");
      }
    }
  }

  throw lastError || new Error("Failed to generate content with Gemini AI.");
}
