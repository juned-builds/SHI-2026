import React from "react";
import {
  FileText,
  FileCode,
  Users,
  Sparkles,
  Globe,
  Sliders,
  Target,
  Palette,
  Package,
  Edit3,
  CheckCircle2,
} from "lucide-react";
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
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export interface GenerationSummaryCardProps {
  draft: ProjectDraft;
  config: TransformationConfig;
  onEditSource: () => void;
  onEditConfig: () => void;
  isLocked?: boolean;
}

export function GenerationSummaryCard({
  draft,
  config,
  onEditSource,
  onEditConfig,
  isLocked = false,
}: GenerationSummaryCardProps) {
  const getAudienceLabel = () => {
    if (!config.audience) return "Not specified";
    if (config.audience === "custom") {
      return config.customAudience.trim()
        ? `Custom: ${config.customAudience.trim()}`
        : "Custom (Unspecified)";
    }
    return AUDIENCE_OPTIONS.find((o) => o.value === config.audience)?.label || config.audience;
  };

  const getToneLabel = () => {
    if (!config.tone) return "Not specified";
    return TONE_OPTIONS.find((o) => o.value === config.tone)?.label || config.tone;
  };

  const getLanguageLabel = () => {
    if (!config.language) return "Not specified";
    if (config.language === "other") {
      return config.customLanguage.trim()
        ? `Other: ${config.customLanguage.trim()}`
        : "Other (Unspecified)";
    }
    return LANGUAGE_OPTIONS.find((o) => o.value === config.language)?.label || config.language;
  };

  const getDetailLabel = () => {
    if (!config.detailLevel) return "Not specified";
    return DETAIL_LEVEL_OPTIONS.find((o) => o.value === config.detailLevel)?.label || config.detailLevel;
  };

  const getObjectiveLabel = () => {
    if (!config.objective) return "Not specified";
    return OBJECTIVE_OPTIONS.find((o) => o.value === config.objective)?.label || config.objective;
  };

  const getStyleLabel = () => {
    if (!config.contentStyle) return "Not specified";
    return CONTENT_STYLE_OPTIONS.find((o) => o.value === config.contentStyle)?.label || config.contentStyle;
  };

  const selectedDeliverables = DELIVERABLES_CATALOG.filter((d) =>
    config.deliverables.includes(d.id)
  );

  return (
    <div className="space-y-4">
      {/* 1. Source Document Overview */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="py-3.5 px-5 bg-slate-50/70 border-b border-slate-200/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700" />
              <CardTitle className="text-sm font-semibold text-slate-900">
                Source Document & Material
              </CardTitle>
            </div>
            {!isLocked && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Edit3 className="w-3 h-3 text-slate-500" />}
                onClick={onEditSource}
                className="text-xs text-slate-600 hover:text-slate-900"
              >
                Edit Source
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-900">
                  {draft.name || "Untitled Transformation Project"}
                </span>
                <Badge variant="outline" className="text-[10px] uppercase font-bold">
                  {draft.sourceType === "file" ? "Uploaded File" : "Direct Text"}
                </Badge>
              </div>

              {draft.sourceType === "file" && draft.sourceFile && (
                <p className="text-xs text-slate-600">
                  Filename: <span className="font-mono text-slate-800">{draft.sourceFile.name}</span> (
                  {draft.sourceFile.formattedSize})
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 shrink-0">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Words</span>
                <span className="font-semibold text-slate-800">
                  {draft.wordCount.toLocaleString()}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Characters</span>
                <span className="font-semibold text-slate-800">
                  {draft.charCount.toLocaleString()}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Validated</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Transformation Settings Matrix */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="py-3.5 px-5 bg-slate-50/70 border-b border-slate-200/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-700" />
              <CardTitle className="text-sm font-semibold text-slate-900">
                Transformation Parameters
              </CardTitle>
            </div>
            {!isLocked && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Edit3 className="w-3 h-3 text-slate-500" />}
                onClick={onEditConfig}
                className="text-xs text-slate-600 hover:text-slate-900"
              >
                Edit Configuration
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                <Users className="w-3 h-3 text-slate-500" /> Audience
              </span>
              <p className="text-xs font-semibold text-slate-800 line-clamp-2" title={getAudienceLabel()}>
                {getAudienceLabel()}
              </p>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3 text-slate-500" /> Tone
              </span>
              <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                {getToneLabel()}
              </p>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                <Globe className="w-3 h-3 text-slate-500" /> Language
              </span>
              <p className="text-xs font-semibold text-slate-800 line-clamp-2" title={getLanguageLabel()}>
                {getLanguageLabel()}
              </p>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                <Sliders className="w-3 h-3 text-slate-500" /> Detail
              </span>
              <p className="text-xs font-semibold text-slate-800 capitalize line-clamp-2">
                {getDetailLabel()}
              </p>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                <Target className="w-3 h-3 text-slate-500" /> Objective
              </span>
              <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                {getObjectiveLabel()}
              </p>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                <Palette className="w-3 h-3 text-slate-500" /> Style
              </span>
              <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                {getStyleLabel()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Selected Deliverables Queue */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="py-3.5 px-5 bg-slate-50/70 border-b border-slate-200/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-700" />
              <CardTitle className="text-sm font-semibold text-slate-900">
                Target Deliverable Pipeline ({selectedDeliverables.length})
              </CardTitle>
            </div>
            <Badge variant="success" className="text-xs">
              {selectedDeliverables.length} Queued
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedDeliverables.map((del) => (
              <div
                key={del.id}
                className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-900 shrink-0" />
                    <h5 className="text-xs font-semibold text-slate-900 truncate">
                      {del.name}
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {del.description}
                  </p>
                </div>
                {del.badgeLabel && (
                  <Badge variant="outline" className="text-[9px] uppercase tracking-wider shrink-0">
                    {del.badgeLabel}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
