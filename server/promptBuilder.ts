export interface GenerationRequestPayload {
  sourceType?: string;
  sourceText: string;
  sourceMetadata?: {
    name?: string;
    charCount?: number;
    wordCount?: number;
    fileName?: string;
  };
  audience: string;
  customAudience?: string;
  tone: string;
  language: string;
  customLanguage?: string;
  detailLevel: string;
  objective: string;
  contentStyle: string;
  deliverables: string[];
}

export const AUDIENCE_LABELS: Record<string, string> = {
  general_public: "General Public / Broad Citizen Audience",
  government_officials: "Government Officials, Policy Makers & Civil Servants",
  executives: "Executives, Directors & C-Suite Leadership",
  c_suite_executives: "C-Suite & Executive Leadership",
  technical_professionals: "Technical Professionals, Engineers & Domain Specialists",
  technical_experts: "Technical Experts, Engineers & Developers",
  students_learners: "Students & Academic Learners",
  youth_students: "Youth & Students",
  media_journalists: "Media Outlets, Journalists & Reporters",
  internal_organization: "Internal Organization & Departmental Employees",
  investors_shareholders: "Investors, Board Members & Shareholders",
  operational_teams: "Operational Teams & Frontline Staff",
  academic_researchers: "Academic Researchers & Subject Specialists",
  seniors_retirees: "Seniors & Retirees",
  custom: "Custom Specified Audience",
};

export const TONE_LABELS: Record<string, string> = {
  professional: "Professional & Workplace-Standard (Polished, balanced, authoritative)",
  formal: "Formal & Institutional (Diplomatic, official, legally precise)",
  informative: "Informative & Fact-Focused (Clear, educational, structured)",
  conversational: "Conversational & Approachable (Engaging, warm, accessible)",
  persuasive: "Persuasive & Compelling (Visionary, rallying, action-driving)",
  urgent: "Urgent & Critical (Decisive, high-priority, action-oriented)",
  neutral: "Neutral & Unbiased (Objective, analytical, balanced)",
  formal_authoritative: "Formal & Authoritative (Official, institutional, legally precise)",
  professional_objective: "Professional & Objective (Balanced, analytical, corporate standard)",
  conversational_approachable: "Conversational & Approachable (Engaging, warm, accessible)",
  inspirational_persuasive: "Inspirational & Persuasive (Motivating, rallying, visionary)",
  empathic_supportive: "Empathic & Supportive (Caring, community-centric, understanding)",
  technical_analytical: "Technical & Analytical (Data-rich, rigorous, specialized)",
  urgent_critical: "Urgent & Critical (Decisive, high-priority, action-oriented)",
};

export const LANGUAGE_LABELS: Record<string, string> = {
  english: "English",
  hindi: "Hindi (हिन्दी)",
  marathi: "Marathi (मराठी)",
  tamil: "Tamil (தமிழ்)",
  telugu: "Telugu (తెలుగు)",
  bengali: "Bengali (বাংলা)",
  gujarati: "Gujarati (ગુજરાતી)",
  kannada: "Kannada (ಕನ್ನಡ)",
  malayalam: "Malayalam (മലയാളം)",
  spanish: "Spanish (Español)",
  french: "French (Français)",
  german: "German (Deutsch)",
  japanese: "Japanese (日本語)",
  mandarin: "Mandarin Chinese (中文)",
  arabic: "Arabic (العربية)",
  other: "Custom Target Language",
};

export const DETAIL_LEVEL_LABELS: Record<string, string> = {
  concise: "Concise (High-impact bullet points, tightly constrained, 1-2 min scan)",
  standard: "Standard (Balanced overview covering primary findings and context)",
  detailed: "Detailed (Thorough breakdown with rationale and context)",
  comprehensive: "Comprehensive (Deep-dive analysis covering complete background)",
  exhaustive: "Exhaustive (Exhaustive analysis covering edge cases and full implications)",
};

export const OBJECTIVE_LABELS: Record<string, string> = {
  inform: "Inform (Deliver factual, transparent information clearly and accurately)",
  educate: "Educate (Build foundational understanding with step-by-step context)",
  summarize: "Summarize (Extract core takeaways and synthesize critical highlights)",
  alert_advise: "Alert & Advise (Communicate guidance, warnings, or immediate action items)",
  persuade: "Persuade (Influence stakeholder decisions and encourage strategic alignment)",
  explain: "Explain (Demystify complex workflows, mechanisms, or domain logic)",
  promote_engage: "Promote & Engage (Drive public engagement, awareness, and community interest)",
  inform_summarize: "Inform & Summarize (Synthesize key facts accurately without bias)",
  persuade_convert: "Persuade & Convert (Build conviction and drive buy-in)",
  educate_train: "Educate & Train (Break down complex ideas into step-by-step learning)",
  engage_entertain: "Engage & Spark Dialogue (Generate resonance and interaction)",
  advise_warn: "Advise & Issue Guidance (Provide recommendations or risk cautions)",
};

export const CONTENT_STYLE_LABELS: Record<string, string> = {
  executive: "Executive (High-level strategic briefing with decision points and metrics)",
  news_editorial: "News / Editorial (Journalistic inverted pyramid structure with strong headlines)",
  technical: "Technical (Precise terminology, structured specifications, and logic)",
  educational: "Educational (Modular explanations, illustrative analogies, and summaries)",
  social_media: "Social Media (Hook-driven, snackable formatting with hashtags and callouts)",
  public_advisory: "Public Advisory (Direct citizen-oriented instructions, FAQs, and action tables)",
  storytelling: "Storytelling (Narrative arc connecting real-world challenges to solutions)",
  minimal_direct: "Minimal & Direct (Ultra-lean, zero filler, essential takeaways only)",
  narrative_storytelling: "Narrative & Storytelling (Arc-driven, illustrative scenarios)",
  bulleted_structured: "Bulleted & Highly Structured (Categorized lists, headers, scannable)",
  academic_formal: "Academic & Formal (Structured abstracts, methodological rigor)",
  journalistic_punchy: "Journalistic & Punchy (Inverted pyramid, compelling headlines)",
  executive_briefing: "Executive Briefing (Decisions, financial impacts, action items)",
};

export const DELIVERABLE_SPECIFICATIONS: Record<string, { name: string; description: string; jsonStructure: any }> = {
  executive_summary: {
    name: "Executive Summary",
    description: "High-level synthesis for leadership and decision-makers",
    jsonStructure: {
      title: "string: Title of the executive summary",
      summary: "string: 2-3 paragraph executive overview",
      key_points: ["string: 3-5 core strategic highlights"],
      important_findings: ["string: critical findings or quantitative insights"],
      recommended_actions: ["string: 2-4 recommended next steps or decisions"],
    },
  },
  linkedin_post: {
    name: "LinkedIn Thought Leadership Post",
    description: "Professional social post optimized for LinkedIn engagement",
    jsonStructure: {
      hook: "string: compelling first 1-2 opening lines",
      body: "string: core post text formatted with clean line breaks and emojis/bullets where appropriate",
      call_to_action: "string: closing question or prompt to encourage discussion",
      hashtags: ["string: 3-5 relevant industry hashtags starting with #"],
    },
  },
  twitter_post: {
    name: "Twitter / X Post & Thread",
    description: "Concise, punchy thread or post for fast consumption",
    jsonStructure: {
      thread_posts: ["string: List of 1-4 numbered or standalone tweet blocks, max 280 chars each"],
      key_takeaway: "string: one-line summary takeaway",
      hashtags: ["string: 2-4 relevant hashtags"],
    },
  },
  advisory: {
    name: "Official Advisory & Policy Notice",
    description: "Structured operational notice, guidance, or critical advisory",
    jsonStructure: {
      title: "string: Advisory title",
      context: "string: background context and situation assessment",
      key_information: ["string: official facts and points of note"],
      action_items: ["string: immediate operational steps or requirements"],
      cautions_or_notes: ["string: risk caveats, compliance notes, or timelines"],
    },
  },
  infographic: {
    name: "Infographic Architecture Plan",
    description: "Content blueprint, data callouts, and visual layout guide for visual designers",
    jsonStructure: {
      title: "string: Infographic headline",
      core_message: "string: primary takeaway",
      key_facts_and_metrics: ["string: 3-5 standalone stats, metrics, or anchor facts"],
      sections: [
        {
          heading: "string: section header",
          content: "string: concise narrative or stats for this visual section",
          visual_cue: "string: icon, chart type, or illustration concept",
        },
      ],
      visual_layout_guidance: "string: design layout tips (e.g. vertical timeline, comparison grid, 3-step hierarchy)",
    },
  },
  presentation: {
    name: "Presentation Deck Content & Speaker Notes",
    description: "Slide deck narrative structure with visual layout ideas and speaker notes",
    jsonStructure: {
      title: "string: Presentation deck title",
      total_slides: "integer: total number of slides (3 to 6 slides)",
      slides: [
        {
          slide_number: "integer",
          slide_title: "string: slide header",
          bullet_points: ["string: 3-4 concise slide bullet points"],
          visual_concept: "string: suggested diagram, chart, or layout for this slide",
          speaker_notes: "string: script notes for the presenter",
        },
      ],
    },
  },
  video_package: {
    name: "Video Package (Script, Storyboard, Narration & Production Plan)",
    description: "Production-ready video package containing opening hook, scene-by-scene storyboard, spoken narration, synchronized subtitles, visual directions, and production notes",
    jsonStructure: {
      title: "string: Compelling title for the video project",
      objective: "string: Core communication objective of this video",
      targetAudience: "string: Target audience for this video",
      targetLanguage: "string: Language of the script, narration, and captions",
      estimatedDuration: "string: Estimated duration (e.g. '60-90 seconds' or '2-3 minutes')",
      format: "string: Aspect ratio & format (e.g. '16:9 Landscape (YouTube/Web)' or '9:16 Vertical (Shorts/Reels)')",
      tone: "string: Delivery tone and energy for narrator and visual pacing",
      hook: {
        headline: "string: Compelling opening hook statement or question (first 5-10 seconds)",
        technique: "string: Strategy used e.g. 'Provocative Question / Surprising Statistic / Relatable Problem'",
        rationale: "string: Why this hook captures target audience attention immediately"
      },
      scenes: [
        {
          sceneNumber: 1,
          timestamp: "0:00 - 0:15",
          durationSeconds: 15,
          sceneTitle: "string: Short descriptive title for this scene",
          narration: "string: Spoken voiceover line (natural spoken tone, not dry document prose)",
          onScreenText: "string: Lower-third overlay, stat callout, or title graphic (concise)",
          visualDirection: "string: Practical camera framing, lighting, motion graphic, or presenter action",
          bRollSuggestions: ["string: 1-2 practical stock footage or archival B-roll suggestions"],
          transition: "string: e.g. 'Cut to presenter', 'Dynamic swipe right', 'Slow fade to next scene'",
          emphasis: "string: Tone/pacing note e.g. 'Deliberate emphasis on key metric', 'High energy'",
          subtitleText: "string: Synchronized caption line for this scene"
        }
      ],
      narration: "string: Complete continuous spoken voiceover script across all scenes with natural flow",
      subtitles: "string: Full closed-caption transcript with scene timestamps (e.g. [00:00] ...)",
      visualRecommendations: [
        "string: 2-3 styling guidelines (e.g. color grading, typography style, visual pacing)"
      ],
      onScreenText: [
        "string: Summary of key on-screen text highlights"
      ],
      transitionNotes: "string: Guidance on scene flow, rhythm, and visual continuity",
      callToAction: "string: Strong closing call-to-action for the target audience",
      productionNotes: {
        audioPacing: "string: Cadence, tempo (e.g. 130-140 words/min), and pauses",
        musicGenre: "string: Background score genre, mood, and volume cues",
        colorPalette: "string: Recommended visual color accents and grade",
        talentInstructions: "string: Tone and body language instructions for presenter/voice talent"
      }
    },
  },
};

export function buildSystemInstruction(): string {
  return `You are the Core GenAI Content Transformation Engine for SIH 26154: 'Gen AI Platform for Automated Content Transformation'.
Your mission is to perform rigorous, multi-deliverable content transformations on source text with strict fidelity, impeccable structural alignment, and full adherence to specified audience, tone, language, detail, objective, and style parameters.

CRITICAL CONTENT INTEGRITY & VIDEO PRODUCTION MANDATES:
1. Strictly preserve all names, numbers, dates, locations, organizations, and facts from the source material.
2. Do NOT hallucinate or fabricate unsupported statistics or factual claims.
3. Explicitly distinguish between source-derived facts and synthesized creative/production recommendations.
4. For Video Packages:
   - Produce natural spoken voiceover narration designed for listening, avoiding dense document-style prose.
   - Craft a punchy, hook-driven opening that captures audience attention in the first 5-10 seconds.
   - Maintain a coherent scene-by-scene progression with realistic durations and practical visual directions.
   - Ensure every scene has spoken narration, visual directions, on-screen text, transitions, and subtitle captions.
   - Provide full continuous narration and timestamped subtitles.
5. If target language is non-English, author the script, narration, and subtitles in that language while preserving factual numbers and names.
6. Output must strictly be valid JSON conforming to the requested schema.`;
}

export function buildTransformationPrompt(request: GenerationRequestPayload): string {
  const audienceStr =
    request.audience === "custom" && request.customAudience?.trim()
      ? request.customAudience.trim()
      : AUDIENCE_LABELS[request.audience] || request.audience;
  const toneStr = TONE_LABELS[request.tone] || request.tone;
  const languageStr =
    request.language === "other" && request.customLanguage?.trim()
      ? request.customLanguage.trim()
      : LANGUAGE_LABELS[request.language] || request.language;
  const detailStr = DETAIL_LEVEL_LABELS[request.detailLevel] || request.detailLevel;
  const objectiveStr = OBJECTIVE_LABELS[request.objective] || request.objective;
  const styleStr = CONTENT_STYLE_LABELS[request.contentStyle] || request.contentStyle;

  const deliverablesInfo: string[] = [];
  for (const dId of request.deliverables) {
    const spec = DELIVERABLE_SPECIFICATIONS[dId];
    if (spec) {
      deliverablesInfo.push(
        `### Deliverable ID: "${dId}"\n- Name: ${spec.name}\n- Objective: ${spec.description}\n- Expected JSON structuredData layout:\n${JSON.stringify(spec.jsonStructure, null, 2)}`
      );
    }
  }

  return `=== TRANSFORMATION MATRIX PARAMETERS ===
1. TARGET AUDIENCE:
   ${audienceStr}

2. COMMUNICATION TONE:
   ${toneStr}

3. TARGET LANGUAGE:
   ${languageStr} (Ensure all generated deliverables are authored in this target language!)

4. DETAIL LEVEL:
   ${detailStr}

5. COMMUNICATION OBJECTIVE:
   ${objectiveStr}

6. CONTENT STYLE:
   ${styleStr}

=== REQUESTED DELIVERABLES (${request.deliverables.length}) ===
You MUST generate an entry in the deliverables array for EVERY ONE of the following deliverable IDs:
${deliverablesInfo.join("\n\n")}

=== RAW SOURCE MATERIAL ===
--- BEGIN SOURCE TEXT ---
${request.sourceText}
--- END SOURCE TEXT ---

=== OUTPUT JSON CONTRACT ===
You must return a single JSON object with the following schema:
{
  "deliverables": [
    {
      "deliverableId": "one of the requested deliverable IDs (e.g. executive_summary)",
      "title": "A crisp, descriptive title for this deliverable",
      "content": "A beautifully formatted markdown representation of the deliverable ready for immediate copy-pasting or rendering",
      "structuredData": { ... the structured fields matching the deliverable specification above ... }
    }
  ]
}

Ensure every requested deliverable ID (${request.deliverables.join(", ")}) is present in the deliverables list.
Return ONLY valid JSON.`;
}
