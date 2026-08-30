import {
  ProjectDraft,
  TransformationConfig,
  GenerationApiResponse,
  GeneratedDeliverable,
} from "../types";

export interface GenerationPayload {
  sourceType: string;
  sourceText: string;
  sourceMetadata: {
    name?: string;
    charCount?: number;
    wordCount?: number;
    fileName?: string;
  };
  audience: string;
  customAudience: string;
  tone: string;
  language: string;
  customLanguage: string;
  detailLevel: string;
  objective: string;
  contentStyle: string;
  deliverables: string[];
}

/**
 * Resolves the active backend API base URL:
 * 1. Explicit environment variable: VITE_API_BASE_URL
 * 2. Relative path for unified full-stack server
 */
export function getApiBaseUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
    return envUrl.trim().replace(/\/$/, "");
  }
  return "";
}

/**
 * Execute real GenAI transformation via FastAPI backend.
 */
export async function executeTransformationApi(
  draft: ProjectDraft,
  config: TransformationConfig,
  signal?: AbortSignal
): Promise<GenerationApiResponse> {
  if (!draft.sourceText || !draft.sourceText.trim()) {
    throw new Error("Source text cannot be empty.");
  }

  if (!config.deliverables || config.deliverables.length === 0) {
    throw new Error("At least one target deliverable must be selected.");
  }

  const payload: GenerationPayload = {
    sourceType: draft.sourceType || "text",
    sourceText: draft.sourceText.trim(),
    sourceMetadata: {
      name: draft.name,
      charCount: draft.charCount,
      wordCount: draft.wordCount,
      fileName: draft.sourceFile?.name,
    },
    audience: config.audience || "general_public",
    customAudience: config.customAudience || "",
    tone: config.tone || "professional",
    language: config.language || "english",
    customLanguage: config.customLanguage || "",
    detailLevel: config.detailLevel || "standard",
    objective: config.objective || "inform",
    contentStyle: config.contentStyle || "executive",
    deliverables: config.deliverables,
  };

  const baseUrl = getApiBaseUrl();
  const endpoint = baseUrl ? `${baseUrl}/api/v1/generation/generate` : `/api/v1/generation/generate`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (fetchErr: any) {
    if (fetchErr.name === "AbortError") {
      throw new Error("Generation request was cancelled.");
    }
    // Network / server connection error
    throw new Error(
      `Unable to connect to the FastAPI backend at ${endpoint}. ` +
      `Please ensure the backend is running (cd backend && uvicorn app.main:app --reload --port 8000) ` +
      `and GEMINI_API_KEY is configured in backend/.env.`
    );
  }

  if (!response.ok) {
    let errorDetail = `Server returned status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        if (typeof errJson.detail === "string") {
          errorDetail = errJson.detail;
        } else if (Array.isArray(errJson.detail)) {
          errorDetail = errJson.detail.map((e: any) => e.msg || JSON.stringify(e)).join(", ");
        }
      }
    } catch {
      // ignore json parse error on error responses
    }

    throw new Error(errorDetail);
  }

  const result: GenerationApiResponse = await response.json();
  return result;
}

/**
 * Regenerate a single specific deliverable reusing existing draft and config.
 */
export async function regenerateSingleDeliverableApi(
  draft: ProjectDraft,
  config: TransformationConfig,
  deliverableId: string,
  signal?: AbortSignal
): Promise<GeneratedDeliverable> {
  const singleConfig: TransformationConfig = {
    ...config,
    deliverables: [deliverableId as any],
  };

  const res = await executeTransformationApi(draft, singleConfig, signal);
  const found = res.deliverables.find((d) => d.deliverableId === deliverableId);
  if (!found) {
    throw new Error(`Deliverable '${deliverableId}' was not returned in the regeneration output.`);
  }
  return found;
}
