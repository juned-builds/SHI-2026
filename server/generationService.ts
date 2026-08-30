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

function normalizeVideoPackage(data: Record<string, any>, defaultTitle: string): Record<string, any> {
  const title = data.title || defaultTitle || "Video Production Blueprint";
  const objective = data.objective || "";
  const targetAudience = data.targetAudience || data.target_audience || "";
  const targetLanguage = data.targetLanguage || data.target_language || "English";
  const estimatedDuration = data.estimatedDuration || data.duration_guidance || data.estimated_duration || "60-90 seconds";
  const format = data.format || data.aspect_ratio || "16:9 Landscape (YouTube/Web)";
  const tone = data.tone || "Engaging & Informative";

  let hook: any = data.hook;
  if (typeof hook === "string") {
    hook = { headline: hook, technique: "Opening Hook", rationale: "" };
  } else if (!hook || typeof hook !== "object") {
    hook = { headline: "What if you could transform complex information in seconds?", technique: "Curiosity Hook", rationale: "Engages audience curiosity immediately." };
  }

  const rawScenes = Array.isArray(data.scenes) ? data.scenes : [];
  const scenes = rawScenes.map((s: any, idx: number) => {
    const sceneNum = typeof s.sceneNumber === "number" ? s.sceneNumber : (typeof s.scene_number === "number" ? s.scene_number : idx + 1);
    const startSec = idx * 15;
    const endSec = (idx + 1) * 15;
    const defaultTimestamp = `${Math.floor(startSec / 60)}:${(startSec % 60).toString().padStart(2, "0")} - ${Math.floor(endSec / 60)}:${(endSec % 60).toString().padStart(2, "0")}`;

    let bRoll = s.bRollSuggestions || s.b_roll_suggestions || s.bRoll || s.b_roll || [];
    if (typeof bRoll === "string") bRoll = [bRoll];
    if (!Array.isArray(bRoll)) bRoll = [];

    const narration = s.narration || s.narration_script || s.script || s.voiceover || "";
    const visual = s.visualDirection || s.visual_direction || s.visual_concept || s.visuals || "Presenter on camera with clean backdrop.";
    const onScreen = s.onScreenText || s.on_screen_text || s.overlay_text || "";
    const transition = s.transition || s.transition_type || "Cut to next scene";
    const emphasis = s.emphasis || s.tone_emphasis || "";
    const subtitle = s.subtitleText || s.subtitle_text || s.subtitles || narration;

    return {
      sceneNumber: sceneNum,
      timestamp: s.timestamp || s.time_range || defaultTimestamp,
      durationSeconds: typeof s.durationSeconds === "number" ? s.durationSeconds : (typeof s.duration_seconds === "number" ? s.duration_seconds : 15),
      sceneTitle: s.sceneTitle || s.scene_title || s.title || `Scene ${sceneNum}`,
      narration,
      onScreenText: onScreen,
      visualDirection: visual,
      bRollSuggestions: bRoll,
      transition,
      emphasis,
      subtitleText: subtitle,
    };
  });

  // If no scenes returned, create a fallback scene
  if (scenes.length === 0) {
    scenes.push({
      sceneNumber: 1,
      timestamp: "0:00 - 0:30",
      durationSeconds: 30,
      sceneTitle: "Core Overview & Key Takeaway",
      narration: typeof data.narration === "string" && data.narration ? data.narration : "Here is the key takeaway from the source document.",
      onScreenText: title,
      visualDirection: "Presenter on camera with animated motion graphic summary.",
      bRollSuggestions: ["Subject matter overview footage"],
      transition: "Fade out",
      emphasis: "Clear, engaging pacing",
      subtitleText: typeof data.narration === "string" && data.narration ? data.narration : "Here is the key takeaway from the source document.",
    });
  }

  let continuousNarration = typeof data.narration === "string" && data.narration.trim() ? data.narration.trim() : "";
  if (!continuousNarration) {
    continuousNarration = scenes.map((s: any) => s.narration).filter(Boolean).join(" ");
  }

  let subtitles = typeof data.subtitles === "string" && data.subtitles.trim() ? data.subtitles.trim() : "";
  if (!subtitles) {
    subtitles = scenes
      .map((s: any) => `[${s.timestamp}] ${s.subtitleText || s.narration}`)
      .filter(Boolean)
      .join("\n\n");
  }

  let visualRecommendations = data.visualRecommendations || data.visual_recommendations || data.visual_layout_guidance || [];
  if (typeof visualRecommendations === "string") visualRecommendations = [visualRecommendations];
  if (!Array.isArray(visualRecommendations) || visualRecommendations.length === 0) {
    visualRecommendations = [
      "Modern clean typography with high-contrast subtitles for mobile legibility.",
      "Balanced 60-30-10 color palette aligned with subject matter theme.",
      "Subtle motion graphics and kinetic typography on key metrics."
    ];
  }

  let onScreenTextSummary = data.onScreenText || data.on_screen_text || [];
  if (typeof onScreenTextSummary === "string") onScreenTextSummary = [onScreenTextSummary];
  if (!Array.isArray(onScreenTextSummary) || onScreenTextSummary.length === 0) {
    onScreenTextSummary = scenes.map((s: any) => s.onScreenText).filter(Boolean);
  }

  const transitionNotes = data.transitionNotes || data.transition_notes || "Maintain dynamic 8-15 second scene rhythm with smooth visual transitions and audio stingers between segments.";
  const callToAction = data.callToAction || data.call_to_action || data.cta || "For more detailed insights and complete data, access the full source publication.";

  let prodNotes = data.productionNotes || data.production_notes;
  if (!prodNotes || typeof prodNotes !== "object") {
    prodNotes = {
      audioPacing: "Natural conversational cadence (130-145 words per minute) with deliberate pauses after key stats.",
      musicGenre: "Subtle ambient corporate / modern electronic underscore (ducked under voiceover).",
      colorPalette: "Clean neutral background with primary brand accent for callout cards.",
      talentInstructions: "Direct eye contact with lens, confident, approachable posture.",
    };
  }

  return {
    title,
    objective,
    targetAudience,
    targetLanguage,
    estimatedDuration,
    format,
    tone,
    hook,
    scenes,
    narration: continuousNarration,
    subtitles,
    visualRecommendations,
    onScreenText: onScreenTextSummary,
    transitionNotes,
    callToAction,
    productionNotes: prodNotes,
  };
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
    // Rich Video Package Markdown representation
    if (data.estimatedDuration || data.format) {
      lines.push(`**Duration:** ${data.estimatedDuration || "60-90s"} | **Format:** ${data.format || "16:9 Landscape"} | **Target Language:** ${data.targetLanguage || "English"}\n`);
    }
    if (data.objective) {
      lines.push(`**Objective:** ${data.objective}\n`);
    }
    if (data.hook) {
      const hookHeadline = typeof data.hook === "object" ? data.hook.headline : data.hook;
      const hookTechnique = typeof data.hook === "object" ? data.hook.technique : "";
      lines.push(`## Opening Hook\n> **"${hookHeadline}"**\n${hookTechnique ? `*(Technique: ${hookTechnique})*\n` : ""}`);
    }
    if (Array.isArray(data.scenes) && data.scenes.length > 0) {
      lines.push("## Storyboard & Scene Breakdown\n");
      data.scenes.forEach((sc: any) => {
        lines.push(`### Scene ${sc.sceneNumber || sc.scene_number || ""}: ${sc.sceneTitle || sc.scene_title || "Scene"}`);
        lines.push(`- **Timestamp/Duration:** ${sc.timestamp || "15s"}`);
        if (sc.visualDirection || sc.visual_direction) {
          lines.push(`- **Visual Direction:** ${sc.visualDirection || sc.visual_direction}`);
        }
        if (sc.narration || sc.narration_script) {
          lines.push(`- **Spoken Voiceover:** *"${sc.narration || sc.narration_script}"*`);
        }
        if (sc.onScreenText || sc.on_screen_text) {
          lines.push(`- **On-Screen Text:** \`${sc.onScreenText || sc.on_screen_text}\``);
        }
        if (Array.isArray(sc.bRollSuggestions) && sc.bRollSuggestions.length > 0) {
          lines.push(`- **B-Roll Suggestions:** ${sc.bRollSuggestions.join(", ")}`);
        }
        if (sc.transition) {
          lines.push(`- **Transition:** ${sc.transition}`);
        }
        lines.push("");
      });
    }
    if (data.narration) {
      lines.push(`## Continuous Voiceover Script\n${data.narration}\n`);
    }
    if (data.subtitles) {
      lines.push(`## Closed Captions & Subtitles\n\`\`\`text\n${data.subtitles}\n\`\`\`\n`);
    }
    if (data.callToAction) {
      lines.push(`## Call to Action\n👉 **${data.callToAction}**\n`);
    }
    if (data.productionNotes) {
      lines.push("## Production Notes");
      if (typeof data.productionNotes === "object") {
        if (data.productionNotes.audioPacing) lines.push(`- **Audio Pacing:** ${data.productionNotes.audioPacing}`);
        if (data.productionNotes.musicGenre) lines.push(`- **Music Mood:** ${data.productionNotes.musicGenre}`);
        if (data.productionNotes.colorPalette) lines.push(`- **Visual Style & Colors:** ${data.productionNotes.colorPalette}`);
        if (data.productionNotes.talentInstructions) lines.push(`- **Talent Direction:** ${data.productionNotes.talentInstructions}`);
      } else {
        lines.push(String(data.productionNotes));
      }
    }
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
  const startTime = Date.now();

  if (!request.sourceText || !request.sourceText.trim()) {
    throw new Error("Source text cannot be empty.");
  }
  if (!request.deliverables || request.deliverables.length === 0) {
    throw new Error("At least one target deliverable must be selected.");
  }

  const deliverableCount = request.deliverables.length;
  console.log(`[Generation] Request started (Deliverables: ${deliverableCount}, CharCount: ${request.sourceText.length})`);

  const systemInstruction = buildSystemInstruction();
  const prompt = buildTransformationPrompt(request);

  // Deliverable-aware bounded timeout: base 60s + 6s per deliverable, capped at 95s
  const timeoutMs = Math.min(95000, Math.max(60000, 45000 + deliverableCount * 6000));

  let rawResult: any;
  let modelUsed = "gemini-3.7-flash";

  try {
    const genResult = await generateStructuredJson(prompt, systemInstruction, {
      timeoutMs,
      maxAttempts: 4,
    });
    rawResult = genResult.data;
    modelUsed = genResult.modelUsed;
  } catch (err: any) {
    const totalElapsed = Date.now() - startTime;
    if (err?.code === "QUOTA_EXHAUSTED" || err?.message?.toLowerCase().includes("quota")) {
      console.log("[Generation] Request stopped — provider quota exhausted");
      return {
        success: false,
        sessionId,
        status: "failed",
        model: modelUsed,
        deliverables: [],
        error: "QUOTA_EXHAUSTED: Gemini usage quota has been reached for the current API plan. Your project and generated content are safe and unchanged.",
        generatedAt: nowIso,
      };
    }

    console.warn(`[Generation] Transformation failed after ${totalElapsed}ms: ${err?.message || err}`);
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

  const normStartTime = Date.now();
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
      let structuredData = typeof rawItem.structuredData === "object" && rawItem.structuredData !== null ? rawItem.structuredData : {};
      
      if (dId === "video_package") {
        structuredData = normalizeVideoPackage(structuredData, title);
      }

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

  const normElapsed = Date.now() - normStartTime;
  const totalElapsed = Date.now() - startTime;
  console.log(`[Generation] Normalization completed: ${normElapsed}ms (Total elapsed: ${totalElapsed}ms, Completed: ${completedCount}/${deliverableCount})`);

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
