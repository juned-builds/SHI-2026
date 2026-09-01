import React from "react";
import {
  Users,
  Sparkles,
  RefreshCw,
  ArrowLeft,
  Clock,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "../../ui/Button";
import { GeneratedDeliverable, AudienceLensReport } from "../../../types";

export interface AudienceLensHeaderProps {
  deliverable: GeneratedDeliverable;
  report: AudienceLensReport | null;
  isEvaluating: boolean;
  isStale: boolean;
  isDemoMode?: boolean;
  onReevaluate: () => void;
  onExit: () => void;
}

export function AudienceLensHeader({
  deliverable,
  report,
  isEvaluating,
  isStale,
  isDemoMode = false,
  onReevaluate,
  onExit,
}: AudienceLensHeaderProps) {
  const isShowcase =
    isDemoMode ||
    report?.reportId === "demo-report-nidci-2026" ||
    report?.reportId?.startsWith("demo-report");

  return (
    <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Title and Branding */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <span>AudienceLens™</span>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  Communication Intelligence
                </span>
              </h3>
              {isShowcase ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-semibold">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Showcase Demo • Zero API Usage
                </span>
              ) : report && !isStale ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10.5px] font-medium">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Evaluated with Gemini
                </span>
              ) : null}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate stakeholder comprehension across Rural Citizen, Senior Executive, and Field Worker perspectives.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isEvaluating}
            icon={
              isEvaluating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              ) : isShowcase ? (
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              )
            }
            onClick={onReevaluate}
            className="text-xs font-medium"
            title={
              isShowcase
                ? "Run optional live Gemini evaluation on this deliverable"
                : "Re-evaluate with live Gemini"
            }
          >
            {isEvaluating
              ? "Evaluating..."
              : isShowcase
              ? "Run Live AI Analysis"
              : report
              ? "Re-evaluate (Live AI)"
              : "Run Live AI Analysis"}
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={onExit}
            className="text-xs bg-slate-900 hover:bg-slate-800 text-white"
          >
            Back to Deliverable
          </Button>
        </div>
      </div>

      {/* Sub-bar with deliverable info and timestamp */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11.5px] text-slate-500">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-slate-700">Evaluating Deliverable:</span>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[11px] border border-slate-200">
            {deliverable.title || deliverable.deliverableId}
          </span>
          <span className="text-slate-400">&bull;</span>
          <span>{deliverable.content.trim().split(/\s+/).length} words</span>
        </div>

        {report && (
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-slate-500">
              <Cpu className="w-3 h-3 text-slate-400" />
              {isShowcase ? "Showcase Precomputed" : report.modelUsed || "gemini-3.7-flash"}
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3 h-3" />
              {isShowcase
                ? "Instant (Zero API)"
                : `Evaluated ${new Date(report.evaluatedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

