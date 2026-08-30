import React, { useState } from "react";
import {
  FileText,
  FileCode,
  Image as ImageIcon,
  Video as VideoIcon,
  File as GenericFile,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import { SourceFileMetadata } from "../../types";
import { getFileTypeLabel } from "../../utils/fileValidation";

export interface SelectedFileCardProps {
  metadata: SourceFileMetadata;
  onRemove: () => void;
  isExtracting?: boolean;
  extractionError?: string | null;
  extractedText?: string;
  wordCount?: number;
  charCount?: number;
  pageCount?: number;
}

export function SelectedFileCard({
  metadata,
  onRemove,
  isExtracting = false,
  extractionError = null,
  extractedText = "",
  wordCount = 0,
  charCount = 0,
  pageCount,
}: SelectedFileCardProps) {
  const [showPreview, setShowPreview] = useState(false);

  const getIcon = () => {
    switch (metadata.category) {
      case "pdf":
      case "docx":
        return <FileText className="w-6 h-6 text-blue-600" />;
      case "text":
        return <FileCode className="w-6 h-6 text-emerald-600" />;
      case "image":
        return <ImageIcon className="w-6 h-6 text-amber-600" />;
      case "video":
        return <VideoIcon className="w-6 h-6 text-purple-600" />;
      default:
        return <GenericFile className="w-6 h-6 text-slate-600" />;
    }
  };

  const getCategoryBg = () => {
    switch (metadata.category) {
      case "pdf":
      case "docx":
        return "bg-blue-50 border-blue-100";
      case "text":
        return "bg-emerald-50 border-emerald-100";
      case "image":
        return "bg-amber-50 border-amber-100";
      case "video":
        return "bg-purple-50 border-purple-100";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  const previewSnippet = extractedText
    ? extractedText.slice(0, 300) + (extractedText.length > 300 ? "..." : "")
    : "";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs transition-all">
      <div className="flex items-start justify-between gap-4">
        {/* File Icon & Info */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${getCategoryBg()}`}
          >
            {getIcon()}
          </div>

          <div className="min-w-0 space-y-1">
            <h4 className="text-sm font-semibold text-slate-900 truncate max-w-xs sm:max-w-md" title={metadata.name}>
              {metadata.name}
            </h4>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-700">
                {getFileTypeLabel(metadata.category, metadata.file)}
              </span>
              <span>•</span>
              <span>{metadata.formattedSize}</span>
              {pageCount && pageCount > 0 && (
                <>
                  <span>•</span>
                  <span>{pageCount} {pageCount === 1 ? "page" : "pages"}</span>
                </>
              )}
            </div>

            {/* Extraction Status */}
            {isExtracting && (
              <div className="flex items-center gap-1.5 pt-1 text-blue-600 font-medium text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Extracting document text...</span>
              </div>
            )}

            {!isExtracting && extractionError && (
              <div className="flex items-center gap-1.5 pt-1 text-red-600 font-medium text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="line-clamp-2">{extractionError}</span>
              </div>
            )}

            {!isExtracting && !extractionError && extractedText && (
              <div className="flex items-center gap-1.5 pt-1 text-emerald-600 font-medium text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Ready • {wordCount.toLocaleString()} words ({charCount.toLocaleString()} characters) extracted
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {extractedText && (
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer text-xs flex items-center gap-1"
              title={showPreview ? "Hide text preview" : "Show text preview"}
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">{showPreview ? "Hide Preview" : "Preview Text"}</span>
              {showPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors cursor-pointer"
            title="Remove file"
            aria-label={`Remove file ${metadata.name}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Text Preview Drawer */}
      {showPreview && extractedText && (
        <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1.5 animate-in fade-in">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <span>Extracted Source Text Sample</span>
            <span>{charCount.toLocaleString()} chars</span>
          </div>
          <p className="font-mono text-xs whitespace-pre-wrap line-clamp-6 text-slate-800 bg-white p-2.5 rounded border border-slate-200/80">
            {previewSnippet}
          </p>
        </div>
      )}

      {/* Local-first transparency disclaimer */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Extracted client-side (local-first)</span>
        <span>Ready for transformation</span>
      </div>
    </div>
  );
}
