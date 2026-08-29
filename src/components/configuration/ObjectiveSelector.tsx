import React from "react";
import { Target, Check } from "lucide-react";
import { ObjectiveType } from "../../types";
import { OBJECTIVE_OPTIONS } from "../../constants/transformationOptions";

export interface ObjectiveSelectorProps {
  selectedObjective: ObjectiveType | null;
  onSelectObjective: (objective: ObjectiveType) => void;
  error?: string | null;
}

export function ObjectiveSelector({
  selectedObjective,
  onSelectObjective,
  error,
}: ObjectiveSelectorProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Target className="w-4 h-4 text-slate-600" />
          Communication Objective
          <span className="text-red-500 text-xs">*</span>
        </label>
        <p className="text-xs text-slate-500 mt-0.5">
          Select the core goal this transformation aims to accomplish for readers.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {OBJECTIVE_OPTIONS.map((option) => {
          const isSelected = selectedObjective === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectObjective(option.value)}
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
              {option.description && (
                <p
                  className={`text-[11px] leading-relaxed line-clamp-2 ${
                    isSelected ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {option.description}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
