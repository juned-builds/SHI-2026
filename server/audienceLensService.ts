import { ThinkingLevel } from "@google/genai";
import { generateStructuredJson } from "./geminiService";
import { classifyError, isHardQuotaExhausted } from "./errorHandling";
import {
  AudiencePersonaEvaluation,
  AudienceLensReadability,
  AudienceLensReport,
  AudiencePersonaId,
} from "../src/types";

export interface SimulatePersonasPayload {
  sourceText?: string;
  generatedDeliverableText: string;
  selectedLanguage?: string;
  targetAudience?: string;
  deliverableType?: string;
  personaIdentifiers?: AudiencePersonaId[];
}

export interface SimulatePersonasResult {
  success: boolean;
  data?: AudienceLensReport;
  report?: AudienceLensReport;
  model?: string;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
    provider?: string;
    attempts?: number;
  } | string;
  detail?: string;
}

export interface AdaptForPersonaPayload {
  deliverableContent: string;
  personaId: AudiencePersonaId;
  personaName: string;
  evaluationFindings?: Partial<AudiencePersonaEvaluation>;
  sourceText?: string;
  language?: string;
  deliverableType?: string;
}

export interface AdaptForPersonaResult {
  success: boolean;
  originalContent?: string;
  adaptedContent?: string;
  personaId?: AudiencePersonaId;
  personaName?: string;
  explanation?: string;
  changed?: boolean;
  model?: string;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
    provider?: string;
  } | string;
  detail?: string;
}

/**
 * Creates a lightweight deterministic content hash for caching validity.
 */
export function computeContentHash(text: string): string {
  const clean = text.trim();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    const char = clean.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `hash_${Math.abs(hash)}_${clean.length}`;
}

/**
 * Builds the AI prompt for multi-persona communication evaluation.
 */
function buildSimulatePersonasPrompt(payload: SimulatePersonasPayload): {
  systemInstruction: string;
  prompt: string;
} {
  const language = payload.selectedLanguage || "English";
  const deliverableType = payload.deliverableType || "Government/Public Communication Document";

  const systemInstruction = `You are AudienceLens™, an advanced Communication Intelligence and Audience Comprehension Evaluator.
Your mission is to objectively simulate how different target audiences will comprehend, perceive, and act upon a specific communication deliverable.

EVALUATION PHILOSOPHY:
1. EVALUATE COMMUNICATION QUALITY ONLY: Do not invent factual claims or penalize the text for true domain facts. Assess clarity, vocabulary accessibility, readability, jargon density, and actionable clarity.
2. ABSOLUTE FACT INTEGRITY: The evaluation must respect all numbers, dates, official names, policy requirements, and commitments present in the text.
3. REALISTIC PERSONA SIMULATION: Evaluate the SAME text independently from 3 standard perspectives:
   - "rural_citizen" (Rural Citizen): Everyday public citizen, potentially limited technical/bureaucratic literacy. Needs plain language, practical everyday utility, no legalistic maze.
   - "senior_executive" (Senior Executive): High-level decision maker. Needs concise strategic synthesis, bottom-line ROI/impact, key risks, and immediate actionable decisions.
   - "field_worker" (Field Implementation Worker): Operational frontline staff executing policies on the ground. Needs unambiguous steps, concrete roles, deadlines, and procedural clarity.
4. CALIBRATED REALISTIC SCORING:
   - Provide realistic numeric scores (1.0 to 10.0, with 1 decimal place).
   - Do not output all 10s or generic identical scores across personas.
   - Identify actual difficult terms (jargon), confusing sentences, and specific recommendations.
5. STRICT STRUCTURED JSON OUTPUT:
   Return valid JSON matching the exact schema specified below.`;

  const prompt = `AUDIENCELENS™ MULTI-PERSONA EVALUATION REQUEST:

Deliverable Type: ${deliverableType}
Target Language: ${language}

${payload.targetAudience ? `Intended Baseline Audience: ${payload.targetAudience}\n` : ""}
${payload.sourceText ? `ORIGINAL SOURCE BACKGROUND (REFERENCE ONLY):\n"""\n${payload.sourceText.slice(0, 1500).trim()}\n"""\n` : ""}

GENERATED DELIVERABLE CONTENT TO EVALUATE:
"""
${payload.generatedDeliverableText}
"""

TASK:
Simulate comprehension and communication effectiveness across the 3 target personas:
1. Rural Citizen ("rural_citizen")
2. Senior Executive ("senior_executive")
3. Field Implementation Worker ("field_worker")

Also calculate overall communication readability metrics (difficulty, reading level, sentence length, jargon density, action clarity, best suited audience, and audience requiring adaptation).

REQUIRED JSON SCHEMA:
{
  "readability": {
    "readingDifficulty": "Easy" | "Moderate" | "Complex" | "Highly Technical",
    "readingScore": number, // 1.0 to 10.0
    "approxReadingLevel": "string (e.g. 8th Grade / General Public, Executive / Professional)",
    "avgSentenceLength": number, // approximate words per sentence
    "jargonDensity": "Low" | "Medium" | "High",
    "actionClarity": "Excellent" | "Good" | "Needs Guidance" | "Unclear",
    "bestSuitedAudience": "string (e.g. Senior Executives / Policy Makers)",
    "audienceRequiringAdaptation": "string (e.g. Rural Citizens)"
  },
  "personas": [
    {
      "persona": "rural_citizen",
      "personaName": "Rural Citizen",
      "overallScore": number, // 1.0 - 10.0
      "clarityScore": number, // 1.0 - 10.0
      "comprehensionScore": number, // 1.0 - 10.0
      "comprehensionLevel": "High" | "Moderate" | "Low" | "Requires Clarification",
      "actionabilityScore": number, // 1.0 - 10.0
      "jargonCount": number,
      "jargonTerms": [
        {
          "term": "string",
          "issue": "string explaining why it is difficult for this persona",
          "suggestedExplanation": "simple plain-language explanation"
        }
      ],
      "strengths": ["string", "string"],
      "weaknesses": ["string", "string"],
      "confusingSections": [
        {
          "excerpt": "exact sentence or clause from text",
          "issue": "explanation of comprehension issue",
          "suggestion": "suggested accessible phrasing"
        }
      ],
      "recommendations": ["string", "string"],
      "adaptationSuggestion": "summary of how this text should be adapted for this persona"
    },
    {
      "persona": "senior_executive",
      "personaName": "Senior Executive",
      "overallScore": number,
      "clarityScore": number,
      "comprehensionScore": number,
      "comprehensionLevel": "High" | "Moderate" | "Low" | "Requires Clarification",
      "actionabilityScore": number,
      "jargonCount": number,
      "jargonTerms": [
        {
          "term": "string",
          "issue": "string",
          "suggestedExplanation": "string"
        }
      ],
      "strengths": ["string"],
      "weaknesses": ["string"],
      "confusingSections": [
        {
          "excerpt": "string",
          "issue": "string",
          "suggestion": "string"
        }
      ],
      "recommendations": ["string"],
      "adaptationSuggestion": "string"
    },
    {
      "persona": "field_worker",
      "personaName": "Field Implementation Worker",
      "overallScore": number,
      "clarityScore": number,
      "comprehensionScore": number,
      "comprehensionLevel": "High" | "Moderate" | "Low" | "Requires Clarification",
      "actionabilityScore": number,
      "jargonCount": number,
      "jargonTerms": [
        {
          "term": "string",
          "issue": "string",
          "suggestedExplanation": "string"
        }
      ],
      "strengths": ["string"],
      "weaknesses": ["string"],
      "confusingSections": [
        {
          "excerpt": "string",
          "issue": "string",
          "suggestion": "string"
        }
      ],
      "recommendations": ["string"],
      "adaptationSuggestion": "string"
    }
  ]
}`;

  return { systemInstruction, prompt };
}

/**
 * Executes multi-persona audience evaluation using Gemini.
 */
export async function executeSimulatePersonas(
  payload: SimulatePersonasPayload
): Promise<SimulatePersonasResult> {
  const deliverableText = payload.generatedDeliverableText
    ? payload.generatedDeliverableText.trim()
    : "";

  if (!deliverableText) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Deliverable text cannot be empty for AudienceLens evaluation.",
        retryable: false,
      },
      detail: "Deliverable text cannot be empty for AudienceLens evaluation.",
    };
  }

  const { systemInstruction, prompt } = buildSimulatePersonasPrompt(payload);

  try {
    const result = await generateStructuredJson(prompt, systemInstruction, {
      preferredModel: "gemini-3.7-flash",
      thinkingLevel: ThinkingLevel.LOW,
      timeoutMs: 75000,
    });
    const rawResult = result.data as {
      readability: AudienceLensReadability;
      personas: AudiencePersonaEvaluation[];
    };

    if (!rawResult || !Array.isArray(rawResult.personas) || rawResult.personas.length === 0) {
      throw new Error("AudienceLens returned an empty or invalid persona evaluation structure.");
    }

    // Sanitize and ensure valid structure
    const sanitizedPersonas: AudiencePersonaEvaluation[] = rawResult.personas.map((p) => {
      const pId = (p.persona || "rural_citizen").toLowerCase();
      const pName =
        p.personaName ||
        (pId === "rural_citizen"
          ? "Rural Citizen"
          : pId === "senior_executive"
          ? "Senior Executive"
          : "Field Implementation Worker");

      return {
        persona: pId,
        personaName: pName,
        overallScore: typeof p.overallScore === "number" ? Math.min(10, Math.max(1, Number(p.overallScore.toFixed(1)))) : 8.0,
        clarityScore: typeof p.clarityScore === "number" ? Math.min(10, Math.max(1, Number(p.clarityScore.toFixed(1)))) : 8.0,
        comprehensionScore: typeof p.comprehensionScore === "number" ? Math.min(10, Math.max(1, Number(p.comprehensionScore.toFixed(1)))) : 8.0,
        comprehensionLevel: p.comprehensionLevel || (p.comprehensionScore >= 8 ? "High" : p.comprehensionScore >= 6 ? "Moderate" : "Low"),
        actionabilityScore: typeof p.actionabilityScore === "number" ? Math.min(10, Math.max(1, Number(p.actionabilityScore.toFixed(1)))) : 8.0,
        jargonCount: Array.isArray(p.jargonTerms) ? p.jargonTerms.length : typeof p.jargonCount === "number" ? p.jargonCount : 0,
        jargonTerms: Array.isArray(p.jargonTerms)
          ? p.jargonTerms.map((j) => ({
              term: String(j.term || "").trim(),
              issue: String(j.issue || "Technical or bureaucratic terminology"),
              suggestedExplanation: String(j.suggestedExplanation || "Plain language equivalent"),
            }))
          : [],
        strengths: Array.isArray(p.strengths) ? p.strengths.map(String) : ["Clear core message"],
        weaknesses: Array.isArray(p.weaknesses) ? p.weaknesses.map(String) : [],
        confusingSections: Array.isArray(p.confusingSections)
          ? p.confusingSections.map((c) => ({
              excerpt: String(c.excerpt || "").trim(),
              issue: String(c.issue || "Potential comprehension issue"),
              suggestion: String(c.suggestion || "Clarify with direct phrasing"),
            }))
          : [],
        recommendations: Array.isArray(p.recommendations) ? p.recommendations.map(String) : [],
        adaptationSuggestion: String(p.adaptationSuggestion || "Consider adapting phrasing to optimize comprehension."),
      };
    });

    const readability: AudienceLensReadability = {
      readingDifficulty: rawResult.readability?.readingDifficulty || "Moderate",
      readingScore: typeof rawResult.readability?.readingScore === "number" ? Number(rawResult.readability.readingScore.toFixed(1)) : 7.8,
      approxReadingLevel: rawResult.readability?.approxReadingLevel || "General Public / Working Professional",
      avgSentenceLength: typeof rawResult.readability?.avgSentenceLength === "number" ? rawResult.readability.avgSentenceLength : 18,
      jargonDensity: rawResult.readability?.jargonDensity || "Low",
      actionClarity: rawResult.readability?.actionClarity || "Good",
      bestSuitedAudience: rawResult.readability?.bestSuitedAudience || "Working Professionals",
      audienceRequiringAdaptation: rawResult.readability?.audienceRequiringAdaptation || "Rural Citizens",
    };

    const report: AudienceLensReport = {
      reportId: `al_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      deliverableId: (payload.deliverableType as any) || "deliverable",
      contentHash: computeContentHash(deliverableText),
      evaluatedAt: new Date().toISOString(),
      modelUsed: "gemini-3.7-flash",
      personas: sanitizedPersonas,
      readability,
    };

    return {
      success: true,
      data: report,
      report,
      model: "gemini-3.7-flash",
    };
  } catch (err: any) {
    const classified = classifyError(err, 1);
    const isQuota = isHardQuotaExhausted(err) || classified.code === "QUOTA_EXHAUSTED";

    return {
      success: false,
      error: {
        code: isQuota ? "QUOTA_EXHAUSTED" : classified.code,
        message: isQuota
          ? "AudienceLens is temporarily unavailable because Gemini usage quota has been reached. Your generated deliverable is safe and unchanged."
          : classified.message || "AudienceLens evaluation encountered an error.",
        retryable: isQuota ? false : classified.retryable,
        provider: classified.provider || "gemini",
      },
      detail: isQuota
        ? "AudienceLens is temporarily unavailable because Gemini usage quota has been reached. Your generated deliverable is safe and unchanged."
        : classified.message,
    };
  }
}

/**
 * Adapts deliverable text specifically for a chosen persona while rigorously preserving factual integrity.
 */
export async function executeAdaptForPersona(
  payload: AdaptForPersonaPayload
): Promise<AdaptForPersonaResult> {
  const content = payload.deliverableContent ? payload.deliverableContent.trim() : "";
  const personaName = payload.personaName || payload.personaId || "Target Audience";
  const language = payload.language || "English";

  if (!content) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Content cannot be empty for persona adaptation.",
        retryable: false,
      },
      detail: "Content cannot be empty for persona adaptation.",
    };
  }

  const systemInstruction = `You are an expert audience adaptation specialist in AudienceLens™.
Your job is to adapt the provided document so that it is optimally understood and acted upon by: "${personaName}".

CRITICAL MANDATES:
1. FACT INTEGRITY & ZERO HALLUCINATION:
   - Preserve all numerical statistics, monetary figures, percentages, dates, deadlines, and timeframes EXACTLY.
   - Preserve all official program names, legal citations, departments, and government bodies.
   - Preserve all eligibility criteria, mandatory requirements, and statutory commitments.
   - DO NOT alter facts or invent new claims.
2. AUDIENCE OPTIMIZATION:
   - For "Rural Citizen": Use simple, clear, approachable language. Replace bureaucratic jargon with everyday concepts. Highlight what it means for them and their family.
   - For "Senior Executive": Make it punchy, executive, bottom-line focused. Highlight ROI, risks, strategic decisions, and high-level milestones.
   - For "Field Implementation Worker": Clarify step-by-step operational workflows, field responsibilities, exact verification checks, and deadline timelines.
3. LANGUAGE CONSISTENCY:
   - Output must be in the specified language (${language}).
4. FORMATTING:
   - Retain clean markdown headers, bullet lists, and paragraphs.
5. STRUCTURED JSON OUTPUT:
   Return valid JSON matching:
   {
     "adaptedContent": "The complete adapted deliverable text",
     "explanation": "Brief 1-2 sentence explanation of key adaptations made for this persona",
     "changed": true
   }`;

  const prompt = `AUDIENCE ADAPTATION REQUEST:

Target Persona: ${personaName}
Language: ${language}
Deliverable Type: ${payload.deliverableType || "Deliverable"}

${payload.evaluationFindings ? `AUDIENCELENS EVALUATION FINDINGS:\n- Clarity Score: ${payload.evaluationFindings.clarityScore || "N/A"}/10\n- Jargon terms flagged: ${payload.evaluationFindings.jargonTerms?.map((j) => j.term).join(", ") || "None"}\n- Guidance: ${payload.evaluationFindings.adaptationSuggestion || "Optimize for persona."}\n` : ""}
${payload.sourceText ? `SOURCE REFERENCE (FOR GROUNDING ONLY):\n"""\n${payload.sourceText.slice(0, 1000).trim()}\n"""\n` : ""}

ORIGINAL DELIVERABLE TEXT TO ADAPT:
"""
${content}
"""

TASK:
Produce an adapted version of the deliverable tailored specifically for "${personaName}".
Preserve all factual numbers, dates, names, and commitments.
Return valid JSON with "adaptedContent", "explanation", and "changed".`;

  try {
    const result = await generateStructuredJson(prompt, systemInstruction, {
      preferredModel: "gemini-3.7-flash",
      thinkingLevel: ThinkingLevel.LOW,
      timeoutMs: 60000,
    });
    const rawResult = result.data as {
      adaptedContent: string;
      explanation: string;
      changed: boolean;
    };

    if (!rawResult || !rawResult.adaptedContent) {
      throw new Error("Adaptation returned empty content.");
    }

    return {
      success: true,
      originalContent: content,
      adaptedContent: rawResult.adaptedContent.trim(),
      personaId: payload.personaId,
      personaName,
      explanation: rawResult.explanation || `Adapted tone and phrasing specifically for ${personaName}.`,
      changed: rawResult.changed !== false,
      model: "gemini-3.7-flash",
    };
  } catch (err: any) {
    const classified = classifyError(err, 1);
    const isQuota = isHardQuotaExhausted(err) || classified.code === "QUOTA_EXHAUSTED";

    return {
      success: false,
      error: {
        code: isQuota ? "QUOTA_EXHAUSTED" : classified.code,
        message: isQuota
          ? "Audience adaptation is temporarily unavailable because Gemini usage quota has been reached. Your existing content is safe and unchanged."
          : classified.message || "Audience adaptation failed.",
        retryable: isQuota ? false : classified.retryable,
        provider: classified.provider || "gemini",
      },
      detail: isQuota
        ? "Audience adaptation is temporarily unavailable because Gemini usage quota has been reached. Your existing content is safe and unchanged."
        : classified.message,
    };
  }
}
