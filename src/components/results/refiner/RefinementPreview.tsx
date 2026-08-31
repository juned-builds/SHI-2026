import React from "react";
import { Check, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "../../ui/Button";

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
  return (
    <div className="space-y-3 p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl animate-in fade-in zoom-in-95 duration-150 text-xs">
      <div className="flex items-center justify-between border-b border-indigo-200/80 pb-2">
        <div className="flex items-center gap-1.5 font-semibold text-indigo-950">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Selection Refined ({actionLabel})</span>
        </div>
        <span className="text-[10.5px] text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full font-mono">
          Preview
        </span>
      </div>

      {/* Comparison view */}
      <div className="space-y-2 text-left">
        <div>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
            Original:
          </span>
          <div className="p-2 bg-white/80 rounded-md border border-slate-200 text-slate-600 text-[11.5px] line-through leading-relaxed max-h-24 overflow-y-auto">
            {originalText}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-semibold text-indigo-900 uppercase tracking-wider block mb-0.5">
            Refined:
          </span>
          <div className="p-2 bg-white rounded-md border border-indigo-300 text-slate-900 font-medium text-[11.5px] leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">
            {refinedText}
          </div>
        </div>
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
