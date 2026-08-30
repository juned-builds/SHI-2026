import { VideoPackageData, VideoScene, VideoHook, VideoProductionNotes } from "../types";

/**
 * Normalizes any arbitrary raw data into a strictly typed VideoPackageData object.
 */
export function normalizeVideoPackageData(
  raw: any,
  defaultTitle: string = "Video Production Blueprint"
): VideoPackageData {
  if (!raw || typeof raw !== "object") {
    return {
      title: defaultTitle,
      objective: "",
      targetAudience: "General Audience",
      targetLanguage: "English",
      estimatedDuration: "60-90 seconds",
      format: "16:9 Landscape (YouTube/Web)",
      tone: "Engaging & Informative",
      hook: {
        headline: "Engaging hook statement from the source document.",
        technique: "Curiosity & Problem Opener",
        rationale: "Captures attention in the first 5-10 seconds.",
      },
      scenes: [
        {
          sceneNumber: 1,
          timestamp: "0:00 - 0:15",
          durationSeconds: 15,
          sceneTitle: "Introduction & Context",
          narration: "Welcome. Here is the core summary from the source material.",
          onScreenText: defaultTitle,
          visualDirection: "Presenter on camera with dynamic title graphics.",
          bRollSuggestions: ["Contextual background footage"],
          transition: "Cut to next scene",
          emphasis: "Confident & clear",
          subtitleText: "Welcome. Here is the core summary from the source material.",
        },
      ],
      narration: "Welcome. Here is the core summary from the source material.",
      subtitles: "[0:00 - 0:15] Welcome. Here is the core summary from the source material.",
      visualRecommendations: [
        "Modern clean typography with high contrast for mobile legibility.",
        "Balanced visual color palette aligned with theme.",
      ],
      onScreenText: [defaultTitle],
      transitionNotes: "Maintain dynamic 8-15 second scene rhythm.",
      callToAction: "Explore the full source material for more detailed findings.",
      productionNotes: {
        audioPacing: "Natural conversational cadence (130-145 words/min)",
        musicGenre: "Modern ambient electronic score",
        colorPalette: "Clean neutral background with brand accent",
        talentInstructions: "Direct eye contact with lens, confident posture",
      },
    };
  }

  const title = raw.title || defaultTitle;
  const objective = raw.objective || "";
  const targetAudience = raw.targetAudience || raw.target_audience || "General Audience";
  const targetLanguage = raw.targetLanguage || raw.target_language || "English";
  const estimatedDuration =
    raw.estimatedDuration || raw.duration_guidance || raw.estimated_duration || "60-90 seconds";
  const format = raw.format || raw.aspect_ratio || "16:9 Landscape (YouTube/Web)";
  const tone = raw.tone || "Engaging & Informative";

  let hook: VideoHook | string = raw.hook;
  if (typeof hook === "string") {
    hook = {
      headline: hook,
      technique: "Opening Hook",
      rationale: "Grabs target audience attention in initial seconds.",
    };
  } else if (!hook || typeof hook !== "object") {
    hook = {
      headline: "How do the latest findings change the landscape?",
      technique: "Provocative Question",
      rationale: "Piques curiosity and establishes relevance.",
    };
  }

  const rawScenes = Array.isArray(raw.scenes) ? raw.scenes : [];
  const scenes: VideoScene[] = rawScenes.map((s: any, idx: number) => {
    const sceneNum =
      typeof s.sceneNumber === "number"
        ? s.sceneNumber
        : typeof s.scene_number === "number"
        ? s.scene_number
        : idx + 1;
    const startSec = idx * 15;
    const endSec = (idx + 1) * 15;
    const defaultTimestamp = `${Math.floor(startSec / 60)}:${(startSec % 60)
      .toString()
      .padStart(2, "0")} - ${Math.floor(endSec / 60)}:${(endSec % 60)
      .toString()
      .padStart(2, "0")}`;

    let bRoll = s.bRollSuggestions || s.b_roll_suggestions || s.bRoll || s.b_roll || [];
    if (typeof bRoll === "string") bRoll = [bRoll];
    if (!Array.isArray(bRoll)) bRoll = [];

    const narration = s.narration || s.narration_script || s.script || s.voiceover || "";
    const visual =
      s.visualDirection ||
      s.visual_direction ||
      s.visual_concept ||
      s.visuals ||
      "Clean visuals with animated graphics and presenter.";
    const onScreen = s.onScreenText || s.on_screen_text || s.overlay_text || "";
    const transition = s.transition || s.transition_type || "Cut to next scene";
    const emphasis = s.emphasis || s.tone_emphasis || "";
    const subtitle = s.subtitleText || s.subtitle_text || s.subtitles || narration;

    return {
      sceneNumber: sceneNum,
      timestamp: s.timestamp || s.time_range || defaultTimestamp,
      durationSeconds:
        typeof s.durationSeconds === "number"
          ? s.durationSeconds
          : typeof s.duration_seconds === "number"
          ? s.duration_seconds
          : 15,
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

  if (scenes.length === 0) {
    scenes.push({
      sceneNumber: 1,
      timestamp: "0:00 - 0:30",
      durationSeconds: 30,
      sceneTitle: "Core Overview & Key Takeaway",
      narration:
        typeof raw.narration === "string" && raw.narration
          ? raw.narration
          : "Key takeaways from the source material.",
      onScreenText: title,
      visualDirection: "Presenter on camera with animated infographic cues.",
      bRollSuggestions: ["Subject footage"],
      transition: "Fade out",
      emphasis: "Clear, deliberate pacing",
      subtitleText:
        typeof raw.narration === "string" && raw.narration
          ? raw.narration
          : "Key takeaways from the source material.",
    });
  }

  let continuousNarration =
    typeof raw.narration === "string" && raw.narration.trim()
      ? raw.narration.trim()
      : scenes.map((s) => s.narration).filter(Boolean).join(" ");

  let subtitles =
    typeof raw.subtitles === "string" && raw.subtitles.trim()
      ? raw.subtitles.trim()
      : scenes
          .map((s) => `[${s.timestamp}] ${s.subtitleText || s.narration}`)
          .filter(Boolean)
          .join("\n\n");

  let visualRecommendations =
    raw.visualRecommendations || raw.visual_recommendations || raw.visual_layout_guidance || [];
  if (typeof visualRecommendations === "string") visualRecommendations = [visualRecommendations];
  if (!Array.isArray(visualRecommendations) || visualRecommendations.length === 0) {
    visualRecommendations = [
      "Modern clean typography with high-contrast subtitles for mobile legibility.",
      "Balanced 60-30-10 color palette aligned with subject matter theme.",
      "Subtle motion graphics and kinetic typography on key metrics.",
    ];
  }

  let onScreenTextSummary = raw.onScreenText || raw.on_screen_text || [];
  if (typeof onScreenTextSummary === "string") onScreenTextSummary = [onScreenTextSummary];
  if (!Array.isArray(onScreenTextSummary) || onScreenTextSummary.length === 0) {
    onScreenTextSummary = scenes.map((s) => s.onScreenText).filter(Boolean) as string[];
  }

  const transitionNotes =
    raw.transitionNotes ||
    raw.transition_notes ||
    "Maintain dynamic 8-15 second scene rhythm with smooth visual transitions.";
  const callToAction =
    raw.callToAction ||
    raw.call_to_action ||
    raw.cta ||
    "For more detailed insights and complete data, access the full source publication.";

  let prodNotes = raw.productionNotes || raw.production_notes;
  if (!prodNotes || typeof prodNotes !== "object") {
    prodNotes = {
      audioPacing:
        "Natural conversational cadence (130-145 words per minute) with deliberate pauses after key stats.",
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

/**
 * Calculates telemetry and validation quality metrics for a video package.
 */
export function validateVideoPackage(data: VideoPackageData) {
  const warnings: string[] = [];
  const sceneCount = data.scenes?.length || 0;

  if (sceneCount === 0) {
    warnings.push("Video package contains no scenes.");
  }

  const words = data.narration ? data.narration.trim().split(/\s+/).filter(Boolean).length : 0;
  // Standard speech rate: ~140 words per minute
  const readingSeconds = Math.round((words / 140) * 60);

  const hasHook = Boolean(
    data.hook &&
      (typeof data.hook === "string" ? data.hook.trim().length > 0 : Boolean(data.hook.headline))
  );
  if (!hasHook) {
    warnings.push("No opening hook provided.");
  }

  const hasSubtitles = Boolean(data.subtitles && data.subtitles.trim().length > 0);

  // Check scene numbering & narration
  data.scenes?.forEach((s, idx) => {
    if (!s.narration || !s.narration.trim()) {
      warnings.push(`Scene ${s.sceneNumber || idx + 1} has no narration voiceover.`);
    }
    if (!s.visualDirection || !s.visualDirection.trim()) {
      warnings.push(`Scene ${s.sceneNumber || idx + 1} is missing visual direction.`);
    }
  });

  return {
    isValid: warnings.length === 0,
    warnings,
    stats: {
      sceneCount,
      totalNarrationWords: words,
      estimatedReadingSeconds: readingSeconds,
      formattedReadingTime:
        readingSeconds > 60
          ? `${Math.floor(readingSeconds / 60)}m ${readingSeconds % 60}s`
          : `${readingSeconds}s`,
      hasHook,
      hasSubtitles,
    },
  };
}

/**
 * Generates SubRip (.srt) caption file content.
 */
export function generateSrtCaptions(data: VideoPackageData): string {
  if (!data.scenes || data.scenes.length === 0) {
    return "1\n00:00:00,000 --> 00:00:10,000\n" + (data.subtitles || data.narration || "");
  }

  let cumulativeSeconds = 0;
  return data.scenes
    .map((scene, idx) => {
      const duration = scene.durationSeconds || 15;
      const startSec = cumulativeSeconds;
      const endSec = cumulativeSeconds + duration;
      cumulativeSeconds = endSec;

      const formatTime = (secs: number) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
          .toString()
          .padStart(2, "0")},000`;
      };

      const captionText = (scene.subtitleText || scene.narration || scene.sceneTitle).trim();
      return `${idx + 1}\n${formatTime(startSec)} --> ${formatTime(endSec)}\n${captionText}\n`;
    })
    .join("\n");
}

/**
 * Generates clean Voiceover / Teleprompter Script Markdown.
 */
export function generateContinuousScript(data: VideoPackageData): string {
  const lines: string[] = [
    `# Teleprompter & Voiceover Script: ${data.title}`,
    `**Target Duration:** ${data.estimatedDuration || "60-90s"} | **Target Tone:** ${data.tone || "Engaging"}`,
    `**Language:** ${data.targetLanguage || "English"} | **Audience:** ${data.targetAudience || "General"}\n`,
    "---",
    "",
  ];

  if (data.hook) {
    const headline = typeof data.hook === "object" ? data.hook.headline : data.hook;
    lines.push("### 🎯 OPENING HOOK (0:00 - 0:05)");
    lines.push(`"${headline}"\n`);
  }

  data.scenes?.forEach((scene) => {
    lines.push(`### Scene ${scene.sceneNumber}: ${scene.sceneTitle} [${scene.timestamp || ""}]`);
    if (scene.emphasis) {
      lines.push(`*Speaker Delivery Note: ${scene.emphasis}*`);
    }
    lines.push(`\n"${scene.narration}"\n`);
    if (scene.onScreenText) {
      lines.push(`*(Overlay Text: ${scene.onScreenText})*\n`);
    }
  });

  if (data.callToAction) {
    lines.push("### 📣 CLOSING CALL TO ACTION");
    lines.push(`"${data.callToAction}"\n`);
  }

  return lines.join("\n");
}

/**
 * Generates production-ready Storyboard Markdown.
 */
export function generateStoryboardMarkdown(data: VideoPackageData): string {
  const lines: string[] = [
    `# Production Storyboard: ${data.title}`,
    `**Objective:** ${data.objective || "Content Transformation Video"}`,
    `**Format:** ${data.format || "16:9 Landscape"} | **Estimated Duration:** ${data.estimatedDuration || "60-90s"}\n`,
    "---",
    "",
  ];

  data.scenes?.forEach((scene) => {
    lines.push(`## Scene ${scene.sceneNumber}: ${scene.sceneTitle}`);
    lines.push(`- **Timeline:** \`${scene.timestamp || "0:00 - 0:15"}\` (${scene.durationSeconds || 15}s)`);
    lines.push(`- **Visual Direction:** ${scene.visualDirection}`);
    lines.push(`- **Voiceover Narration:** *"${scene.narration}"*`);
    if (scene.onScreenText) lines.push(`- **On-Screen Text:** \`${scene.onScreenText}\``);
    if (scene.bRollSuggestions && scene.bRollSuggestions.length > 0) {
      lines.push(`- **B-Roll Recommendations:** ${scene.bRollSuggestions.join(" | ")}`);
    }
    if (scene.transition) lines.push(`- **Transition:** ${scene.transition}`);
    if (scene.emphasis) lines.push(`- **Audio/Pacing Emphasis:** ${scene.emphasis}`);
    lines.push("");
  });

  if (data.productionNotes && typeof data.productionNotes === "object") {
    lines.push("---");
    lines.push("## Production Direction & Technical Notes");
    if (data.productionNotes.audioPacing) lines.push(`- **Audio Pacing:** ${data.productionNotes.audioPacing}`);
    if (data.productionNotes.musicGenre) lines.push(`- **Music Mood & Underscore:** ${data.productionNotes.musicGenre}`);
    if (data.productionNotes.colorPalette) lines.push(`- **Visual Grade & Palette:** ${data.productionNotes.colorPalette}`);
    if (data.productionNotes.talentInstructions) lines.push(`- **Talent Direction:** ${data.productionNotes.talentInstructions}`);
  }

  return lines.join("\n");
}
