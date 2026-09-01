import React from "react";
import {
  Users,
  Briefcase,
  HardHat,
  ChevronRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Layers,
  ArrowRight,
} from "lucide-react";
import { AudiencePersonaEvaluation } from "../../../types";
import { Button } from "../../ui/Button";

export interface PersonaCardProps {
  key?: React.Key;
  evaluation: AudiencePersonaEvaluation;
  onViewAnalysis: (evaluation: AudiencePersonaEvaluation) => void;
  onAdaptForAudience: (evaluation: AudiencePersonaEvaluation) => void;
  isAdapting?: boolean;
}

export const PersonaCard: React.FC<PersonaCardProps> = ({
  evaluation,
  onViewAnalysis,
  onAdaptForAudience,
  isAdapting = false,
}) => {
  const isCitizen = evaluation.persona.includes("citizen");
  const isExec = evaluation.persona.includes("exec");
  const isWorker = evaluation.persona.includes("worker") || (!isCitizen && !isExec);

  const personaIcon = isCitizen ? (
    <Users className="w-5 h-5 text-emerald-600" />
  ) : isExec ? (
    <Briefcase className="w-5 h-5 text-blue-600" />
  ) : (
    <HardHat className="w-5 h-5 text-amber-600" />
  );

  const personaTheme = isCitizen
    ? {
        border: "border-emerald-200",
        badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
        headerBg: "bg-emerald-50/50",
        accent: "text-emerald-700",
      }
    : isExec
    ? {
        border: "border-blue-200",
        badge: "bg-blue-50 text-blue-800 border-blue-200",
        headerBg: "bg-blue-50/50",
        accent: "text-blue-700",
      }
    : {
        border: "border-amber-200",
        badge: "bg-amber-50 text-amber-800 border-amber-200",
        headerBg: "bg-amber-50/50",
        accent: "text-amber-700",
      };

  const personaTagline = isCitizen
    ? "Everyday public citizen & community member"
    : isExec
    ? "Strategic leadership & decision makers"
    : "Operations & field frontline personnel";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all">
      {/* Header */}
      <div className={`p-4 border-b border-slate-100 ${personaTheme.headerBg}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
              {personaIcon}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {evaluation.personaName}
              </h4>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                {personaTagline}
              </p>
            </div>
          </div>

          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${personaTheme.badge}`}>
            {evaluation.comprehensionLevel}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          {/* Clarity Score */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-[11px] text-slate-500 font-medium">Clarity Score</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold text-slate-900 font-mono">
                {evaluation.clarityScore}
              </span>
              <span className="text-[11px] text-slate-400">/ 10</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1 mt-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-1 rounded-full"
                style={{ width: `${Math.min(100, evaluation.clarityScore * 10)}%` }}
              />
            </div>
          </div>

          {/* Actionability Score */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-[11px] text-slate-500 font-medium">Actionability</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold text-slate-900 font-mono">
                {evaluation.actionabilityScore}
              </span>
              <span className="text-[11px] text-slate-400">/ 10</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1 mt-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-1 rounded-full"
                style={{ width: `${Math.min(100, evaluation.actionabilityScore * 10)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Jargon & Comprehension Status */}
        <div className="flex items-center justify-between text-xs py-1.5 px-2 bg-slate-50/70 rounded-md border border-slate-100">
          <span className="text-slate-600 font-medium">Jargon Terminology:</span>
          {evaluation.jargonCount > 0 ? (
            <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
              {evaluation.jargonCount} {evaluation.jargonCount === 1 ? "flag" : "flags"}
            </span>
          ) : (
            <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
              0 flags (Clean)
            </span>
          )}
        </div>

        {/* Highlight Snippet */}
        {evaluation.strengths && evaluation.strengths.length > 0 && (
          <div className="text-xs space-y-1">
            <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Key Strength:</span>
            </div>
            <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50/50 p-1.5 rounded border border-slate-100">
              {evaluation.strengths[0]}
            </p>
          </div>
        )}

        {evaluation.confusingSections && evaluation.confusingSections.length > 0 && (
          <div className="text-xs space-y-1">
            <div className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
              <span>Comprehension Flag:</span>
            </div>
            <p className="text-[11px] text-slate-600 line-clamp-2 bg-amber-50/40 p-1.5 rounded border border-amber-100">
              "{evaluation.confusingSections[0].excerpt}"
            </p>
          </div>
        )}
      </div>

      {/* Footer Buttons */}
      <div className="p-3 bg-slate-50/70 border-t border-slate-100 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onViewAnalysis(evaluation)}
          className="text-xs text-slate-700 hover:bg-white"
        >
          View Analysis
        </Button>

        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={isAdapting}
          onClick={() => onAdaptForAudience(evaluation)}
          icon={<Sparkles className="w-3 h-3 text-white" />}
          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
        >
          Adapt for Audience
        </Button>
      </div>
    </div>
  );
}
