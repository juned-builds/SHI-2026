import React from "react";
import { CheckCircle2, ShieldCheck, Cpu, ArrowRight, RefreshCw, Edit3 } from "lucide-react";
import { Button } from "../ui/Button";

export interface PipelineReadyBannerProps {
  onEditConfig: () => void;
  onReset: () => void;
  deliverablesCount: number;
}

export function PipelineReadyBanner({
  onEditConfig,
  onReset,
  deliverablesCount,
}: PipelineReadyBannerProps) {
  return (
    <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl border border-slate-700 shadow-sm space-y-4 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-semibold text-white">
              Generation Pipeline Staged & Verified
            </h4>
            <p className="text-xs text-slate-300">
              In-memory prompt schemas and deliverable contracts are validated for {deliverablesCount}{" "}
              {deliverablesCount === 1 ? "deliverable" : "deliverables"}.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Local-First Verified</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            Module 0.5 Status
          </span>
          <p className="font-medium text-white">Workspace & Pipeline Contract</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Structured state, parameters, and prompt schemas assembled locally.
          </p>
        </div>

        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            Upcoming AI Connection
          </span>
          <p className="font-medium text-white">Gemini GenAI Engine</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Will execute real content synthesis via the configurable API layer.
          </p>
        </div>

        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            Security & Portability
          </span>
          <p className="font-medium text-white">Zero External Leakage</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Zero cloud databases, zero telemetry, fully local-first execution.
          </p>
        </div>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <p className="text-slate-400 text-center sm:text-left">
          You can modify your source or transformation options at any time prior to live generation.
        </p>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={onReset}
            className="text-slate-300 hover:text-white hover:bg-white/10 text-xs w-full sm:w-auto"
          >
            Re-run Staging
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Edit3 className="w-3.5 h-3.5" />}
            onClick={onEditConfig}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs w-full sm:w-auto"
          >
            Edit Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
