import React from "react";
import { Sparkles, Check } from "lucide-react";
import { ToneType } from "../../types";
import { TONE_OPTIONS } from "../../constants/transformationOptions";

export interface ToneSelectorProps {
  selectedTone: ToneType | null;
  onSelectTone: (tone: ToneType) => void;
  error?: string | null;
}

export function ToneSelector({
  selectedTone,
  onSelectTone,
  error,
}: ToneSelectorProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-slate-600" />
          Communication Tone
          <span className="text-red-500 text-xs">*</span>
        </label>
        <p className="text-xs text-slate-500 mt-0.5">
          Establish the voice and stylistic resonance of the output deliverables.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {TONE_OPTIONS.map((option) => {
          const isSelected = selectedTone === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectTone(option.value)}
              className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[56px] ${
                isSelected
                  ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50/70"
              }`}
            >
              <span
                className={`text-xs font-semibold flex items-center gap-1 ${
                  isSelected ? "text-white" : "text-slate-900"
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
