import {
  GenerationRequestPayload,
  DELIVERABLE_SPECIFICATIONS,
  buildSystemInstruction,
  buildTransformationPrompt,
} from "./promptBuilder";
import { generateStructuredJson } from "./geminiService";

export interface GeneratedDeliverableResponse {
  deliverableId: string;
  title: string;
  content: string;
  structuredData?: Record<string, any> | null;
  status: string;
  error?: string | null;
}

export interface GenerationResponsePayload {
  success: boolean;
  sessionId: string;
  status: "completed" | "partial" | "failed";
  model?: string;
  deliverables: GeneratedDeliverableResponse[];
  error?: string | null;
  generatedAt: string;
}

function formatMarkdownFallback(deliverableId: string, data: Record<string, any>, title: string): string {
  const lines: string[] = [`# ${title}\n`];

  if (deliverableId === "executive_summary") {
    if (data.summary) lines.push(`## Executive Overview\n${data.summary}\n`);
    if (Array.isArray(data.key_points)) {
      lines.push("## Key Strategic Points");
      data.key_points.forEach((p: string) => lines.push(`- ${p}`));
      lines.push("");
    }
    if (Array.isArray(data.important_findings)) {
      lines.push("## Important Findings");
      data.important_findings.forEach((f: string) => lines.push(`- ${f}`));
      lines.push("");
    }
    if (Array.isArray(data.recommended_actions)) {
      lines.push("## Recommended Actions");
      data.recommended_actions.forEach((a: string) => lines.push(`- ${a}`));
    }
  } else if (deliverableId === "linkedin_post") {
    if (data.hook) lines.push(`${data.hook}\n`);
    if (data.body) lines.push(`${data.body}\n`);
    if (data.call_to_action) lines.push(`👉 ${data.call_to_action}\n`);
    if (Array.isArray(data.hashtags)) lines.push(data.hashtags.join(" "));
  } else if (deliverableId === "twitter_post") {
    if (Array.isArray(data.thread_posts)) {
      data.thread_posts.forEach((t: string, idx: number) => {
        lines.push(`**Post ${idx + 1}/${data.thread_posts.length}**\n${t}\n`);
      });
    }
    if (data.key_takeaway) lines.push(`💡 Key Takeaway: ${data.key_takeaway}\n`);
    if (Array.isArray(data.hashtags)) lines.push(data.hashtags.join(" "));
  } else if (deliverableId === "advisory") {
    if (data.context) lines.push(`## Context & Background\n${data.context}\n`);
    if (Array.isArray(data.key_information)) {
      lines.push("## Key Information");
      data.key_information.forEach((k: string) => lines.push(`- ${k}`));
      lines.push("");
    }
    if (Array.isArray(data.action_items)) {
      lines.push("## Action Items");
      data.action_items.forEach((a: string) => lines.push(`- ${a}`));
      lines.push("");
    }
    if (Array.isArray(data.cautions_or_notes)) {
      lines.push("## Cautions & Notes");
      data.cautions_or_notes.forEach((c: string) => lines.push(`- ⚠️ ${c}`));
    }
  } else if (deliverableId === "infographic") {
    if (data.core_message) lines.push(`**Core Message**: ${data.core_message}\n`);
    if (Array.isArray(data.key_facts_and_metrics)) {
      lines.push("## Anchor Metrics & Facts");
      data.key_facts_and_metrics.forEach((m: string) => lines.push(`- 📊 ${m}`));
      lines.push("");
    }
    if (Array.isArray(data.sections)) {
      lines.push("## Infographic Sections");
      data.sections.forEach((s: any) => {
        lines.push(`### ${s.heading || "Section"}`);
        if (s.content) lines.push(`${s.content}`);
        if (s.visual_cue) lines.push(`*Visual Direction: ${s.visual_cue}*\n`);
      });
    }
    if (data.visual_layout_guidance) {
      lines.push(`## Visual Layout Guidance\n${data.visual_layout_guidance}`);
    }
  } else if (deliverableId === "presentation") {
    if (Array.isArray(data.slides)) {
      data.slides.forEach((s: any) => {
        lines.push(`## Slide ${s.slide_number || ""}: ${s.slide_title || "Slide"}`);
        if (Array.isArray(s.bullet_points)) {
          s.bullet_points.forEach((b: string) => lines.push(`- ${b}`));
        }
        if (s.visual_concept) lines.push(`\n*Visual Concept: ${s.visual_concept}*`);
        if (s.speaker_notes) lines.push(`\n> **Speaker Notes:** ${s.speaker_notes}\n`);
      });
    }
  } else if (deliverableId === "video_package") {
    if (data.duration_guidance) lines.push(`**Target Duration:** ${data.duration_guidance}\n`);
    if (Array.isArray(data.scenes)) {
      lines.push("## Scene Breakdown");
      data.scenes.forEach((sc: any) => {
        lines.push(`### Scene ${sc.scene_number || ""}`);
        if (sc.visual_direction) lines.push(`**Visual:** ${sc.visual_direction}`);
        if (sc.narration_script) lines.push(`**Narration:** "${sc.narration_script}"`);
        if (sc.on_screen_text) lines.push(`**On-Screen Text:** ${sc.on_screen_text}\n`);
      });
    }
    if (data.subtitles) lines.push(`## Full Subtitles Transcript\n${data.subtitles}`);
  } else {
    for (const [k, v] of Object.entries(data)) {
      lines.push(`**${k.replace(/_/g, " ")}**: ${typeof v === "object" ? JSON.stringify(v) : v}`);
    }
  }

  return lines.join("\n").trim();
}

export async function executeTransformation(request: GenerationRequestPayload): Promise<GenerationResponsePayload> {
  const sessionId = `gen_session_${Math.random().toString(36).substring(2, 14)}`;
  const nowIso = new Date().toISOString();

  if (!request.sourceText || !request.sourceText.trim()) {
    throw new Error("Source text cannot be empty.");
  }
  if (!request.deliverables || request.deliverables.length === 0) {
    throw new Error("At least one target deliverable must be selected.");
  }

  const systemInstruction = buildSystemInstruction();
  const prompt = buildTransformationPrompt(request);

  let rawResult: any;
  let modelUsed = "gemini-3.6-flash";

  try {
    const genResult = await generateStructuredJson(prompt, systemInstruction);
    rawResult = genResult.data;
    modelUsed = genResult.modelUsed;
  } catch (err: any) {
    console.error("[GenerationService] Execution failed:", err);
    return {
      success: false,
      sessionId,
      status: "failed",
      model: modelUsed,
      deliverables: [],
      error: err.message || "Failed to generate deliverables with Gemini AI.",
      generatedAt: nowIso,
    };
  }

  const parsedDeliverables: GeneratedDeliverableResponse[] = [];
  const rawList = Array.isArray(rawResult?.deliverables) ? rawResult.deliverables : [];
  const deliverablesById: Record<string, any> = {};

  for (const item of rawList) {
    if (item && item.deliverableId) {
      deliverablesById[String(item.deliverableId)] = item;
    }
  }

  for (const dId of request.deliverables) {
    const spec = DELIVERABLE_SPECIFICATIONS[dId] || { name: dId.replace(/_/g, " ") };
    const defaultTitle = spec.name;

    if (deliverablesById[dId]) {
      const rawItem = deliverablesById[dId];
      const title = rawItem.title || defaultTitle;
      const structuredData = typeof rawItem.structuredData === "object" ? rawItem.structuredData : {};
      let content = typeof rawItem.content === "string" && rawItem.content.trim() ? rawItem.content.trim() : "";
      if (!content) {
        content = formatMarkdownFallback(dId, structuredData, title);
      }

      parsedDeliverables.push({
        deliverableId: dId,
        title,
        content,
        structuredData,
        status: "completed",
      });
    } else {
      parsedDeliverables.push({
        deliverableId: dId,
        title: defaultTitle,
        content: `Deliverable generation could not be completed for ${defaultTitle}.`,
        structuredData: null,
        status: "failed",
        error: `Model output did not include deliverable '${dId}'.`,
      });
    }
  }

  const completedCount = parsedDeliverables.filter((d) => d.status === "completed").length;
  const overallStatus =
    completedCount === request.deliverables.length
      ? "completed"
      : completedCount > 0
      ? "partial"
      : "failed";

  return {
    success: completedCount > 0,
    sessionId,
    status: overallStatus,
    model: modelUsed,
    deliverables: parsedDeliverables,
    error: overallStatus === "completed" ? null : `Completed ${completedCount}/${request.deliverables.length} deliverables.`,
    generatedAt: nowIso,
  };
}
