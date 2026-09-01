import {
  PresentationDeckData,
  SlideData,
  SlideLayoutType,
  MetricItem,
  TimelineItem,
  ProcessStepItem,
  ComparisonData,
  RecommendationItem,
} from "../../types/presentation";

const DEFAULT_THEME = {
  primaryColor: "1E3A8A", // Deep Navy
  secondaryColor: "0D9488", // Teal
  accentColor: "4338CA", // Indigo
  backgroundColor: "F8FAFC", // Slate 50
  cardBackground: "FFFFFF", // Pure White
  textColor: "0F172A", // Slate 900
  mutedTextColor: "64748B", // Slate 500
};

/**
 * Parses numeric and currency values to extract structured MetricItems.
 */
function extractMetricsFromBullets(bullets: string[]): MetricItem[] {
  const metrics: MetricItem[] = [];
  const metricRegex = /(₹[\d,\.]+\s*(?:Crore|Cr|Lakh|L|Billion|Million)?|[\d\.]+\s*(?:Crore|Cr|Lakh|%|Days|Hours|Farmers|Zones|Agro-Climatic Zones))/i;

  for (const bullet of bullets) {
    const match = bullet.match(metricRegex);
    if (match) {
      // Split bullet into key/label and value
      const parts = bullet.split(/:\s*|\s*\|\s*/);
      if (parts.length >= 2) {
        metrics.push({
          label: parts[0].replace(/\*\*/g, "").trim(),
          value: parts[1].replace(/\*\*/g, "").trim(),
          subtext: parts.slice(2).join(" | ").replace(/\*\*/g, "").trim() || undefined,
        });
      } else {
        metrics.push({
          value: match[0].trim(),
          label: bullet.replace(match[0], "").replace(/\*\*/g, "").replace(/^[-:\s]+|[-:\s]+$/g, "").trim() || "Key Metric",
        });
      }
    }
  }
  return metrics;
}

/**
 * Detects if bullets contain chronological milestones.
 */
function extractTimelineFromBullets(bullets: string[]): TimelineItem[] {
  const items: TimelineItem[] = [];
  const dateRegex = /^(?:(?:\*\*|\b)(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Q[1-4]|Phase\s*\d|\d{1,2}\s+[A-Za-z]+|\d{4})[^\*:]*)(?:\*\*|:|\s*[-–—]\s*)/i;

  for (const bullet of bullets) {
    const match = bullet.match(dateRegex);
    if (match) {
      const datePart = match[0].replace(/[\*:\-–—]/g, "").trim();
      const rest = bullet.slice(match[0].length).replace(/\*\*/g, "").trim();
      items.push({
        dateOrPhase: datePart,
        title: rest.split(/[:\.]/)[0].trim() || rest,
        description: rest.includes(":") ? rest.split(":").slice(1).join(":").trim() : undefined,
        status: "active",
      });
    } else if (bullet.includes(":") && /\d{4}|Phase|Month/i.test(bullet)) {
      const [datePart, ...restParts] = bullet.split(":");
      items.push({
        dateOrPhase: datePart.replace(/\*\*/g, "").trim(),
        title: restParts.join(":").replace(/\*\*/g, "").trim(),
        status: "active",
      });
    }
  }
  return items;
}

/**
 * Detects if bullets contain a before/after or paradigm shift comparison.
 */
function extractComparisonFromBullets(bullets: string[]): ComparisonData | null {
  const leftItems: string[] = [];
  const rightItems: string[] = [];
  let leftHeading = "Current State / Baseline";
  let rightHeading = "Target State / Innovation";

  let hasComparison = false;

  for (const bullet of bullets) {
    const clean = bullet.replace(/\*\*/g, "").trim();
    if (/legacy|current|before|baseline|traditional|manual/i.test(clean)) {
      hasComparison = true;
      if (clean.includes(":")) {
        const parts = clean.split(":");
        leftHeading = parts[0].trim();
        leftItems.push(parts.slice(1).join(":").trim());
      } else {
        leftItems.push(clean);
      }
    } else if (/innovation|proposed|target|nidci|future|automated|after/i.test(clean)) {
      hasComparison = true;
      if (clean.includes(":")) {
        const parts = clean.split(":");
        rightHeading = parts[0].trim();
        rightItems.push(parts.slice(1).join(":").trim());
      } else {
        rightItems.push(clean);
      }
    } else if (/disbursement|benefit|settlement|outcome/i.test(clean)) {
      rightItems.push(clean);
    } else {
      // Balance into right column
      rightItems.push(clean);
    }
  }

  if (hasComparison && (leftItems.length > 0 || rightItems.length > 0)) {
    return {
      leftHeading: leftHeading || "Legacy Process",
      leftItems: leftItems.length > 0 ? leftItems : ["Manual assessment", "Multi-stage physical verification"],
      rightHeading: rightHeading || "Transformation Blueprint",
      rightItems: rightItems.length > 0 ? rightItems : ["Automated processing", "Real-time verification"],
    };
  }

  return null;
}

/**
 * Detects step-by-step processes.
 */
function extractProcessSteps(bullets: string[]): ProcessStepItem[] {
  const steps: ProcessStepItem[] = [];
  let stepCounter = 1;

  for (const bullet of bullets) {
    const clean = bullet.replace(/\*\*/g, "").trim();
    const stepMatch = clean.match(/^(?:Step\s*(\d+)|Phase\s*(\d+)|\b(\d+)[\.\)])\s*[:\-–—]?\s*(.*)/i);

    if (stepMatch) {
      const num = parseInt(stepMatch[1] || stepMatch[2] || stepMatch[3] || String(stepCounter), 10);
      const content = stepMatch[4] || clean;
      const parts = content.split(":");
      steps.push({
        stepNumber: num,
        title: parts[0].trim(),
        description: parts.slice(1).join(":").trim() || undefined,
      });
      stepCounter = num + 1;
    }
  }
  return steps;
}

/**
 * Infers layout type for a slide based on content semantics.
 */
function inferLayoutType(
  slideNumber: number,
  title: string,
  bullets: string[],
  comparison: ComparisonData | null,
  timeline: TimelineItem[],
  metrics: MetricItem[],
  processSteps: ProcessStepItem[]
): SlideLayoutType {
  const titleLower = title.toLowerCase();

  // 1. Title / Hero slide
  if (
    slideNumber === 1 ||
    titleLower.includes("title & executive vision") ||
    titleLower.includes("executive vision") ||
    titleLower.includes("title slide") ||
    (slideNumber === 1 && bullets.some((b) => /title:|subtitle:/i.test(b)))
  ) {
    return "title_hero";
  }

  // 2. Timeline / Roadmap
  if (
    timeline.length >= 2 ||
    titleLower.includes("roadmap") ||
    titleLower.includes("timeline") ||
    titleLower.includes("key dates") ||
    titleLower.includes("milestone")
  ) {
    return "timeline_roadmap";
  }

  // 3. Comparison / Paradigm shift
  if (
    comparison ||
    titleLower.includes("paradigm shift") ||
    titleLower.includes("comparison") ||
    titleLower.includes("before vs after") ||
    titleLower.includes("vs")
  ) {
    return "two_column_comparison";
  }

  // 4. Process / Workflow
  if (
    processSteps.length >= 2 ||
    titleLower.includes("workflow") ||
    titleLower.includes("process") ||
    titleLower.includes("stages") ||
    titleLower.includes("steps")
  ) {
    return "process_workflow";
  }

  // 5. Key Metrics
  if (
    metrics.length >= 2 ||
    titleLower.includes("metrics") ||
    titleLower.includes("financial") ||
    titleLower.includes("budget") ||
    titleLower.includes("numbers") ||
    titleLower.includes("beneficiary terms")
  ) {
    return "key_metrics";
  }

  // 6. Recommendations
  if (
    titleLower.includes("recommendation") ||
    titleLower.includes("action plan") ||
    titleLower.includes("next steps")
  ) {
    return "recommendations";
  }

  // 7. Executive summary
  if (titleLower.includes("executive summary") || titleLower.includes("takeaways")) {
    return "executive_summary";
  }

  return "standard_cards";
}

/**
 * Parses markdown presentation text into structured slides.
 */
function parseMarkdownToSlides(markdown: string): { deckTitle: string; slides: SlideData[] } {
  const lines = markdown.split("\n");
  let deckTitle = "TransformAI Presentation Deck";
  const rawSlides: Array<{
    title: string;
    bullets: string[];
    visualConcept?: string;
    speakerNotes?: string;
  }> = [];

  let currentSlide: {
    title: string;
    bullets: string[];
    visualConcept?: string;
    speakerNotes?: string;
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Catch # Header as Deck Title
    if (line.startsWith("# ") && !line.startsWith("## ")) {
      deckTitle = line.replace(/^#\s*(?:Presentation\s*(?:Outline|Deck)?:\s*)?/i, "").trim();
      continue;
    }

    // Catch ## Slide as New Slide
    if (line.startsWith("## ")) {
      if (currentSlide) {
        rawSlides.push(currentSlide);
      }
      const slideTitle = line.replace(/^##\s*(?:Slide\s*\d+\s*:\s*)?/i, "").trim();
      currentSlide = {
        title: slideTitle,
        bullets: [],
      };
      continue;
    }

    if (!currentSlide) {
      // Auto-start slide 1 if bullets appear before header
      if (line.startsWith("- ") || line.startsWith("* ")) {
        currentSlide = {
          title: "Executive Overview",
          bullets: [],
        };
      } else {
        continue;
      }
    }

    // Parse speaker notes
    if (line.startsWith(">") || line.toLowerCase().includes("speaker notes:")) {
      const notes = line
        .replace(/^>\s*/, "")
        .replace(/\*\*Speaker Notes:\*\*/i, "")
        .replace(/Speaker Notes:/i, "")
        .trim();
      currentSlide.speakerNotes = (currentSlide.speakerNotes ? currentSlide.speakerNotes + " " : "") + notes;
      continue;
    }

    // Parse visual concept
    if (line.toLowerCase().includes("visual concept:") || line.toLowerCase().includes("visual direction:")) {
      const visual = line
        .replace(/\*Visual Concept:\*/i, "")
        .replace(/Visual Concept:/i, "")
        .replace(/\*Visual Direction:\*/i, "")
        .replace(/Visual Direction:/i, "")
        .replace(/\*/g, "")
        .trim();
      currentSlide.visualConcept = visual;
      continue;
    }

    // Parse bullet points
    if (line.startsWith("- ") || line.startsWith("* ") || /^\d+\.\s+/.test(line)) {
      const cleanBullet = line.replace(/^[-*]\s+|\d+\.\s+/, "").trim();
      if (cleanBullet) {
        currentSlide.bullets.push(cleanBullet);
      }
    }
  }

  if (currentSlide) {
    rawSlides.push(currentSlide);
  }

  // Convert raw slides to full structured SlideData
  const structuredSlides: SlideData[] = rawSlides.map((raw, idx) => {
    const slideNumber = idx + 1;
    const bullets = raw.bullets;
    const comparison = extractComparisonFromBullets(bullets);
    const timeline = extractTimelineFromBullets(bullets);
    const metrics = extractMetricsFromBullets(bullets);
    const processSteps = extractProcessSteps(bullets);

    const layoutType = inferLayoutType(
      slideNumber,
      raw.title,
      bullets,
      comparison,
      timeline,
      metrics,
      processSteps
    );

    // Extract title & subtitle if slide 1 is title_hero
    let slideTitle = raw.title;
    let subtitle: string | undefined;

    if (layoutType === "title_hero") {
      for (const b of bullets) {
        if (/^(\*\*Title:\*\*|Title:)/i.test(b)) {
          slideTitle = b.replace(/^(\*\*Title:\*\*|Title:)\s*/i, "").replace(/\*\*/g, "").trim();
        } else if (/^(\*\*Subtitle:\*\*|Subtitle:)/i.test(b)) {
          subtitle = b.replace(/^(\*\*Subtitle:\*\*|Subtitle:)\s*/i, "").replace(/\*\*/g, "").trim();
        }
      }
    }

    return {
      slideNumber,
      title: slideTitle,
      subtitle,
      categoryTag: getCategoryTag(layoutType, slideNumber, raw.title),
      layoutType,
      bulletPoints: bullets,
      metrics: metrics.length > 0 ? metrics : undefined,
      comparison: comparison || undefined,
      timeline: timeline.length > 0 ? timeline : undefined,
      processSteps: processSteps.length > 0 ? processSteps : undefined,
      visualConcept: raw.visualConcept,
      speakerNotes: raw.speakerNotes,
    };
  });

  return {
    deckTitle,
    slides: structuredSlides,
  };
}

function getCategoryTag(layoutType: SlideLayoutType, slideNumber: number, title: string): string {
  switch (layoutType) {
    case "title_hero":
      return "EXECUTIVE VISION";
    case "two_column_comparison":
      return "PARADIGM SHIFT";
    case "key_metrics":
      return "FINANCIAL & OPERATIONAL TARGETS";
    case "timeline_roadmap":
      return "STRATEGIC ROADMAP";
    case "process_workflow":
      return "OPERATIONAL WORKFLOW";
    case "recommendations":
      return "ACTIONABLE RECOMMENDATIONS";
    case "executive_summary":
      return "EXECUTIVE SUMMARY";
    default:
      return `SECTION ${slideNumber}`;
  }
}

/**
 * Normalizes any presentation deliverable (structured JSON or markdown content)
 * into a robust, deterministic PresentationDeckData model.
 */
export function normalizePresentationData(
  structuredData?: any,
  markdownContent?: string,
  fallbackTitle = "Presentation Deck",
  projectName?: string
): PresentationDeckData {
  // Case A: Structured data is already rich and contains slides
  if (structuredData && Array.isArray(structuredData.slides) && structuredData.slides.length > 0) {
    const deckTitle = structuredData.title || fallbackTitle || projectName || "Strategic Presentation";
    const slides: SlideData[] = structuredData.slides.map((s: any, idx: number) => {
      const slideNumber = s.slide_number || idx + 1;
      const title = s.slide_title || s.title || `Slide ${slideNumber}`;
      const bullets = Array.isArray(s.bullet_points) ? s.bullet_points : [];
      const comparison = extractComparisonFromBullets(bullets);
      const timeline = extractTimelineFromBullets(bullets);
      const metrics = extractMetricsFromBullets(bullets);
      const processSteps = extractProcessSteps(bullets);

      const layoutType = (s.layout_type as SlideLayoutType) || inferLayoutType(
        slideNumber,
        title,
        bullets,
        comparison,
        timeline,
        metrics,
        processSteps
      );

      return {
        slideNumber,
        title,
        subtitle: s.subtitle,
        categoryTag: getCategoryTag(layoutType, slideNumber, title),
        layoutType,
        bulletPoints: bullets,
        metrics: metrics.length > 0 ? metrics : undefined,
        comparison: comparison || undefined,
        timeline: timeline.length > 0 ? timeline : undefined,
        processSteps: processSteps.length > 0 ? processSteps : undefined,
        visualConcept: s.visual_concept,
        speakerNotes: s.speaker_notes,
      };
    });

    return {
      deckTitle,
      subtitle: structuredData.subtitle,
      targetAudience: structuredData.target_audience || structuredData.targetAudience,
      totalSlides: slides.length,
      theme: DEFAULT_THEME,
      slides,
    };
  }

  // Case B: Markdown content provided (e.g. from Showcase Demo or plain text editor)
  if (markdownContent && markdownContent.trim().length > 0) {
    const parsed = parseMarkdownToSlides(markdownContent);
    return {
      deckTitle: parsed.deckTitle || fallbackTitle,
      totalSlides: parsed.slides.length,
      theme: DEFAULT_THEME,
      slides: parsed.slides,
    };
  }

  // Case C: Fallback minimal deck
  return {
    deckTitle: fallbackTitle,
    totalSlides: 1,
    theme: DEFAULT_THEME,
    slides: [
      {
        slideNumber: 1,
        title: fallbackTitle,
        categoryTag: "EXECUTIVE BRIEF",
        layoutType: "title_hero",
        bulletPoints: ["Comprehensive content synthesis ready for executive briefing."],
      },
    ],
  };
}
