import React from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { FactMeshClaim, SourceEvidenceUnit } from "../../../types";
import { ClaimStatusBadge } from "./ClaimStatusBadge";

export interface ClaimEvidenceDetailCardProps {
  claim: FactMeshClaim | null;
  sourceUnits: SourceEvidenceUnit[];
  onSelectSourceUnit?: (unitId: string) => void;
  onClose?: () => void;
}

export function ClaimEvidenceDetailCard({
  claim,
  sourceUnits,
  onSelectSourceUnit,
  onClose,
}: ClaimEvidenceDetailCardProps) {
  if (!claim) return null;

  const matchedUnits = sourceUnits.filter((u) => claim.supportingSourceIds.includes(u.id));

  return (
    <div className="bg-white border border-indigo-200/90 rounded-xl p-4 shadow-sm space-y-3">
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
            {claim.claimId}
          </span>
          <ClaimStatusBadge status={claim.status} size="sm" />
          <span className="text-xs font-semibold text-slate-800">
            Claim Inspection & Evidence Linkage
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">
            {claim.confidence}% Confidence
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold px-1.5 py-0.5 rounded hover:bg-slate-100 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Left: Generated Claim & Finding */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Generated Claim Statement
          </div>
          <p className="text-xs font-medium text-slate-900 leading-relaxed italic">
            &quot;{claim.claimText}&quot;
          </p>

          <div className="pt-2 border-t border-slate-200/70 text-[11px] text-slate-600">
            <strong className="text-slate-700">Audit Finding: </strong>
            {claim.explanation}
          </div>

          {claim.detectedNumberOrDate && (
            <div className="text-[11px] text-amber-900 bg-amber-50 px-2 py-1 rounded border border-amber-200 font-mono">
              Audited Metric/Date: <strong>{claim.detectedNumberOrDate}</strong>
            </div>
          )}
        </div>

        {/* Right: Matched Source Evidence */}
        <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-200/80 space-y-2">
          <div className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center justify-between">
            <span>Authoritative Source Match</span>
            <span>{matchedUnits.length} citation(s)</span>
          </div>

          {matchedUnits.length === 0 ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
              <div className="font-semibold flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Zero Source Citations Found
              </div>
              <p className="text-[11.5px] text-rose-700">
                This statement was flagged as unsupported because no verifiable facts in the source document substantiate this specific claim.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[140px] overflow-y-auto">
              {matchedUnits.map((unit) => (
                <div
                  key={unit.id}
                  onClick={() => onSelectSourceUnit && onSelectSourceUnit(unit.id)}
                  className="p-2 rounded bg-white border border-indigo-200 text-[11.5px] text-slate-800 hover:border-indigo-400 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between gap-1 mb-1 font-mono text-[10px] text-indigo-700 font-bold">
                    <span>[{unit.id}] {unit.pageNumber ? `(Page ${unit.pageNumber})` : ""}</span>
                    <span className="text-slate-400 flex items-center gap-0.5 font-normal">
                      Focus <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                  <p className="leading-snug">{unit.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
