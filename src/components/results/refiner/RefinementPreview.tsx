import React, { useState, useMemo } from "react";
import { Check, RotateCcw, Sparkles, Columns, AlignLeft } from "lucide-react";
import { Button } from "../../ui/Button";
import { DiffViewer } from "../diff/DiffViewer";
import { calculateContentDiff } from "../../../utils/localIntelligence";

export interface RefinementPreviewProps {
  originalText: string;
  refinedText: string;
  actionLabel?: string;
  onAccept: () => void;
  onUndo: () => void;
}

export function RefinementPreview({
  originalText,
  refinedText,
  actionLabel = "Refinement",
  onAccept,
  onUndo,
}: RefinementPreviewProps) {
  const [diffMode, setDiffMode] = useState<"inline" | "side-by-side">("inline");

  const diffs = useMemo(
    () => calculateContentDiff(originalText, refinedText),
    [originalText, refinedText]
  );

  return (
    <div className="space-y-3 p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl animate-in fade-in zoom-in-95 duration-150 text-xs">
      <div className="flex items-center justify-between border-b border-indigo-200/80 pb-2">
        <div className="flex items-center gap-1.5 font-semibold text-indigo-950">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Selection Refined ({actionLabel})</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setDiffMode(diffMode === "inline" ? "side-by-side" : "inline")}
            className="text-[10.5px] text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 transition-colors"
            title="Toggle Diff Mode"
          >
            {diffMode === "inline" ? (
              <>
                <Columns className="w-3 h-3" />
                <span>Side-by-Side</span>
              </>
            ) : (
              <>
                <AlignLeft className="w-3 h-3" />
                <span>Inline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Polish Diff Comparison View */}
      <div className="space-y-1.5 text-left">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
          Difference Review ({diffMode}):
        </span>
        <DiffViewer diffs={diffs} mode={diffMode} className="max-h-48" />
      </div>

      {/* Action Buttons: Keep vs Undo */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={<RotateCcw className="w-3 h-3 text-slate-500" />}
          onClick={onUndo}
          className="text-xs bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs"
        >
          Undo
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          icon={<Check className="w-3 h-3" />}
          onClick={onAccept}
          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-2xs"
        >
          Keep Refinement
        </Button>
      </div>
    </div>
  );
}
