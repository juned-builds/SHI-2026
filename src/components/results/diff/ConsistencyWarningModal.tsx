import React from "react";
import { AlertCircle, ArrowRight, X, ExternalLink } from "lucide-react";
import { ConsistencyIssue } from "../../../utils/localIntelligence";
import { Button } from "../../ui/Button";

export interface ConsistencyWarningModalProps {
  isOpen: boolean;
  issues: ConsistencyIssue[];
  onClose: () => void;
  onNavigateToDeliverable?: (deliverableId: string) => void;
}

export function ConsistencyWarningModal({
  isOpen,
  issues,
  onClose,
  onNavigateToDeliverable,
}: ConsistencyWarningModalProps) {
  if (!isOpen || issues.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-amber-50/70 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 shadow-2xs">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Cross-Deliverable Consistency Check
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                  Local Review
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Fact values modified in your latest edit appear in other project deliverables.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs">
            <strong>Deterministic Local Intelligence:</strong> No AI was called to generate this notice. Other deliverables remain unchanged until you review and edit them.
          </div>

          <div className="space-y-3">
            {issues.map((issue, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 capitalize">
                    {issue.tokenType}: <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">"{issue.originalToken}"</span>
                  </span>
                  <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
                    Modified in {issue.sourceDeliverableTitle}
                  </span>
                </div>

                <p className="text-slate-600 text-xs">{issue.description}</p>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Also detected in:
                  </span>
                  {issue.affectedDeliverables.map((affected, aIdx) => (
                    <div
                      key={aIdx}
                      className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-semibold text-slate-900">
                          {affected.deliverableTitle}
                        </span>
                        <span className="text-slate-500 text-[11px] ml-1.5">
                          ({affected.occurrences} instance{affected.occurrences > 1 ? "s" : ""})
                        </span>
                        {affected.snippets.length > 0 && (
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5 italic">
                            {affected.snippets[0]}
                          </p>
                        )}
                      </div>

                      {onNavigateToDeliverable && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onClose();
                            onNavigateToDeliverable(affected.deliverableId);
                          }}
                          icon={<ExternalLink className="w-3 h-3" />}
                          className="text-[11px] shrink-0"
                        >
                          View
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <Button type="button" variant="primary" size="sm" onClick={onClose} className="text-xs">
            Acknowledge & Close
          </Button>
        </div>
      </div>
    </div>
  );
}
