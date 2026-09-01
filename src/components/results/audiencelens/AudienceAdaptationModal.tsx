import React, { useState, useMemo } from "react";
import {
  X,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  FileText,
  Layers,
  Columns,
  GitCompare,
} from "lucide-react";
import { Button } from "../../ui/Button";
import { AudiencePersonaEvaluation } from "../../../types";
import { DiffViewer } from "../diff/DiffViewer";
import { calculateContentDiff } from "../../../utils/localIntelligence";

export interface AudienceAdaptationModalProps {
  isOpen: boolean;
  persona: AudiencePersonaEvaluation | null;
  originalContent: string;
  adaptedContent: string | null;
  explanation?: string;
  isGenerating: boolean;
  error: string | null;
  onApply: (adaptedText: string) => void;
  onDiscard: () => void;
  onRetry: () => void;
}

export function AudienceAdaptationModal({
  isOpen,
  persona,
  originalContent,
  adaptedContent,
  explanation,
  isGenerating,
  error,
  onApply,
  onDiscard,
  onRetry,
}: AudienceAdaptationModalProps) {
  const [viewMode, setViewMode] = useState<"diff" | "side-by-side" | "adapted-only">("diff");

  const diffs = useMemo(() => {
    if (!adaptedContent) return [];
    return calculateContentDiff(originalContent, adaptedContent);
  }, [originalContent, adaptedContent]);

  if (!isOpen || !persona) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-5xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">
                  Adapt Deliverable for {persona.personaName}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Proposed Adaptation
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review proposed language adjustments before applying to your deliverable workspace.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDiscard}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status / Notice Bar */}
        <div className="bg-indigo-50/80 px-4 py-2.5 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-indigo-900">
            <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Fact Integrity Guarantee:</strong> All numbers, dates, official names, and commitments are strictly preserved.
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-indigo-700">
            <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold border border-amber-200 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              FactMesh will require re-verification
            </span>
          </div>
        </div>

        {/* Explanation Box */}
        {explanation && (
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-700 space-y-1">
            <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
              Adaptation Strategy:
            </span>
            <p className="leading-relaxed">{explanation}</p>
          </div>
        )}

        {/* Content Comparison Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {isGenerating ? (
            <div className="py-16 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">
                  Generating Adaptation for {persona.personaName}...
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Gemini is restructuring vocabulary, tone, and sentence flow to optimize clarity for this audience while safeguarding every factual claim.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-rose-900">
                  Adaptation Unavailable
                </h4>
                <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Retry Adaptation
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onDiscard}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : adaptedContent ? (
            <div className="space-y-3">
              {/* View Toggle */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-700">
                  Adaptation Review ({viewMode}):
                </span>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode("diff")}
                    className={`px-2.5 py-1 rounded font-medium transition-all flex items-center gap-1 ${
                      viewMode === "diff"
                        ? "bg-white shadow-2xs text-slate-900 font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <GitCompare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Diff Highlights</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("side-by-side")}
                    className={`px-2.5 py-1 rounded font-medium transition-all flex items-center gap-1 ${
                      viewMode === "side-by-side"
                        ? "bg-white shadow-2xs text-slate-900 font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Side by Side</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("adapted-only")}
                    className={`px-2.5 py-1 rounded font-medium transition-all flex items-center gap-1 ${
                      viewMode === "adapted-only"
                        ? "bg-white shadow-2xs text-slate-900 font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Adapted Only</span>
                  </button>
                </div>
              </div>

              {viewMode === "diff" ? (
                <div className="space-y-1.5">
                  <DiffViewer diffs={diffs} mode="side-by-side" className="max-h-[420px]" />
                </div>
              ) : viewMode === "side-by-side" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Before (Original) */}
                  <div className="space-y-1.5 flex flex-col">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-t-lg border border-slate-200">
                      <span>Original Deliverable (Before)</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        {originalContent.split(/\s+/).length} words
                      </span>
                    </div>
                    <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-b-lg text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed max-h-[420px] overflow-y-auto">
                      {originalContent}
                    </div>
                  </div>

                  {/* After (Adapted) */}
                  <div className="space-y-1.5 flex flex-col">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-t-lg border border-indigo-200">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Adapted for {persona.personaName} (Proposed)
                      </span>
                      <span className="text-[11px] text-indigo-700 font-normal">
                        {adaptedContent.split(/\s+/).length} words
                      </span>
                    </div>
                    <div className="p-4 bg-white border border-indigo-300 rounded-b-lg text-xs text-slate-900 font-mono whitespace-pre-wrap leading-relaxed max-h-[420px] overflow-y-auto shadow-2xs ring-1 ring-indigo-100">
                      {adaptedContent}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-t-lg border border-indigo-200">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Adapted for {persona.personaName}
                    </span>
                    <span className="text-[11px] text-indigo-700 font-normal">
                      {adaptedContent.split(/\s+/).length} words
                    </span>
                  </div>
                  <div className="p-5 bg-white border border-indigo-300 rounded-b-lg text-xs text-slate-900 whitespace-pre-wrap leading-relaxed max-h-[450px] overflow-y-auto">
                    {adaptedContent}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDiscard}
            className="text-xs"
          >
            Discard & Keep Original
          </Button>

          {adaptedContent && !isGenerating && !error && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={<CheckCircle2 className="w-4 h-4 text-white" />}
                onClick={() => onApply(adaptedContent)}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
              >
                Apply Adaptation to Deliverable
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
