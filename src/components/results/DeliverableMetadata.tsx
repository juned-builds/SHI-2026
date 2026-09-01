import React from "react";
import {
  FileText,
  Clock,
  Cpu,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  ShieldCheck,
  Users,
} from "lucide-react";
import { GeneratedDeliverable } from "../../types";
import { DELIVERABLES_CATALOG } from "../../constants/transformationOptions";

export interface DeliverableMetadataProps {
  deliverable: GeneratedDeliverable;
  modelUsed?: string;
  projectName?: string;
  onOpenFactMeshAudit?: () => void;
  onOpenAudienceLens?: () => void;
}

export function DeliverableMetadata({
  deliverable,
  modelUsed = "gemini-3.7-flash",
  projectName,
  onOpenFactMeshAudit,
  onOpenAudienceLens,
}: DeliverableMetadataProps) {
  const meta = DELIVERABLES_CATALOG.find((m) => m.id === deliverable.deliverableId);
  const wordCount = deliverable.content.trim()
    ? deliverable.content.trim().split(/\s+/).length
    : 0;
  const charCount = deliverable.content.length;
  const audit = deliverable.factMeshAudit;
  const audienceReport = deliverable.audienceLensReport;

  return (
    <div className="flex flex-wrap items-center gap-2 py-2 px-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
      {/* Category Pill */}
      {meta?.category && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-medium capitalize">
          <Layers className="w-3 h-3 text-blue-500" />
          {meta.category}
        </span>
      )}

      {/* Model Pill */}
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium">
        <Cpu className="w-3 h-3 text-slate-500" />
        {modelUsed}
      </span>

      {/* Word and Char counts */}
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100/70 border border-slate-200 text-slate-600 text-[11px]">
        <FileText className="w-3 h-3 text-slate-400" />
        {wordCount.toLocaleString()} words &bull; {charCount.toLocaleString()} chars
      </span>

      {/* FactMesh Grounding Status or Quick Trigger */}
      {audit ? (
        deliverable.factMeshAuditStale ? (
          <button
            type="button"
            onClick={onOpenFactMeshAudit}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-400 bg-amber-50 text-amber-900 text-[11px] font-semibold cursor-pointer transition-all hover:bg-amber-100"
            title="Content changed after verification. Click to re-verify with FactMesh™."
          >
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            FactMesh: Re-audit Needed
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenFactMeshAudit}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold cursor-pointer transition-all ${
              audit.summary.integrityScore >= 85
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                : audit.summary.integrityScore >= 65
                ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            FactMesh: {audit.summary.integrityScore}% Score
          </button>
        )
      ) : onOpenFactMeshAudit ? (
        <button
          type="button"
          onClick={onOpenFactMeshAudit}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-[11px] font-medium cursor-pointer transition-all"
        >
          <ShieldCheck className="w-3 h-3 text-indigo-600" />
          Verify with FactMesh™
        </button>
      ) : null}

      {/* AudienceLens™ Communication Intelligence Status or Trigger */}
      {audienceReport ? (
        deliverable.audienceLensStale ? (
          <button
            type="button"
            onClick={onOpenAudienceLens}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-400 bg-amber-50 text-amber-900 text-[11px] font-semibold cursor-pointer transition-all hover:bg-amber-100"
            title="Content changed after audience evaluation. Click to re-evaluate AudienceLens™."
          >
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            AudienceLens: Re-evaluate
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAudienceLens}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 text-[11px] font-semibold cursor-pointer transition-all"
            title="AudienceLens™ Communication Intelligence evaluated"
          >
            <Users className="w-3 h-3 text-purple-600" />
            AudienceLens™ ({audienceReport.readability.readingScore}/10)
          </button>
        )
      ) : onOpenAudienceLens ? (
        <button
          type="button"
          onClick={onOpenAudienceLens}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50/70 border border-purple-200 text-purple-700 hover:bg-purple-100 text-[11px] font-medium cursor-pointer transition-all"
        >
          <Users className="w-3 h-3 text-purple-600" />
          AudienceLens™
        </button>
      ) : null}

      {/* Edited Status Indicator */}
      {deliverable.isEdited ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
          <Edit3 className="w-3 h-3 text-amber-600" />
          Edited in Workspace
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          AI Synthesized
        </span>
      )}

      {/* Timestamp if available */}
      {deliverable.generatedAt && (
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 ml-auto">
          <Clock className="w-3 h-3" />
          {new Date(deliverable.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </div>
  );
}
