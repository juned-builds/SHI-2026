import React from "react";
import {
  Sparkles,
  Cpu,
  CheckCircle2,
  Edit3,
  Layers,
  FileDown,
  ArrowLeft,
  Settings,
  RotateCcw,
} from "lucide-react";
import { GeneratedDeliverable, ProjectDraft } from "../../types";
import { Button } from "../ui/Button";

export interface ResultsHeaderProps {
  draft: ProjectDraft;
  deliverables: GeneratedDeliverable[];
  modelUsed?: string;
  sessionId?: string;
  onNavigate: (route: string) => void;
  onExportAll: () => void;
  onRegenerateAll?: () => void;
}

export function ResultsHeader({
  draft,
  deliverables,
  modelUsed = "gemini-3.7-flash",
  sessionId,
  onNavigate,
  onExportAll,
  onRegenerateAll,
}: ResultsHeaderProps) {
  const completedCount = deliverables.filter((d) => d.status === "completed").length;
  const editedCount = deliverables.filter((d) => d.isEdited).length;

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb / Nav Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
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

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={<FileDown className="w-3.5 h-3.5" />}
            onClick={onExportAll}
            className="text-xs shadow-xs"
          >
            Export All Deliverables
          </Button>
        </div>
      </div>

      {/* Main Status & Metric Banner */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold uppercase tracking-wider">
              Transformation Complete
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 font-mono">
              <Cpu className="w-3 h-3 text-blue-400" />
              {modelUsed}
            </span>
          </div>

          <h2 className="text-base font-bold text-white mt-1">
            {draft.name || "Content Transformation Results Workspace"}
          </h2>

          <p className="text-xs text-slate-300 mt-0.5">
            Synthesized {completedCount} of {deliverables.length} requested deliverables. You can inspect, edit, or download each format.
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
