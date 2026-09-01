import pptxgen from "pptxgenjs";
import {
  PresentationDeckData,
  SlideData,
  MetricItem,
  TimelineItem,
  ComparisonData,
} from "../../types/presentation";
import { sanitizeFilename } from "../../utils/exportHelpers";

export interface PPTXExportResult {
  success: boolean;
  filename: string;
  slideCount: number;
  error?: string;
}

/**
 * Deterministic PowerPoint (.pptx) Generator for TransformAI.
 * Generates genuine 16:9 widescreen PowerPoint slides with professional typography,
 * shape geometry, metric callouts, timeline milestones, comparison grids, and presenter notes.
 * 
 * 100% Client-side. ZERO Gemini / API quota usage.
 */
export async function generatePowerPointPresentation(
  deckData: PresentationDeckData,
  projectName?: string
): Promise<PPTXExportResult> {
  try {
    const pptx = new pptxgen();

    // Set 16:9 Widescreen Layout (Standard width: 10in, height: 5.625in)
    pptx.layout = "LAYOUT_16x9";
    pptx.title = deckData.deckTitle;
    pptx.subject = "TransformAI Content Transformation Deliverable";
    pptx.author = "TransformAI";
    pptx.company = "TransformAI";

    const totalSlides = deckData.slides.length;

    // Render each slide deterministically based on inferred layout
    for (let i = 0; i < deckData.slides.length; i++) {
      const slideData = deckData.slides[i];
      const slide = pptx.addSlide();

      // Set clean background
      slide.background = { color: deckData.theme.backgroundColor || "F8FAFC" };

      // Render slide content based on layout type
      switch (slideData.layoutType) {
        case "title_hero":
          renderTitleHeroSlide(pptx, slide, slideData, deckData, i + 1, totalSlides);
          break;
        case "two_column_comparison":
          renderTwoColumnComparisonSlide(pptx, slide, slideData, deckData, i + 1, totalSlides);
          break;
        case "key_metrics":
          renderKeyMetricsSlide(pptx, slide, slideData, deckData, i + 1, totalSlides);
          break;
        case "timeline_roadmap":
          renderTimelineRoadmapSlide(pptx, slide, slideData, deckData, i + 1, totalSlides);
          break;
        case "process_workflow":
          renderProcessWorkflowSlide(pptx, slide, slideData, deckData, i + 1, totalSlides);
          break;
        case "executive_summary":
        case "recommendations":
        case "standard_cards":
        default:
          renderStandardCardsSlide(pptx, slide, slideData, deckData, i + 1, totalSlides);
          break;
      }

      // Add Presenter Speaker Notes if available
      if (slideData.speakerNotes) {
        slide.addNotes(slideData.speakerNotes);
      }
    }

    // Build sanitized filename
    const safeProject = sanitizeFilename(projectName || deckData.deckTitle || "Presentation");
    const filename = `TransformAI_${safeProject}_Presentation.pptx`;

    // Trigger browser download via pptxgenjs
    await pptx.writeFile({ fileName: filename });

    return {
      success: true,
      filename,
      slideCount: totalSlides,
    };
  } catch (err: any) {
    console.error("[PPTX Renderer] Export failed:", err);
    return {
      success: false,
      filename: "presentation.pptx",
      slideCount: 0,
      error: err?.message || "Failed to generate PowerPoint presentation file.",
    };
  }
}

// ==========================================
// 1. STANDARD HEADER & FOOTER HELPERS
// ==========================================

function addSlideHeader(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  slideData: SlideData,
  deckData: PresentationDeckData
) {
  // Category Pill Badge
  const categoryText = slideData.categoryTag || `SECTION ${slideData.slideNumber}`;
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 0.35,
    w: 2.8,
    h: 0.26,
    fill: { color: "EEF2FF" },
    line: { color: "C7D2FE", width: 0.75 },
    rectRadius: 0.04,
  });

  slide.addText(categoryText.toUpperCase(), {
    x: 0.6,
    y: 0.35,
    w: 2.8,
    h: 0.26,
    fontSize: 8,
    bold: true,
    color: "4338CA",
    align: "center",
    valign: "middle",
    fontFace: "Calibri",
  });

  // Slide Main Title
  slide.addText(slideData.title, {
    x: 0.6,
    y: 0.65,
    w: 8.8,
    h: 0.45,
    fontSize: 17,
    bold: true,
    color: "0F172A",
    fontFace: "Calibri",
    valign: "top",
  });

  // Header Divider
  slide.addShape(pptx.ShapeType.line, {
    x: 0.6,
    y: 1.15,
    w: 8.8,
    h: 0,
    line: { color: "E2E8F0", width: 1 },
  });
}

function addSlideFooter(
  slide: pptxgen.Slide,
  slideNumber: number,
  totalSlides: number,
  deckData: PresentationDeckData
) {
  // Footer text
  slide.addText(`TransformAI • ${deckData.deckTitle.slice(0, 45)}`, {
    x: 0.6,
    y: 5.15,
    w: 6.0,
    h: 0.3,
    fontSize: 8,
    color: "94A3B8",
    fontFace: "Calibri",
    valign: "middle",
  });

  // Slide Number
  slide.addText(`Slide ${slideNumber} of ${totalSlides}`, {
    x: 7.0,
    y: 5.15,
    w: 2.4,
    h: 0.3,
    fontSize: 8,
    color: "94A3B8",
    align: "right",
    fontFace: "Calibri",
    valign: "middle",
  });
}

// ==========================================
// 2. SLIDE LAYOUT RENDERERS
// ==========================================

/**
 * Layout A: Title / Hero Slide (Executive Presentation Cover)
 */
function renderTitleHeroSlide(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  slideData: SlideData,
  deckData: PresentationDeckData,
  slideNumber: number,
  totalSlides: number
) {
  // Deep Navy Premium Hero Card
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 0.5,
    w: 8.8,
    h: 3.1,
    fill: { color: "1E3A8A" }, // Deep Navy
    line: { color: "172554", width: 1 },
    rectRadius: 0.08,
  });

  // Inner Accent Top Bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.6,
    y: 0.5,
    w: 8.8,
    h: 0.08,
    fill: { color: "0D9488" }, // Teal accent
  });

  // Initiative Tag
  slide.addText("TRANSFORMAI EXECUTIVE BLUEPRINT", {
    x: 1.0,
    y: 0.85,
    w: 8.0,
    h: 0.25,
    fontSize: 9,
    bold: true,
    color: "93C5FD",
    fontFace: "Calibri",
  });

  // Main Deck Title
  slide.addText(slideData.title, {
    x: 1.0,
    y: 1.15,
    w: 8.0,
    h: 1.1,
    fontSize: 23,
    bold: true,
    color: "FFFFFF",
    fontFace: "Calibri",
    valign: "top",
  });

  // Subtitle
  const subtitle =
    slideData.subtitle ||
    deckData.subtitle ||
    "Strategic Implementation & Institutional Framework";
  slide.addText(subtitle, {
    x: 1.0,
    y: 2.3,
    w: 8.0,
    h: 0.5,
    fontSize: 12.5,
    color: "E2E8F0",
    fontFace: "Calibri",
    valign: "top",
  });

  // Bottom Stats & Overview Cards (2 or 3 cards)
  const bullets = slideData.bulletPoints.filter(
    (b) => !/^(\*\*Title:\*\*|\*\*Subtitle:\*\*|Title:|Subtitle:)/i.test(b)
  );

  const cardCount = Math.min(bullets.length > 0 ? bullets.length : 3, 3);
  const cardW = 2.75;
  const gap = 0.27;
  const startX = 0.6;

  for (let i = 0; i < cardCount; i++) {
    const xPos = startX + i * (cardW + gap);
    const text = bullets[i] || `Strategic Pillar ${i + 1}`;

    slide.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: 3.75,
      w: cardW,
      h: 1.25,
      fill: { color: "FFFFFF" },
      line: { color: "CBD5E1", width: 1 },
      rectRadius: 0.06,
    });

    // Top Accent line
    slide.addShape(pptx.ShapeType.rect, {
      x: xPos,
      y: 3.75,
      w: cardW,
      h: 0.05,
      fill: { color: i === 0 ? "4338CA" : i === 1 ? "0D9488" : "D97706" },
    });

    slide.addText(text.replace(/\*\*/g, ""), {
      x: xPos + 0.15,
      y: 3.9,
      w: cardW - 0.3,
      h: 1.0,
      fontSize: 10,
      bold: i === 0,
      color: "1E293B",
      fontFace: "Calibri",
      valign: "middle",
    });
  }

  addSlideFooter(slide, slideNumber, totalSlides, deckData);
}

/**
 * Layout B: Two-Column Comparison (Paradigm Shift: Legacy vs Innovation)
 */
function renderTwoColumnComparisonSlide(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  slideData: SlideData,
  deckData: PresentationDeckData,
  slideNumber: number,
  totalSlides: number
) {
  addSlideHeader(pptx, slide, slideData, deckData);

  const colW = 4.25;
  const colH = 3.65;
  const colY = 1.35;

  const comparison = slideData.comparison || {
    leftHeading: "Legacy Process",
    leftItems: slideData.bulletPoints.slice(0, 2),
    rightHeading: "NIDCI Innovation",
    rightItems: slideData.bulletPoints.slice(2),
  };

  // 1. Left Card: Baseline / Legacy
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: colY,
    w: colW,
    h: colH,
    fill: { color: "FFFFFF" },
    line: { color: "E2E8F0", width: 1 },
    rectRadius: 0.06,
  });

  // Left Card Header Bar
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: colY + 0.2,
    w: 3.85,
    h: 0.45,
    fill: { color: "F1F5F9" },
    line: { color: "CBD5E1", width: 0.5 },
    rectRadius: 0.04,
  });

  slide.addText(comparison.leftHeading.toUpperCase(), {
    x: 0.9,
    y: colY + 0.2,
    w: 3.65,
    h: 0.45,
    fontSize: 10,
    bold: true,
    color: "475569",
    fontFace: "Calibri",
    valign: "middle",
  });

  // Left Items
  const leftTextItems = comparison.leftItems.map((item) => ({
    text: `•  ${item.replace(/\*\*/g, "")}\n\n`,
    options: { fontSize: 10.5, color: "334155", fontFace: "Calibri" },
  }));

  slide.addText(leftTextItems, {
    x: 0.85,
    y: colY + 0.8,
    w: 3.75,
    h: colH - 1.0,
    valign: "top",
  });

  // 2. Right Card: Target / Innovation (Emerald / Indigo Accent)
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.15,
    y: colY,
    w: colW,
    h: colH,
    fill: { color: "F0FDF4" }, // Very soft emerald
    line: { color: "86EFAC", width: 1.25 },
    rectRadius: 0.06,
  });

  // Right Card Header Bar
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.35,
    y: colY + 0.2,
    w: 3.85,
    h: 0.45,
    fill: { color: "DCFCE7" },
    line: { color: "86EFAC", width: 0.5 },
    rectRadius: 0.04,
  });

  slide.addText(`✓  ${comparison.rightHeading.toUpperCase()}`, {
    x: 5.45,
    y: colY + 0.2,
    w: 3.65,
    h: 0.45,
    fontSize: 10,
    bold: true,
    color: "166534",
    fontFace: "Calibri",
    valign: "middle",
  });

  // Right Items
  const rightTextItems = comparison.rightItems.map((item) => ({
    text: `✓  ${item.replace(/\*\*/g, "")}\n\n`,
    options: { fontSize: 10.5, color: "14532D", bold: true, fontFace: "Calibri" },
  }));

  slide.addText(rightTextItems, {
    x: 5.4,
    y: colY + 0.8,
    w: 3.75,
    h: colH - 1.0,
    valign: "top",
  });

  addSlideFooter(slide, slideNumber, totalSlides, deckData);
}

/**
 * Layout C: Key Metrics / Stat Cards
 */
function renderKeyMetricsSlide(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  slideData: SlideData,
  deckData: PresentationDeckData,
  slideNumber: number,
  totalSlides: number
) {
  addSlideHeader(pptx, slide, slideData, deckData);

  const metrics = slideData.metrics || [];
  const bullets = slideData.bulletPoints;

  // Use either structured metrics or convert bullets into 3 prominent cards
  const displayItems: { label: string; value: string; subtext?: string }[] =
    metrics.length >= 2
      ? metrics
      : bullets.map((b) => {
          const parts = b.split(/:\s*/);
          return {
            label: parts[0]?.replace(/\*\*/g, "") || "Metric",
            value: parts[1]?.replace(/\*\*/g, "") || b.replace(/\*\*/g, ""),
            subtext: parts.length > 2 ? parts.slice(2).join(" ") : undefined,
          };
        });

  const count = Math.min(displayItems.length, 3);
  const cardW = 2.75;
  const gap = 0.27;
  const startX = 0.6;
  const cardY = 1.35;
  const cardH = 3.6;

  const colorPalettes = [
    { top: "4338CA", bg: "EEF2FF", text: "312E81", border: "C7D2FE" },
    { top: "0D9488", bg: "F0FDFA", text: "134E4A", border: "99F6E4" },
    { top: "D97706", bg: "FFFBEB", text: "78350F", border: "FDE68A" },
  ];

  for (let i = 0; i < count; i++) {
    const xPos = startX + i * (cardW + gap);
    const item = displayItems[i];
    const palette = colorPalettes[i % colorPalettes.length];

    // Card background
    slide.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: cardY,
      w: cardW,
      h: cardH,
      fill: { color: "FFFFFF" },
      line: { color: palette.border, width: 1.25 },
      rectRadius: 0.06,
    });

    // Top color band
    slide.addShape(pptx.ShapeType.rect, {
      x: xPos,
      y: cardY,
      w: cardW,
      h: 0.1,
      fill: { color: palette.top },
    });

    // Metric Value Badge Pill
    slide.addShape(pptx.ShapeType.roundRect, {
      x: xPos + 0.2,
      y: cardY + 0.35,
      w: cardW - 0.4,
      h: 1.1,
      fill: { color: palette.bg },
      line: { color: palette.border, width: 0.75 },
      rectRadius: 0.04,
    });

    // Large prominent metric number / value
    slide.addText(item.value, {
      x: xPos + 0.25,
      y: cardY + 0.4,
      w: cardW - 0.5,
      h: 1.0,
      fontSize: 16,
      bold: true,
      color: palette.text,
      fontFace: "Calibri",
      align: "center",
      valign: "middle",
    });

    // Metric Label
    slide.addText(item.label, {
      x: xPos + 0.2,
      y: cardY + 1.6,
      w: cardW - 0.4,
      h: 0.6,
      fontSize: 12,
      bold: true,
      color: "0F172A",
      fontFace: "Calibri",
      align: "center",
      valign: "top",
    });

    // Supporting Details
    if (item.subtext) {
      slide.addText(item.subtext, {
        x: xPos + 0.2,
        y: cardY + 2.3,
        w: cardW - 0.4,
        h: 1.0,
        fontSize: 9.5,
        color: "64748B",
        fontFace: "Calibri",
        align: "center",
        valign: "top",
      });
    }
  }

  addSlideFooter(slide, slideNumber, totalSlides, deckData);
}

/**
 * Layout D: Timeline / Milestone Roadmap
 */
function renderTimelineRoadmapSlide(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  slideData: SlideData,
  deckData: PresentationDeckData,
  slideNumber: number,
  totalSlides: number
) {
  addSlideHeader(pptx, slide, slideData, deckData);

  const timelineItems = slideData.timeline || [];
  const bullets = slideData.bulletPoints;

  const itemsToRender =
    timelineItems.length > 0
      ? timelineItems
      : bullets.map((b, idx) => {
          const parts = b.split(/:\s*/);
          return {
            dateOrPhase: parts[0]?.replace(/\*\*/g, "") || `Phase ${idx + 1}`,
            title: parts[1]?.replace(/\*\*/g, "") || b.replace(/\*\*/g, ""),
          };
        });

  const count = Math.min(itemsToRender.length, 4);
  const cardW = 2.05;
  const gap = 0.2;
  const startX = 0.6;
  const cardY = 1.45;
  const cardH = 3.4;

  // Horizontal Connecting Line across milestones
  slide.addShape(pptx.ShapeType.line, {
    x: startX + 0.5,
    y: cardY + 0.4,
    w: 8.8 - 1.0,
    h: 0,
    line: { color: "CBD5E1", width: 2 },
  });

  for (let i = 0; i < count; i++) {
    const xPos = startX + i * (cardW + gap);
    const item = itemsToRender[i];

    // Card
    slide.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: cardY + 0.8,
      w: cardW,
      h: cardH - 0.8,
      fill: { color: "FFFFFF" },
      line: { color: "E2E8F0", width: 1 },
      rectRadius: 0.05,
    });

    // Milestone Node Number Circle
    slide.addShape(pptx.ShapeType.ellipse, {
      x: xPos + cardW / 2 - 0.25,
      y: cardY + 0.15,
      w: 0.5,
      h: 0.5,
      fill: { color: i === 0 ? "4338CA" : i === count - 1 ? "0D9488" : "1E3A8A" },
      line: { color: "FFFFFF", width: 2 },
    });

    slide.addText(String(i + 1), {
      x: xPos + cardW / 2 - 0.25,
      y: cardY + 0.15,
      w: 0.5,
      h: 0.5,
      fontSize: 10,
      bold: true,
      color: "FFFFFF",
      fontFace: "Calibri",
      align: "center",
      valign: "middle",
    });

    // Date Badge Pill
    slide.addShape(pptx.ShapeType.roundRect, {
      x: xPos + 0.15,
      y: cardY + 1.0,
      w: cardW - 0.3,
      h: 0.35,
      fill: { color: "EEF2FF" },
      line: { color: "C7D2FE", width: 0.5 },
      rectRadius: 0.04,
    });

    slide.addText(item.dateOrPhase, {
      x: xPos + 0.2,
      y: cardY + 1.0,
      w: cardW - 0.4,
      h: 0.35,
      fontSize: 9,
      bold: true,
      color: "4338CA",
      fontFace: "Calibri",
      align: "center",
      valign: "middle",
    });

    // Milestone Title & Description
    slide.addText(item.title, {
      x: xPos + 0.15,
      y: cardY + 1.45,
      w: cardW - 0.3,
      h: 1.5,
      fontSize: 9.5,
      bold: true,
      color: "1E293B",
      fontFace: "Calibri",
      valign: "top",
    });
  }

  addSlideFooter(slide, slideNumber, totalSlides, deckData);
}

/**
 * Layout E: Process / Workflow Steps
 */
function renderProcessWorkflowSlide(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  slideData: SlideData,
  deckData: PresentationDeckData,
  slideNumber: number,
  totalSlides: number
) {
  addSlideHeader(pptx, slide, slideData, deckData);

  const bullets = slideData.bulletPoints;
  const count = Math.min(bullets.length, 4);
  const cardW = 2.05;
  const gap = 0.2;
  const startX = 0.6;
  const cardY = 1.4;
  const cardH = 3.5;

  for (let i = 0; i < count; i++) {
    const xPos = startX + i * (cardW + gap);
    const bullet = bullets[i].replace(/\*\*/g, "");

    // Card
    slide.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: cardY,
      w: cardW,
      h: cardH,
      fill: { color: "FFFFFF" },
      line: { color: "E2E8F0", width: 1 },
      rectRadius: 0.06,
    });

    // Step Header Bar
    slide.addShape(pptx.ShapeType.roundRect, {
      x: xPos + 0.15,
      y: cardY + 0.2,
      w: cardW - 0.3,
      h: 0.35,
      fill: { color: "F0FDFA" },
      line: { color: "99F6E4", width: 0.5 },
      rectRadius: 0.04,
    });

    slide.addText(`STEP ${i + 1}`, {
      x: xPos + 0.2,
      y: cardY + 0.2,
      w: cardW - 0.4,
      h: 0.35,
      fontSize: 9,
      bold: true,
      color: "0D9488",
      fontFace: "Calibri",
      align: "center",
      valign: "middle",
    });

    // Content
    slide.addText(bullet, {
      x: xPos + 0.15,
      y: cardY + 0.7,
      w: cardW - 0.3,
      h: 2.5,
      fontSize: 9.5,
      color: "1E293B",
      fontFace: "Calibri",
      valign: "top",
    });
  }

  addSlideFooter(slide, slideNumber, totalSlides, deckData);
}

/**
 * Layout F: Standard Multi-Card Grid / Executive Cards
 */
function renderStandardCardsSlide(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  slideData: SlideData,
  deckData: PresentationDeckData,
  slideNumber: number,
  totalSlides: number
) {
  addSlideHeader(pptx, slide, slideData, deckData);

  const bullets = slideData.bulletPoints;
  const count = bullets.length;

  if (count <= 3) {
    // 3 Vertical Cards side by side
    const cardW = 2.75;
    const gap = 0.27;
    const startX = 0.6;
    const cardY = 1.35;
    const cardH = 3.6;

    for (let i = 0; i < count; i++) {
      const xPos = startX + i * (cardW + gap);
      const text = bullets[i].replace(/\*\*/g, "");
      const parts = text.split(/:\s*/);

      slide.addShape(pptx.ShapeType.roundRect, {
        x: xPos,
        y: cardY,
        w: cardW,
        h: cardH,
        fill: { color: "FFFFFF" },
        line: { color: "E2E8F0", width: 1 },
        rectRadius: 0.06,
      });

      // Accent top bar
      slide.addShape(pptx.ShapeType.rect, {
        x: xPos,
        y: cardY,
        w: cardW,
        h: 0.08,
        fill: { color: i === 0 ? "1E3A8A" : i === 1 ? "0D9488" : "4338CA" },
      });

      if (parts.length >= 2) {
        slide.addText(parts[0], {
          x: xPos + 0.2,
          y: cardY + 0.25,
          w: cardW - 0.4,
          h: 0.4,
          fontSize: 11,
          bold: true,
          color: "0F172A",
          fontFace: "Calibri",
        });

        slide.addText(parts.slice(1).join(": "), {
          x: xPos + 0.2,
          y: cardY + 0.7,
          w: cardW - 0.4,
          h: 2.6,
          fontSize: 10,
          color: "334155",
          fontFace: "Calibri",
          valign: "top",
        });
      } else {
        slide.addText(text, {
          x: xPos + 0.2,
          y: cardY + 0.3,
          w: cardW - 0.4,
          h: 3.0,
          fontSize: 10,
          color: "334155",
          fontFace: "Calibri",
          valign: "top",
        });
      }
    }
  } else {
    // 2x2 Bento Grid for 4+ items
    const gridW = 4.25;
    const gridH = 1.7;
    const startX = 0.6;
    const startY = 1.35;
    const gapX = 0.3;
    const gapY = 0.25;

    for (let i = 0; i < Math.min(count, 4); i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const xPos = startX + col * (gridW + gapX);
      const yPos = startY + row * (gridH + gapY);
      const text = bullets[i].replace(/\*\*/g, "");
      const parts = text.split(/:\s*/);

      slide.addShape(pptx.ShapeType.roundRect, {
        x: xPos,
        y: yPos,
        w: gridW,
        h: gridH,
        fill: { color: "FFFFFF" },
        line: { color: "E2E8F0", width: 1 },
        rectRadius: 0.05,
      });

      // Left vertical accent
      slide.addShape(pptx.ShapeType.rect, {
        x: xPos,
        y: yPos,
        w: 0.08,
        h: gridH,
        fill: { color: i === 0 ? "1E3A8A" : i === 1 ? "0D9488" : i === 2 ? "4338CA" : "D97706" },
      });

      if (parts.length >= 2) {
        slide.addText(parts[0], {
          x: xPos + 0.2,
          y: yPos + 0.15,
          w: gridW - 0.35,
          h: 0.35,
          fontSize: 10.5,
          bold: true,
          color: "0F172A",
          fontFace: "Calibri",
        });

        slide.addText(parts.slice(1).join(": "), {
          x: xPos + 0.2,
          y: yPos + 0.5,
          w: gridW - 0.35,
          h: 1.1,
          fontSize: 9.5,
          color: "334155",
          fontFace: "Calibri",
          valign: "top",
        });
      } else {
        slide.addText(text, {
          x: xPos + 0.2,
          y: yPos + 0.2,
          w: gridW - 0.35,
          h: 1.3,
          fontSize: 9.5,
          color: "334155",
          fontFace: "Calibri",
          valign: "top",
        });
      }
    }
  }

  addSlideFooter(slide, slideNumber, totalSlides, deckData);
}
