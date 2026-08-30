import React from "react";
import {
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  Hash,
  Calendar,
  Layers,
  FileCheck2,
} from "lucide-react";
import { FactMeshSummary } from "../../../types";

export interface FactMeshSummaryCardsProps {
  summary: FactMeshSummary;
  onFilterStatus?: (status: string) => void;
  activeFilter?: string;
}

export function FactMeshSummaryCards({
  summary,
  onFilterStatus,
  activeFilter = "all",
}: FactMeshSummaryCardsProps) {
  const verifiedPct = summary.totalClaims > 0
    ? Math.round((summary.verifiedClaims / summary.totalClaims) * 100)
    : 100;

  const numbersPct = summary.numbersChecked > 0
    ? `${summary.numbersVerified}/${summary.numbersChecked}`
    : "None";

  const datesPct = summary.datesChecked > 0
    ? `${summary.datesVerified}/${summary.datesChecked}`
    : "None";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Total Claims */}
      <button
        type="button"
        onClick={() => onFilterStatus && onFilterStatus("all")}
        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
          activeFilter === "all"
            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
            : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${activeFilter === "all" ? "text-slate-300" : "text-slate-500"}`}>
            Claims Total
          </span>
          <Layers className={`w-3.5 h-3.5 ${activeFilter === "all" ? "text-slate-300" : "text-slate-400"}`} />
        </div>
        <div className="mt-1.5 text-xl font-bold">{summary.totalClaims}</div>
        <div className={`text-[10px] mt-0.5 ${activeFilter === "all" ? "text-slate-300" : "text-slate-500"}`}>
          Full deliverable matrix
        </div>
      </button>

      {/* 2. Verified Claims */}
      <button
        type="button"
        onClick={() => onFilterStatus && onFilterStatus("verified")}
        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
          activeFilter === "verified"
            ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
            : "bg-emerald-50/70 text-emerald-950 border-emerald-200/90 hover:border-emerald-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${activeFilter === "verified" ? "text-emerald-100" : "text-emerald-700"}`}>
            Verified
          </span>
          <CheckCircle2 className={`w-3.5 h-3.5 ${activeFilter === "verified" ? "text-emerald-200" : "text-emerald-600"}`} />
        </div>
        <div className="mt-1.5 text-xl font-bold flex items-baseline gap-1.5">
          <span>{summary.verifiedClaims}</span>
          <span className={`text-xs font-normal ${activeFilter === "verified" ? "text-emerald-200" : "text-emerald-600"}`}>
            ({verifiedPct}%)
          </span>
        </div>
        <div className={`text-[10px] mt-0.5 ${activeFilter === "verified" ? "text-emerald-100" : "text-emerald-700"}`}>
          Authoritative source match
        </div>
      </button>

      {/* 3. Inferred Claims */}
      <button
        type="button"
        onClick={() => onFilterStatus && onFilterStatus("inferred")}
        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
          activeFilter === "inferred"
            ? "bg-blue-700 text-white border-blue-700 shadow-xs"
            : "bg-blue-50/70 text-blue-950 border-blue-200/90 hover:border-blue-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${activeFilter === "inferred" ? "text-blue-100" : "text-blue-700"}`}>
            Inferred
          </span>
          <HelpCircle className={`w-3.5 h-3.5 ${activeFilter === "inferred" ? "text-blue-200" : "text-blue-600"}`} />
        </div>
        <div className="mt-1.5 text-xl font-bold">{summary.inferredClaims}</div>
        <div className={`text-[10px] mt-0.5 ${activeFilter === "inferred" ? "text-blue-100" : "text-blue-700"}`}>
          Contextual synthesis
        </div>
      </button>

      {/* 4. Unsupported Claims / Potential Hallucinations */}
      <button
        type="button"
        onClick={() => onFilterStatus && onFilterStatus("unsupported")}
        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
          summary.unsupportedClaims > 0
            ? activeFilter === "unsupported"
              ? "bg-rose-700 text-white border-rose-700 shadow-xs ring-2 ring-rose-400"
              : "bg-rose-50 text-rose-950 border-rose-300 hover:border-rose-400 animate-pulse"
            : activeFilter === "unsupported"
            ? "bg-slate-800 text-white border-slate-800"
            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider ${
              summary.unsupportedClaims > 0
                ? activeFilter === "unsupported"
                  ? "text-rose-100"
                  : "text-rose-700"
                : activeFilter === "unsupported"
                ? "text-slate-300"
                : "text-slate-500"
            }`}
          >
            Unsupported
          </span>
          <AlertTriangle
            className={`w-3.5 h-3.5 ${
              summary.unsupportedClaims > 0
                ? activeFilter === "unsupported"
                  ? "text-rose-200"
                  : "text-rose-600"
                : "text-slate-400"
            }`}
          />
        </div>
        <div className="mt-1.5 text-xl font-bold flex items-baseline gap-1">
          <span>{summary.unsupportedClaims}</span>
          {summary.unsupportedClaims > 0 && (
            <span className="text-[10px] font-semibold text-rose-600 uppercase">Attention</span>
          )}
        </div>
        <div
          className={`text-[10px] mt-0.5 ${
            summary.unsupportedClaims > 0
              ? activeFilter === "unsupported"
                ? "text-rose-100"
                : "text-rose-700 font-medium"
              : "text-slate-500"
          }`}
        >
          {summary.unsupportedClaims > 0 ? "Review hallucination" : "Zero ungrounded"}
        </div>
      </button>

      {/* 5. Numbers / Metrics Verified */}
      <button
        type="button"
        onClick={() => onFilterStatus && onFilterStatus("numbers")}
        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
          activeFilter === "numbers"
            ? "bg-amber-700 text-white border-amber-700 shadow-xs"
            : "bg-amber-50/60 text-amber-950 border-amber-200 hover:border-amber-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${activeFilter === "numbers" ? "text-amber-100" : "text-amber-800"}`}>
            Metrics / Stats
          </span>
          <Hash className={`w-3.5 h-3.5 ${activeFilter === "numbers" ? "text-amber-200" : "text-amber-600"}`} />
        </div>
        <div className="mt-1.5 text-xl font-bold">{numbersPct}</div>
        <div className={`text-[10px] mt-0.5 ${activeFilter === "numbers" ? "text-amber-100" : "text-amber-700"}`}>
          Exact numerical audit
        </div>
      </button>

      {/* 6. Dates & Deadlines */}
      <button
        type="button"
        onClick={() => onFilterStatus && onFilterStatus("dates")}
        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
          activeFilter === "dates"
            ? "bg-purple-700 text-white border-purple-700 shadow-xs"
            : "bg-purple-50/60 text-purple-950 border-purple-200 hover:border-purple-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${activeFilter === "dates" ? "text-purple-100" : "text-purple-800"}`}>
            Dates / Deadlines
          </span>
          <Calendar className={`w-3.5 h-3.5 ${activeFilter === "dates" ? "text-purple-200" : "text-purple-600"}`} />
        </div>
        <div className="mt-1.5 text-xl font-bold">{datesPct}</div>
        <div className={`text-[10px] mt-0.5 ${activeFilter === "dates" ? "text-purple-100" : "text-purple-700"}`}>
          Temporal grounding
        </div>
      </button>
    </div>
  );
}
