import React, { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { ProjectDraft, SourceFileMetadata, SourceType } from "../../types";
import { Button } from "../ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Input } from "../ui/Input";
import { SourceDropzone } from "./SourceDropzone";
import { SelectedFileCard } from "./SelectedFileCard";
import { SourceTextInput } from "./SourceTextInput";
import {
  extractTextFromSourceFile,
  calculateWordCount,
  MIN_SOURCE_CHAR_LENGTH,
  MIN_SOURCE_WORD_COUNT,
} from "../../utils/documentExtractor";

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
  const [activeTab, setActiveTab] = useState<"file" | "text">(
    initialDraft?.sourceType === "text" ? "text" : "file"
  );
  const [selectedFile, setSelectedFile] = useState<SourceFileMetadata | null>(
    initialDraft?.sourceFile || null
  );
  const [fileError, setFileError] = useState<string | null>(null);
  
  // File extraction state
  const [isExtractingFile, setIsExtractingFile] = useState<boolean>(false);
  const [fileExtractionError, setFileExtractionError] = useState<string | null>(null);
  const [extractedFileText, setExtractedFileText] = useState<string>(
    initialDraft?.sourceType === "file" && initialDraft?.sourceText ? initialDraft.sourceText : ""
  );
  const [fileWordCount, setFileWordCount] = useState<number>(
    initialDraft?.sourceType === "file" && initialDraft?.wordCount ? initialDraft.wordCount : 0
  );
  const [fileCharCount, setFileCharCount] = useState<number>(
    initialDraft?.sourceType === "file" && initialDraft?.charCount ? initialDraft.charCount : 0
  );
  const [filePageCount, setFilePageCount] = useState<number | undefined>(undefined);

  // Raw text state
  const [sourceText, setSourceText] = useState<string>(
    initialDraft?.sourceType === "text" && initialDraft?.sourceText ? initialDraft.sourceText : ""
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  // Perform extraction whenever a file is selected
  const processFileExtraction = async (fileMeta: SourceFileMetadata) => {
    setIsExtractingFile(true);
    setFileExtractionError(null);
    setValidationError(null);

    try {
      const result = await extractTextFromSourceFile(fileMeta.file);
      if (!result.success) {
        setFileExtractionError(result.error || "Failed to extract text from document.");
        setExtractedFileText("");
        setFileWordCount(0);
        setFileCharCount(0);
      } else {
        setExtractedFileText(result.text);
        setFileWordCount(result.wordCount);
        setFileCharCount(result.charCount);
        setFilePageCount(result.pageCount);
        setFileExtractionError(null);

        // If project name is default, suggest the file name
        if (!projectName || projectName === "Untitled transformation") {
          const suggestedName = fileMeta.name.replace(/\.[^/.]+$/, "");
          if (suggestedName) {
            setProjectName(suggestedName);
          }
        }
      }
    } catch (err: any) {
      console.error("[SourceInputWorkspace] Extraction exception:", err);
      setFileExtractionError(err.message || "An unexpected error occurred reading the file.");
      setExtractedFileText("");
      setFileWordCount(0);
      setFileCharCount(0);
    } finally {
      setIsExtractingFile(false);
    }
  };

  const handleFileSelected = (fileMeta: SourceFileMetadata) => {
    setSelectedFile(fileMeta);
    setFileError(null);
    processFileExtraction(fileMeta);
  };

  const handleFileRemoved = () => {
    setSelectedFile(null);
    setFileError(null);
    setExtractedFileText("");
    setFileWordCount(0);
    setFileCharCount(0);
    setFilePageCount(undefined);
    setFileExtractionError(null);
  };

  const handleTextChange = (text: string) => {
    setSourceText(text);
    if (validationError && text.trim().length > 0) {
      setValidationError(null);
    }
  };

  const handleTabSwitch = (newTab: "file" | "text") => {
    setActiveTab(newTab);
    setValidationError(null);
  };

  const trimmedRawText = sourceText.trim();
  const rawTextWordCount = calculateWordCount(trimmedRawText);

  // Active validation strictly checks the currently active tab mode
  const isFileValid = selectedFile !== null && !isExtractingFile && !fileExtractionError && extractedFileText.length >= MIN_SOURCE_CHAR_LENGTH;
  const isTextValid = trimmedRawText.length >= MIN_SOURCE_CHAR_LENGTH && rawTextWordCount >= MIN_SOURCE_WORD_COUNT;
  const isActiveSourceValid = activeTab === "file" ? isFileValid : isTextValid;

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();

    const finalName = projectName.trim() || "Untitled transformation";

    if (activeTab === "file") {
      if (!selectedFile) {
        setValidationError(
          "Please select a valid document to continue, or switch to the Paste Text tab."
        );
        return;
      }

      if (isExtractingFile) {
        setValidationError("Please wait for document text extraction to complete.");
        return;
      }

      if (fileExtractionError || !extractedFileText || extractedFileText.trim().length < MIN_SOURCE_CHAR_LENGTH) {
        setValidationError(
          fileExtractionError ||
            "No readable text was found in this document. Please upload a text-based document or provide the content as text."
        );
        return;
      }

      onContinue({
        name: finalName,
        sourceType: "file",
        sourceFile: selectedFile,
        sourceText: extractedFileText.trim(),
        charCount: fileCharCount,
        wordCount: fileWordCount,
        isReady: true,
      });
    } else {
      if (!trimmedRawText) {
        setValidationError(
          "Please enter or paste your source text to continue, or switch to the Upload File tab."
        );
        return;
      }

      if (trimmedRawText.length < MIN_SOURCE_CHAR_LENGTH || rawTextWordCount < MIN_SOURCE_WORD_COUNT) {
        setValidationError(
          `Source text is too short. Please provide at least ${MIN_SOURCE_CHAR_LENGTH} characters of content.`
        );
        return;
      }

      onContinue({
        name: finalName,
        sourceType: "text",
        sourceFile: null,
        sourceText: trimmedRawText,
        charCount: trimmedRawText.length,
        wordCount: rawTextWordCount,
        isReady: true,
      });
    }
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
            <p className="font-semibold text-red-900">Source Material Incomplete</p>
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
                onClick={() => handleTabSwitch("file")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeTab === "file"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "hover:text-slate-900"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Document</span>
                {isFileValid && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ml-0.5" title="Valid document ready" />
                )}
              </button>
              <button
                type="button"
                onClick={() => handleTabSwitch("text")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeTab === "text"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "hover:text-slate-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Paste Text</span>
                {isTextValid && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ml-0.5" title="Valid text ready" />
                )}
              </button>
            </div>
          </div>
          <CardDescription>
            {activeTab === "file"
              ? "Upload a PDF, DOCX, TXT, or Markdown document. Text will be extracted locally before configuration."
              : "Paste raw text, articles, research papers, or transcript notes."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tab 1: File Upload */}
          {activeTab === "file" && (
            <div className="space-y-4">
              {selectedFile ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Selected Source Document
                  </p>
                  <SelectedFileCard
                    metadata={selectedFile}
                    onRemove={handleFileRemoved}
                    isExtracting={isExtractingFile}
                    extractionError={fileExtractionError}
                    extractedText={extractedFileText}
                    wordCount={fileWordCount}
                    charCount={fileCharCount}
                    pageCount={filePageCount}
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
              onClear={() => {
                setSourceText("");
                setValidationError(null);
              }}
            />
          )}

          {/* Informative notice if user switched tabs and has inactive content */}
          {activeTab === "file" && isTextValid && !selectedFile && (
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              <span>You have valid text entered in the <strong>Paste Text</strong> tab ({rawTextWordCount} words).</span>
              <button
                type="button"
                onClick={() => handleTabSwitch("text")}
                className="text-slate-900 font-semibold hover:underline cursor-pointer ml-2"
              >
                Switch to Text
              </button>
            </div>
          )}

          {activeTab === "text" && selectedFile && isFileValid && !isTextValid && (
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              <span>You have a valid document extracted in the <strong>Upload Document</strong> tab ({selectedFile?.name}).</span>
              <button
                type="button"
                onClick={() => handleTabSwitch("file")}
                className="text-slate-900 font-semibold hover:underline cursor-pointer ml-2"
              >
                Switch to Document
              </button>
            </div>
          )}

          {selectedFile && isFileValid && isTextValid && (
            <div className="flex items-center gap-2 p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg text-xs text-blue-800">
              <Layers className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Active Source Mode: <strong>{activeTab === "file" ? `Uploaded Document (${selectedFile.name})` : "Pasted Raw Text"}</strong>. Only the active mode's content will be transformed.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-slate-400" />
          <span>Extracted locally • Verified before transformation</span>
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
            disabled={!isActiveSourceValid}
            icon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Continue to Configuration
          </Button>
        </div>
      </div>
    </form>
  );
}
