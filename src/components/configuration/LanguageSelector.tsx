import React from "react";
import { Globe, Check } from "lucide-react";
import { LanguageType } from "../../types";
import { LANGUAGE_OPTIONS } from "../../constants/transformationOptions";
import { Input } from "../ui/Input";

export interface LanguageSelectorProps {
  selectedLanguage: LanguageType | null;
  customLanguage: string;
  onSelectLanguage: (language: LanguageType) => void;
  onChangeCustomLanguage: (text: string) => void;
  error?: string | null;
}

export function LanguageSelector({
  selectedLanguage,
  customLanguage,
  onSelectLanguage,
  onChangeCustomLanguage,
  error,
}: LanguageSelectorProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-600" />
          Target Language
          <span className="text-red-500 text-xs">*</span>
        </label>
        <p className="text-xs text-slate-500 mt-0.5">
          Select the output language for generated deliverables (multilingual localization).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {LANGUAGE_OPTIONS.map((option) => {
          const isSelected = selectedLanguage === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectLanguage(option.value)}
              className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                isSelected
                  ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      {selectedLanguage === "other" && (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 animate-in fade-in duration-150">
          <label
            htmlFor="custom-language-input"
            className="text-xs font-medium text-slate-700"
          >
            Custom Language Specification <span className="text-red-500">*</span>
          </label>
          <Input
            id="custom-language-input"
            type="text"
            value={customLanguage}
            onChange={(e) => onChangeCustomLanguage(e.target.value)}
            placeholder="e.g. Punjabi (ਪੰਜਾਬੀ), Odia (ଓଡ଼ିଆ), Sanskrit, French..."
            className="text-xs bg-white"
          />
        </div>
      )}

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
