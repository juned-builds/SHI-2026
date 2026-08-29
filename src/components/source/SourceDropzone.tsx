import React, { useRef, useState } from "react";
import { UploadCloud, FileText, Image as ImageIcon, Video as VideoIcon, AlertCircle } from "lucide-react";
import { SourceFileMetadata } from "../../types";
import { MAX_FILE_SIZE_LABEL, validateSourceFile } from "../../utils/fileValidation";

export interface SourceDropzoneProps {
  onFileSelected: (metadata: SourceFileMetadata) => void;
  onError: (errorMessage: string | null) => void;
  errorMessage?: string | null;
}

export function SourceDropzone({
  onFileSelected,
  onError,
  errorMessage,
}: SourceDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
    if (!file) return;

    const result = validateSourceFile(file);
    if (!result.valid) {
      onError(result.error || "Failed to validate file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (result.metadata) {
      onError(null);
      onFileSelected(result.metadata);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const triggerBrowse = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full space-y-3">
      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        id="source-file-input"
        className="sr-only"
        aria-label="Upload source file"
        accept=".pdf,.docx,.doc,.txt,.md,.rtf,image/*,video/*"
        onChange={handleChange}
      />

      {/* Drag & Drop Visual Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerBrowse}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            triggerBrowse();
          }
        }}
        className={`relative flex flex-col items-center justify-center p-8 sm:p-10 border-2 border-dashed rounded-xl transition-all cursor-pointer text-center outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 ${
          isDragging
            ? "border-slate-900 bg-slate-100/70 scale-[1.005]"
            : errorMessage
            ? "border-red-300 bg-red-50/20 hover:border-red-400 hover:bg-red-50/40"
            : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform shadow-xs ${
            isDragging ? "bg-slate-900 text-white scale-110" : "bg-white border border-slate-200/80 text-slate-600"
          }`}
        >
          <UploadCloud className="w-6 h-6" />
        </div>

        <h4 className="text-sm font-semibold text-slate-900 mb-1">
          {isDragging ? "Drop your file here" : "Click to browse or drag & drop"}
        </h4>
        <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">
          Select a source document or media asset from your local device to transform.
        </p>

        {/* Supported formats & size pill tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-600 font-medium">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200">
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>PDF, DOCX, TXT</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200">
            <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
            <span>Images (PNG, JPG, WEBP)</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200">
            <VideoIcon className="w-3.5 h-3.5 text-purple-500" />
            <span>Video (MP4, MOV, WEBM)</span>
          </span>
        </div>

        <span className="text-[11px] text-slate-400 mt-3">
          Max file size: {MAX_FILE_SIZE_LABEL} (Client-side limit)
        </span>
      </div>

      {/* Error Display */}
      {errorMessage && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 animate-in fade-in" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <p className="font-semibold">Invalid File</p>
            <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
