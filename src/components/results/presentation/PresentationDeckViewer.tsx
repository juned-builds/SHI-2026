import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Presentation,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  FileText,
  Sparkles,
  Check,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../../ui/Button";
import {
  PresentationDeckData,
  SlideData,
  SlideLayoutType,
} from "../../../types/presentation";
import { normalizePresentationData } from "../../../services/presentation/presentationParser";
import { generatePowerPointPresentation } from "../../../services/presentation/pptxRenderer";

export interface PresentationDeckViewerProps {
  data?: Record<string, any> | null;
  markdownContent?: string;
  deliverableTitle?: string;
  projectName?: string;
}

export function PresentationDeckViewer({
  data,
  markdownContent,
  deliverableTitle = "Presentation Deck",
  projectName,
}: PresentationDeckViewerProps) {
  // Normalize structured data or markdown content into unified PresentationDeckData
  const deckData: PresentationDeckData = normalizePresentationData(
    data,
    markdownContent,
    deliverableTitle,
    projectName
  );

  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const totalSlides = deckData.slides.length;
  const currentSlide: SlideData = deckData.slides[activeSlideIndex] || deckData.slides[0];

  const handlePrev = useCallback(() => {
    setActiveSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const handleNext = useCallback(() => {
    setActiveSlideIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : prev));
  }, [totalSlides]);

  // Keyboard navigation support (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext, isFullscreen]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // PowerPoint Export Handler
  const handleDownloadPowerPoint = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);

    try {
      const result = await generatePowerPointPresentation(deckData, projectName);
      if (result.success) {
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3500);
      } else {
        setExportError(result.error || "Failed to generate PowerPoint file.");
      }
    } catch (err: any) {
      setExportError(err?.message || "PowerPoint export encountered an error.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`space-y-4 ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-slate-950 p-6 flex flex-col justify-between overflow-y-auto"
          : ""
      }`}
    >
      {/* Top Presentation Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
            <Presentation className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
              {deckData.deckTitle}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>{totalSlides} Widescreen Slides (16:9)</span>
              <span>•</span>
              <span className="capitalize font-medium text-blue-600">
                {currentSlide.layoutType.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSpeakerNotes((prev) => !prev)}
            icon={<FileText className="w-3.5 h-3.5 text-slate-500" />}
            className="text-xs"
          >
            {showSpeakerNotes ? "Hide Notes" : "Speaker Notes"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            icon={
              isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5 text-slate-600" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
              )
            }
            className="text-xs"
            title="Fullscreen Slide View"
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={isExporting}
            onClick={handleDownloadPowerPoint}
            icon={
              exportSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <Download className="w-3.5 h-3.5 text-white" />
              )
            }
            className="text-xs bg-blue-700 hover:bg-blue-800 text-white font-semibold shadow-xs"
          >
            {isExporting
              ? "Creating .pptx..."
              : exportSuccess
              ? "Downloaded!"
              : "Download PowerPoint"}
          </Button>
        </div>
      </div>

      {exportError && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {exportError}
        </div>
      )}

      {/* Main 16:9 Slide Canvas */}
      <div className="relative w-full aspect-[16/9] max-w-5xl mx-auto bg-slate-50 border border-slate-300 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between p-6 sm:p-8 select-none">
        {/* Slide Header */}
        {currentSlide.layoutType !== "title_hero" && (
          <div className="space-y-1.5 border-b border-slate-200 pb-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10.5px] font-bold text-blue-700 uppercase tracking-wide">
                <Layers className="w-3 h-3 text-blue-500" />
                {currentSlide.categoryTag || `SECTION ${currentSlide.slideNumber}`}
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                Slide {currentSlide.slideNumber} of {totalSlides}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {currentSlide.title}
            </h3>
          </div>
        )}

        {/* Slide Body Canvas (Dynamic per Layout) */}
        <div className="flex-1 my-auto py-2">
          {renderSlideBody(currentSlide, deckData)}
        </div>

        {/* Slide Footer */}
        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10.5px] text-slate-400">
          <span>TransformAI • {deckData.deckTitle}</span>
          <span>Slide {currentSlide.slideNumber} of {totalSlides}</span>
        </div>
      </div>

      {/* Slide Navigation Bar & Thumbnails */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
        {/* Previous Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={activeSlideIndex === 0}
          onClick={handlePrev}
          icon={<ChevronLeft className="w-4 h-4" />}
          className="text-xs"
        >
          Previous
        </Button>

        {/* Thumbnail Strip */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-xl scrollbar-thin">
          {deckData.slides.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveSlideIndex(idx)}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                activeSlideIndex === idx
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>{idx + 1}</span>
              <span className="ml-1.5 hidden md:inline text-[11px] font-normal opacity-90 truncate max-w-[100px]">
                {s.title.slice(0, 16)}
              </span>
            </button>
          ))}
        </div>

        {/* Next Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={activeSlideIndex === totalSlides - 1}
          onClick={handleNext}
          icon={<ChevronRight className="w-4 h-4" />}
          className="text-xs"
        >
          Next
        </Button>
      </div>

      {/* Speaker Notes Drawer */}
      {showSpeakerNotes && (
        <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-amber-200/60">
            <span className="font-bold text-amber-950 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              Presenter Speaker Notes (Slide {currentSlide.slideNumber})
            </span>
            <span className="text-[10.5px] text-amber-800">
              Embedded in PowerPoint Presenter View
            </span>
          </div>

          <p className="text-amber-900 leading-relaxed">
            {currentSlide.speakerNotes ||
              "Present this slide focusing on core strategic outcomes, factual compliance, and target beneficiary milestones."}
          </p>

          {currentSlide.visualConcept && (
            <div className="mt-2 pt-2 border-t border-amber-200/60 text-amber-800">
              <strong>Visual Layout Note: </strong>
              {currentSlide.visualConcept}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// RENDERERS FOR IN-APP 16:9 SLIDE BODY
// ==========================================

function renderSlideBody(slide: SlideData, deck: PresentationDeckData) {
  switch (slide.layoutType) {
    case "title_hero":
      return <TitleHeroSlideBody slide={slide} deck={deck} />;
    case "two_column_comparison":
      return <TwoColumnComparisonSlideBody slide={slide} />;
    case "key_metrics":
      return <KeyMetricsSlideBody slide={slide} />;
    case "timeline_roadmap":
      return <TimelineRoadmapSlideBody slide={slide} />;
    case "process_workflow":
      return <ProcessWorkflowSlideBody slide={slide} />;
    case "standard_cards":
    default:
      return <StandardCardsSlideBody slide={slide} />;
  }
}

/**
 * Layout A: Title / Hero Slide
 */
function TitleHeroSlideBody({ slide, deck }: { slide: SlideData; deck: PresentationDeckData }) {
  const bullets = slide.bulletPoints.filter(
    (b) => !/^(\*\*Title:\*\*|\*\*Subtitle:\*\*|Title:|Subtitle:)/i.test(b)
  );

  return (
    <div className="space-y-4">
      <div className="p-6 sm:p-7 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl shadow-xs space-y-2">
        <span className="px-2.5 py-0.5 rounded-full bg-blue-800/80 border border-blue-600 text-[10px] font-bold text-blue-200 uppercase tracking-wider">
          TransformAI Executive Blueprint
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {slide.title}
        </h2>
        <p className="text-xs sm:text-sm text-blue-100/90 font-medium">
          {slide.subtitle || deck.subtitle || "Strategic Implementation & Policy Framework"}
        </p>
      </div>

      {bullets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {bullets.slice(0, 3).map((b, idx) => (
            <div
              key={idx}
              className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs text-xs font-semibold text-slate-800 flex items-center gap-2 border-t-2 border-t-blue-600"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{b.replace(/\*\*/g, "")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Layout B: Two-Column Comparison (Paradigm Shift)
 */
function TwoColumnComparisonSlideBody({ slide }: { slide: SlideData }) {
  const comparison = slide.comparison || {
    leftHeading: "Legacy Process",
    leftItems: slide.bulletPoints.slice(0, 2),
    rightHeading: "NIDCI Innovation",
    rightItems: slide.bulletPoints.slice(2),
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
      {/* Left Baseline Card */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
        <div>
          <div className="px-3 py-1 bg-slate-100 rounded-md text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-3">
            {comparison.leftHeading}
          </div>
          <ul className="space-y-2 text-xs text-slate-600">
            {comparison.leftItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-slate-400 font-bold">•</span>
                <span>{item.replace(/\*\*/g, "")}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Target / Innovation Card */}
      <div className="p-4 bg-emerald-50/50 border border-emerald-300 rounded-xl shadow-2xs flex flex-col justify-between">
        <div>
          <div className="px-3 py-1 bg-emerald-100 text-emerald-900 rounded-md text-[11px] font-bold uppercase tracking-wide mb-3 flex items-center justify-between">
            <span>✓ {comparison.rightHeading}</span>
            <span className="text-[10px] bg-emerald-200 px-1.5 py-0.5 rounded font-semibold">
              Automated
            </span>
          </div>
          <ul className="space-y-2 text-xs text-emerald-950 font-medium">
            {comparison.rightItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{item.replace(/\*\*/g, "")}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Layout C: Key Metrics Slide
 */
function KeyMetricsSlideBody({ slide }: { slide: SlideData }) {
  const metrics = slide.metrics || [];
  const bullets = slide.bulletPoints;

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      {displayItems.slice(0, 3).map((m, idx) => (
        <div
          key={idx}
          className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between text-center space-y-2 border-t-3 border-t-indigo-600"
        >
          <div className="py-2 px-3 bg-indigo-50/70 border border-indigo-100 rounded-lg">
            <span className="text-base sm:text-lg font-black text-indigo-900">
              {m.value}
            </span>
          </div>
          <h5 className="text-xs font-bold text-slate-800">{m.label}</h5>
          {m.subtext && (
            <p className="text-[11px] text-slate-500">{m.subtext}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Layout D: Timeline / Roadmap Slide
 */
function TimelineRoadmapSlideBody({ slide }: { slide: SlideData }) {
  const timelineItems = slide.timeline || [];
  const bullets = slide.bulletPoints;

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
      {itemsToRender.slice(0, 4).map((item, idx) => (
        <div
          key={idx}
          className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between space-y-2 relative"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
              {idx + 1}
            </span>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">
              {item.dateOrPhase}
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-800 leading-snug">
            {item.title}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * Layout E: Process / Workflow Slide
 */
function ProcessWorkflowSlideBody({ slide }: { slide: SlideData }) {
  const bullets = slide.bulletPoints;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
      {bullets.slice(0, 4).map((b, idx) => (
        <div
          key={idx}
          className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between space-y-2 border-t-2 border-t-teal-600"
        >
          <span className="px-2 py-0.5 bg-teal-50 text-teal-800 font-bold text-[10px] rounded w-fit">
            STEP {idx + 1}
          </span>
          <p className="text-xs text-slate-800 leading-snug">
            {b.replace(/\*\*/g, "")}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * Layout F: Standard Cards Slide
 */
function StandardCardsSlideBody({ slide }: { slide: SlideData }) {
  const bullets = slide.bulletPoints;

  if (bullets.length <= 3) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {bullets.map((b, idx) => {
          const parts = b.split(/:\s*/);
          return (
            <div
              key={idx}
              className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1.5 border-t-2 border-t-blue-600"
            >
              {parts.length >= 2 ? (
                <>
                  <h5 className="text-xs font-bold text-slate-900">
                    {parts[0].replace(/\*\*/g, "")}
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {parts.slice(1).join(": ").replace(/\*\*/g, "")}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-700 leading-relaxed">
                  {b.replace(/\*\*/g, "")}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {bullets.slice(0, 4).map((b, idx) => {
        const parts = b.split(/:\s*/);
        return (
          <div
            key={idx}
            className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-1 border-l-3 border-l-blue-600"
          >
            {parts.length >= 2 ? (
              <>
                <h5 className="text-xs font-bold text-slate-900">
                  {parts[0].replace(/\*\*/g, "")}
                </h5>
                <p className="text-xs text-slate-600 leading-snug">
                  {parts.slice(1).join(": ").replace(/\*\*/g, "")}
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-700 leading-snug">
                {b.replace(/\*\*/g, "")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
