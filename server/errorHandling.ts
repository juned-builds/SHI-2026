/**
 * Server-side Error Classification, Safe Logging, and Bounded Retry Infrastructure.
 * Ensures transient Gemini/API failures (503, 429, 502, 504, UNAVAILABLE) are retried
 * with exponential backoff and jitter, while HARD QUOTA EXHAUSTION (RESOURCE_EXHAUSTED)
 * fails fast without entering unnecessary retry loops or spamming logs.
 */

export type FactMeshErrorCode =
  | "MODEL_UNAVAILABLE"
  | "RATE_LIMITED"
  | "QUOTA_EXHAUSTED"
  | "TRANSIENT_SERVER_ERROR"
  | "TIMEOUT_ERROR"
  | "INVALID_API_KEY"
  | "VALIDATION_ERROR"
  | "PARSE_ERROR"
  | "UNKNOWN_ERROR";

export interface ClassifiedError {
  code: FactMeshErrorCode;
  message: string;
  userMessage?: string;
  retryable: boolean;
  httpStatus: number;
  provider?: string;
  originalMessage?: string;
  attempts?: number;
}

/**
 * Detects hard, non-retryable project or account quota exhaustion from Gemini.
 * Examples: RESOURCE_EXHAUSTED, "You exceeded your current quota", "quotaValue", "generate_content_free_tier_requests"
 */
export function isHardQuotaExhausted(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  const raw = typeof err === "object" ? JSON.stringify(err).toLowerCase() : "";
  const combined = `${msg} ${raw}`;

  return (
    combined.includes("resource_exhausted") ||
    combined.includes("you exceeded your current quota") ||
    combined.includes("exceeded your current quota") ||
    combined.includes("quotavalue") ||
    combined.includes("generate_content_free_tier_requests") ||
    combined.includes("free_tier_requests") ||
    combined.includes("daily quota") ||
    combined.includes("project quota") ||
    combined.includes("check your plan and billing details") ||
    (combined.includes("quota") && combined.includes("exceeded"))
  );
}

/**
 * Detects transient rate limiting (short-term throttling e.g. RPM / requests-per-minute spikes)
 * which CAN be retried after a brief backoff, distinct from hard quota exhaustion.
 */
export function isTransientRateLimit(err: any): boolean {
  if (!err) return false;
  if (isHardQuotaExhausted(err)) return false;

  const msg = (err.message || String(err)).toLowerCase();
  const status = err.status || err.statusCode || (err.response && err.response.status);

  return (
    status === 429 ||
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("throttled") ||
    msg.includes("concurrency limit")
  );
}

/**
 * Checks if a given error represents a transient / retryable condition.
 * Hard quota exhaustion (RESOURCE_EXHAUSTED) is explicitly marked as NOT retryable.
 */
export function isRetryableError(err: any): boolean {
  if (!err) return false;

  // 1. HARD QUOTA EXHAUSTION is strictly NON-RETRYABLE
  if (isHardQuotaExhausted(err)) {
    return false;
  }

  const msg = (err.message || String(err)).toLowerCase();
  const status = err.status || err.statusCode || (err.response && err.response.status);

  // 2. Explicit non-retryable auth / validation / client error conditions
  if (
    msg.includes("api key not valid") ||
    msg.includes("invalid api key") ||
    msg.includes("unauthorized") ||
    msg.includes("forbidden") ||
    msg.includes("invalid_argument") ||
    msg.includes("bad request") ||
    status === 400 ||
    status === 401 ||
    status === 403
  ) {
    return false;
  }

  // 3. Transient Rate Limiting is retryable with backoff
  if (isTransientRateLimit(err)) {
    return true;
  }

  // 4. Transient / Server / Network Retryable conditions
  if (
    status === 503 ||
    status === 502 ||
    status === 504 ||
    status === 500 ||
    status === 408 ||
    msg.includes("503") ||
    msg.includes("502") ||
    msg.includes("504") ||
    msg.includes("408") ||
    msg.includes("unavailable") ||
    msg.includes("high demand") ||
    msg.includes("overloaded") ||
    msg.includes("spikes in demand") ||
    msg.includes("temporarily unavailable") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("deadline exceeded") ||
    msg.includes("socket hang up") ||
    msg.includes("network error") ||
    msg.includes("fetch failed")
  ) {
    return true;
  }

  return false;
}

/**
 * Classifies any error into a safe, structured, user-facing error response.
 * Never leaks internal server stack traces or API keys to the client.
 */
export function classifyError(err: any, attempts = 1): ClassifiedError {
  const rawMsg = err?.message ? String(err.message) : String(err || "");
  const lowerMsg = rawMsg.toLowerCase();
  const status = err?.status || err?.statusCode || (err?.response && err?.response.status);

  // 1. Hard Quota Exhaustion
  if (isHardQuotaExhausted(err) || err?.code === "QUOTA_EXHAUSTED") {
    return {
      code: "QUOTA_EXHAUSTED",
      message: "Gemini usage quota has been reached. Your generated content is safe and unchanged.",
      userMessage: "Gemini usage quota has been reached. Your generated content is safe and unchanged.",
      retryable: false,
      httpStatus: 429,
      provider: "gemini",
      attempts,
    };
  }

  // 2. API Key / Auth Errors
  if (
    lowerMsg.includes("gemini_api_key") ||
    lowerMsg.includes("api key not valid") ||
    lowerMsg.includes("invalid api key") ||
    status === 401 ||
    status === 403
  ) {
    return {
      code: "INVALID_API_KEY",
      message: "Gemini API key is not configured or is invalid. Please check your settings.",
      userMessage: "Gemini API key is not configured or is invalid. Please check your settings.",
      retryable: false,
      httpStatus: 401,
      provider: "gemini",
      attempts,
    };
  }

  // 3. Validation / Bad Input Errors
  if (
    lowerMsg.includes("sourcetext cannot be empty") ||
    lowerMsg.includes("generatedcontent cannot be empty") ||
    lowerMsg.includes("invalid request payload") ||
    lowerMsg.includes("invalid_argument") ||
    status === 400
  ) {
    return {
      code: "VALIDATION_ERROR",
      message: rawMsg.includes("cannot be empty")
        ? rawMsg
        : "Invalid request payload for AI analysis.",
      userMessage: rawMsg.includes("cannot be empty")
        ? rawMsg
        : "Invalid request payload for AI analysis.",
      retryable: false,
      httpStatus: 400,
      attempts,
    };
  }

  // 4. Timeout Errors
  if (lowerMsg.includes("timeout") || lowerMsg.includes("timed out") || status === 504) {
    return {
      code: "TIMEOUT_ERROR",
      message: "The AI verification request timed out. The model took too long to respond.",
      userMessage: "The AI verification request timed out. Please try again.",
      retryable: true,
      httpStatus: 504,
      provider: "gemini",
      attempts,
    };
  }

  // 5. Transient Rate Limiting (RPM throttling)
  if (isTransientRateLimit(err)) {
    return {
      code: "RATE_LIMITED",
      message: "The AI service rate limit was temporarily reached. Please try again shortly.",
      userMessage: "The AI service rate limit was temporarily reached. Please try again shortly.",
      retryable: true,
      httpStatus: 429,
      provider: "gemini",
      attempts,
    };
  }

  // 6. Model Unavailable / High Demand (503)
  if (
    status === 503 ||
    lowerMsg.includes("503") ||
    lowerMsg.includes("unavailable") ||
    lowerMsg.includes("high demand") ||
    lowerMsg.includes("overloaded") ||
    lowerMsg.includes("spikes in demand") ||
    lowerMsg.includes("temporarily unavailable")
  ) {
    return {
      code: "MODEL_UNAVAILABLE",
      message: "The AI verification service is experiencing temporary demand. Your deliverable is safe and unchanged.",
      userMessage: "The AI verification service is experiencing temporary demand. Your deliverable is safe and unchanged.",
      retryable: true,
      httpStatus: 503,
      provider: "gemini",
      attempts,
    };
  }

  // 7. JSON Parse / Output Format Errors
  if (lowerMsg.includes("json") || lowerMsg.includes("parse") || lowerMsg.includes("syntaxerror")) {
    return {
      code: "PARSE_ERROR",
      message: "The AI returned an unparseable response structure. Retrying will re-generate valid evidence mapping.",
      userMessage: "The AI returned an unparseable response structure. Please retry.",
      retryable: true,
      httpStatus: 502,
      attempts,
    };
  }

  // 8. General Transient Server / Network Errors (500, 502, network failure)
  if (
    status === 500 ||
    status === 502 ||
    lowerMsg.includes("econnreset") ||
    lowerMsg.includes("socket") ||
    lowerMsg.includes("fetch failed")
  ) {
    return {
      code: "TRANSIENT_SERVER_ERROR",
      message: "A temporary network or server error occurred during grounding verification.",
      userMessage: "A temporary network or server error occurred. Please try again.",
      retryable: true,
      httpStatus: 503,
      attempts,
    };
  }

  // 9. Fallback
  return {
    code: "UNKNOWN_ERROR",
    message: "The AI service encountered an unexpected error. Your deliverable is safe.",
    userMessage: "The AI service encountered an unexpected error. Your deliverable is safe.",
    retryable: isRetryableError(err),
    httpStatus: 500,
    attempts,
  };
}

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  timeoutMs?: number;
  onRetry?: (attempt: number, delayMs: number, error: any) => void;
}

/**
 * Executes an async task with bounded exponential backoff and randomized jitter.
 * Stops immediately upon detecting hard quota exhaustion (RESOURCE_EXHAUSTED) without
 * entering pointless retry loops or spamming console logs.
 */
export async function executeWithRetry<T>(
  task: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 800,
    maxDelayMs = 5000,
    backoffFactor = 2.0,
    timeoutMs = 30000,
    onRetry,
  } = options;

  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Wrap attempt in per-attempt timeout
      const result = await Promise.race([
        task(attempt),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
        ),
      ]);
      return result;
    } catch (err: any) {
      lastError = err;

      // 1. HARD QUOTA EXHAUSTION: Stop immediately, do not retry or spam logs
      if (isHardQuotaExhausted(err) || err?.code === "QUOTA_EXHAUSTED") {
        console.log("[Gemini] QUOTA_EXHAUSTED");
        break;
      }

      const isRetryable = isRetryableError(err);

      // If last attempt or not retryable, throw immediately
      if (attempt >= maxAttempts || !isRetryable) {
        if (!isRetryable) {
          console.log(`[Gemini] Non-retryable error encountered: ${err?.message || err}`);
        }
        break;
      }

      // Calculate exponential backoff with jitter
      const exponentialDelay = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
      const jitter = Math.random() * (exponentialDelay * 0.5);
      const delayMs = Math.min(Math.round(exponentialDelay + jitter), maxDelayMs);

      if (onRetry) {
        try {
          onRetry(attempt, delayMs, err);
        } catch {
          // ignore callback error
        }
      }

      console.log(`[Gemini] Transient error (${err?.message || "retryable condition"}). Waiting ${delayMs}ms before attempt ${attempt + 1}/${maxAttempts}...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}
