import React from "react";
import {
  Sparkles,
  Cpu,
  CheckCircle2,
  Bookmark,
  Trash2,
  FileDown,
  ArrowLeft,
  Settings,
  History,
  Edit2,
  AlertCircle,
  FolderKanban,
  Save,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { GeneratedDeliverable, ProjectDraft, PersistenceStatus } from "../../types";
import { Button } from "../ui/Button";

export interface ResultsHeaderProps {
  draft: ProjectDraft;
  deliverables: GeneratedDeliverable[];
  modelUsed?: string;
  sessionId?: string;
  persistenceStatus?: PersistenceStatus;
  isSaved?: boolean;
  isSaving?: boolean;
  isOpenedFromHistory?: boolean;
  onNavigate: (route: string) => void;
  onExportAll: () => void;
  onSaveProject?: () => void;
  onSaveChanges?: () => void;
  onDiscardProject?: () => void;
  onRenameProject?: () => void;
  onRegenerateAll?: () => void;
}

export function ResultsHeader({
  draft,
  deliverables,
  modelUsed = "gemini-3.7-flash",
  sessionId,
  persistenceStatus = "unsaved",
  isSaved = false,
  isSaving = false,
  isOpenedFromHistory,
  onNavigate,
  onExportAll,
  onSaveProject,
  onSaveChanges,
  onDiscardProject,
  onRenameProject,
  onRegenerateAll,
}: ResultsHeaderProps) {
  const completedCount = deliverables.filter((d) => d.status === "completed").length;
  const editedCount = deliverables.filter((d) => d.isEdited).length;

  // Derive consolidated status
  const effectiveStatus: PersistenceStatus = isSaving
    ? "saving"
    : persistenceStatus || (isSaved ? (editedCount > 0 ? "dirty" : "saved") : "unsaved");

  const isActuallySaved = effectiveStatus === "saved" || effectiveStatus === "dirty";

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb & Primary Save / Discard Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isOpenedFromHistory ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<History className="w-3.5 h-3.5 text-slate-500" />}
                onClick={() => onNavigate("history")}
                className="text-slate-600 hover:text-slate-900 -ml-2 text-xs"
              >
                Back to History
              </Button>
              <span className="text-slate-300">|</span>
            </>
          ) : isActuallySaved ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<FolderKanban className="w-3.5 h-3.5 text-slate-500" />}
                onClick={() => onNavigate("projects")}
                className="text-slate-600 hover:text-slate-900 -ml-2 text-xs"
              >
                Back to Projects
              </Button>
              <span className="text-slate-300">|</span>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<ArrowLeft className="w-4 h-4 text-slate-500" />}
                onClick={() => onNavigate("projects/new/configure")}
                className="text-slate-600 hover:text-slate-900 -ml-2 text-xs"
              >
                Back to Configuration
              </Button>
              <span className="text-slate-300">|</span>
            </>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<Settings className="w-3.5 h-3.5 text-slate-400" />}
            onClick={() => onNavigate("projects/new")}
            className="text-slate-500 hover:text-slate-900 text-xs"
          >
            Edit Source
          </Button>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2">
          {/* DISCARD BUTTON: Only shown when project is UNSAVED */}
          {!isActuallySaved && effectiveStatus !== "saving" && onDiscardProject && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
              onClick={onDiscardProject}
              className="text-xs border-slate-200 text-slate-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
            >
              Discard
            </Button>
          )}

          {/* SAVE PROJECT BUTTON: For initial unsaved state */}
          {effectiveStatus === "unsaved" && onSaveProject && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Bookmark className="w-3.5 h-3.5 fill-current" />}
              onClick={onSaveProject}
              disabled={isSaving}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs font-semibold"
            >
              Save Project
            </Button>
          )}

          {/* SAVE CHANGES BUTTON: When saved project has modified content */}
          {effectiveStatus === "dirty" && (onSaveChanges || onSaveProject) && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Save className="w-3.5 h-3.5" />}
              onClick={onSaveChanges || onSaveProject}
              disabled={isSaving}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-xs font-semibold animate-pulse"
            >
              Save Changes
            </Button>
          )}

          {/* SAVING IN PROGRESS BUTTON */}
          {effectiveStatus === "saving" && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled
              icon={<Loader2 className="w-3.5 h-3.5 animate-spin" />}
              className="text-xs bg-blue-600 text-white opacity-80"
            >
              Saving to Storage...
            </Button>
          )}

          {/* RETRY SAVE BUTTON: If save failed */}
          {effectiveStatus === "save_failed" && onSaveProject && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={onSaveProject}
              disabled={isSaving}
              className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Retry Save
            </Button>
          )}

          {/* RENAME BUTTON: Allowed once project is saved */}
          {isActuallySaved && onRenameProject && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Edit2 className="w-3.5 h-3.5 text-slate-500" />}
              onClick={onRenameProject}
              className="text-xs"
            >
              Rename
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<FileDown className="w-3.5 h-3.5" />}
            onClick={onExportAll}
            className="text-xs"
          >
            Export All
          </Button>
        </div>
      </div>

      {/* State-specific Banners */}
      {effectiveStatus === "unsaved" && (
        <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <strong className="font-semibold text-amber-950">UNSAVED SESSION:</strong> Inspect deliverables, make local edits, or regenerate before deciding to save.
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {onSaveProject && (
              <button
                type="button"
                onClick={onSaveProject}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Save Project Now
              </button>
            )}
          </div>
        </div>
      )}

      {effectiveStatus === "dirty" && (
        <div className="p-3.5 bg-blue-50/90 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Edit2 className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <strong className="font-semibold text-blue-950">Unsaved Local Modifications:</strong> You have edited deliverables. Click <strong>Save Changes</strong> to sync these updates to storage.
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {(onSaveChanges || onSaveProject) && (
              <button
                type="button"
                onClick={onSaveChanges || onSaveProject}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Save Changes Now
              </button>
            )}
          </div>
        </div>
      )}

      {effectiveStatus === "save_failed" && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <div>
              <strong className="font-semibold text-red-950">Save Failed:</strong> Could not persist project to local IndexedDB. Your generated content is still safely preserved in this session.
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {onSaveProject && (
              <button
                type="button"
                onClick={onSaveProject}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Retry Save
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Status & Metric Banner */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {effectiveStatus === "saved" ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Project Saved
              </span>
            ) : effectiveStatus === "dirty" ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
                <Edit2 className="w-3 h-3 text-amber-400" />
                Unsaved Edits
              </span>
            ) : effectiveStatus === "saving" ? (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
                <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold uppercase tracking-wider">
                Unsaved Transformation
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 font-mono">
              <Cpu className="w-3 h-3 text-blue-400" />
              {modelUsed}
            </span>
          </div>

          <h2 className="text-base font-bold text-white mt-1">
            {draft.name || "Content Transformation Results Workspace"}
          </h2>

          <p className="text-xs text-slate-300 mt-0.5">
            Synthesized {completedCount} of {deliverables.length} requested deliverables. You can inspect, edit, or export each format.
          </p>
        </div>

        {/* Stats Pill Group */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
          <div className="px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-center">
            <div className="text-sm font-bold text-emerald-400">{completedCount} / {deliverables.length}</div>
            <div className="text-[10px] text-slate-400 uppercase font-medium">Completed</div>
          </div>

          {editedCount > 0 && (
            <div className="px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-center">
              <div className="text-sm font-bold text-amber-400">{editedCount}</div>
              <div className="text-[10px] text-slate-400 uppercase font-medium">Edited Locally</div>
            </div>
          )}

          {sessionId && (
            <div className="hidden lg:block px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-right">
              <div className="text-[11px] font-mono text-slate-300">{sessionId.slice(0, 16)}...</div>
              <div className="text-[10px] text-slate-400 uppercase font-medium">Session ID</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
