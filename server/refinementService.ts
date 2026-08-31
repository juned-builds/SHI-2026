import { ThinkingLevel } from "@google/genai";
import { generateStructuredJson } from "./geminiService";
import { classifyError, isHardQuotaExhausted } from "./errorHandling";

export interface RefineSelectionPayload {
  sourceText?: string;
  selectedText: string;
  surroundingContext?: string;
  instruction: string;
  deliverableType?: string;
  language?: string;
}

export interface RefineSelectionResult {
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
}

/**
 * Prompt builder strictly scoped for surgical refinement of selected text.
 * Enforces fact preservation (numbers, dates, names, policies, commitments),
 * language preservation, and strict non-expansion beyond the selected range.
 */
function buildRefinementPrompt(payload: RefineSelectionPayload): {
  systemInstruction: string;
  prompt: string;
} {
  const language = payload.language || "English";
  const deliverableType = payload.deliverableType || "Deliverable";

  const systemInstruction = `You are a precision surgical AI text refiner for high-stakes, trustworthy communication.
Your ONLY role is to rewrite the specific SELECTED TEXT in accordance with the user's directive while leaving the rest of the document untouched.

CRITICAL DIRECTIVES:
1. REWRITE ONLY THE SELECTED TEXT. Never output surrounding sentences, full paragraphs, or full document content.
2. ABSOLUTE FACT PRESERVATION:
   - Preserve all numbers, percentages, statistics, monetary amounts, metrics, and units exactly as in the original, unless the instruction specifically commands changing them.
   - Preserve all dates, deadlines, timestamps, years, and timeframes exactly.
   - Preserve all organization names, official designations, department names, people's names, and locations.
   - Preserve all policy names, program titles, statutory references, and binding commitments.
   - DO NOT invent, hallucinate, or assume facts not present in the original text.
3. LANGUAGE PRESERVATION:
   - The output MUST be in the same language as the selected text (e.g. Hindi if the text is in Hindi, English if in English) unless explicitly commanded to translate.
4. TONE & DIRECTIVE FIDELITY:
   - Follow the requested instruction (e.g. Simplify, Make Punchier, Citizen-Friendly, Professional, Bullets, Shorten, or Custom) precisely.
5. FORMATTING & DELIMITER INTEGRITY:
   - If the selected text was markdown or prose, maintain valid and appropriate inline markdown.
   - If converted to bullet points, use markdown bullet dashes (- item).
6. JSON OUTPUT FORMAT:
   - Return valid JSON matching the exact schema:
     {
       "refinedText": "The rewritten version of ONLY the selected text",
       "changed": true
     }`;

  let prompt = `SURGICAL REFINEMENT REQUEST:

Deliverable Type: ${deliverableType}
Target Language: ${language}

${payload.surroundingContext ? `SURROUNDING CONTEXT (FOR REFERENCE ONLY — DO NOT INCLUDE IN OUTPUT):\n"""\n${payload.surroundingContext.trim()}\n"""\n` : ""}
${payload.sourceText ? `ORIGINAL SOURCE GROUNDING EXCERPT (REFERENCE ONLY):\n"""\n${payload.sourceText.slice(0, 1000).trim()}\n"""\n` : ""}

TARGET SELECTED TEXT TO REWRITE (REWRITE ONLY THIS):
"""
${payload.selectedText}
"""

DIRECTIVE / REFINEMENT INSTRUCTION:
"${payload.instruction}"

REQUIREMENT:
Rewrite ONLY the TARGET SELECTED TEXT according to the directive. Preserve all factual claims, metrics, dates, and names.
Return valid JSON with "refinedText" and "changed".`;

  return { systemInstruction, prompt };
}

/**
 * Executes a surgical AI refinement request on selected text.
 */
export async function executeRefineSelection(
  payload: RefineSelectionPayload
): Promise<RefineSelectionResult> {
  const selectedText = payload.selectedText ? payload.selectedText.trim() : "";
  const instruction = payload.instruction ? payload.instruction.trim() : "";

  if (!selectedText) {
    return {
      success: false,
      originalText: payload.selectedText || "",
      error: {
        code: "VALIDATION_ERROR",
        message: "Selected text cannot be empty for refinement.",
        retryable: false,
      },
    };
  }

  if (!instruction) {
    return {
      success: false,
      originalText: selectedText,
      error: {
        code: "VALIDATION_ERROR",
        message: "Refinement instruction cannot be empty.",
        retryable: false,
      },
    };
  }

  const { systemInstruction, prompt } = buildRefinementPrompt(payload);

  try {
    const result = await generateStructuredJson(prompt, systemInstruction, {
      preferredModel: "gemini-3.7-flash",
      timeoutMs: 40000,
      thinkingLevel: ThinkingLevel.LOW,
    });

    const data = result.data;
    if (!data || typeof data !== "object") {
      throw new Error("Invalid or empty response from refinement model.");
    }

    const rawRefined = data.refinedText !== undefined && data.refinedText !== null
      ? String(data.refinedText)
      : "";

    // Safeguard: Never allow an empty string to wipe out selected text unless the original was empty
    const refinedText = rawRefined.trim() ? rawRefined : selectedText;
    const changed = refinedText !== selectedText;

    return {
      success: true,
      refinedText,
      originalText: payload.selectedText,
      instruction,
      model: result.modelUsed,
      changed,
    };
  } catch (err: any) {
    if (isHardQuotaExhausted(err) || err?.code === "QUOTA_EXHAUSTED") {
      console.log("[Refinement] Request stopped — provider quota exhausted");
      return {
        success: false,
        originalText: payload.selectedText,
        instruction,
        error: {
          code: "QUOTA_EXHAUSTED",
          message: "Selection refinement is temporarily unavailable because Gemini usage quota has been reached. Your existing content is safe and unchanged.",
          retryable: false,
          provider: "gemini",
        },
      };
    }

    const classified = classifyError(err, 1);
    console.warn(`[Refinement] Refine selection failed with [${classified.code}]: ${classified.message}`);
    return {
      success: false,
      originalText: payload.selectedText,
      instruction,
      error: {
        code: classified.code,
        message: classified.userMessage || "Selection refinement is temporarily unavailable. Your existing content is unchanged.",
        retryable: classified.retryable,
        provider: classified.provider || "gemini",
      },
    };
  }
}
