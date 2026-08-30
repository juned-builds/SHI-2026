import { ProjectDraft, TransformationConfig, GeneratedDeliverable } from "../types";
import {
  AUDIENCE_OPTIONS,
  TONE_OPTIONS,
  LANGUAGE_OPTIONS,
  DETAIL_LEVEL_OPTIONS,
  OBJECTIVE_OPTIONS,
  CONTENT_STYLE_OPTIONS,
  DELIVERABLES_CATALOG,
} from "../constants/transformationOptions";

/**
 * Sanitize strings for safe cross-platform file naming.
 */
export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_\-\.]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80) || "deliverable";
}

/**
 * Native browser download via Blob and Object URL.
 */
export function downloadTextFile(filename: string, content: string, mimeType = "text/markdown;charset=utf-8"): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Native browser download for structured JSON data.
 */
export function downloadJsonFile(filename: string, data: any): void {
  const jsonString = JSON.stringify(data, null, 2);
  downloadTextFile(filename, jsonString, "application/json;charset=utf-8");
}

/**
 * Builds a unified, production-grade combined Markdown export document
 * containing project metadata, configuration breakdown, source summary,
 * table of contents, and all generated deliverables.
 */
export function buildCombinedExportMarkdown(
  draft: ProjectDraft,
  config: TransformationConfig,
  deliverables: GeneratedDeliverable[],
  modelUsed = "gemini-3.7-flash",
  sessionId?: string
): string {
  const now = new Date().toISOString();
  const audienceLabel = AUDIENCE_OPTIONS.find((o) => o.value === config.audience)?.label || config.audience || "Standard";
  const toneLabel = TONE_OPTIONS.find((o) => o.value === config.tone)?.label || config.tone || "Professional";
  const langLabel = LANGUAGE_OPTIONS.find((o) => o.value === config.language)?.label || config.language || "English";
  const detailLabel = DETAIL_LEVEL_OPTIONS.find((o) => o.value === config.detailLevel)?.label || config.detailLevel || "Standard";
  const objLabel = OBJECTIVE_OPTIONS.find((o) => o.value === config.objective)?.label || config.objective || "Inform";
  const styleLabel = CONTENT_STYLE_OPTIONS.find((o) => o.value === config.contentStyle)?.label || config.contentStyle || "Executive";

  const lines: string[] = [];

  // Header Banner
  lines.push(`# Content Transformation Bundle: ${draft.name || "Untitled Project"}`);
  lines.push(`\n*Generated on:* \`${now}\` | *Engine:* \`${modelUsed}\`${sessionId ? ` | *Session ID:* \`${sessionId}\`` : ""}`);
  lines.push("\n---\n");

  // Executive Summary Metadata Table
  lines.push("## 1. Transformation Parameters Matrix\n");
  lines.push("| Dimension | Selected Configuration |");
  lines.push("| :--- | :--- |");
  lines.push(`| **Target Audience** | ${audienceLabel} ${config.customAudience ? `(*${config.customAudience}*)` : ""} |`);
  lines.push(`| **Tone of Voice** | ${toneLabel} |`);
  lines.push(`| **Target Language** | ${langLabel} ${config.customLanguage ? `(*${config.customLanguage}*)` : ""} |`);
  lines.push(`| **Detail Level** | ${detailLabel} |`);
  lines.push(`| **Core Objective** | ${objLabel} |`);
  lines.push(`| **Content Style** | ${styleLabel} |`);
  lines.push(`| **Source Characters / Words** | ${draft.charCount.toLocaleString()} chars / ${draft.wordCount.toLocaleString()} words |`);
  lines.push(`| **Source Type** | ${draft.sourceType === "file" ? `File (${draft.sourceFile?.name || "Uploaded document"})` : "Raw Text Ingestion"} |`);
  lines.push("\n---\n");

  // Table of Contents
  lines.push("## 2. Table of Deliverables\n");
  deliverables.forEach((d, idx) => {
    const meta = DELIVERABLES_CATALOG.find((m) => m.id === d.deliverableId);
    const title = d.title || meta?.name || d.deliverableId;
    const editedTag = d.isEdited ? " *(Locally Edited)*" : "";
    lines.push(`${idx + 1}. [${title}](#deliverable-${idx + 1}-${sanitizeFilename(d.deliverableId)})${editedTag}`);
  });
  lines.push("\n---\n");

  // Individual Deliverable Sections
  lines.push("## 3. Generated Deliverables\n");
  deliverables.forEach((d, idx) => {
    const meta = DELIVERABLES_CATALOG.find((m) => m.id === d.deliverableId);
    const title = d.title || meta?.name || d.deliverableId;
    const anchor = `deliverable-${idx + 1}-${sanitizeFilename(d.deliverableId)}`;

    lines.push(`### <a id="${anchor}"></a>${idx + 1}. ${title}\n`);
    lines.push(`**Deliverable Type:** \`${d.deliverableId}\` | **Category:** \`${meta?.category || "Standard"}\`${d.isEdited ? " | **Status:** `Edited in Workspace`" : ""}\n`);
    
    if (d.status === "failed") {
      lines.push(`> ⚠️ **Generation Incomplete:** ${d.error || "Deliverable could not be synthesized."}\n`);
    } else {
      lines.push(d.content);
    }
    
    lines.push("\n\n---\n");
  });

  // Appendix: Source Material Excerpt
  lines.push("## 4. Reference Source Material (Summary / Excerpt)\n");
  lines.push("```text");
  const sourcePreview = draft.sourceText.length > 2000
    ? draft.sourceText.slice(0, 2000) + "\n\n...[Truncated in Export Package]..."
    : draft.sourceText;
  lines.push(sourcePreview);
  lines.push("```\n");
  lines.push(`\n*End of Transformation Bundle — SIH 26154 Automated Content Transformation Platform*`);

  return lines.join("\n");
}
