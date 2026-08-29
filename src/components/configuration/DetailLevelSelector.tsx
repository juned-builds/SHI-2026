import React from "react";
import { Sliders, Check } from "lucide-react";
import { DetailLevelType } from "../../types";
import { DETAIL_LEVEL_OPTIONS } from "../../constants/transformationOptions";

export interface DetailLevelSelectorProps {
  selectedDetail: DetailLevelType | null;
  onSelectDetail: (detail: DetailLevelType) => void;
  error?: string | null;
}

export function DetailLevelSelector({
  selectedDetail,
  onSelectDetail,
  error,
}: DetailLevelSelectorProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-slate-600" />
          Detail Level & Granularity
          <span className="text-red-500 text-xs">*</span>
        </label>
        <p className="text-xs text-slate-500 mt-0.5">
          Control the depth, context density, and depth of explanation across outputs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {DETAIL_LEVEL_OPTIONS.map((option) => {
          const isSelected = selectedDetail === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectDetail(option.value)}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50/70"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span
                  className={`text-xs font-semibold ${
                    isSelected ? "text-white" : "text-slate-900"
                  }`}
                >
                  {option.label}
                </span>
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </span>
                )}
              </div>
              <p
                className={`text-[11px] leading-relaxed ${
                  isSelected ? "text-slate-300" : "text-slate-500"
                }`}
              >
                {option.description}
              </p>
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
