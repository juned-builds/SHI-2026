/**
 * Deterministic Client-Side LinkedIn Post Formatter and Style Engine for TransformAI.
 * Formats, restructures, and enhances LinkedIn deliverables without calling external APIs.
 * Preserves all underlying factual content (numbers, dates, names, organizations, statistics, claims).
 */

export type LinkedInStyle =
  | "professional"
  | "thought_leadership"
  | "storytelling"
  | "government"
  | "executive";

export type LinkedInEmojiDensity = "none" | "balanced" | "expressive";

export interface LinkedInParsedSections {
  hook: string;
  context: string;
  takeaways: string[];
  whyItMatters: string;
  closingCta: string;
  hashtags: string[];
}

export interface LinkedInFormatOptions {
  style?: LinkedInStyle;
  emojiDensity?: LinkedInEmojiDensity;
}

// Unicode Emoji regex matching pictographs, flags, keycaps, skin tones, zero-width joiners, and dingbats
const EMOJI_REGEX =
  /(?:[\p{Extended_Pictographic}\uFE0F\u200D]|[\u{1F1E6}-\u{1F1FF}]|[\u{1F3FB}-\u{1F3FF}]|[\u{2600}-\u{27BF}])/gu;

/**
 * Safely strips all emojis from a string while preserving characters, punctuation, and markdown.
 */
export function stripEmojis(str: string): string {
  if (!str) return "";
  return str.replace(EMOJI_REGEX, "").trim();
}

/**
 * Strips leading bullet markers, numbering, or emojis without consuming markdown bold (e.g. `**`).
 */
export function stripLeadingBulletPrefix(str: string): string {
  if (!str) return "";
  const prefixRegex =
    /^((?:[•\-]|\*(?!\*)|(?:[\p{Extended_Pictographic}\uFE0F\u200D]|[\u{1F1E6}-\u{1F1FF}]|[\u{1F3FB}-\u{1F3FF}]|[\u{2600}-\u{27BF}])+|\d+[\.\)])\s*)/u;
  return str.replace(prefixRegex, "").trim();
}

/**
 * Cleans section header wrappers (e.g. `**Key Takeaways:**`, `**EXECUTIVE BRIEFING**`, etc.).
 */
export function cleanHeaderPrefix(str: string): string {
  if (!str) return "";
  return str
    .replace(
      /^((\*\*|##|###)?\s*(PUBLIC POLICY & GOVERNANCE BRIEFING|PUBLIC POLICY & GOVERNANCE|EXECUTIVE BRIEFING|BOTTOM LINE UP FRONT \(BLUF\)|BOTTOM LINE UP FRONT|WHAT THIS SIGNALS|THE BIGGER PICTURE|WHAT LEADERS SHOULD WATCH|HERE'S WHAT HAPPENED|THEN CAME THE CRITICAL SHIFT|THEN CAME THE OPERATIONAL SHIFT|AND THIS IS WHERE IT BECOMES TRULY IMPORTANT|AND THIS IS WHERE IT BECOMES IMPORTANT|KEY TAKEAWAYS|WHY IT MATTERS|PUBLIC & POLICY IMPLICATIONS|STRATEGIC IMPLICATION & RISK OUTLOOK|EXECUTIVE SUMMARY|KEY DEVELOPMENTS & PROVISIONS|KEY DEVELOPMENTS|WHAT THIS MEANS FOR STAKEHOLDERS|DECISION-MAKER ACTION ITEMS|CORE INSIGHTS|STRATEGIC IMPACT|STRATEGIC TAKEAWAY|CITIZEN & SECTOR IMPACT|NEXT STEPS & IMPLEMENTATION)[:\s]*(\*\*|##)?\s*)/iu,
      ""
    )
    .trim();
}

/**
 * Checks if a bullet point is a generated static action item / boilerplate.
 */
function isBoilerplateBullet(str: string): boolean {
  return (
    /monitor\s+implementation\s+milestones/i.test(str) ||
    /evaluate\s+resource\s+allocation/i.test(str) ||
    /assess\s+resource\s+allocation/i.test(str) ||
    /what\s+leaders\s+should\s+watch/i.test(str)
  );
}

/**
 * Parses raw text/markdown into structured LinkedIn sections.
 * Robust against repeated re-formatting and extracts the canonical facts.
 */
export function parseLinkedInPost(rawText: string): LinkedInParsedSections {
  if (!rawText || !rawText.trim()) {
    return {
      hook: "",
      context: "",
      takeaways: [],
      whyItMatters: "",
      closingCta: "",
      hashtags: [],
    };
  }

  const lines = rawText.split("\n").map((l) => l.trim());
  const hashtags: string[] = [];
  const contentLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("#") && !line.startsWith("##") && !line.startsWith("###")) {
      const tags = line.match(/#[A-Za-z0-9_]+/g);
      if (tags && tags.length > 0) {
        hashtags.push(...tags);
        continue;
      }
    }
    contentLines.push(line);
  }

  const rawParagraphs = contentLines
    .join("\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (rawParagraphs.length === 0) {
    return {
      hook: "",
      context: "",
      takeaways: [],
      whyItMatters: "",
      closingCta: "",
      hashtags,
    };
  }

  const bulletRegex =
    /^((?:[•\-]|\*(?!\*)|(?:[\p{Extended_Pictographic}\uFE0F\u200D]|[\u{1F1E6}-\u{1F1FF}]|[\u{1F3FB}-\u{1F3FF}]|[\u{2600}-\u{27BF}])+|\d+[\.\)])\s+)(.*)$/u;
  const isHeaderRegex =
    /^((\*\*|##|###)?\s*(PUBLIC POLICY & GOVERNANCE|EXECUTIVE BRIEFING|BOTTOM LINE UP FRONT|WHAT THIS SIGNALS|THE BIGGER PICTURE|WHAT LEADERS SHOULD WATCH|HERE'S WHAT HAPPENED|THEN CAME|AND THIS IS WHERE|KEY TAKEAWAYS|WHY IT MATTERS|PUBLIC & POLICY|STRATEGIC IMPLICATION|EXECUTIVE SUMMARY|KEY DEVELOPMENTS|WHAT THIS MEANS|DECISION-MAKER|CORE INSIGHTS|STRATEGIC IMPACT|STRATEGIC TAKEAWAY|CITIZEN & SECTOR|NEXT STEPS)[\w\s/&():\-]*(\*\*|##)?\s*)$/i;

  let hook = "";
  let context = "";
  const takeaways: string[] = [];
  let whyItMatters = "";
  let closingCta = "";

  // 1. Find the primary hook/headline
  let startIndex = 0;
  for (let i = 0; i < rawParagraphs.length; i++) {
    const p = rawParagraphs[i];
    if (isHeaderRegex.test(p)) continue;
    const cleaned = cleanHeaderPrefix(p);
    if (!cleaned) continue;
    hook = stripLeadingBulletPrefix(cleaned);
    startIndex = i + 1;
    break;
  }

  // 2. Process remaining paragraphs
  for (let i = startIndex; i < rawParagraphs.length; i++) {
    const p = rawParagraphs[i];
    const pLines = p.split("\n").map((l) => l.trim()).filter(Boolean);

    let containsBullets = false;
    for (const pl of pLines) {
      const bMatch = pl.match(bulletRegex);
      if (bMatch) {
        containsBullets = true;
        const cleanBullet = bMatch[2].trim();
        if (
          cleanBullet &&
          !isBoilerplateBullet(cleanBullet) &&
          !takeaways.includes(cleanBullet)
        ) {
          takeaways.push(cleanBullet);
        }
      }
    }

    if (!containsBullets) {
      if (isHeaderRegex.test(p)) {
        continue;
      }
      const cleaned = cleanHeaderPrefix(p);
      if (!cleaned) continue;

      const pLower = cleaned.toLowerCase();

      // Skip generated boilerplate text during cyclic parsing
      if (
        pLower.includes("the bigger picture") ||
        pLower.includes("structural, not just incremental") ||
        pLower.includes("story of how strategy meets") ||
        pLower.includes("every successful transformation begins") ||
        pLower.includes("public administrators, industry partners") ||
        pLower.includes("consistent execution, stakeholder alignment") ||
        pLower.includes("behind every major milestone is a story")
      ) {
        continue;
      }

      if (
        pLower.startsWith("why this matters") ||
        pLower.startsWith("why it matters") ||
        pLower.startsWith("strategic impact") ||
        pLower.startsWith("public & policy") ||
        pLower.includes("sets a precedent") ||
        pLower.includes("implication") ||
        pLower.startsWith("strategic takeaway")
      ) {
        let cleanText = cleaned
          .replace(
            /^(why this matters[:\s]*|why it matters[:\s]*|strategic impact[:\s]*|strategic takeaway[:\s]*|impact[:\s]*)/i,
            ""
          )
          .trim();
        cleanText = cleanText
          .replace(
            /\s*This framework reinforces institutional accountability.*$/i,
            ""
          )
          .trim();
        if (!whyItMatters) whyItMatters = cleanText;
      } else if (
        pLower.startsWith("what are your") ||
        pLower.startsWith("what do you think") ||
        pLower.startsWith("let's discuss") ||
        pLower.startsWith("how is your") ||
        pLower.startsWith("what is your executive") ||
        pLower.startsWith("what part of this") ||
        pLower.startsWith("share this") ||
        pLower.includes("?")
      ) {
        closingCta = cleaned;
      } else if (!context) {
        let cleanCtx = cleaned
          .replace(
            /\s*This reflects a broader shift toward automated verification.*$/i,
            ""
          )
          .trim();
        context = cleanCtx;
      } else if (!whyItMatters) {
        whyItMatters = cleaned;
      } else if (!closingCta) {
        closingCta = cleaned;
      }
    }
  }

  // Fallback defaults if extraction missed items
  if (takeaways.length === 0 && rawParagraphs.length > 2) {
    takeaways.push(rawParagraphs[2]);
  }

  return {
    hook,
    context,
    takeaways,
    whyItMatters,
    closingCta,
    hashtags,
  };
}

/**
 * Formats a LinkedIn post according to selected style and emoji density.
 * Executes genuinely distinct structural transformations for each voice:
 * - Professional: Polished, conventional hierarchy with key takeaways and practical next steps.
 * - Thought Leader: Insight-driven macro perspective connecting developments to broader trends.
 * - Storytelling: Narrative arc progressing through context, operational shift, and human impact.
 * - Gov / Public: Accessible public-sector briefing emphasizing civic governance and policy impact.
 * - Executive: High-density decision briefing with BLUF, strategic impact, and action items.
 */
export function formatLinkedInPost(
  rawText: string,
  options: LinkedInFormatOptions = {}
): string {
  const { style = "professional", emojiDensity = "balanced" } = options;
  const parsed = parseLinkedInPost(rawText);

  // Bullet marker generator based on emoji density and voice
  const getBulletMarker = (index: number, styleType: LinkedInStyle): string => {
    if (emojiDensity === "none") return "•";
    if (emojiDensity === "expressive") {
      const expressiveIcons = ["🚀", "💡", "⚡", "📊", "✅", "🎯", "📈"];
      return expressiveIcons[index % expressiveIcons.length];
    }
    // Balanced
    const balancedIcons =
      styleType === "executive"
        ? ["▪️", "🔹", "📊", "📌"]
        : styleType === "government"
        ? ["🏛️", "📌", "🔹", "📊"]
        : styleType === "thought_leadership"
        ? ["💡", "🔍", "📈", "⚡"]
        : ["🔹", "📌", "📊", "⚡", "💡"];
    return balancedIcons[index % balancedIcons.length];
  };

  // Section header emoji generator
  const getSectionHeaderEmoji = (type: string): string => {
    if (emojiDensity === "none") return "";
    if (emojiDensity === "expressive") {
      switch (type) {
        case "executive":
          return "🎯 ";
        case "signals":
          return "📡 ";
        case "picture":
          return "🌐 ";
        case "watch":
          return "👀 ";
        case "story":
          return "📖 ";
        case "shift":
          return "⚡ ";
        case "gov":
          return "🏛️ ";
        case "takeaway":
          return "📌 ";
        case "impact":
          return "💥 ";
        default:
          return "✨ ";
      }
    }
    // Balanced
    switch (type) {
      case "executive":
        return "📊 ";
      case "signals":
        return "🔍 ";
      case "picture":
        return "🌐 ";
      case "watch":
        return "📌 ";
      case "story":
        return "📖 ";
      case "shift":
        return "⚡ ";
      case "gov":
        return "🏛️ ";
      case "takeaway":
        return "🔹 ";
      case "impact":
        return "💡 ";
      default:
        return "";
    }
  };

  // Hook prefix based on style & emoji density
  const getHookPrefix = (): string => {
    if (emojiDensity === "none") return "";
    if (emojiDensity === "expressive") {
      switch (style) {
        case "executive":
          return "🎯 ";
        case "thought_leadership":
          return "💡 ";
        case "storytelling":
          return "🌱 ";
        case "government":
          return "🏛️ ";
        case "professional":
        default:
          return "📢 ";
      }
    }
    // Balanced
    switch (style) {
      case "executive":
        return "📊 ";
      case "thought_leadership":
        return "🔍 ";
      case "storytelling":
        return "📖 ";
      case "government":
        return "🏛️ ";
      case "professional":
      default:
        return "🚀 ";
    }
  };

  // Clean factual elements
  const cleanHook = stripEmojis(parsed.hook);
  const cleanContext = stripEmojis(parsed.context);
  const cleanWhy = stripEmojis(parsed.whyItMatters);
  const cleanTakeaways = parsed.takeaways.map((t) =>
    stripLeadingBulletPrefix(stripEmojis(t))
  );

  const sections: string[] = [];

  switch (style) {
    // ==========================================
    // STYLE 5: EXECUTIVE (BLUF, High-Density Briefing)
    // ==========================================
    case "executive": {
      sections.push(`${getSectionHeaderEmoji("executive")}**EXECUTIVE BRIEFING**`);

      const blufSummary = cleanContext || cleanHook;
      sections.push(`**BOTTOM LINE UP FRONT (BLUF):** ${blufSummary}`);

      if (cleanTakeaways.length > 0) {
        const bulletList = cleanTakeaways
          .map((t, idx) => `${getBulletMarker(idx, "executive")} ${t}`)
          .join("\n");
        sections.push(
          `${getSectionHeaderEmoji("takeaway")}**KEY DEVELOPMENTS:**\n${bulletList}`
        );
      }

      if (cleanWhy) {
        sections.push(
          `${getSectionHeaderEmoji("impact")}**STRATEGIC IMPLICATION & RISK OUTLOOK:**\n${cleanWhy}`
        );
      }

      sections.push(
        `${getSectionHeaderEmoji("watch")}**DECISION-MAKER ACTION ITEMS:**\n• Monitor implementation milestones across operational units.\n• Evaluate resource allocation and compliance alignment.`
      );

      sections.push(
        "What is your executive assessment of these operational priorities?"
      );
      break;
    }

    // ==========================================
    // STYLE 2: THOUGHT LEADER (Insight & Macro Perspective)
    // ==========================================
    case "thought_leadership": {
      sections.push(
        `${getHookPrefix()}**The most important developments in modern systems are structural, not just incremental.**\n\n${cleanHook}`
      );

      if (cleanContext) {
        sections.push(
          `${getSectionHeaderEmoji("signals")}**What This Signals:**\n${cleanContext} This reflects a broader shift toward automated verification, direct stakeholder integration, and accountable execution at scale.`
        );
      }

      sections.push(
        `${getSectionHeaderEmoji("picture")}**The Bigger Picture:**\nWhen institutional policy integrates real-time digital infrastructure with field operations, it fundamentally changes industry benchmarks for transparency and response speed.`
      );

      if (cleanTakeaways.length > 0) {
        const bulletList = cleanTakeaways
          .map((t, idx) => `${getBulletMarker(idx, "thought_leadership")} ${t}`)
          .join("\n");
        sections.push(
          `${getSectionHeaderEmoji("watch")}**What Leaders Should Watch:**\n${bulletList}`
        );
      }

      if (cleanWhy) {
        sections.push(
          `${getSectionHeaderEmoji("impact")}**Strategic Takeaway:**\n${cleanWhy}`
        );
      }

      sections.push(
        "How is your sector preparing for this level of structural transformation? Let's discuss below."
      );
      break;
    }

    // ==========================================
    // STYLE 3: STORYTELLING (Narrative Progression)
    // ==========================================
    case "storytelling": {
      sections.push(
        `${getHookPrefix()}**Behind every major milestone is a story of how strategy meets execution on the ground.**\n\n${cleanHook}`
      );

      if (cleanContext) {
        sections.push(`**Here's what happened:**\n\n${cleanContext}`);
      }

      if (cleanTakeaways.length > 0) {
        const bulletList = cleanTakeaways
          .map((t, idx) => `${getBulletMarker(idx, "storytelling")} ${t}`)
          .join("\n");
        sections.push(
          `${getSectionHeaderEmoji("shift")}**Then came the operational shift:**\n\nTo move from policy to real-world impact, key mechanisms were put in motion:\n\n${bulletList}`
        );
      }

      if (cleanWhy) {
        sections.push(
          `${getSectionHeaderEmoji("impact")}**And this is where it becomes truly important:**\n\n${cleanWhy}`
        );
      }

      sections.push(
        "Every successful transformation begins with a clear commitment and compounds through execution.\n\nWhat part of this transformation resonates most with your journey?"
      );
      break;
    }

    // ==========================================
    // STYLE 4: GOV / PUBLIC (Public Sector & Civic Governance)
    // ==========================================
    case "government": {
      sections.push(
        `${getSectionHeaderEmoji("gov")}**PUBLIC POLICY & GOVERNANCE BRIEFING**\n\n${cleanHook}`
      );

      if (cleanContext) {
        sections.push(`**Executive Summary:**\n${cleanContext}`);
      }

      if (cleanTakeaways.length > 0) {
        const bulletList = cleanTakeaways
          .map((t, idx) => `${getBulletMarker(idx, "government")} ${t}`)
          .join("\n");
        sections.push(`**Key Developments & Provisions:**\n${bulletList}`);
      }

      if (cleanWhy) {
        sections.push(
          `**Public & Policy Implications:**\n${cleanWhy} This framework reinforces institutional accountability, standardized delivery, and citizen-centric outcomes.`
        );
      }

      sections.push(
        "**What This Means for Stakeholders:**\nPublic administrators, industry partners, and community stakeholders should review the implementation guidelines and coordinate through regional departmental channels."
      );

      sections.push(
        "Please share this briefing with teams and stakeholders implementing these frameworks."
      );
      break;
    }

    // ==========================================
    // STYLE 1: PROFESSIONAL (Clean Conventional Hierarchy)
    // ==========================================
    case "professional":
    default: {
      const profHook = cleanHook ? `${getHookPrefix()}${cleanHook}` : "";
      if (profHook) sections.push(profHook);

      if (cleanContext) {
        sections.push(cleanContext);
      }

      if (cleanTakeaways.length > 0) {
        const bulletList = cleanTakeaways
          .map((t, idx) => `${getBulletMarker(idx, "professional")} ${t}`)
          .join("\n");
        sections.push(`**Key Takeaways:**\n${bulletList}`);
      }

      if (cleanWhy) {
        sections.push(`**Why It Matters:**\n${cleanWhy}`);
      }

      sections.push(
        "**Next Steps & Implementation:**\nConsistent execution, stakeholder alignment, and transparent feedback loops will be essential to realizing the full potential of this initiative."
      );

      sections.push(
        parsed.closingCta ||
          "What are your key takeaways from these developments?"
      );
      break;
    }
  }

  // Deduplicate and format hashtags
  if (parsed.hashtags.length > 0) {
    const uniqueTags = Array.from(
      new Set(parsed.hashtags.map((t) => (t.startsWith("#") ? t : `#${t}`)))
    );
    sections.push(uniqueTags.slice(0, 6).join(" "));
  } else {
    sections.push(
      "#Innovation #DigitalTransformation #Leadership #PublicPolicy #Technology"
    );
  }

  return sections.join("\n\n");
}

/**
 * Computes metrics for LinkedIn post (word count, char count, estimated reading time, hashtag count).
 */
export function getLinkedInPostStats(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = content.length;
  const hashtags = (content.match(/#[A-Za-z0-9_]+/g) || []).length;
  const readingTimeSec = Math.max(15, Math.round((wordCount / 200) * 60));

  return {
    wordCount,
    charCount,
    hashtags,
    readingTimeSec,
    formattedReadingTime: `${readingTimeSec} sec read`,
  };
}

