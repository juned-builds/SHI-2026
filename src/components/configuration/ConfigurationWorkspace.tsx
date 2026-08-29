import React, { useState } from "react";
import { ArrowRight, RotateCcw, AlertCircle } from "lucide-react";
import {
  ProjectDraft,
  TransformationConfig,
  AudienceType,
  ToneType,
  LanguageType,
  DetailLevelType,
  ObjectiveType,
  ContentStyleType,
  DeliverableId,
} from "../../types";
import {
  INITIAL_TRANSFORMATION_CONFIG,
  EMPTY_TRANSFORMATION_CONFIG,
  DELIVERABLES_CATALOG,
} from "../../constants/transformationOptions";
import { CompactSourceBanner } from "./CompactSourceBanner";
import { AudienceSelector } from "./AudienceSelector";
import { ToneSelector } from "./ToneSelector";
import { LanguageSelector } from "./LanguageSelector";
import { DetailLevelSelector } from "./DetailLevelSelector";
import { ObjectiveSelector } from "./ObjectiveSelector";
import { ContentStyleSelector } from "./ContentStyleSelector";
import { DeliverableSelector } from "./DeliverableSelector";
import { TransformationSummary } from "./TransformationSummary";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";

export interface ConfigurationWorkspaceProps {
  draft: ProjectDraft;
  initialConfig?: TransformationConfig | null;
  onContinue: (config: TransformationConfig) => void;
  onEditSource: () => void;
  onCancel?: () => void;
}

export function ConfigurationWorkspace({
  draft,
  initialConfig,
  onContinue,
  onEditSource,
  onCancel,
}: ConfigurationWorkspaceProps) {
  const [config, setConfig] = useState<TransformationConfig>(
    initialConfig || INITIAL_TRANSFORMATION_CONFIG
  );

  const [validationErrors, setValidationErrors] = useState<{
    audience?: string;
    tone?: string;
    language?: string;
    detailLevel?: string;
    objective?: string;
    contentStyle?: string;
    deliverables?: string;
    general?: string;
  }>({});

  // Audience Handlers
  const handleSelectAudience = (audience: AudienceType) => {
    setConfig((prev) => ({
      ...prev,
      audience,
      customAudience: audience === "custom" ? prev.customAudience : "",
    }));
    if (validationErrors.audience || validationErrors.general) {
      setValidationErrors((prev) => ({ ...prev, audience: undefined, general: undefined }));
    }
  };

  const handleChangeCustomAudience = (customAudience: string) => {
    setConfig((prev) => ({ ...prev, customAudience }));
    if (validationErrors.audience || validationErrors.general) {
      setValidationErrors((prev) => ({ ...prev, audience: undefined, general: undefined }));
    }
  };

  // Tone Handler
  const handleSelectTone = (tone: ToneType) => {
    setConfig((prev) => ({ ...prev, tone }));
    if (validationErrors.tone || validationErrors.general) {
      setValidationErrors((prev) => ({ ...prev, tone: undefined, general: undefined }));
    }
  };

  // Language Handlers
  const handleSelectLanguage = (language: LanguageType) => {
    setConfig((prev) => ({
      ...prev,
      language,
      customLanguage: language === "other" ? prev.customLanguage : "",
    }));
    if (validationErrors.language || validationErrors.general) {
      setValidationErrors((prev) => ({ ...prev, language: undefined, general: undefined }));
    }
  };

  const handleChangeCustomLanguage = (customLanguage: string) => {
    setConfig((prev) => ({ ...prev, customLanguage }));
    if (validationErrors.language || validationErrors.general) {
      setValidationErrors((prev) => ({ ...prev, language: undefined, general: undefined }));
    }
  };

  // Detail Level Handler
  const handleSelectDetail = (detailLevel: DetailLevelType) => {
    setConfig((prev) => ({ ...prev, detailLevel }));
    if (validationErrors.detailLevel || validationErrors.general) {
      setValidationErrors((prev) => ({ ...prev, detailLevel: undefined, general: undefined }));
    }
  };

  // Objective Handler
  const handleSelectObjective = (objective: ObjectiveType) => {
    setConfig((prev) => ({ ...prev, objective }));
    if (validationErrors.objective || validationErrors.general) {
      setValidationErrors((prev) => ({ ...prev, objective: undefined, general: undefined }));
    }
  };

  // Content Style Handler
  const handleSelectStyle = (contentStyle: ContentStyleType) => {
    setConfig((prev) => ({ ...prev, contentStyle }));
    if (validationErrors.contentStyle || validationErrors.general) {
      setValidationErrors((prev) => ({ ...prev, contentStyle: undefined, general: undefined }));
    }
  };

  // Deliverables Multi-select Handlers
  const handleToggleDeliverable = (id: DeliverableId) => {
    setConfig((prev) => {
      const exists = prev.deliverables.includes(id);
      const updated = exists
        ? prev.deliverables.filter((item) => item !== id)
        : [...prev.deliverables, id];
      return { ...prev, deliverables: updated };
    });
    if (validationErrors.deliverables || validationErrors.general) {
      setValidationErrors((prev) => ({ ...prev, deliverables: undefined, general: undefined }));
    }
  };

  const handleSelectAllDeliverables = () => {
    setConfig((prev) => ({
      ...prev,
      deliverables: DELIVERABLES_CATALOG.map((d) => d.id),
    }));
    if (validationErrors.deliverables || validationErrors.general) {
      setValidationErrors((prev) => ({ ...prev, deliverables: undefined, general: undefined }));
    }
  };

  const handleClearAllDeliverables = () => {
    setConfig((prev) => ({
      ...prev,
      deliverables: [],
    }));
  };

  // Reset Configuration Action
  const handleResetConfig = () => {
    setConfig(EMPTY_TRANSFORMATION_CONFIG);
    setValidationErrors({});
  };

  // Validation before submission
  const validate = (): boolean => {
    const errors: typeof validationErrors = {};

    if (!config.audience) {
      errors.audience = "Please select a target audience.";
    } else if (config.audience === "custom" && !config.customAudience.trim()) {
      errors.audience = "Please provide a description for your custom audience.";
    }

    if (!config.tone) {
      errors.tone = "Please select a communication tone.";
    }

    if (!config.language) {
      errors.language = "Please select a target language.";
    } else if (config.language === "other" && !config.customLanguage.trim()) {
      errors.language = "Please specify the custom target language.";
    }

    if (!config.detailLevel) {
      errors.detailLevel = "Please select a detail level.";
    }

    if (!config.objective) {
      errors.objective = "Please select a communication objective.";
    }

    if (!config.contentStyle) {
      errors.contentStyle = "Please select a content style.";
    }

    if (!config.deliverables || config.deliverables.length === 0) {
      errors.deliverables = "Please select at least one output deliverable from the matrix.";
    }

    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) {
      errors.general = "Please complete all required configuration parameters before proceeding.";
      setValidationErrors(errors);
      return false;
    }

    setValidationErrors({});
    return true;
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onContinue(config);
    }
  };

  return (
    <form onSubmit={handleContinue} className="space-y-6">
      {/* 1. Compact Source Summary Banner */}
      <CompactSourceBanner draft={draft} onEditSource={onEditSource} />

      {/* Main Configuration Card */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-6 sm:p-8 space-y-8">
          {/* Section 1: Target Audience */}
          <AudienceSelector
            selectedAudience={config.audience}
            customAudience={config.customAudience}
            onSelectAudience={handleSelectAudience}
            onChangeCustomAudience={handleChangeCustomAudience}
            error={validationErrors.audience}
          />

          <hr className="border-slate-100" />

          {/* Section 2: Communication Tone */}
          <ToneSelector
            selectedTone={config.tone}
            onSelectTone={handleSelectTone}
            error={validationErrors.tone}
          />

          <hr className="border-slate-100" />

          {/* Section 3: Language */}
          <LanguageSelector
            selectedLanguage={config.language}
            customLanguage={config.customLanguage}
            onSelectLanguage={handleSelectLanguage}
            onChangeCustomLanguage={handleChangeCustomLanguage}
            error={validationErrors.language}
          />

          <hr className="border-slate-100" />

          {/* Section 4: Detail Level */}
          <DetailLevelSelector
            selectedDetail={config.detailLevel}
            onSelectDetail={handleSelectDetail}
            error={validationErrors.detailLevel}
          />

          <hr className="border-slate-100" />

          {/* Section 5: Communication Objective */}
          <ObjectiveSelector
            selectedObjective={config.objective}
            onSelectObjective={handleSelectObjective}
            error={validationErrors.objective}
          />

          <hr className="border-slate-100" />

          {/* Section 6: Content Style */}
          <ContentStyleSelector
            selectedStyle={config.contentStyle}
            onSelectStyle={handleSelectStyle}
            error={validationErrors.contentStyle}
          />

          <hr className="border-slate-100" />

          {/* Section 7: Deliverable Matrix (Multi-Select) */}
          <DeliverableSelector
            selectedDeliverables={config.deliverables}
            onToggleDeliverable={handleToggleDeliverable}
            onSelectAll={handleSelectAllDeliverables}
            onClearAll={handleClearAllDeliverables}
            error={validationErrors.deliverables}
          />
        </CardContent>
      </Card>

      {/* Section 8: Live Transformation Summary */}
      <TransformationSummary draft={draft} config={config} />

      {/* Validation alert banner if incomplete */}
      {validationErrors.general && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{validationErrors.general}</p>
            <p className="text-red-600 mt-0.5">
              Review highlighted fields above to ensure audience, tone, language, detail, objective, style, and at least one deliverable are selected.
            </p>
          </div>
        </div>
      )}

      {/* Bottom Action Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 pb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={handleResetConfig}
            className="text-slate-500 hover:text-slate-900 text-xs"
          >
            Reset configuration
          </Button>

          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-slate-400 hover:text-red-600 text-xs"
            >
              Cancel
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onEditSource}
            className="w-full sm:w-auto text-xs"
          >
            Edit Source
          </Button>

          <Button
            type="submit"
            variant="primary"
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
            className="w-full sm:w-auto"
          >
            Continue to Generation
          </Button>
        </div>
      </div>
    </form>
  );
}
