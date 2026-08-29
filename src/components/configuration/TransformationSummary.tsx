import React from "react";
import { CheckCircle2, Package, Layers, Sparkles, Globe, Sliders, Target, Palette, Users } from "lucide-react";
import { ProjectDraft, TransformationConfig } from "../../types";
import {
  AUDIENCE_OPTIONS,
  TONE_OPTIONS,
  LANGUAGE_OPTIONS,
  DETAIL_LEVEL_OPTIONS,
  OBJECTIVE_OPTIONS,
  CONTENT_STYLE_OPTIONS,
  DELIVERABLES_CATALOG,
} from "../../constants/transformationOptions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";

export interface TransformationSummaryProps {
  draft: ProjectDraft;
  config: TransformationConfig;
}

export function TransformationSummary({
  draft,
  config,
}: TransformationSummaryProps) {
  const getAudienceLabel = () => {
    if (!config.audience) return "Not selected";
    if (config.audience === "custom") {
      return config.customAudience.trim()
        ? `Custom: "${config.customAudience.trim()}"`
        : "Custom (Unspecified)";
    }
    return AUDIENCE_OPTIONS.find((o) => o.value === config.audience)?.label || config.audience;
  };

  const getToneLabel = () => {
    if (!config.tone) return "Not selected";
    return TONE_OPTIONS.find((o) => o.value === config.tone)?.label || config.tone;
  };

  const getLanguageLabel = () => {
    if (!config.language) return "Not selected";
    if (config.language === "other") {
      return config.customLanguage.trim()
        ? `Other: ${config.customLanguage.trim()}`
        : "Other (Unspecified)";
    }
    return LANGUAGE_OPTIONS.find((o) => o.value === config.language)?.label || config.language;
  };

  const getDetailLabel = () => {
    if (!config.detailLevel) return "Not selected";
    return DETAIL_LEVEL_OPTIONS.find((o) => o.value === config.detailLevel)?.label || config.detailLevel;
  };

  const getObjectiveLabel = () => {
    if (!config.objective) return "Not selected";
    return OBJECTIVE_OPTIONS.find((o) => o.value === config.objective)?.label || config.objective;
  };

  const getStyleLabel = () => {
    if (!config.contentStyle) return "Not selected";
    return CONTENT_STYLE_OPTIONS.find((o) => o.value === config.contentStyle)?.label || config.contentStyle;
  };

  const selectedDeliverableMetas = DELIVERABLES_CATALOG.filter((d) =>
    config.deliverables.includes(d.id)
  );

  return (
    <Card className="border-slate-300 shadow-xs bg-gradient-to-b from-white to-slate-50/50">
      <CardHeader className="py-4 px-5 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <CardTitle className="text-sm sm:text-base">Transformation Configuration Summary</CardTitle>
          </div>
          <Badge variant={config.deliverables.length > 0 ? "default" : "outline"} className="text-xs">
            {config.deliverables.length} {config.deliverables.length === 1 ? "Output" : "Outputs"}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Review the transformation parameters that will govern multi-deliverable generation.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Core parameters grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-3.5 bg-slate-100/70 border border-slate-200/80 rounded-xl text-xs">
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-400" /> Audience
            </span>
            <p className="font-semibold text-slate-900 truncate" title={getAudienceLabel()}>
              {getAudienceLabel()}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-slate-400" /> Tone
            </span>
            <p className="font-semibold text-slate-900 truncate">
              {getToneLabel()}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Globe className="w-3 h-3 text-slate-400" /> Language
            </span>
            <p className="font-semibold text-slate-900 truncate" title={getLanguageLabel()}>
              {getLanguageLabel()}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-slate-400" /> Detail
            </span>
            <p className="font-semibold text-slate-900 truncate">
              {getDetailLabel()}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Target className="w-3 h-3 text-slate-400" /> Objective
            </span>
            <p className="font-semibold text-slate-900 truncate">
              {getObjectiveLabel()}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Palette className="w-3 h-3 text-slate-400" /> Style
            </span>
            <p className="font-semibold text-slate-900 truncate">
              {getStyleLabel()}
            </p>
          </div>
        </div>

        {/* Selected Deliverables list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Package className="w-3.5 h-3.5 text-slate-600" />
              Target Deliverables ({selectedDeliverableMetas.length}):
            </span>
            {selectedDeliverableMetas.length === 0 && (
              <span className="text-red-500 font-medium">Please select at least 1 deliverable</span>
            )}
          </div>

          {selectedDeliverableMetas.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedDeliverableMetas.map((del) => (
                <div
                  key={del.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium border border-slate-800 shadow-2xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{del.name}</span>
                  {del.badgeLabel && (
                    <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-1.5 ml-0.5">
                      {del.badgeLabel}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg text-xs text-red-700">
              No deliverables selected yet. Choose one or more outputs from the Deliverable Matrix above.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
