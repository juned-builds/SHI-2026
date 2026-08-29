import React, { useState } from "react";
import {
  Copy,
  Check,
  Download,
  Sparkles,
  Layers,
  FileText,
  Share2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cpu,
} from "lucide-react";
import { GeneratedDeliverable, DeliverableId } from "../../types";
import { DELIVERABLES_CATALOG } from "../../constants/transformationOptions";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

export interface GeneratedDeliverablesViewerProps {
  deliverables: GeneratedDeliverable[];
  modelUsed?: string | null;
  sessionId?: string;
  generatedAt?: string;
}

export function GeneratedDeliverablesViewer({
  deliverables,
  modelUsed = "gemini-3.7-flash",
  sessionId,
  generatedAt,
}: GeneratedDeliverablesViewerProps) {
  const [selectedId, setSelectedId] = useState<DeliverableId>(() => {
    return deliverables[0]?.deliverableId || "executive_summary";
  });
  const [copied, setCopied] = useState<boolean>(false);
  const [showStructuredData, setShowStructuredData] = useState<boolean>(false);

  const activeDeliverable = deliverables.find((d) => d.deliverableId === selectedId) || deliverables[0];
  const activeMeta = DELIVERABLES_CATALOG.find((m) => m.id === activeDeliverable?.deliverableId);

  const handleCopy = () => {
    if (!activeDeliverable) return;
    navigator.clipboard.writeText(activeDeliverable.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeDeliverable) return;
    const blob = new Blob([activeDeliverable.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeDeliverable.deliverableId}_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!deliverables || deliverables.length === 0) {
    return null;
  }

  const completedCount = deliverables.filter((d) => d.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Overview Metadata Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs text-emerald-900">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-semibold text-emerald-950 flex items-center gap-2">
              <span>AI Content Transformation Complete</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-medium">
                <Cpu className="w-2.5 h-2.5" />
                {modelUsed || "Gemini Engine"}
              </span>
            </div>
            <p className="text-emerald-700 text-[11px] mt-0.5">
              Successfully synthesized {completedCount} of {deliverables.length} requested deliverables with structural fidelity.
            </p>
          </div>
        </div>

        {sessionId && (
          <div className="text-[11px] text-emerald-700 font-mono bg-emerald-100/60 px-2.5 py-1 rounded-md">
            Session: {sessionId.slice(0, 16)}...
          </div>
        )}
      </div>

      {/* Deliverable Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-thin">
        {deliverables.map((deliv) => {
          const meta = DELIVERABLES_CATALOG.find((m) => m.id === deliv.deliverableId);
          const isSelected = deliv.deliverableId === selectedId;
          const isFailed = deliv.status === "failed";

          return (
            <button
              key={deliv.deliverableId}
              type="button"
              onClick={() => {
                setSelectedId(deliv.deliverableId);
                setShowStructuredData(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-lg text-xs font-medium transition-all whitespace-nowrap border-b-2 -mb-[2px] ${
                isSelected
                  ? "bg-white border-blue-600 text-blue-700 shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {isFailed ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              ) : (
                <Check className={`w-3.5 h-3.5 ${isSelected ? "text-blue-600" : "text-emerald-500"} shrink-0`} />
              )}
              <span>{meta?.name || deliv.title || deliv.deliverableId}</span>
              {meta?.badgeLabel && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-normal">
                  {meta.badgeLabel}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Deliverable Content Box */}
      {activeDeliverable && (
        <Card className="p-0 overflow-hidden shadow-xs border-slate-200">
          {/* Header Toolbar */}
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  {activeDeliverable.title || activeMeta?.name || activeDeliverable.deliverableId}
                </h3>
                {activeMeta?.category && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-medium capitalize">
                    {activeMeta.category}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeMeta?.description || "Engineered structured deliverable output."}
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {activeDeliverable.structuredData && Object.keys(activeDeliverable.structuredData).length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStructuredData(!showStructuredData)}
                  icon={showStructuredData ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  {showStructuredData ? "Hide Schema Data" : "View Structured JSON"}
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
                icon={<Download className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Download (.md)
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCopy}
                icon={copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                {copied ? "Copied!" : "Copy Content"}
              </Button>
            </div>
          </div>

          {/* Structured JSON Inspector (Collapsible) */}
          {showStructuredData && activeDeliverable.structuredData && (
            <div className="p-4 bg-slate-900 border-b border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto max-h-72">
              <div className="text-[10px] text-slate-400 mb-2 uppercase tracking-wider font-semibold">
                Validated JSON Output Contract:
              </div>
              <pre>{JSON.stringify(activeDeliverable.structuredData, null, 2)}</pre>
            </div>
          )}

          {/* Main Markdown Text View */}
          <div className="p-6 bg-white min-h-[220px]">
            {activeDeliverable.status === "failed" ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                <div className="font-semibold mb-1">Deliverable Generation Incomplete</div>
                <p>{activeDeliverable.error || "The AI engine was unable to synthesize this specific deliverable structure."}</p>
              </div>
            ) : (
              <div className="prose prose-slate max-w-none text-slate-800 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                {activeDeliverable.content}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
