import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  X,
  Loader2,
  AlertCircle,
  Clock,
  RotateCcw,
  Check,
} from "lucide-react";
import { RefinementActions } from "./RefinementActions";
import { RefinementPreview } from "./RefinementPreview";
import { refineSelectionApi } from "../../../services/refinementApi";

export interface InlineRefinerPopoverProps {
  selectedText: string;
  surroundingContext?: string;
  sourceText?: string;
  deliverableType?: string;
  language?: string;
  position: { top: number; left: number };
  onApplyRefinement: (originalText: string, refinedText: string) => void;
  onClose: () => void;
}

export function InlineRefinerPopover({
  selectedText,
  surroundingContext,
  sourceText,
  deliverableType,
  language,
  position,
  onApplyRefinement,
  onClose,
}: InlineRefinerPopoverProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeActionLabel, setActiveActionLabel] = useState<string>("");
  const [previewData, setPreviewData] = useState<{
    originalText: string;
    refinedText: string;
    actionLabel: string;
  } | null>(null);

  // In-flight guard to prevent duplicate concurrent calls or double clicks
  const isInFlightRef = useRef<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !isLoading
      ) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isLoading, onClose]);

  // Handle refinement selection
  const handleExecuteRefinement = async (instruction: string, actionLabel: string) => {
    if (isInFlightRef.current || isLoading) return;
    isInFlightRef.current = true;
    setIsLoading(true);
    setErrorMessage(null);
    setActiveActionLabel(actionLabel);

    try {
      const response = await refineSelectionApi({
        selectedText,
        instruction,
        surroundingContext,
        sourceText,
        deliverableType,
        language,
      });

      if (response.success && response.refinedText) {
        setPreviewData({
          originalText: selectedText,
          refinedText: response.refinedText,
          actionLabel,
        });
      } else {
        const errObj = response.error;
        const msg =
          typeof errObj === "object" && errObj?.code === "QUOTA_EXHAUSTED"
            ? "Selection refinement is temporarily unavailable because Gemini usage quota has been reached. Your existing content is safe and unchanged."
            : typeof errObj === "object" && errObj?.message
            ? errObj.message
            : response.detail || "Selection refinement is temporarily unavailable. Your existing content is unchanged.";
        setErrorMessage(msg);
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Selection refinement is temporarily unavailable. Your existing content is unchanged."
      );
    } finally {
      setIsLoading(false);
      isInFlightRef.current = false;
    }
  };

  const handleKeep = () => {
    if (previewData) {
      onApplyRefinement(previewData.originalText, previewData.refinedText);
      onClose();
    }
  };

  const handleUndo = () => {
    setPreviewData(null);
    setErrorMessage(null);
  };

  // Bound positioning within viewport
  const style: React.CSSProperties = {
    top: Math.max(10, position.top),
    left: Math.min(Math.max(10, position.left), window.innerWidth - 360),
  };

  return (
    <div
      ref={popoverRef}
      style={style}
      className="fixed z-50 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-900/10 p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-150 font-sans"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5">
          <div className="p-1 bg-indigo-50 text-indigo-700 rounded-md">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 leading-none">
              ✨ Refine Selection
            </h4>
            <span className="text-[10px] text-slate-500">
              Surgical AI Directive Refiner
            </span>
          </div>
        </div>

        {!isLoading && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close refiner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Selected excerpt preview */}
      <div className="bg-slate-50/90 p-2 rounded-lg border border-slate-200/70 text-[11px] text-slate-600 line-clamp-2 italic">
        "{selectedText}"
      </div>

      {/* Active Error state */}
      {errorMessage && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-[11px] leading-relaxed">
            {errorMessage}
          </div>
        </div>
      )}

      {/* Loading state indicator */}
      {isLoading && (
        <div className="py-6 text-center space-y-2 animate-in fade-in duration-150">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
          <div className="text-xs font-semibold text-slate-900">
            Refining selection ({activeActionLabel})...
          </div>
          <p className="text-[10.5px] text-slate-500 max-w-xs mx-auto">
            Rewriting only highlighted text while preserving facts, metrics, and dates.
          </p>
        </div>
      )}

      {/* Main Mode: Actions or Preview */}
      {!isLoading && !previewData && (
        <RefinementActions
          isLoading={isLoading}
          onSelectAction={handleExecuteRefinement}
        />
      )}

      {/* Before / After Preview Confirmation */}
      {!isLoading && previewData && (
        <RefinementPreview
          originalText={previewData.originalText}
          refinedText={previewData.refinedText}
          actionLabel={previewData.actionLabel}
          onAccept={handleKeep}
          onUndo={handleUndo}
        />
      )}
    </div>
  );
}
