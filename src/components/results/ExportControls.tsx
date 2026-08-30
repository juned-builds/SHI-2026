import React, { useState } from "react";
import {
  Copy,
  Check,
  Download,
  FileDown,
  Layers,
  Sparkles,
  FileText,
  Code2,
  Share2,
  Film,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { GeneratedDeliverable, ProjectDraft, TransformationConfig } from "../../types";
import { Button } from "../ui/Button";
import {
  downloadTextFile,
  downloadJsonFile,
  buildCombinedExportMarkdown,
  sanitizeFilename,
} from "../../utils/exportHelpers";
import {
  normalizeVideoPackageData,
  generateSrtCaptions,
  generateContinuousScript,
  generateStoryboardMarkdown,
} from "../../utils/videoPackageUtils";

export interface ExportControlsProps {
  activeDeliverable: GeneratedDeliverable;
  allDeliverables: GeneratedDeliverable[];
  draft: ProjectDraft;
  config: TransformationConfig;
  modelUsed?: string;
  sessionId?: string;
  isEditing?: boolean;
  onToggleEdit?: () => void;
  onOpenRegenerate?: () => void;
  onOpenFactMeshAudit?: () => void;
}

export function ExportControls({
  activeDeliverable,
  allDeliverables,
  draft,
  config,
  modelUsed = "gemini-3.7-flash",
  sessionId,
  isEditing = false,
  onToggleEdit,
  onOpenRegenerate,
  onOpenFactMeshAudit,
}: ExportControlsProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const isVideo = activeDeliverable.deliverableId === "video_package";

  const handleCopy = async () => {
    try {
      setCopyError(null);
      await navigator.clipboard.writeText(activeDeliverable.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err: any) {
      // Fallback for older browsers or restricted iframe environments
      try {
        const el = document.createElement("textarea");
        el.value = activeDeliverable.content;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } catch (fallbackErr) {
        setCopyError("Clipboard copy was restricted by the browser.");
        setTimeout(() => setCopyError(null), 3000);
      }
    }
  };

  const handleDownloadMarkdown = () => {
    const safeProject = sanitizeFilename(draft.name || "project");
    const safeDeliv = sanitizeFilename(activeDeliverable.deliverableId);
    const filename = `${safeProject}_${safeDeliv}.md`;
    downloadTextFile(filename, activeDeliverable.content);
  };

  const handleDownloadJson = () => {
    if (!activeDeliverable.structuredData) return;
    const safeProject = sanitizeFilename(draft.name || "project");
    const safeDeliv = sanitizeFilename(activeDeliverable.deliverableId);
    const filename = `${safeProject}_${safeDeliv}.json`;
    downloadJsonFile(filename, activeDeliverable.structuredData);
  };

  const handleDownloadSrt = () => {
    if (!isVideo || !activeDeliverable.structuredData) return;
    const pkg = normalizeVideoPackageData(activeDeliverable.structuredData, activeDeliverable.title);
    const safeProject = sanitizeFilename(draft.name || "video");
    const filename = `${safeProject}_captions.srt`;
    const srt = generateSrtCaptions(pkg);
    downloadTextFile(filename, srt);
  };

  const handleDownloadScript = () => {
    if (!isVideo || !activeDeliverable.structuredData) return;
    const pkg = normalizeVideoPackageData(activeDeliverable.structuredData, activeDeliverable.title);
    const safeProject = sanitizeFilename(draft.name || "video");
    const filename = `${safeProject}_teleprompter_script.md`;
    const script = generateContinuousScript(pkg);
    downloadTextFile(filename, script);
  };

  const handleExportAll = () => {
    const safeProject = sanitizeFilename(draft.name || "project");
    const filename = `${safeProject}_full_transformation_bundle.md`;
    const fullMarkdown = buildCombinedExportMarkdown(
      draft,
      config,
      allDeliverables,
      modelUsed,
      sessionId
    );
    downloadTextFile(filename, fullMarkdown);
  };

  const hasJson =
    activeDeliverable.structuredData &&
    Object.keys(activeDeliverable.structuredData).length > 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
      {/* Left side actions (Edit / Regenerate / FactMesh Grounding) */}
      <div className="flex flex-wrap items-center gap-2">
        {onOpenFactMeshAudit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenFactMeshAudit}
            icon={<ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />}
            className="text-xs text-indigo-900 border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/80 font-semibold shadow-2xs"
          >
            {activeDeliverable.factMeshAudit
              ? `FactMesh™ Audit (${activeDeliverable.factMeshAudit.summary.integrityScore}%)`
              : "Verify Grounding (FactMesh™)"}
          </Button>
        )}

        {onToggleEdit && (
          <Button
            type="button"
            variant={isEditing ? "primary" : "outline"}
            size="sm"
            onClick={onToggleEdit}
            className="text-xs"
          >
            {isEditing ? "Editing Mode" : "Edit Content"}
          </Button>
        )}

        {onOpenRegenerate && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenRegenerate}
            className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
          >
            Regenerate This Deliverable
          </Button>
        )}
      </div>

      {/* Right side export actions */}
      <div className="flex flex-wrap items-center gap-2">
        {copyError && (
          <span className="text-[11px] text-red-600 mr-1">{copyError}</span>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
          icon={
            copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-500" />
            )
          }
          className="text-xs"
        >
          {copied ? "Copied!" : "Copy"}
        </Button>

        {isVideo && hasJson && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadSrt}
              icon={<MessageSquare className="w-3.5 h-3.5 text-emerald-600" />}
              className="text-xs text-emerald-800 border-emerald-200 hover:bg-emerald-50"
            >
              Download .SRT
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadScript}
              icon={<Film className="w-3.5 h-3.5 text-purple-600" />}
              className="text-xs text-purple-800 border-purple-200 hover:bg-purple-50"
            >
              Download Script
            </Button>
          </>
        )}

        {hasJson && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadJson}
            icon={<Code2 className="w-3.5 h-3.5 text-slate-500" />}
            className="text-xs"
          >
            Download JSON
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDownloadMarkdown}
          icon={<Download className="w-3.5 h-3.5 text-slate-500" />}
          className="text-xs"
        >
          Download .MD
        </Button>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleExportAll}
          icon={<FileDown className="w-3.5 h-3.5" />}
          className="text-xs shadow-xs"
        >
          Export All Bundle
        </Button>
      </div>
    </div>
  );
}

