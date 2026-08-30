import { generateStructuredJson } from "./geminiService";

export interface SourceEvidenceUnit {
  id: string;
  index: number;
  text: string;
  pageNumber?: number | null;
  section?: string | null;
}

export interface FactMeshClaim {
  claimId: string;
  claimText: string;
  claimType: string;
  status: "verified" | "inferred" | "unsupported" | "not_a_fact";
  confidence: number;
  supportingSourceIds: string[];
  explanation: string;
  detectedNumberOrDate?: string | null;
}

export interface FactMeshSummary {
  totalClaims: number;
  verifiedClaims: number;
  inferredClaims: number;
  unsupportedClaims: number;
  nonFactStatements: number;
  numbersChecked: number;
  numbersVerified: number;
  datesChecked: number;
  datesVerified: number;
  integrityScore: number;
}

export interface FactMeshAudit {
  auditId: string;
  generatedAt: string;
  deliverableId: string;
  deliverableTitle?: string;
  sourceSummary: {
    sourceName?: string;
    sourceType: string;
    sourceUnitCount: number;
  };
  summary: FactMeshSummary;
  sourceUnits: SourceEvidenceUnit[];
  claims: FactMeshClaim[];
}

export interface FactMeshAuditRequest {
  sourceText: string;
  sourceMetadata?: {
    name?: string;
    type?: string;
    pageCount?: number;
  };
  deliverableId: string;
  deliverableName?: string;
  generatedContent: string;
  structuredData?: any;
}

/**
 * Deterministically splits raw source text into numbered evidence units (S001, S002, etc.).
 * Preserves page annotations if present and extracts section titles when possible.
 */
export function segmentSourceIntoEvidenceUnits(
  sourceText: string,
  metadata?: { name?: string; type?: string }
): SourceEvidenceUnit[] {
  if (!sourceText || !sourceText.trim()) {
    return [];
  }

  const rawLines = sourceText.replace(/\r\n/g, "\n").split("\n");
  const units: SourceEvidenceUnit[] = [];
  let currentPage: number | null = null;
  let currentSection: string | null = null;
  let unitIndex = 1;

  let currentBlockText: string[] = [];

  const flushCurrentBlock = () => {
    if (currentBlockText.length === 0) return;
    const combined = currentBlockText.join(" ").trim();
    if (combined.length > 0) {
      // If block is very long (> 400 chars), sub-segment by sentences
      if (combined.length > 400) {
        const sentences = combined.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [combined];
        for (const sent of sentences) {
          const cleanSent = sent.trim();
          if (cleanSent.length > 10) {
            units.push({
              id: `S${unitIndex.toString().padStart(3, "0")}`,
              index: unitIndex,
              text: cleanSent,
              pageNumber: currentPage,
              section: currentSection,
            });
            unitIndex++;
          }
        }
      } else {
        units.push({
          id: `S${unitIndex.toString().padStart(3, "0")}`,
          index: unitIndex,
          text: combined,
          pageNumber: currentPage,
          section: currentSection,
        });
        unitIndex++;
      }
    }
    currentBlockText = [];
  };

  for (const rawLine of rawLines) {
    const line = rawLine.trim();

    // Check for page markers e.g. "--- Page 2 ---" or "[Page 2]" or "Page 2:"
    const pageMatch = line.match(/^(?:---|\[|--)?\s*Page\s+(\d+)\s*(?:---|\]|--|:)?$/i);
    if (pageMatch) {
      flushCurrentBlock();
      currentPage = parseInt(pageMatch[1], 10);
      continue;
    }

    // Check for section headers e.g. "## Introduction" or "1. Executive Summary"
    const headingMatch = line.match(/^(?:#{1,4}\s+|(?:\d+\.)+\s+)([A-Za-z0-9\s—–_-]{3,60})$/);
    if (headingMatch && line.length < 70) {
      flushCurrentBlock();
      currentSection = headingMatch[1].trim();
      continue;
    }

    // Empty line signals block flush
    if (!line) {
      flushCurrentBlock();
      continue;
    }

    // Bullet points e.g. "- item" or "* item" or "1) item"
    if (/^[-*•]\s+/.test(line) || /^\d+[.)]\s+/.test(line)) {
      flushCurrentBlock();
      currentBlockText.push(line);
      flushCurrentBlock();
      continue;
    }

    currentBlockText.push(line);
  }

  flushCurrentBlock();

  // If text was too short or single-line fallback
  if (units.length === 0 && sourceText.trim().length > 0) {
    units.push({
      id: "S001",
      index: 1,
      text: sourceText.trim(),
      pageNumber: null,
      section: null,
    });
  }

  return units;
}

/**
 * Builds the strict JSON prompt and system instruction for Gemini FactMesh grounding.
 */
export function buildFactMeshPrompt(
  sourceUnits: SourceEvidenceUnit[],
  generatedContent: string,
  deliverableName?: string
): { prompt: string; systemInstruction: string } {
  const systemInstruction = `You are FactMesh™, an authoritative GenAI Grounding & Provenance Auditor for enterprise, legal, and government communications.

YOUR MISSION:
Perform a rigorous claim-by-claim factual grounding audit of a GENERATED DELIVERABLE against the numbered AUTHORITATIVE SOURCE EVIDENCE units.

DEFINITIONS OF STATUS:
1. "verified": The factual claim is directly and unambiguously supported by one or more source evidence units.
2. "inferred": The claim is a reasonable synthesis, logical generalization, or contextual deduction of source evidence without distorting factual parameters.
3. "unsupported": The claim introduces dates, numbers, percentages, commitments, names, organizations, or factual assertions NOT found in or contradictory to the source.
4. "not_a_fact": Purely stylistic phrasing, formatting headers, opening/closing greetings, or subjective commentary that does not assert factual reality.

STRICT FACT-CHECKING RULES:
- The SOURCE EVIDENCE is the SOLE ground truth. Do NOT use outside knowledge to verify claims.
- EXACT NUMBER & DATE RIGOR: Inspect every numerical quantity, currency (₹, $, €), percentage (%), date, and deadline. If the source says ₹4.2 crore and the generated says ₹5 crore, mark it UNSUPPORTED with clear explanation.
- For EVERY claim, populate "supportingSourceIds" with an array of matching source IDs (e.g. ["S001", "S003"]). If unsupported, "supportingSourceIds" MUST be [].
- "confidence": Integer 0 to 100 representing your degree of certainty in the verification classification.
- "detectedNumberOrDate": If the claim involves a specific metric, date, or number, specify the exact substring (e.g. "14.2%", "₹4.2 crore", "30 September 2026"). Otherwise null.
- Output MUST strictly be valid JSON without any markdown ticks or conversational text outside the JSON.`;

  const formattedSource = sourceUnits
    .slice(0, 120) // Guard against extreme token limits while providing rich evidence
    .map((u) => {
      const pageTag = u.pageNumber ? ` (Page ${u.pageNumber})` : "";
      const secTag = u.section ? ` [${u.section}]` : "";
      return `[${u.id}]${pageTag}${secTag} ${u.text}`;
    })
    .join("\n\n");

  const prompt = `Perform FactMesh™ Grounding Audit for the deliverable: "${deliverableName || "Generated Content"}".

=== AUTHORITATIVE SOURCE EVIDENCE UNITS ===
${formattedSource}

=== GENERATED DELIVERABLE CONTENT TO AUDIT ===
${generatedContent}

=== REQUIRED JSON OUTPUT FORMAT ===
{
  "claims": [
    {
      "claimId": "C001",
      "claimText": "Exact sentence or factual claim extracted from generated deliverable",
      "claimType": "number | date | organization | person | location | policy | commitment | eligibility | factual_statement | recommendation | editorial_statement",
      "status": "verified | inferred | unsupported | not_a_fact",
      "confidence": 95,
      "supportingSourceIds": ["S001"],
      "explanation": "Clear explanation detailing why this is verified, inferred, or unsupported against the source evidence",
      "detectedNumberOrDate": "₹4.2 crore"
    }
  ]
}`;

  return { prompt, systemInstruction };
}

/**
 * Normalizes raw model output, cleans references, computes summary statistics, and derives the integrity score.
 */
export function normalizeFactMeshResponse(
  rawJson: any,
  sourceUnits: SourceEvidenceUnit[],
  deliverableId: string,
  deliverableName?: string,
  sourceMetadata?: { name?: string; type?: string }
): FactMeshAudit {
  const validSourceIds = new Set(sourceUnits.map((u) => u.id));
  const rawClaims = Array.isArray(rawJson?.claims) ? rawJson.claims : [];

  let verifiedCount = 0;
  let inferredCount = 0;
  let unsupportedCount = 0;
  let nonFactCount = 0;

  let numbersChecked = 0;
  let numbersVerified = 0;
  let datesChecked = 0;
  let datesVerified = 0;

  const claims: FactMeshClaim[] = rawClaims.map((c: any, idx: number) => {
    const claimId = `C${(idx + 1).toString().padStart(3, "0")}`;
    const claimText = typeof c.claimText === "string" ? c.claimText.trim() : (typeof c.text === "string" ? c.text.trim() : `Claim ${idx + 1}`);
    const claimType = typeof c.claimType === "string" ? c.claimType : "factual_statement";

    let rawStatus = typeof c.status === "string" ? c.status.toLowerCase() : "verified";
    if (!["verified", "inferred", "unsupported", "not_a_fact"].includes(rawStatus)) {
      rawStatus = "verified";
    }
    const status = rawStatus as FactMeshClaim["status"];

    let confidence = typeof c.confidence === "number" ? Math.round(c.confidence) : 90;
    if (confidence < 0) confidence = 0;
    if (confidence > 100) confidence = 100;

    // Filter supporting source IDs to those that actually exist in sourceUnits
    let rawIds = Array.isArray(c.supportingSourceIds) ? c.supportingSourceIds : [];
    let supportingSourceIds = rawIds
      .map((id: any) => String(id).toUpperCase().trim())
      .filter((id: string) => validSourceIds.has(id));

    if (status === "unsupported") {
      supportingSourceIds = [];
    }

    const explanation = typeof c.explanation === "string" && c.explanation.trim()
      ? c.explanation.trim()
      : status === "verified"
      ? "Directly supported by matching source evidence."
      : status === "inferred"
      ? "Reasonable contextual synthesis from source material."
      : status === "unsupported"
      ? "No supporting evidence found in the authoritative source."
      : "Stylistic or structural editorial expression.";

    const detectedNumberOrDate = typeof c.detectedNumberOrDate === "string" && c.detectedNumberOrDate.trim()
      ? c.detectedNumberOrDate.trim()
      : null;

    // Count statistics
    if (status === "verified") verifiedCount++;
    else if (status === "inferred") inferredCount++;
    else if (status === "unsupported") unsupportedCount++;
    else if (status === "not_a_fact") nonFactCount++;

    // Track numbers & dates
    const isNumberType = claimType === "number" || (detectedNumberOrDate && /\d+/.test(detectedNumberOrDate));
    const isDateType = claimType === "date" || (detectedNumberOrDate && /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|202\d|\d{1,2}\/\d{1,2})/i.test(detectedNumberOrDate));

    if (isNumberType) {
      numbersChecked++;
      if (status === "verified") numbersVerified++;
    }
    if (isDateType) {
      datesChecked++;
      if (status === "verified") datesVerified++;
    }

    return {
      claimId,
      claimText,
      claimType,
      status,
      confidence,
      supportingSourceIds,
      explanation,
      detectedNumberOrDate,
    };
  });

  // Calculate Deterministic FactMesh Integrity Score
  const verifiableClaims = verifiedCount + inferredCount + unsupportedCount;
  let integrityScore = 100;

  if (verifiableClaims > 0) {
    // Verified = 1.0 weight, Inferred = 0.65 weight, Unsupported = 0 weight
    const rawWeighted = ((verifiedCount * 1.0 + inferredCount * 0.65) / verifiableClaims) * 100;
    let score = Math.round(rawWeighted);

    // Apply strict penalties for unsupported / hallucinated claims
    if (unsupportedCount > 0) {
      // Capped maximum score based on unsupported count
      const maxAllowed = Math.max(0, 85 - (unsupportedCount - 1) * 15);
      score = Math.min(score, maxAllowed);
    }

    integrityScore = Math.max(0, Math.min(100, score));
  }

  const summary: FactMeshSummary = {
    totalClaims: claims.length,
    verifiedClaims: verifiedCount,
    inferredClaims: inferredCount,
    unsupportedClaims: unsupportedCount,
    nonFactStatements: nonFactCount,
    numbersChecked,
    numbersVerified,
    datesChecked,
    datesVerified,
    integrityScore,
  };

  const auditId = `audit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

  return {
    auditId,
    generatedAt: new Date().toISOString(),
    deliverableId,
    deliverableTitle: deliverableName || deliverableId,
    sourceSummary: {
      sourceName: sourceMetadata?.name || "Source Document",
      sourceType: sourceMetadata?.type || "Document",
      sourceUnitCount: sourceUnits.length,
    },
    summary,
    sourceUnits,
    claims,
  };
}

/**
 * Primary server-side execution function for FactMesh Grounding Audit.
 */
export async function executeFactMeshAudit(payload: FactMeshAuditRequest): Promise<FactMeshAudit> {
  const { sourceText, sourceMetadata, deliverableId, deliverableName, generatedContent } = payload;

  if (!sourceText || !sourceText.trim()) {
    throw new Error("Cannot perform FactMesh audit: sourceText is empty.");
  }
  if (!generatedContent || !generatedContent.trim()) {
    throw new Error("Cannot perform FactMesh audit: generatedContent is empty.");
  }

  // 1. Deterministically segment source
  const sourceUnits = segmentSourceIntoEvidenceUnits(sourceText, sourceMetadata);

  // 2. Build Gemini prompt
  const { prompt, systemInstruction } = buildFactMeshPrompt(sourceUnits, generatedContent, deliverableName);

  // 3. Call Gemini
  let rawResponse: any = null;
  try {
    const result = await generateStructuredJson(prompt, systemInstruction, "gemini-3.7-flash");
    rawResponse = result.data;
  } catch (err: any) {
    if (err?.code === "QUOTA_EXHAUSTED" || err?.message?.toLowerCase().includes("quota")) {
      console.log("[FactMesh] Request stopped — provider quota exhausted");
    } else {
      console.warn(`[FactMeshService] AI audit call failed: ${err.message || err}`);
    }
    throw err;
  }

  // 4. Normalize and calculate deterministic integrity metrics
  const audit = normalizeFactMeshResponse(
    rawResponse,
    sourceUnits,
    deliverableId,
    deliverableName,
    sourceMetadata
  );

  return audit;
}
