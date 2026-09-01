import {
  AudienceLensReport,
  AudiencePersonaId,
  AudiencePersonaEvaluation,
} from "../types";

export interface SimulatePersonasApiRequest {
  sourceText?: string;
  generatedDeliverableText: string;
  selectedLanguage?: string;
  targetAudience?: string;
  deliverableType?: string;
  personaIdentifiers?: AudiencePersonaId[];
}

export interface AdaptForPersonaApiRequest {
  deliverableContent: string;
  personaId: AudiencePersonaId;
  personaName: string;
  evaluationFindings?: Partial<AudiencePersonaEvaluation>;
  sourceText?: string;
  language?: string;
  deliverableType?: string;
}

export interface AdaptForPersonaApiResponse {
  success: boolean;
  originalContent: string;
  adaptedContent: string;
  personaId: AudiencePersonaId;
  personaName: string;
  explanation: string;
  changed: boolean;
  model?: string;
}

export class AudienceLensException extends Error {
  code: string;
  retryable: boolean;
  httpStatus?: number;
  provider?: string;

  constructor(
    message: string,
    code: string = "AUDIENCE_LENS_ERROR",
    retryable: boolean = false,
    httpStatus?: number,
    provider?: string
  ) {
    super(message);
    this.name = "AudienceLensException";
    this.code = code;
    this.retryable = retryable;
    this.httpStatus = httpStatus;
    this.provider = provider || "gemini";
  }

  get isQuotaExhausted(): boolean {
    return this.code === "QUOTA_EXHAUSTED" || this.httpStatus === 429;
  }
}

/**
 * Computes deterministic content hash to verify caching freshness.
 */
export function computeClientContentHash(text: string): string {
  const clean = text.trim();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    const char = clean.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash_${Math.abs(hash)}_${clean.length}`;
}

/**
 * Invokes server-side multi-persona communication intelligence evaluation.
 */
export async function simulatePersonasApi(
  payload: SimulatePersonasApiRequest,
  signal?: AbortSignal
): Promise<AudienceLensReport> {
  const endpoint = "/api/v1/generation/simulate-personas";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal,
    });

    const data = await response.json();

    if (!response.ok) {
      const errCode = data?.error?.code || "HTTP_" + response.status;
      const errMsg =
        data?.error?.message ||
        data?.detail ||
        (response.status === 429
          ? "AudienceLens is temporarily unavailable because Gemini usage quota has been reached. Your generated deliverable is safe and unchanged."
          : `AudienceLens evaluation failed with status ${response.status}`);
      const isRetryable = Boolean(data?.error?.retryable);

      throw new AudienceLensException(
        errMsg,
        errCode,
        isRetryable,
        response.status,
        data?.error?.provider
      );
    }

    const report = data.data || data.report;
    if (!report || !Array.isArray(report.personas)) {
      throw new AudienceLensException(
        "AudienceLens returned an invalid response structure.",
        "INVALID_RESPONSE",
        false
      );
    }

    return report as AudienceLensReport;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new AudienceLensException("AudienceLens evaluation was cancelled.", "CANCELLED", false);
    }
    if (err instanceof AudienceLensException) {
      throw err;
    }
    throw new AudienceLensException(
      err?.message || "Network error while connecting to AudienceLens service.",
      "NETWORK_ERROR",
      true
    );
  }
}

/**
 * Invokes server-side persona adaptation to generate Before / Proposed After.
 */
export async function adaptForPersonaApi(
  payload: AdaptForPersonaApiRequest,
  signal?: AbortSignal
): Promise<AdaptForPersonaApiResponse> {
  const endpoint = "/api/v1/generation/adapt-for-persona";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal,
    });

    const data = await response.json();

    if (!response.ok) {
      const errCode = data?.error?.code || "HTTP_" + response.status;
      const errMsg =
        data?.error?.message ||
        data?.detail ||
        (response.status === 429
          ? "Audience adaptation is temporarily unavailable because Gemini usage quota has been reached. Your existing content is safe and unchanged."
          : `Audience adaptation failed with status ${response.status}`);
      const isRetryable = Boolean(data?.error?.retryable);

      throw new AudienceLensException(
        errMsg,
        errCode,
        isRetryable,
        response.status,
        data?.error?.provider
      );
    }

    if (!data.adaptedContent) {
      throw new AudienceLensException(
        "Server returned an empty adaptation response.",
        "EMPTY_RESPONSE",
        false
      );
    }

    return {
      success: true,
      originalContent: data.originalContent || payload.deliverableContent,
      adaptedContent: data.adaptedContent,
      personaId: data.personaId || payload.personaId,
      personaName: data.personaName || payload.personaName,
      explanation: data.explanation || "Adapted for target persona.",
      changed: data.changed !== false,
      model: data.model || "gemini-3.7-flash",
    };
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new AudienceLensException("Audience adaptation was cancelled.", "CANCELLED", false);
    }
    if (err instanceof AudienceLensException) {
      throw err;
    }
    throw new AudienceLensException(
      err?.message || "Network error while adapting for audience.",
      "NETWORK_ERROR",
      true
    );
  }
}
