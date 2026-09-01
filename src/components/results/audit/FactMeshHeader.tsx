import React from "react";
import {
  ShieldCheck,
  RefreshCw,
  FileDown,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
} from "lucide-react";
import { FactMeshAudit } from "../../../types";
import { Button } from "../../ui/Button";
import { sanitizeFilename, downloadJsonFile, downloadTextFile } from "../../../utils/exportHelpers";

export interface FactMeshHeaderProps {
  audit: FactMeshAudit;
  projectName?: string;
  isAuditing?: boolean;
  onRerunAudit: () => void;
  onExit: () => void;
}

export function FactMeshHeader({
  audit,
  projectName = "Project",
  isAuditing = false,
  onRerunAudit,
  onExit,
}: FactMeshHeaderProps) {
  const score = audit.summary.integrityScore;

  // Determine score color theme
  const getScoreTheme = (val: number) => {
    if (val >= 85) {
      return {
        bg: "bg-emerald-50 text-emerald-800 border-emerald-300",
        pill: "bg-emerald-600 text-white",
        label: "High Grounding Confidence",
        badge: "bg-emerald-100 text-emerald-800",
      };
    }
    if (val >= 65) {
      return {
        bg: "bg-amber-50 text-amber-800 border-amber-300",
        pill: "bg-amber-600 text-white",
        label: "Moderate Grounding (Review Inferences)",
        badge: "bg-amber-100 text-amber-800",
      };
    }
    return {
      bg: "bg-rose-50 text-rose-800 border-rose-300",
      pill: "bg-rose-600 text-white",
      label: "Low Grounding (Potential Hallucinations)",
      badge: "bg-rose-100 text-rose-800",
    };
  };

  const theme = getScoreTheme(score);

  const handleExportAuditJson = () => {
    const safeProject = sanitizeFilename(projectName);
    const safeDeliv = sanitizeFilename(audit.deliverableId);
    downloadJsonFile(`${safeProject}_${safeDeliv}_factmesh_audit.json`, audit);
  };

  const handleExportAuditMarkdown = () => {
    const lines: string[] = [];
    lines.push(`# FactMesh™ Grounding & Provenance Audit Report`);
    lines.push(`**Project**: ${projectName}`);
    lines.push(`**Deliverable**: ${audit.deliverableTitle || audit.deliverableId}`);
    lines.push(`**Audit ID**: \`${audit.auditId}\``);
    lines.push(`**Generated At**: ${new Date(audit.generatedAt).toLocaleString()}`);
    lines.push(`\n---\n`);
    lines.push(`## Grounding Integrity Score: ${score} / 100 (${theme.label})`);
    lines.push(`- **Total Claims Audited**: ${audit.summary.totalClaims}`);
    lines.push(`- **Verified Claims**: ${audit.summary.verifiedClaims} (${Math.round((audit.summary.verifiedClaims / Math.max(1, audit.summary.totalClaims)) * 100)}%)`);
    lines.push(`- **Inferred Claims**: ${audit.summary.inferredClaims}`);
    lines.push(`- **Unsupported Claims**: ${audit.summary.unsupportedClaims}`);
    lines.push(`- **Numbers / Metrics Verified**: ${audit.summary.numbersVerified} / ${audit.summary.numbersChecked}`);
    lines.push(`- **Dates Verified**: ${audit.summary.datesVerified} / ${audit.summary.datesChecked}`);
    lines.push(`\n---\n`);
    lines.push(`## Claim Ledger & Grounding Traceability\n`);

    audit.claims.forEach((c) => {
      const statusIcon = c.status === "verified" ? "[✓ VERIFIED]" : c.status === "inferred" ? "[~ INFERRED]" : c.status === "unsupported" ? "[⚠ UNSUPPORTED]" : "[INFO]";
      const sources = c.supportingSourceIds.length > 0 ? c.supportingSourceIds.join(", ") : "None";
      lines.push(`### ${c.claimId}: ${statusIcon} (${c.confidence}% confidence)`);
      lines.push(`> "${c.claimText}"`);
      lines.push(`- **Type**: ${c.claimType}`);
      lines.push(`- **Supporting Evidence**: ${sources}`);
      lines.push(`- **Explanation**: ${c.explanation}`);
      if (c.detectedNumberOrDate) {
        lines.push(`- **Detected Metric/Date**: \`${c.detectedNumberOrDate}\``);
      }
      lines.push(``);
    });

    lines.push(`\n---\n`);
    lines.push(`## Authoritative Source Evidence Units\n`);
    audit.sourceUnits.forEach((u) => {
      const pageInfo = u.pageNumber ? ` (Page ${u.pageNumber})` : "";
      lines.push(`**[${u.id}]**${pageInfo} ${u.text}\n`);
    });

    const safeProject = sanitizeFilename(projectName);
    const safeDeliv = sanitizeFilename(audit.deliverableId);
    downloadTextFile(`${safeProject}_${safeDeliv}_factmesh_report.md`, lines.join("\n"));
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Brand, Deliverable, and Back action */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4 text-slate-500" />}
              onClick={onExit}
              className="text-slate-600 hover:text-slate-900 -ml-2 text-xs"
            >
              Back to Deliverable
            </Button>
            <span className="text-slate-300">|</span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              FactMesh™ Provenance Engine
            </div>
            {audit.auditId === "demo-audit-nidci-001" || audit.auditId?.startsWith("demo-") ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-semibold">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Sample Provenance Matrix
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                v1.0 • Grounding Matrix
              </span>
            )}
          </div>

          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 pt-1">
            <span>Grounding Audit:</span>
            <span className="text-indigo-600 capitalize">
              {audit.deliverableTitle || audit.deliverableId.replace(/_/g, " ")}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Source: <strong className="text-slate-700">{audit.sourceSummary.sourceName}</strong> • {audit.sourceUnits.length} evidence units extracted
          </p>
        </div>

        {/* Right: Integrity Score Widget & Action Buttons */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Integrity Score Badge */}
          <div
            className={`flex items-center gap-3 px-3.5 py-2 rounded-xl border ${theme.bg}`}
          >
            <div className="text-center">
              <div className="text-2xl font-black tracking-tight leading-none">
                {score}
                <span className="text-xs font-medium text-slate-500">/100</span>
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider mt-0.5">
                Integrity Score
              </div>
            </div>
            <div className="h-8 w-px bg-slate-300/60 hidden sm:block" />
            <div className="text-xs hidden sm:block">
              <div className="font-semibold">{theme.label}</div>
              <div className="text-[11px] opacity-80">
                {audit.summary.verifiedClaims} of {audit.summary.totalClaims} claims verified
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? "animate-spin" : ""}`} />}
              disabled={isAuditing}
              onClick={onRerunAudit}
              className="text-xs"
            >
              {isAuditing ? "Auditing..." : "Re-run Audit"}
            </Button>

            <div className="relative group">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<FileDown className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Export Report
              </Button>
              <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 hidden group-hover:block group-focus-within:block z-20">
                <button
                  type="button"
                  onClick={handleExportAuditMarkdown}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Markdown Report (.md)
                </button>
                <button
                  type="button"
                  onClick={handleExportAuditJson}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5 text-slate-500" />
                  Audit Schema (.json)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
