/**
 * Local Intelligence Engine for TransformAI.
 * Client-Side Deterministic Analysis Engine.
 *
 * Deterministic, fast, side-effect free, testable, and completely independent of Gemini.
 * Tolerant of empty content, multilingual/Unicode/Hindi text, and structured markdown.
 */

export interface TextStatistics {
  wordCount: number;
  charCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
}

export interface ReadabilityMetrics {
  readingScore: number; // 0 - 10
  readingEaseScore: number; // 0 - 100
  gradeLevel: string; // e.g. "Grade 8-9"
  complexity: "Simple" | "Moderate" | "Complex" | "Technical";
  averageWordsPerSentence: number;
  averageSyllablesPerWord: number;
}

export interface ExtractedFactToken {
  type: "number" | "currency" | "percentage" | "date" | "entity";
  raw: string;
  normalized: string;
  startIndex: number;
  endIndex: number;
  context: string;
}

export interface FactSetComparison {
  sourceTokens: ExtractedFactToken[];
  deliverableTokens: ExtractedFactToken[];
  matchedCount: number;
  unmatchedDeliverableTokens: ExtractedFactToken[];
  sourceFactCoverageRatio: number;
}

export interface ConsistencyIssue {
  tokenType: "number" | "currency" | "percentage" | "date" | "entity";
  originalToken: string;
  newToken?: string;
  sourceDeliverableId: string;
  sourceDeliverableTitle: string;
  affectedDeliverables: {
    deliverableId: string;
    deliverableTitle: string;
    occurrences: number;
    snippets: string[];
  }[];
  description: string;
}

export interface ConsistencyReport {
  hasIssues: boolean;
  totalIssuesCount: number;
  issues: ConsistencyIssue[];
  analyzedDeliverablesCount: number;
  timestamp: string;
}

export interface DiffSegment {
  type: "added" | "removed" | "unchanged";
  value: string;
}

/**
 * 1. extractNumbers(text)
 * Conservative extraction of numeric quantities, metrics, ranges, and phone/reference numbers.
 */
export function extractNumbers(text: string): ExtractedFactToken[] {
  if (!text || typeof text !== "string") return [];

  const results: ExtractedFactToken[] = [];
  // Match standalone numbers, decimals, comma-separated integers, crore/lakh/k/M suffixes
  const numRegex = /\b(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?:\s*(?:crore|crores|lakh|lakhs|k|m|b|million|billion|trillion|percent|%))?\b/gi;

  let match: RegExpExecArray | null;
  while ((match = numRegex.exec(text)) !== null) {
    const raw = match[0].trim();
    if (!raw) continue;
    const startIndex = match.index;
    const endIndex = startIndex + raw.length;
    const startContext = Math.max(0, startIndex - 25);
    const endContext = Math.min(text.length, endIndex + 25);
    const context = text.substring(startContext, endContext).replace(/\s+/g, " ");

    const isPct = raw.includes("%") || raw.toLowerCase().includes("percent");
    if (!isPct) {
      results.push({
        type: "number",
        raw,
        normalized: raw.toLowerCase().replace(/,/g, ""),
        startIndex,
        endIndex,
        context,
      });
    }
  }

  return results;
}

/**
 * 2. extractDates(text)
 * Deterministic detection of dates, deadlines, years, and day-month-year combinations.
 */
export function extractDates(text: string): ExtractedFactToken[] {
  if (!text || typeof text !== "string") return [];

  const results: ExtractedFactToken[] = [];
  // Month names and abbreviations
  const monthNames =
    "january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec";

  // Regex 1: 15 October 2026 or 15th October 2026 or October 15, 2026
  const dateRegex1 = new RegExp(
    `\\b(?:\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${monthNames})(?:\\s*,?\\s*\\d{2,4})?|(?:${monthNames})\\s+\\d{1,2}(?:st|nd|rd|th)?(?:\\s*,?\\s*\\d{2,4})?)\\b`,
    "gi"
  );

  // Regex 2: Standard ISO or Slash/Dash dates: 2026-09-30, 30/09/2026, 30-09-2026
  const dateRegex2 = /\b(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b/g;

  // Regex 3: Standalone 4-digit years between 1900 and 2099
  const yearRegex = /\b(?:19|20)\d{2}\b/g;

  const addMatch = (match: RegExpExecArray, rawText: string) => {
    const raw = rawText.trim();
    if (!raw) return;
    const startIndex = match.index;
    const endIndex = startIndex + raw.length;
    const startContext = Math.max(0, startIndex - 25);
    const endContext = Math.min(text.length, endIndex + 25);
    const context = text.substring(startContext, endContext).replace(/\s+/g, " ");

    results.push({
      type: "date",
      raw,
      normalized: raw.toLowerCase().replace(/,/g, "").replace(/\s+/g, " "),
      startIndex,
      endIndex,
      context,
    });
  };

  let m: RegExpExecArray | null;
  while ((m = dateRegex1.exec(text)) !== null) {
    addMatch(m, m[0]);
  }
  while ((m = dateRegex2.exec(text)) !== null) {
    addMatch(m, m[0]);
  }
  while ((m = yearRegex.exec(text)) !== null) {
    // Avoid re-adding if already included in a multi-word date
    const alreadyCaptured = results.some((r) => r.startIndex <= m!.index && r.endIndex >= m!.index + 4);
    if (!alreadyCaptured) {
      addMatch(m, m[0]);
    }
  }

  return results;
}

/**
 * 3. extractPercentages(text)
 * Deterministic detection of percentages (e.g., 14.2%, 25 percent).
 */
export function extractPercentages(text: string): ExtractedFactToken[] {
  if (!text || typeof text !== "string") return [];

  const results: ExtractedFactToken[] = [];
  const pctRegex = /\b\d+(?:\.\d+)?\s*(?:%|percent|percentage)\b/gi;

  let match: RegExpExecArray | null;
  while ((match = pctRegex.exec(text)) !== null) {
    const raw = match[0].trim();
    if (!raw) continue;
    const startIndex = match.index;
    const endIndex = startIndex + raw.length;
    const startContext = Math.max(0, startIndex - 25);
    const endContext = Math.min(text.length, endIndex + 25);
    const context = text.substring(startContext, endContext).replace(/\s+/g, " ");

    results.push({
      type: "percentage",
      raw,
      normalized: raw.toLowerCase().replace(/\s+/g, "").replace(/percent(?:age)?/, "%"),
      startIndex,
      endIndex,
      context,
    });
  }

  return results;
}

/**
 * Currency extractor (e.g. ₹4.2 crore, $500,000, Rs. 1500)
 */
export function extractCurrencies(text: string): ExtractedFactToken[] {
  if (!text || typeof text !== "string") return [];

  const results: ExtractedFactToken[] = [];
  const currRegex = /(?:₹|Rs\.?|INR|\$|€|£)\s*(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?:\s*(?:crore|crores|lakh|lakhs|k|m|million|billion))?/gi;

  let match: RegExpExecArray | null;
  while ((match = currRegex.exec(text)) !== null) {
    const raw = match[0].trim();
    if (!raw) continue;
    const startIndex = match.index;
    const endIndex = startIndex + raw.length;
    const startContext = Math.max(0, startIndex - 25);
    const endContext = Math.min(text.length, endIndex + 25);
    const context = text.substring(startContext, endContext).replace(/\s+/g, " ");

    results.push({
      type: "currency",
      raw,
      normalized: raw.toLowerCase().replace(/,/g, "").replace(/\s+/g, " "),
      startIndex,
      endIndex,
      context,
    });
  }

  return results;
}

/**
 * 4. extractNamedEntities(text)
 * Conservative pattern matching for acronyms, capitalized scheme/initiative titles, and organizations.
 */
export function extractNamedEntities(text: string): ExtractedFactToken[] {
  if (!text || typeof text !== "string") return [];

  const results: ExtractedFactToken[] = [];
  // Acronyms (e.g., PM-KISAN, AIIMS, NASA, ISRO, MoHUA)
  const acronymRegex = /\b[A-Z][A-Z0-9_-]{1,10}[A-Z0-9]\b/g;

  // Title Cased multi-word schemes/names (e.g. "Digital India Mission", "Pradhan Mantri Awas Yojana")
  const titleCaseRegex = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4}\b/g;

  let m: RegExpExecArray | null;
  while ((m = acronymRegex.exec(text)) !== null) {
    const raw = m[0].trim();
    if (raw.length >= 2) {
      results.push({
        type: "entity",
        raw,
        normalized: raw.toUpperCase(),
        startIndex: m.index,
        endIndex: m.index + raw.length,
        context: text.substring(Math.max(0, m.index - 20), Math.min(text.length, m.index + raw.length + 20)),
      });
    }
  }

  while ((m = titleCaseRegex.exec(text)) !== null) {
    const raw = m[0].trim();
    // Exclude common standard sentence start phrases
    const lower = raw.toLowerCase();
    if (
      lower.startsWith("the ") ||
      lower.startsWith("this ") ||
      lower.startsWith("when ") ||
      lower.startsWith("however ") ||
      lower.startsWith("in addition") ||
      lower.startsWith("for example")
    ) {
      continue;
    }

    results.push({
      type: "entity",
      raw,
      normalized: raw.toLowerCase().replace(/\s+/g, " "),
      startIndex: m.index,
      endIndex: m.index + raw.length,
      context: text.substring(Math.max(0, m.index - 20), Math.min(text.length, m.index + raw.length + 20)),
    });
  }

  return results;
}

/**
 * 5. compareFactSets(sourceFacts, deliverableFacts)
 * Compares factual numbers, dates, and entities between source and generated deliverable.
 */
export function compareFactSets(
  sourceText: string,
  deliverableText: string
): FactSetComparison {
  if (!sourceText || !deliverableText) {
    return {
      sourceTokens: [],
      deliverableTokens: [],
      matchedCount: 0,
      unmatchedDeliverableTokens: [],
      sourceFactCoverageRatio: 0,
    };
  }

  const sCurrs = extractCurrencies(sourceText);
  const sPcts = extractPercentages(sourceText);
  const sDates = extractDates(sourceText);
  const sNums = extractNumbers(sourceText);
  const sEntities = extractNamedEntities(sourceText);
  const sourceTokens = [...sCurrs, ...sPcts, ...sDates, ...sNums, ...sEntities];

  const dCurrs = extractCurrencies(deliverableText);
  const dPcts = extractPercentages(deliverableText);
  const dDates = extractDates(deliverableText);
  const dNums = extractNumbers(deliverableText);
  const dEntities = extractNamedEntities(deliverableText);
  const deliverableTokens = [...dCurrs, ...dPcts, ...dDates, ...dNums, ...dEntities];

  const sourceNormalizedSet = new Set(sourceTokens.map((t) => t.normalized));

  let matchedCount = 0;
  const unmatchedDeliverableTokens: ExtractedFactToken[] = [];

  for (const dToken of deliverableTokens) {
    if (sourceNormalizedSet.has(dToken.normalized)) {
      matchedCount++;
    } else {
      // Check partial inclusion for compound numbers or dates
      const partialMatch = sourceTokens.some(
        (st) =>
          st.normalized.includes(dToken.normalized) ||
          dToken.normalized.includes(st.normalized)
      );
      if (partialMatch) {
        matchedCount++;
      } else {
        unmatchedDeliverableTokens.push(dToken);
      }
    }
  }

  const coverage =
    deliverableTokens.length > 0 ? matchedCount / deliverableTokens.length : 1;

  return {
    sourceTokens,
    deliverableTokens,
    matchedCount,
    unmatchedDeliverableTokens,
    sourceFactCoverageRatio: Math.min(1, Math.max(0, coverage)),
  };
}

/**
 * 6. calculateTextStatistics(text)
 * Fast, deterministic text metrics.
 */
export function calculateTextStatistics(text: string): TextStatistics {
  if (!text || typeof text !== "string") {
    return {
      wordCount: 0,
      charCount: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      readingTimeMinutes: 0,
      speakingTimeMinutes: 0,
    };
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return {
      wordCount: 0,
      charCount: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      readingTimeMinutes: 0,
      speakingTimeMinutes: 0,
    };
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = text.length;

  const sentences = trimmed.split(/[.!?]+(?:\s+|$)/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);

  const paragraphs = trimmed.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  const paragraphCount = Math.max(1, paragraphs.length);

  const readingTimeMinutes = Math.max(0.5, Math.round((wordCount / 200) * 10) / 10);
  const speakingTimeMinutes = Math.max(0.5, Math.round((wordCount / 130) * 10) / 10);

  return {
    wordCount,
    charCount,
    sentenceCount,
    paragraphCount,
    readingTimeMinutes,
    speakingTimeMinutes,
  };
}

/**
 * 7. calculateBasicReadability(text)
 * Deterministic estimation of Flesch Reading Ease and approximate Grade Level.
 */
export function calculateBasicReadability(text: string): ReadabilityMetrics {
  const stats = calculateTextStatistics(text);
  if (stats.wordCount === 0) {
    return {
      readingScore: 10,
      readingEaseScore: 100,
      gradeLevel: "Grade 4-5",
      complexity: "Simple",
      averageWordsPerSentence: 0,
      averageSyllablesPerWord: 1,
    };
  }

  const words = text.trim().split(/\s+/).filter(Boolean);
  let totalSyllables = 0;

  for (const word of words) {
    const clean = word.toLowerCase().replace(/[^a-z]/g, "");
    if (!clean) {
      totalSyllables += 1;
      continue;
    }
    if (clean.length <= 3) {
      totalSyllables += 1;
      continue;
    }
    // Count vowel groupings
    const syllableMatches = clean.match(/[aeiouy]{1,2}/g);
    let count = syllableMatches ? syllableMatches.length : 1;
    if (clean.endsWith("e") && !clean.endsWith("le") && count > 1) {
      count -= 1;
    }
    totalSyllables += Math.max(1, count);
  }

  const asl = stats.wordCount / stats.sentenceCount; // Average sentence length
  const asw = totalSyllables / stats.wordCount; // Average syllables per word

  // Flesch Reading Ease formula: 206.835 - (1.015 * ASL) - (84.6 * ASW)
  const rawEase = 206.835 - 1.015 * asl - 84.6 * asw;
  const readingEaseScore = Math.max(0, Math.min(100, Math.round(rawEase)));

  // Scaled 0 - 10 reading score (10 = most accessible)
  const readingScore = Math.round((readingEaseScore / 10) * 10) / 10;

  let gradeLevel = "Grade 6-7";
  let complexity: "Simple" | "Moderate" | "Complex" | "Technical" = "Moderate";

  if (readingEaseScore >= 80) {
    gradeLevel = "Grade 4-6 (Accessible / Primary)";
    complexity = "Simple";
  } else if (readingEaseScore >= 60) {
    gradeLevel = "Grade 7-9 (General Audience)";
    complexity = "Moderate";
  } else if (readingEaseScore >= 40) {
    gradeLevel = "Grade 10-12 (Executive / Professional)";
    complexity = "Complex";
  } else {
    gradeLevel = "College / Specialist (Technical)";
    complexity = "Technical";
  }

  return {
    readingScore,
    readingEaseScore,
    gradeLevel,
    complexity,
    averageWordsPerSentence: Math.round(asl * 10) / 10,
    averageSyllablesPerWord: Math.round(asw * 100) / 100,
  };
}

/**
 * 8. calculateContentDiff(before, after)
 * Fast, word-level side-by-side / inline diff calculation.
 */
export function calculateContentDiff(before: string, after: string): DiffSegment[] {
  if (before === after) {
    return [{ type: "unchanged", value: after }];
  }
  if (!before) {
    return [{ type: "added", value: after }];
  }
  if (!after) {
    return [{ type: "removed", value: before }];
  }

  const beforeWords = before.split(/(\s+)/);
  const afterWords = after.split(/(\s+)/);

  const segments: DiffSegment[] = [];
  let bIdx = 0;
  let aIdx = 0;

  while (bIdx < beforeWords.length && aIdx < afterWords.length) {
    if (beforeWords[bIdx] === afterWords[aIdx]) {
      segments.push({ type: "unchanged", value: beforeWords[bIdx] });
      bIdx++;
      aIdx++;
    } else {
      // Lookahead window to find realignment
      let matchFound = false;
      const windowSize = 8;

      for (let offset = 1; offset <= windowSize; offset++) {
        if (aIdx + offset < afterWords.length && beforeWords[bIdx] === afterWords[aIdx + offset]) {
          // Added words in after
          const addedVal = afterWords.slice(aIdx, aIdx + offset).join("");
          segments.push({ type: "added", value: addedVal });
          aIdx += offset;
          matchFound = true;
          break;
        } else if (bIdx + offset < beforeWords.length && beforeWords[bIdx + offset] === afterWords[aIdx]) {
          // Removed words from before
          const removedVal = beforeWords.slice(bIdx, bIdx + offset).join("");
          segments.push({ type: "removed", value: removedVal });
          bIdx += offset;
          matchFound = true;
          break;
        }
      }

      if (!matchFound) {
        segments.push({ type: "removed", value: beforeWords[bIdx] });
        segments.push({ type: "added", value: afterWords[aIdx] });
        bIdx++;
        aIdx++;
      }
    }
  }

  if (bIdx < beforeWords.length) {
    segments.push({ type: "removed", value: beforeWords.slice(bIdx).join("") });
  }
  if (aIdx < afterWords.length) {
    segments.push({ type: "added", value: afterWords.slice(aIdx).join("") });
  }

  // Merge consecutive segments of same type
  const merged: DiffSegment[] = [];
  for (const seg of segments) {
    if (!seg.value) continue;
    const last = merged[merged.length - 1];
    if (last && last.type === seg.type) {
      last.value += seg.value;
    } else {
      merged.push({ type: seg.type, value: seg.value });
    }
  }

  return merged;
}

/**
 * 9. findCrossDeliverableMatches(factToken, deliverables, excludeDeliverableId)
 * Finds other deliverables that mention the exact or normalized factual token.
 */
export function findCrossDeliverableMatches(
  factToken: ExtractedFactToken,
  deliverables: { deliverableId: string; title: string; content: string }[],
  excludeDeliverableId?: string
) {
  const matches: {
    deliverableId: string;
    deliverableTitle: string;
    occurrences: number;
    snippets: string[];
  }[] = [];

  const rawLower = factToken.raw.toLowerCase();
  const normLower = factToken.normalized.toLowerCase();

  for (const d of deliverables) {
    if (excludeDeliverableId && d.deliverableId === excludeDeliverableId) continue;
    if (!d.content) continue;

    const contentLower = d.content.toLowerCase();
    let occurrences = 0;
    const snippets: string[] = [];

    let searchPos = 0;
    while (searchPos < contentLower.length) {
      const idx = contentLower.indexOf(rawLower, searchPos);
      if (idx === -1) {
        // Also search for normalized if distinct
        if (normLower !== rawLower) {
          const normIdx = contentLower.indexOf(normLower, searchPos);
          if (normIdx !== -1) {
            occurrences++;
            const start = Math.max(0, normIdx - 30);
            const end = Math.min(d.content.length, normIdx + normLower.length + 30);
            snippets.push("..." + d.content.substring(start, end).replace(/\s+/g, " ") + "...");
            searchPos = normIdx + normLower.length;
            continue;
          }
        }
        break;
      }
      occurrences++;
      const start = Math.max(0, idx - 30);
      const end = Math.min(d.content.length, idx + rawLower.length + 30);
      snippets.push("..." + d.content.substring(start, end).replace(/\s+/g, " ") + "...");
      searchPos = idx + rawLower.length;
    }

    if (occurrences > 0) {
      matches.push({
        deliverableId: d.deliverableId,
        deliverableTitle: d.title,
        occurrences,
        snippets: snippets.slice(0, 3), // top 3 occurrences
      });
    }
  }

  return matches;
}

/**
 * 10. generateConsistencyReport(deliverables, editedDeliverableId, beforeText, afterText)
 * Compares changes in the edited deliverable against other deliverables in the project.
 */
export function generateConsistencyReport(
  deliverables: { deliverableId: string; title: string; content: string }[],
  editedDeliverableId?: string,
  beforeText?: string,
  afterText?: string
): ConsistencyReport {
  const issues: ConsistencyIssue[] = [];

  if (editedDeliverableId && beforeText && afterText) {
    const beforeTokens = [
      ...extractCurrencies(beforeText),
      ...extractPercentages(beforeText),
      ...extractDates(beforeText),
      ...extractNumbers(beforeText),
    ];

    const afterTokens = [
      ...extractCurrencies(afterText),
      ...extractPercentages(afterText),
      ...extractDates(afterText),
      ...extractNumbers(afterText),
    ];

    const afterNormSet = new Set(afterTokens.map((t) => t.normalized));
    const targetDeliverable = deliverables.find((d) => d.deliverableId === editedDeliverableId);
    const targetTitle = targetDeliverable?.title || "Deliverable";

    // Find tokens present in 'before' but altered/missing in 'after'
    for (const bToken of beforeTokens) {
      if (!afterNormSet.has(bToken.normalized)) {
        const matches = findCrossDeliverableMatches(bToken, deliverables, editedDeliverableId);
        if (matches.length > 0) {
          issues.push({
            tokenType: bToken.type,
            originalToken: bToken.raw,
            sourceDeliverableId: editedDeliverableId,
            sourceDeliverableTitle: targetTitle,
            affectedDeliverables: matches,
            description: `The ${bToken.type} "${bToken.raw}" was modified in ${targetTitle}, but still appears in ${matches.length} other deliverable(s).`,
          });
        }
      }
    }
  }

  return {
    hasIssues: issues.length > 0,
    totalIssuesCount: issues.length,
    issues,
    analyzedDeliverablesCount: deliverables.length,
    timestamp: new Date().toISOString(),
  };
}
