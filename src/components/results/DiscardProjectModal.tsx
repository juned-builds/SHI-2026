import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "../ui/Button";

export interface DiscardProjectModalProps {
  isOpen: boolean;
  hasEdits: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DiscardProjectModal({
  isOpen,
  hasEdits,
  onConfirm,
  onClose,
}: DiscardProjectModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-xl overflow-hidden animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-5 bg-red-50 border-b border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-red-950">Discard Transformation?</h3>
              <p className="text-xs text-red-700">Unsaved session will be permanently cleared</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to discard this generated transformation? Your generated deliverables will be removed, and this session will <strong>not</strong> be saved to My Projects or History.
          </p>

          {hasEdits && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> You have made local edits to deliverables in this session. Discarding will permanently lose these modifications.
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs"
            >
              Keep Working
            </Button>

            <Button
              type="button"
              variant="danger"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={onConfirm}
              className="text-xs bg-red-600 hover:bg-red-700 text-white"
            >
              Discard Transformation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
