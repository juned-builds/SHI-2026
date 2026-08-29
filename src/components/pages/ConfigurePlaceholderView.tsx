import React from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  AlignLeft,
  AlertCircle,
  Plus,
  ArrowRight,
} from "lucide-react";
import { ProjectDraft } from "../../types";
import { PageContainer } from "../layout/PageContainer";
import { PageHeader } from "../layout/PageHeader";
import { Button } from "../ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { getFileTypeLabel } from "../../utils/fileValidation";

export interface ConfigurePlaceholderViewProps {
  draft: ProjectDraft | null;
  onNavigate: (route: string) => void;
  onCancel?: () => void;
}

export function ConfigurePlaceholderView({
  draft,
  onNavigate,
  onCancel,
}: ConfigurePlaceholderViewProps) {
  // If no in-memory draft exists (e.g. refreshed or navigated directly)
  if (!draft || !draft.isReady) {
    return (
      <PageContainer maxWidth="narrow">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => onNavigate("projects")}
            className="text-slate-500 hover:text-slate-900 -ml-2"
          >
            Back to Projects
          </Button>
        </div>

        <Card>
          <EmptyState
            title="No source content found"
            description="A transformation project requires source material (uploaded file or pasted text) before configuration can begin."
            icon={<AlertCircle className="w-6 h-6 text-slate-400" />}
            primaryAction={{
              label: "Start New Project",
              icon: <Plus className="w-4 h-4" />,
              onClick: () => onNavigate("projects/new"),
            }}
          />
        </Card>
      </PageContainer>
    );
  }

  const isFile = draft.sourceType === "file";
  const sourceLabel = isFile
    ? draft.sourceFile?.name || "Uploaded File"
    : "Text Source";

  return (
    <PageContainer maxWidth="narrow">
      {/* Return to source input action */}
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => onNavigate("projects/new")}
          className="text-slate-500 hover:text-slate-900 -ml-2"
        >
          Back to Source Input
        </Button>

        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-slate-400 hover:text-red-600"
          >
            Cancel Project
          </Button>
        )}
      </div>

      {/* Header */}
      <PageHeader
        title="Source ready"
        description="Transformation configuration will be available in the next step."
        badge="Source Ready"
      />

      {/* Summary Card */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <CardTitle>Source Summary</CardTitle>
              </div>
              <Badge variant="success">Ready for Configuration</Badge>
            </div>
            <CardDescription>
              Your source material has been validated and is ready for the transformation setup.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1">
                <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  Project Name
                </span>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {draft.name}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1">
                <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  Source Type
                </span>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                  {isFile ? (
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <AlignLeft className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span className="truncate">{isFile ? "File Upload" : "Pasted Text"}</span>
                </div>
              </div>
            </div>

            {/* Detailed metadata */}
            {isFile && draft.sourceFile && (
              <div className="p-4 bg-white border border-slate-200 rounded-lg text-xs space-y-2.5">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-medium">File Name:</span>
                  <span className="font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
                    {draft.sourceFile.name}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-medium">Category:</span>
                  <span className="font-semibold text-slate-900">
                    {getFileTypeLabel(draft.sourceFile.category, draft.sourceFile.file)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-medium">File Size:</span>
                  <span className="font-semibold text-slate-900">
                    {draft.sourceFile.formattedSize}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Storage: In-memory (browser session)</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready for step 2
                  </span>
                </div>
              </div>
            )}

            {!isFile && draft.sourceText && (
              <div className="p-4 bg-white border border-slate-200 rounded-lg text-xs space-y-2.5">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-medium">Status:</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Text source ready
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-medium">Word Count:</span>
                  <span className="font-semibold text-slate-900">
                    {draft.wordCount.toLocaleString()} {draft.wordCount === 1 ? "word" : "words"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-medium">Character Count:</span>
                  <span className="font-semibold text-slate-900">
                    {draft.charCount.toLocaleString()} characters
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block mb-1 text-[10px] uppercase font-semibold">
                    Content Excerpt:
                  </span>
                  <p className="text-slate-700 italic bg-slate-50 p-2.5 rounded border border-slate-100 text-[11px] leading-relaxed line-clamp-2">
                    "{draft.sourceText.slice(0, 160)}
                    {draft.sourceText.length > 160 ? "…" : ""}"
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informational Guidance */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed space-y-1.5">
          <p className="font-semibold text-slate-900">Next Step: Transformation Configuration</p>
          <p>
            In Module 0.4, you will define audience personas, communication tone, and select from the matrix of multimodal deliverables (executive briefs, presentation decks, infographics, and scripts).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Button
            variant="outline"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => onNavigate("projects/new")}
            className="w-full sm:w-auto"
          >
            Edit Source Input
          </Button>

          <div className="w-full sm:w-auto flex items-center justify-end gap-3">
            {onCancel && (
              <Button
                variant="ghost"
                onClick={onCancel}
                className="w-full sm:w-auto text-slate-600"
              >
                Discard & Return
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => onNavigate("projects")}
              className="w-full sm:w-auto"
            >
              Projects List
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

