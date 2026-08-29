import React from "react";
import { AlignLeft, Trash2 } from "lucide-react";

export interface SourceTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  disabled?: boolean;
}

export function SourceTextInput({
  value,
  onChange,
  onClear,
  disabled = false,
}: SourceTextInputProps) {
  const charCount = value.length;
  const trimmedLength = value.trim().length;
  const wordCount = trimmedLength > 0 ? value.trim().split(/\s+/).length : 0;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="source-raw-text"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wider"
        >
          <AlignLeft className="w-3.5 h-3.5 text-slate-500" />
          <span>Pasted Content & Raw Text</span>
        </label>

        {charCount > 0 && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
            title="Clear text"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="relative">
        <textarea
          id="source-raw-text"
          rows={9}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste your source document, executive memo, article text, policy circular, meeting notes, research findings, or rough draft here..."
          className="w-full px-4 py-3 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-y min-h-[180px] leading-relaxed disabled:bg-slate-50 disabled:text-slate-400"
        />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span className="text-[11px] text-slate-400">
          {trimmedLength === 0
            ? "Enter text or paste copied material"
            : `${wordCount.toLocaleString()} ${wordCount === 1 ? "word" : "words"}`}
        </span>
        <span
          className={`font-medium ${
            trimmedLength > 0 ? "text-slate-700 font-mono" : "text-slate-400"
          }`}
        >
          {charCount.toLocaleString()} characters
        </span>
      </div>
    </div>
  );
}
