import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { executeWithRetry, isHardQuotaExhausted, isTransientRateLimit, classifyError } from "./errorHandling";

let aiClient: GoogleGenAI | null = null;

export const STABLE_GEMINI_MODELS = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
];

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

export type GeminiHealthStatus =
  | "AVAILABLE"
  | "TEMPORARILY_UNAVAILABLE"
  | "QUOTA_EXHAUSTED"
  | "INVALID_API_KEY";

export interface GeminiHealthCheckResult {
  status: GeminiHealthStatus;
  available: boolean;
  model: string;
  latencyMs: number;
  message: string;
  cached?: boolean;
}

// In-memory cache for health checks to avoid burning API quota on repeated calls
let cachedHealthResult: { result: GeminiHealthCheckResult; timestamp: number } | null = null;
const HEALTH_CACHE_TTL_MS = 20000; // 20 seconds TTL

/**
 * Diagnostics function to test Gemini availability and latency with a minimal test request.
 * Accurately categorizes AVAILABLE, TEMPORARILY_UNAVAILABLE, QUOTA_EXHAUSTED, and INVALID_API_KEY.
 * Caches results briefly to avoid consuming quota on repeated checks.
 */
export async function testGeminiAvailability(modelToTest?: string, forceRefresh = false): Promise<GeminiHealthCheckResult> {
  const model = modelToTest || "gemini-3.7-flash";
  const now = Date.now();

  if (!forceRefresh && cachedHealthResult && now - cachedHealthResult.timestamp < HEALTH_CACHE_TTL_MS && cachedHealthResult.result.model === model) {
    return {
      ...cachedHealthResult.result,
      cached: true,
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    const res: GeminiHealthCheckResult = {
      status: "INVALID_API_KEY",
      available: false,
      model,
      latencyMs: 0,
      message: "GEMINI_API_KEY environment variable is not configured.",
    };
    cachedHealthResult = { result: res, timestamp: now };
    return res;
  }

  const startTime = Date.now();
  try {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model,
      contents: "Return the word OK in JSON format: {\"status\": \"OK\"}",
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const latencyMs = Date.now() - startTime;
    const text = response.text || "";
    const res: GeminiHealthCheckResult = {
      status: "AVAILABLE",
      available: true,
      model,
      latencyMs,
      message: text.trim() || "OK",
    };
    cachedHealthResult = { result: res, timestamp: now };
    return res;
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const msg = err?.message || String(err);

    let status: GeminiHealthStatus = "TEMPORARILY_UNAVAILABLE";
    let userMessage = "The AI service is experiencing temporary demand. Please try again shortly.";

    if (isHardQuotaExhausted(err)) {
      status = "QUOTA_EXHAUSTED";
      userMessage = "Gemini usage quota has been reached for the current API plan.";
    } else if (
      msg.toLowerCase().includes("api key not valid") ||
      msg.toLowerCase().includes("invalid api key") ||
      err?.status === 401 ||
      err?.status === 403
    ) {
      status = "INVALID_API_KEY";
      userMessage = "Configured GEMINI_API_KEY is invalid or lacks necessary permissions.";
    }

    const res: GeminiHealthCheckResult = {
      status,
      available: false,
      model,
      latencyMs,
      message: userMessage,
    };
    cachedHealthResult = { result: res, timestamp: now };
    return res;
  }
}

/**
 * Robust JSON extractor that handles markdown codeblocks, trailing explanations,
 * nested brackets, and trailing characters after the main JSON root object.
 */
export function extractValidJson(raw: string): any {
  if (!raw || !raw.trim()) {
    throw new Error("Empty text received for JSON parsing.");
  }

  let cleaned = raw.trim();

  // 1. Strip markdown code fences if present at boundaries
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  // 2. Fast path: direct standard JSON parse
  try {
    return JSON.parse(cleaned);
  } catch (directErr: any) {
    // 3. Balanced delimiter extraction
    const firstBrace = cleaned.indexOf("{");
    const firstBracket = cleaned.indexOf("[");

    if (firstBrace === -1 && firstBracket === -1) {
      throw new Error(`No JSON object or array found in AI model response: ${directErr.message}`);
    }

    const isObject = firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket);
    const startIdx = isObject ? firstBrace : firstBracket;
    const openChar = isObject ? "{" : "[";
    const closeChar = isObject ? "}" : "]";

    let depth = 0;
    let inString = false;
    let escape = false;
    let endIdx = -1;

    for (let i = startIdx; i < cleaned.length; i++) {
      const char = cleaned[i];

      if (escape) {
        escape = false;
        continue;
      }

      if (char === "\\") {
        if (inString) {
          escape = true;
        }
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === openChar) {
          depth++;
        } else if (char === closeChar) {
          depth--;
          if (depth === 0) {
            endIdx = i;
            break;
          }
        }
      }
    }

    if (endIdx !== -1) {
      const candidate = cleaned.slice(startIdx, endIdx + 1);
      try {
        return JSON.parse(candidate);
      } catch (parseCandErr: any) {
        // Try trimming trailing commas before closing braces/brackets
        try {
          const sanitized = candidate.replace(/,\s*([}\]])/g, "$1");
          return JSON.parse(sanitized);
        } catch {
          throw new Error(`Failed to parse extracted JSON object: ${parseCandErr.message}`);
        }
      }
    }

    // Fallback: try slice from startIdx to last delimiter
    const lastDelim = isObject ? cleaned.lastIndexOf("}") : cleaned.lastIndexOf("]");
    if (lastDelim > startIdx) {
      const candidate = cleaned.slice(startIdx, lastDelim + 1);
      try {
        return JSON.parse(candidate);
      } catch (lastErr: any) {
        throw new Error(`Invalid JSON syntax returned by AI model: ${lastErr.message}`);
      }
    }

    throw new Error(`Invalid JSON syntax returned by AI model: ${directErr.message}`);
  }
}

export interface GenerationOptions {
  preferredModel?: string;
  timeoutMs?: number;
  maxAttempts?: number;
  thinkingLevel?: ThinkingLevel;
}

export async function generateStructuredJson(
  prompt: string,
  systemInstruction?: string,
  options?: GenerationOptions | string
): Promise<{ data: any; modelUsed: string }> {
  const opts: GenerationOptions = typeof options === "string" ? { preferredModel: options } : options || {};
  const client = getGeminiClient();
  const primaryModel = opts.preferredModel || process.env.GEMINI_MODEL || "gemini-3.7-flash";

  // Build candidate model rotation list: preferred first, then remaining stable models
  const candidateModels = [
    primaryModel,
    ...STABLE_GEMINI_MODELS.filter((m) => m !== primaryModel),
  ];

  const modelsToTry = Array.from(new Set(candidateModels));
  const timeoutMs = opts.timeoutMs ?? 75000;
  const maxAttempts = opts.maxAttempts ?? modelsToTry.length;

  const requestStartTime = Date.now();

  try {
    // Execute with bounded retry & model failover across candidate models
    return await executeWithRetry(
      async (attempt: number) => {
        const modelIndex = (attempt - 1) % modelsToTry.length;
        const model = modelsToTry[modelIndex];
        const attemptStartTime = Date.now();

        console.log(`[Gemini] Model request started: ${model} (Attempt ${attempt}/${maxAttempts})`);

        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: systemInstruction || undefined,
            responseMimeType: "application/json",
            temperature: 0.1,
            thinkingConfig: { thinkingLevel: opts.thinkingLevel ?? ThinkingLevel.LOW },
          },
        });

        const elapsedMs = Date.now() - attemptStartTime;
        const totalElapsedMs = Date.now() - requestStartTime;
        console.log(`[Gemini] Response received from ${model}: ${elapsedMs}ms (Total elapsed: ${totalElapsedMs}ms)`);

        const text = response.text;
        if (!text || !text.trim()) {
          throw new Error(`Empty response returned by Gemini model ${model}`);
        }

        const parseStartTime = Date.now();
        const parsed = extractValidJson(text);
        const parseElapsedMs = Date.now() - parseStartTime;
        console.log(`[Generation] JSON parsed successfully: ${parseElapsedMs}ms`);

        return { data: parsed, modelUsed: model };
      },
      {
        maxAttempts,
        initialDelayMs: 600,
        maxDelayMs: 3000,
        backoffFactor: 1.8,
        timeoutMs,
      }
    );
  } catch (err: any) {
    if (isHardQuotaExhausted(err) || err?.code === "QUOTA_EXHAUSTED") {
      const classified = classifyError(err);
      throw classified;
    }
    throw err;
  }
}
