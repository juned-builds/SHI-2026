import { FactMeshAudit, FactMeshAuditRequest, FactMeshApiError, FactMeshErrorCode } from "../types";

export class FactMeshException extends Error {
  public code: FactMeshErrorCode;
  public retryable: boolean;
  public attempts: number;
  public maxAttempts: number;
  public httpStatus: number;

  constructor(apiError: FactMeshApiError, httpStatus = 500) {
    super(apiError.message);
    this.name = "FactMeshException";
    this.code = apiError.code;
    this.retryable = apiError.retryable;
    this.attempts = apiError.attempts ?? 3;
    this.maxAttempts = apiError.maxAttempts ?? 3;
    this.httpStatus = httpStatus;
  }
}

/**
 * Calls server-side FactMesh grounding engine to audit a generated deliverable against source text.
 * Implements client-side timeout, structured error extraction, and safe fallback classification.
 */
export async function auditGroundingApi(
  request: FactMeshAuditRequest,
  options?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<FactMeshAudit> {
  const timeoutMs = options?.timeoutMs ?? 55000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Link external signal if provided
  if (options?.signal) {
    options.signal.addEventListener("abort", () => controller.abort());
  }

  try {
    const response = await fetch("/api/v1/generation/audit-grounding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let parsedJson: any = null;
    try {
      parsedJson = await response.json();
    } catch (parseErr) {
      console.warn("[FactMeshApi] Failed to parse response JSON:", parseErr);
    }

    if (!response.ok) {
      const httpStatus = response.status;
      const errorObj = parsedJson?.error;

      // Extract structured error or construct safe classification
      let code: FactMeshErrorCode = errorObj?.code || "UNKNOWN_ERROR";
      let retryable = errorObj?.retryable ?? (httpStatus === 503 || httpStatus === 502 || httpStatus === 504);
      let message = errorObj?.message || parsedJson?.detail || "FactMesh grounding audit is temporarily unavailable.";
      let attempts = errorObj?.attempts ?? 1;

      if (code === "QUOTA_EXHAUSTED" || message.toLowerCase().includes("quota") || message.toLowerCase().includes("resource_exhausted")) {
        code = "QUOTA_EXHAUSTED";
        retryable = false;
        message = errorObj?.message || "FactMesh verification is temporarily unavailable because the AI usage limit has been reached. Your generated deliverable is safe and unchanged.";
      } else if (httpStatus === 503 && code === "UNKNOWN_ERROR") {
        code = "MODEL_UNAVAILABLE";
        retryable = true;
        message = "The AI verification service is experiencing temporary demand. Your deliverable is safe and unchanged.";
      } else if (httpStatus === 429 && code === "UNKNOWN_ERROR") {
        code = "RATE_LIMITED";
        retryable = true;
        message = "AI service rate limit reached. Please try again in a few moments.";
      } else if (httpStatus === 504 && code === "UNKNOWN_ERROR") {
        code = "TIMEOUT_ERROR";
        retryable = true;
        message = "The verification request timed out while processing grounding evidence.";
      }

      const apiError: FactMeshApiError = {
        code,
        message,
        retryable,
        provider: errorObj?.provider || "gemini",
        attempts,
        maxAttempts: 3,
      };

      throw new FactMeshException(apiError, httpStatus);
    }

    // Support both direct FactMeshAudit and wrapped { success: true, data: FactMeshAudit }
    const auditData: FactMeshAudit = parsedJson?.data || parsedJson;
    if (!auditData || !auditData.summary || !Array.isArray(auditData.claims)) {
      throw new FactMeshException(
        {
          code: "PARSE_ERROR",
          message: "Received an incomplete audit payload structure.",
          retryable: true,
          attempts: 3,
        },
        502
      );
    }

    return auditData;
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err instanceof FactMeshException) {
      throw err;
    }

    // Handle AbortError / Timeout
    if (err?.name === "AbortError" || controller.signal.aborted) {
      throw new FactMeshException(
        {
          code: "TIMEOUT_ERROR",
          message: "FactMesh audit request timed out. The server is under high demand.",
          retryable: true,
          attempts: 3,
        },
        504
      );
    }

    // Handle Network / Connection Drop
    throw new FactMeshException(
      {
        code: "TRANSIENT_SERVER_ERROR",
        message: "Unable to reach the FactMesh verification server. Please check your network connection and retry.",
        retryable: true,
        attempts: 1,
      },
      503
    );
  }
}
