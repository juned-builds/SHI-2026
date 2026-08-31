import { RefineSelectionPayload, RefineSelectionResult } from "../../server/refinementService";

export interface RefineSelectionRequestOptions {
  sourceText?: string;
  selectedText: string;
  surroundingContext?: string;
  instruction: string;
  deliverableType?: string;
  language?: string;
}

export interface RefineSelectionApiResponse {
  success: boolean;
  refinedText?: string;
  originalText?: string;
  instruction?: string;
  model?: string;
  changed?: boolean;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
    provider?: string;
  } | string;
  detail?: string;
}

/**
 * Frontend client service to invoke the Surgical Directive Refiner API.
 */
export async function refineSelectionApi(
  payload: RefineSelectionRequestOptions
): Promise<RefineSelectionApiResponse> {
  const response = await fetch("/api/v1/generation/refine-selection", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorObj = data.error || {
      code: response.status === 429 ? "QUOTA_EXHAUSTED" : "SERVER_ERROR",
      message: data.detail || `Server responded with HTTP ${response.status}`,
      retryable: response.status === 503 || response.status === 504,
    };

    return {
      success: false,
      originalText: payload.selectedText,
      instruction: payload.instruction,
      error: errorObj,
      detail: typeof errorObj === "string" ? errorObj : errorObj.message,
    };
  }

  return data;
}
