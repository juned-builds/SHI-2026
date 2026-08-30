import React, { useState, useEffect } from "react";
import { Bookmark, CheckCircle2, X, Sparkles, FileText, Layers } from "lucide-react";
import { GeneratedDeliverable, ProjectDraft } from "../../types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { DELIVERABLES_CATALOG } from "../../constants/transformationOptions";

export interface SaveProjectModalProps {
  isOpen: boolean;
  draft: ProjectDraft;
  deliverables: GeneratedDeliverable[];
  isSaving: boolean;
  onSave: (customProjectName: string) => void;
  onClose: () => void;
}

export function SaveProjectModal({
  isOpen,
  draft,
  deliverables,
  isSaving,
  onSave,
  onClose,
}: SaveProjectModalProps) {
  const [projectName, setProjectName] = useState<string>(
    draft?.name || "Untitled transformation"
  );
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setProjectName(draft?.name || "Untitled transformation");
      setNameError(null);
    }
  }, [isOpen, draft?.name]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = projectName.trim();
    if (!trimmed) {
      setNameError("Project name cannot be empty.");
      return;
    }
    onSave(trimmed);
  };

  const completedDeliverables = deliverables.filter((d) => d.status === "completed");
  const editedCount = deliverables.filter((d) => d.isEdited).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-xl overflow-hidden animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Save Transformation Project</h3>
              <p className="text-xs text-slate-300">
                Save to My Projects with all generated formats and edits
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <Input
              id="save-project-name"
              label="Project Name"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                if (nameError && e.target.value.trim()) {
                  setNameError(null);
                }
              }}
              placeholder="e.g. Q3 Strategic Planning Summary"
              helperText="This name will appear in My Projects and History."
              error={nameError || undefined}
              required
              autoFocus
            />
          </div>

          {/* Deliverables summary */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <span>Included Content</span>
              <span className="text-emerald-600 font-bold">
                {completedDeliverables.length} Deliverables Ready
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {deliverables.map((d) => {
                const meta = DELIVERABLES_CATALOG.find((m) => m.id === d.deliverableId);
                return (
                  <span
                    key={d.deliverableId}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-white border border-slate-200 text-slate-700 font-medium"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>{meta?.name || d.title || d.deliverableId}</span>
                    {d.isEdited && (
                      <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1 rounded border border-amber-200">
                        Edited
                      </span>
                    )}
                  </span>
                );
              })}
            </div>

            {editedCount > 0 && (
              <p className="text-[11px] text-amber-700 font-medium pt-1">
                • {editedCount} deliverable{editedCount > 1 ? "s" : ""} contain local modifications that will be saved.
              </p>
            )}
          </div>

          {/* Local-first transparency notice */}
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50/60 p-3 rounded-lg border border-slate-100">
            <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
            <span>
              Persisted directly into your local browser IndexedDB storage (offline-accessible).
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="text-xs"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              icon={<Bookmark className="w-3.5 h-3.5 fill-current" />}
              className="text-xs shadow-xs"
            >
              Save Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
