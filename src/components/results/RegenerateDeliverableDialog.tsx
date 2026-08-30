import React from "react";
import {
  RefreshCw,
  AlertTriangle,
  X,
  Sparkles,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { GeneratedDeliverable } from "../../types";
import { DELIVERABLES_CATALOG } from "../../constants/transformationOptions";
import { Button } from "../ui/Button";

export interface RegenerateDeliverableDialogProps {
  isOpen: boolean;
  deliverable: GeneratedDeliverable | null;
  isRegenerating: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function RegenerateDeliverableDialog({
  isOpen,
  deliverable,
  isRegenerating,
  error,
  onConfirm,
  onClose,
}: RegenerateDeliverableDialogProps) {
  if (!isOpen || !deliverable) return null;

  const meta = DELIVERABLES_CATALOG.find((m) => m.id === deliverable.deliverableId);
  const title = deliverable.title || meta?.name || deliverable.deliverableId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <RefreshCw className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Regenerate Deliverable
              </h3>
              <p className="text-[11px] text-slate-500">
                Re-synthesize with Gemini AI
              </p>
            </div>
          </div>

          {!isRegenerating && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="py-4 space-y-3 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="font-semibold text-slate-900">{title}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Type: <code className="font-mono text-blue-700">{deliverable.deliverableId}</code>
            </div>
          </div>

          <p className="leading-relaxed">
            This will request a fresh AI synthesis for <strong>{title}</strong> using the existing source text and transformation configuration.
          </p>

          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg text-[11px] text-blue-900 space-y-1">
            <div className="font-semibold text-blue-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              Session Preservation Guarantee:
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-blue-800">
              <li>All other generated deliverables remain untouched.</li>
              <li>Local edits made to other deliverables are preserved.</li>
              <li>If regeneration fails, your current version is retained.</li>
            </ul>
          </div>

          {deliverable.isEdited && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Note: This deliverable was edited locally. Regenerating will replace it with the new AI output.
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-[11px]">
              <strong>Regeneration Failed:</strong> {error}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isRegenerating}
            className="text-xs text-slate-600"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onConfirm}
            loading={isRegenerating}
            icon={!isRegenerating ? <RefreshCw className="w-3.5 h-3.5" /> : undefined}
            className="text-xs shadow-xs"
          >
            {isRegenerating ? "Regenerating..." : "Confirm & Regenerate"}
          </Button>
        </div>
      </div>
    </div>
  );
}
