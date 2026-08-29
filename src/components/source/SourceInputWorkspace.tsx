import React, { useState } from "react";
import {
  Upload,
  FileText,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Layers,
} from "lucide-react";
import { ProjectDraft, SourceFileMetadata, SourceType } from "../../types";
import { Button } from "../ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Input } from "../ui/Input";
import { SourceDropzone } from "./SourceDropzone";
import { SelectedFileCard } from "./SelectedFileCard";
import { SourceTextInput } from "./SourceTextInput";

export interface SourceInputWorkspaceProps {
  initialDraft?: Partial<ProjectDraft>;
  onContinue: (draft: ProjectDraft) => void;
  onCancel?: () => void;
}

export function SourceInputWorkspace({
  initialDraft,
  onContinue,
  onCancel,
}: SourceInputWorkspaceProps) {
  const [projectName, setProjectName] = useState<string>(
    initialDraft?.name || "Untitled transformation"
  );
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  const [selectedFile, setSelectedFile] = useState<SourceFileMetadata | null>(
    initialDraft?.sourceFile || null
  );
  const [fileError, setFileError] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState<string>(
    initialDraft?.sourceText || ""
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const hasFile = selectedFile !== null;
  const hasText = sourceText.trim().length > 0;
  const isSourceValid = hasFile || hasText;

  const handleFileSelected = (fileMeta: SourceFileMetadata) => {
    setSelectedFile(fileMeta);
    setFileError(null);
    setValidationError(null);
  };

  const handleFileRemoved = () => {
    setSelectedFile(null);
    setFileError(null);
  };

  const handleTextChange = (text: string) => {
    setSourceText(text);
    if (validationError && (text.trim().length > 0 || hasFile)) {
      setValidationError(null);
    }
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();

    // Check project name
    const finalName = projectName.trim() || "Untitled transformation";

    // Validate that either a valid file or non-whitespace text is provided
    if (!isSourceValid) {
      setValidationError(
        "Please provide a source input. You can either upload a document/media file or paste raw text into the editor."
      );
      return;
    }

    let determinedType: SourceType = "text";
    if (hasFile && hasText) {
      determinedType = activeTab === "file" ? "file" : "text";
    } else if (hasFile) {
      determinedType = "file";
    } else {
      determinedType = "text";
    }

    onContinue({
      name: finalName,
      sourceType: determinedType,
      sourceFile: selectedFile,
      sourceText: sourceText.trim(),
    });
  };

  return (
    <form onSubmit={handleContinue} className="space-y-8">
      {/* Validation Banner */}
      {validationError && (
        <div
          className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 animate-in fade-in"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold text-red-900">Source Material Required</p>
            <p className="text-red-700 leading-relaxed">{validationError}</p>
          </div>
        </div>
      )}

      {/* 1. Project Details Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px]">
              1
            </span>
            <CardTitle>Project Details</CardTitle>
          </div>
          <CardDescription>
            Give your transformation project a descriptive title to organize your deliverables.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xl">
            <Input
              id="project-name-input"
              label="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Annual Financial Highlights Summary"
              helperText="You can rename this project at any stage in the workflow."
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Source Material Selection Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px]">
                2
              </span>
              <CardTitle>Source Material</CardTitle>
            </div>

            {/* Input Mode Switcher Tabs */}
            <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium text-slate-600">
              <button
                type="button"
                onClick={() => setActiveTab("file")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeTab === "file"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "hover:text-slate-900"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
                {hasFile && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ml-0.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("text")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeTab === "text"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "hover:text-slate-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Paste Text</span>
                {hasText && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ml-0.5" />
                )}
              </button>
            </div>
          </div>
          <CardDescription>
            Provide the source document or text you wish to transform into structured deliverables.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tab 1: File Upload */}
          {activeTab === "file" && (
            <div className="space-y-4">
              {hasFile && selectedFile ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Selected Source File
                  </p>
                  <SelectedFileCard
                    metadata={selectedFile}
                    onRemove={handleFileRemoved}
                  />
                </div>
              ) : (
                <SourceDropzone
                  onFileSelected={handleFileSelected}
                  onError={setFileError}
                  errorMessage={fileError}
                />
              )}
            </div>
          )}

          {/* Tab 2: Pasted Raw Text */}
          {activeTab === "text" && (
            <SourceTextInput
              value={sourceText}
              onChange={handleTextChange}
              onClear={() => setSourceText("")}
            />
          )}

          {/* Quick Dual-Source Status info if user provided both */}
          {hasFile && hasText && (
            <div className="flex items-center gap-2 p-3 bg-blue-50/60 border border-blue-200/80 rounded-lg text-xs text-blue-800">
              <Layers className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Both a source file (<strong>{selectedFile?.name}</strong>) and pasted text are present. The currently selected tab (<strong>{activeTab === "file" ? "Upload File" : "Paste Text"}</strong>) will be treated as the active transformation source.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-slate-400" />
          <span>Local transformation draft • In-memory state</span>
        </div>

        <div className="w-full sm:w-auto flex items-center justify-end gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={!isSourceValid}
            icon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Continue
          </Button>
        </div>
      </div>
    </form>
  );
}
