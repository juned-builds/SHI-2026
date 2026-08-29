import React from "react";
import { Users, Check } from "lucide-react";
import { AudienceType } from "../../types";
import { AUDIENCE_OPTIONS } from "../../constants/transformationOptions";
import { Input } from "../ui/Input";

export interface AudienceSelectorProps {
  selectedAudience: AudienceType | null;
  customAudience: string;
  onSelectAudience: (audience: AudienceType) => void;
  onChangeCustomAudience: (text: string) => void;
  error?: string | null;
}

export function AudienceSelector({
  selectedAudience,
  customAudience,
  onSelectAudience,
  onChangeCustomAudience,
  error,
}: AudienceSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-600" />
            Target Audience
            <span className="text-red-500 text-xs">*</span>
          </label>
          <p className="text-xs text-slate-500 mt-0.5">
            Select the primary demographic or stakeholder group receiving this content.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {AUDIENCE_OPTIONS.map((option) => {
          const isSelected = selectedAudience === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectAudience(option.value)}
              className={`text-left p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50/70"
              }`}
            >
              <div className="flex items-start justify-between gap-2 w-full mb-1">
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

      {selectedAudience === "custom" && (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 animate-in fade-in duration-150">
          <label
            htmlFor="custom-audience-input"
            className="text-xs font-medium text-slate-700"
          >
            Custom Audience Description <span className="text-red-500">*</span>
          </label>
          <Input
            id="custom-audience-input"
            type="text"
            value={customAudience}
            onChange={(e) => onChangeCustomAudience(e.target.value)}
            placeholder="Describe the intended audience (e.g. Municipal water engineers and district collectors)..."
            className="text-xs bg-white"
          />
        </div>
      )}

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
