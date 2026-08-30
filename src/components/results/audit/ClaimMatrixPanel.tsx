import React, { useState } from "react";
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  FileText,
  ExternalLink,
  ChevronRight,
  Hash,
  Calendar,
} from "lucide-react";
import { FactMeshClaim, FactMeshClaimStatus } from "../../../types";
import { ClaimStatusBadge } from "./ClaimStatusBadge";
import { MarkdownRenderer } from "../MarkdownRenderer";

export interface ClaimMatrixPanelProps {
  claims: FactMeshClaim[];
  rawContent: string;
  selectedClaimId: string | null;
  onSelectClaim: (claim: FactMeshClaim) => void;
  onSelectSourceUnit: (unitId: string) => void;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
}

export function ClaimMatrixPanel({
  claims,
  rawContent,
  selectedClaimId,
  onSelectClaim,
  onSelectSourceUnit,
  activeFilter = "all",
  onFilterChange,
}: ClaimMatrixPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"ledger" | "document">("ledger");

  // Filtering
  const filteredClaims = claims.filter((claim) => {
    // 1. Status / Category Filter
    if (activeFilter === "verified" && claim.status !== "verified") return false;
    if (activeFilter === "inferred" && claim.status !== "inferred") return false;
    if (activeFilter === "unsupported" && claim.status !== "unsupported") return false;
    if (activeFilter === "numbers") {
      const isNum = claim.claimType === "number" || (claim.detectedNumberOrDate && /\d+/.test(claim.detectedNumberOrDate));
      if (!isNum) return false;
    }
    if (activeFilter === "dates") {
      const isDate = claim.claimType === "date" || (claim.detectedNumberOrDate && /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|202\d|\d{1,2}\/\d{1,2})/i.test(claim.detectedNumberOrDate));
      if (!isDate) return false;
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        claim.claimId.toLowerCase().includes(q) ||
        claim.claimText.toLowerCase().includes(q) ||
        claim.explanation.toLowerCase().includes(q) ||
        claim.claimType.toLowerCase().includes(q) ||
        (claim.detectedNumberOrDate && claim.detectedNumberOrDate.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
      {/* Top Header & View Mode Switcher */}
      <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-200/80 text-slate-700 rounded-md">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Generated Claims Matrix
              </h3>
              <p className="text-[11px] text-slate-500">
                {claims.length} Extracted Claims • Grounding Breakdown
              </p>
            </div>
          </div>

          {/* Sub-view toggle */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setViewMode("ledger")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                viewMode === "ledger"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Claims Ledger
            </button>
            <button
              type="button"
              onClick={() => setViewMode("document")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                viewMode === "document"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Document View
            </button>
          </div>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex-1 min-w-[180px] relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search claims, numbers, policies..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => onFilterChange && onFilterChange("all")}
              className={`px-2 py-1 rounded text-[10px] font-medium border cursor-pointer ${
                activeFilter === "all"
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              All ({claims.length})
            </button>
            <button
              type="button"
              onClick={() => onFilterChange && onFilterChange("verified")}
              className={`px-2 py-1 rounded text-[10px] font-medium border cursor-pointer ${
                activeFilter === "verified"
                  ? "bg-emerald-700 text-white border-emerald-700"
                  : "bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70"
              }`}
            >
              Verified
            </button>
            <button
              type="button"
              onClick={() => onFilterChange && onFilterChange("inferred")}
              className={`px-2 py-1 rounded text-[10px] font-medium border cursor-pointer ${
                activeFilter === "inferred"
                  ? "bg-blue-700 text-white border-blue-700"
                  : "bg-blue-50/70 text-blue-800 border-blue-200 hover:bg-blue-100/70"
              }`}
            >
              Inferred
            </button>
            <button
              type="button"
              onClick={() => onFilterChange && onFilterChange("unsupported")}
              className={`px-2 py-1 rounded text-[10px] font-medium border cursor-pointer ${
                activeFilter === "unsupported"
                  ? "bg-rose-700 text-white border-rose-700"
                  : "bg-rose-50/70 text-rose-800 border-rose-200 hover:bg-rose-100/70"
              }`}
            >
              Unsupported
            </button>
            <button
              type="button"
              onClick={() => onFilterChange && onFilterChange("numbers")}
              className={`px-2 py-1 rounded text-[10px] font-medium border cursor-pointer ${
                activeFilter === "numbers"
                  ? "bg-amber-700 text-white border-amber-700"
                  : "bg-amber-50/70 text-amber-800 border-amber-200 hover:bg-amber-100/70"
              }`}
            >
              Metrics #
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 max-h-[640px]">
        {viewMode === "document" ? (
          <div className="space-y-3">
            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-lg text-xs text-amber-900">
              <span className="font-semibold">Document Provenance View:</span> Below is the rendered deliverable. Switch to Claims Ledger to inspect each claim and corresponding source citations.
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <MarkdownRenderer content={rawContent} />
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredClaims.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No claims match the selected filter & search criteria.
              </div>
            ) : (
              filteredClaims.map((claim) => {
                const isSelected = selectedClaimId === claim.claimId;

                return (
                  <div
                    key={claim.claimId}
                    onClick={() => onSelectClaim(claim)}
                    className={`p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-300 shadow-xs"
                        : claim.status === "unsupported"
                        ? "bg-rose-50/40 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                        : "bg-white border-slate-200 hover:bg-slate-50/80 hover:border-slate-300"
                    }`}
                  >
                    {/* Top Row: Claim ID, Status Badge, Type, Confidence */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {claim.claimId}
                        </span>

                        <ClaimStatusBadge status={claim.status} size="sm" />

                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">
                          {claim.claimType.replace(/_/g, " ")}
                        </span>

                        {claim.detectedNumberOrDate && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-900 border border-amber-200">
                            <Hash className="w-2.5 h-2.5" />
                            {claim.detectedNumberOrDate}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span className="font-mono text-[10px] font-medium text-slate-500">
                          {claim.confidence}% confidence
                        </span>
                      </div>
                    </div>

                    {/* Claim Text */}
                    <p className="text-slate-900 font-medium leading-relaxed text-[12px] mb-2">
                      &quot;{claim.claimText}&quot;
                    </p>

                    {/* Explanation */}
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 mb-2.5">
                      <span className="font-semibold text-slate-700">Audit Finding: </span>
                      {claim.explanation}
                    </div>

                    {/* Supporting Source ID pills */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                          Grounded In:
                        </span>
                        {claim.supportingSourceIds.length === 0 ? (
                          <span className="text-[10px] font-medium text-rose-600 italic">
                            No source evidence found (Unsupported)
                          </span>
                        ) : (
                          claim.supportingSourceIds.map((sId) => (
                            <button
                              key={sId}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectClaim(claim);
                                onSelectSourceUnit(sId);
                              }}
                              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border border-indigo-200 transition-all cursor-pointer"
                            >
                              <span>{sId}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </button>
                          ))
                        )}
                      </div>

                      <span className="text-[10px] text-indigo-600 font-medium flex items-center gap-0.5">
                        {isSelected ? "Inspecting" : "Click to inspect"}
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Click any source pill [S00X] to jump directly to source sentence.</span>
        <span className="font-mono text-[10px] text-slate-400">Claim-Level Provenance</span>
      </div>
    </div>
  );
}
