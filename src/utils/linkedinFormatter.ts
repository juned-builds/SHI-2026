/**
 * Deterministic Client-Side LinkedIn Post Formatter and Style Engine for TransformAI.
 * Formats, restructures, and enhances LinkedIn deliverables without calling external APIs.
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

/**
 * Parses raw text/markdown into structured LinkedIn sections.
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
  const nonHashtagLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("#") && !line.startsWith("##") && !line.startsWith("###")) {
      const tags = line.match(/#[A-Za-z0-9_]+/g);
      if (tags && tags.length > 0) {
        hashtags.push(...tags);
        continue;
      }
    }
    nonHashtagLines.push(line);
  }

  const cleanedText = nonHashtagLines.join("\n").trim();
  const paragraphs = cleanedText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  let hook = paragraphs[0] || "";
  let context = paragraphs.length > 1 ? paragraphs[1] : "";
  const takeaways: string[] = [];
  let whyItMatters = "";
  let closingCta = "";

  // Extract bullets from text if present
  for (const p of paragraphs) {
    const pLines = p.split("\n");
    for (const pl of pLines) {
      if (
        pl.startsWith("•") ||
        pl.startsWith("-") ||
        pl.startsWith("*") ||
        pl.startsWith("🔹") ||
        pl.startsWith("✅") ||
        pl.startsWith("📌") ||
        pl.startsWith("1.") ||
        pl.startsWith("2.") ||
        pl.startsWith("3.") ||
        pl.startsWith("4.")
      ) {
        const cleanBullet = pl.replace(/^([•\-\*🔹✅📌\d\.]+\s*)/, "").trim();
        if (cleanBullet && !takeaways.includes(cleanBullet)) {
          takeaways.push(cleanBullet);
        }
      }
    }
  }

  // Look for "Why this matters" or closing
  for (let i = 2; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    if (p.toLowerCase().includes("why this matters") || p.toLowerCase().includes("impact:")) {
      whyItMatters = p.replace(/^(why this matters[:\s]*|impact[:\s]*)/i, "").trim();
    } else if (p.toLowerCase().includes("what do you think") || p.toLowerCase().includes("register") || p.toLowerCase().includes("contact") || p.toLowerCase().includes("call")) {
      closingCta = p;
    } else if (!takeaways.some((t) => p.includes(t)) && p !== hook && p !== context) {
      if (!whyItMatters) {
        whyItMatters = p;
      } else if (!closingCta) {
        closingCta = p;
      }
    }
  }

  // Fallback defaults if extraction missed items
  if (takeaways.length === 0 && paragraphs.length > 2) {
    takeaways.push(paragraphs[2]);
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
 */
export function formatLinkedInPost(
  rawText: string,
  options: LinkedInFormatOptions = {}
): string {
  const { style = "professional", emojiDensity = "balanced" } = options;
  const parsed = parseLinkedInPost(rawText);

  // Bullet marker based on emoji density
  const getBulletMarker = (index: number): string => {
    if (emojiDensity === "none") return "•";
    if (emojiDensity === "expressive") {
      const markers = ["🚀", "💡", "⚡", "📊", "✅", "🌱", "🎯"];
      return markers[index % markers.length];
    }
    // Balanced
    const markers = ["🔹", "📌", "📊", "⚡", "💡", "🤝"];
    return markers[index % markers.length];
  };

  const getHookPrefix = (): string => {
    if (emojiDensity === "none") return "";
    switch (style) {
      case "government":
        return emojiDensity === "expressive" ? "🇮🇳 " : "🏛️ ";
      case "thought_leadership":
        return emojiDensity === "expressive" ? "💡 " : "🔍 ";
      case "storytelling":
        return emojiDensity === "expressive" ? "🌱 " : "📖 ";
      case "executive":
        return emojiDensity === "expressive" ? "📈 " : "🎯 ";
      case "professional":
      default:
        return emojiDensity === "expressive" ? "📢 " : "🚀 ";
    }
  };

  // Strip existing emojis from hook if density is none
  let cleanHook = parsed.hook;
  if (emojiDensity === "none") {
    cleanHook = cleanHook.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim();
  }

  const parts: string[] = [];

  // 1. Hook
  if (cleanHook) {
    const formattedHook = cleanHook.startsWith(getHookPrefix())
      ? cleanHook
      : `${getHookPrefix()}${cleanHook.replace(/^[•\-\*📢🚀💡🏛️🔍📖🎯🌱\s]+/, "")}`;
    parts.push(formattedHook.trim());
  }

  // 2. Context
  if (parsed.context) {
    let cleanContext = parsed.context;
    if (emojiDensity === "none") {
      cleanContext = cleanContext.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim();
    }
    parts.push(cleanContext);
  }

  // 3. Key Takeaways Section
  if (parsed.takeaways.length > 0) {
    const takeawayHeader =
      style === "executive"
        ? "Key Strategic Takeaways:"
        : style === "thought_leadership"
        ? "Core Insights:"
        : style === "government"
        ? "Key Operational Guidelines:"
        : "Key Takeaways:";

    const formattedBullets = parsed.takeaways.map((t, idx) => {
      let cleanText = t.replace(/^[•\-\*🔹📌📊⚡💡🤝✅🚀\s]+/, "").trim();
      if (emojiDensity === "none") {
        cleanText = cleanText.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim();
      }
      return `${getBulletMarker(idx)} ${cleanText}`;
    });

    parts.push(`${takeawayHeader}\n${formattedBullets.join("\n")}`);
  }

  // 4. Why This Matters / Impact
  if (parsed.whyItMatters) {
    let cleanWhy = parsed.whyItMatters;
    if (emojiDensity === "none") {
      cleanWhy = cleanWhy.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim();
    }

    const whyHeader =
      style === "executive"
        ? "Strategic Impact:"
        : style === "thought_leadership"
        ? "Why This Matters:"
        : style === "government"
        ? "Citizen & Sector Impact:"
        : "Why this matters:";

    if (!cleanWhy.toLowerCase().startsWith("why") && !cleanWhy.toLowerCase().startsWith("strategic")) {
      parts.push(`${whyHeader}\n${cleanWhy}`);
    } else {
      parts.push(cleanWhy);
    }
  }

  // 5. Closing / CTA
  if (parsed.closingCta) {
    let cleanCta = parsed.closingCta;
    if (emojiDensity === "none") {
      cleanCta = cleanCta.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim();
    }
    parts.push(cleanCta);
  } else {
    // Contextual clean CTA
    const defaultCta =
      style === "thought_leadership"
        ? "What are your thoughts on this approach? Let's discuss below."
        : style === "executive"
        ? "How is your organization addressing similar workflow transformations?"
        : style === "government"
        ? "Share this update with teams and stakeholders implementing these frameworks."
        : "What are your key takeaways from these developments?";
    parts.push(defaultCta);
  }

  // 6. Hashtags
  if (parsed.hashtags.length > 0) {
    // Deduplicate and format
    const uniqueTags = Array.from(new Set(parsed.hashtags.map((t) => (t.startsWith("#") ? t : `#${t}`))));
    parts.push(uniqueTags.slice(0, 6).join(" "));
  } else {
    parts.push("#Innovation #DigitalTransformation #Leadership #PublicPolicy #Technology");
  }

  return parts.join("\n\n");
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
