import React from "react";
import {
  FileText,
  FileCode,
  Image as ImageIcon,
  Video as VideoIcon,
  File as GenericFile,
  X,
  CheckCircle2,
} from "lucide-react";
import { SourceFileMetadata } from "../../types";
import { getFileTypeLabel } from "../../utils/fileValidation";

export interface SelectedFileCardProps {
  metadata: SourceFileMetadata;
  onRemove: () => void;
}

export function SelectedFileCard({ metadata, onRemove }: SelectedFileCardProps) {
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
            </div>
            <div className="flex items-center gap-1.5 pt-1 text-emerald-600 font-medium text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ready to continue</span>
            </div>
          </div>
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors cursor-pointer shrink-0"
          title="Remove file"
          aria-label={`Remove file ${metadata.name}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Local-first transparency disclaimer */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Held in browser memory (local-first)</span>
        <span>Not uploaded or processed</span>
      </div>
    </div>
  );
}
