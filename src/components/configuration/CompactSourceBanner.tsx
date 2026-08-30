import React from "react";
import { FileText, AlignLeft, CheckCircle2, Edit2 } from "lucide-react";
import { ProjectDraft } from "../../types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { getFileTypeLabel } from "../../utils/fileValidation";

export interface CompactSourceBannerProps {
  draft: ProjectDraft;
  onEditSource: () => void;
}

export function CompactSourceBanner({
  draft,
  onEditSource,
}: CompactSourceBannerProps) {
  const isFile = draft.sourceType === "file";
  const sourceName = isFile
    ? draft.sourceFile?.name || "Uploaded Document"
    : "Pasted Raw Text";

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 mt-0.5 sm:mt-0">
            {isFile ? (
              <FileText className="w-5 h-5 text-blue-600" />
            ) : (
              <AlignLeft className="w-5 h-5 text-emerald-600" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Source Content
              </span>
              <Badge variant="success" className="gap-1 py-0 px-2 text-[11px]">
                <CheckCircle2 className="w-3 h-3" />
                Text Extracted & Ready
              </Badge>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                {draft.name}
              </h2>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-xs text-slate-600 truncate">
                {isFile && draft.sourceFile ? (
                  <>
                    <strong className="font-medium text-slate-800">{sourceName}</strong> (
                    {getFileTypeLabel(draft.sourceFile.category, draft.sourceFile.file)} •{" "}
                    {draft.wordCount > 0 ? `${draft.wordCount.toLocaleString()} words, ` : ""}
                    {draft.sourceFile.formattedSize})
                  </>
                ) : (
                  <>
                    <strong className="font-medium text-slate-800">Raw Text</strong> (
                    {draft.wordCount.toLocaleString()} words,{" "}
                    {draft.charCount.toLocaleString()} chars)
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Edit2 className="w-3.5 h-3.5" />}
            onClick={onEditSource}
            className="text-xs"
          >
            Edit Source
          </Button>
        </div>
      </div>
    </div>
  );
}
