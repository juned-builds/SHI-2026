import React from "react";
import { ArrowLeft, CheckCircle2, FileText, AlignLeft } from "lucide-react";
import { ProjectDraft } from "../../types";
import { PageContainer } from "../layout/PageContainer";
import { PageHeader } from "../layout/PageHeader";
import { Button } from "../ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";

export interface ConfigurePlaceholderViewProps {
  draft: ProjectDraft | null;
  onNavigate: (route: string) => void;
}

export function ConfigurePlaceholderView({
  draft,
  onNavigate,
}: ConfigurePlaceholderViewProps) {
  const isFile = draft?.sourceType === "file";
  const sourceTitle = isFile
    ? draft?.sourceFile?.name || "Uploaded File"
    : "Pasted Text";

  return (
    <PageContainer maxWidth="narrow">
      {/* Return to source input action */}
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => onNavigate("projects/new")}
          className="text-slate-500 hover:text-slate-900 -ml-2"
        >
          Return to Source Input
        </Button>
      </div>

      {/* Header */}
      <PageHeader
        title="Source ready"
        description="Transformation configuration will be available in the next step."
        badge="Configuration Ready"
      />

      {/* Summary Card */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <CardTitle>Source Ingestion Summary</CardTitle>
              </div>
              <Badge variant="success">Ready for Configuration</Badge>
            </div>
            <CardDescription>
              Review your initial project details and source payload.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1">
                <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  Project Name
                </span>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {draft?.name || "Untitled transformation"}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1">
                <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  Source Type
                </span>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                  {isFile ? (
                    <FileText className="w-4 h-4 text-blue-600" />
                  ) : (
                    <AlignLeft className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>{sourceTitle}</span>
                </div>
              </div>
            </div>

            {/* Detailed metadata */}
            {isFile && draft?.sourceFile && (
              <div className="p-4 bg-white border border-slate-200 rounded-lg text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>File Name:</span>
                  <span className="font-semibold text-slate-900">{draft.sourceFile.name}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>File Size:</span>
                  <span className="font-semibold text-slate-900">{draft.sourceFile.formattedSize}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Category:</span>
                  <span className="font-semibold text-slate-900 uppercase">{draft.sourceFile.category}</span>
                </div>
              </div>
            )}

            {!isFile && draft?.sourceText && (
              <div className="p-4 bg-white border border-slate-200 rounded-lg text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Character Count:</span>
                  <span className="font-semibold text-slate-900">{draft.sourceText.length.toLocaleString()} chars</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Word Count:</span>
                  <span className="font-semibold text-slate-900">
                    {draft.sourceText.trim().split(/\s+/).length.toLocaleString()} words
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block mb-1 text-[10px] uppercase font-semibold">Preview:</span>
                  <p className="text-slate-700 italic line-clamp-3 bg-slate-50 p-2 rounded border border-slate-100 font-mono text-[11px]">
                    "{draft.sourceText}"
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informational Banner */}
        <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 leading-relaxed space-y-1">
          <p className="font-semibold">Module 0.3A Complete</p>
          <p className="text-blue-800">
            Source material is stored in browser memory. Audience targeting, tone selection, objective definitions, and deliverable matrix configuration will be unlocked in Module 0.4.
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

          <Button
            variant="secondary"
            onClick={() => onNavigate("projects")}
            className="w-full sm:w-auto"
          >
            Go to Projects
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
