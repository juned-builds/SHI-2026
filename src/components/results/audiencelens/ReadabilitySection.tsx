import React from "react";
import {
  BookOpen,
  Gauge,
  HelpCircle,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Users,
  Briefcase,
  HardHat,
  Sparkles,
} from "lucide-react";
import { AudienceLensReadability, AudiencePersonaEvaluation } from "../../../types";

export interface ReadabilitySectionProps {
  readability: AudienceLensReadability;
  personas: AudiencePersonaEvaluation[];
  onSelectPersonaForAnalysis: (persona: AudiencePersonaEvaluation) => void;
  onSelectPersonaForAdapt: (persona: AudiencePersonaEvaluation) => void;
}

export function ReadabilitySection({
  readability,
  personas,
  onSelectPersonaForAnalysis,
  onSelectPersonaForAdapt,
}: ReadabilitySectionProps) {
  // Score to color helper
  const getScoreColor = (score: number) => {
    if (score >= 8.5) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (score >= 7.0) return "text-indigo-700 bg-indigo-50 border-indigo-200";
    if (score >= 5.5) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-rose-700 bg-rose-50 border-rose-200";
  };

  const getPersonaIcon = (id: string) => {
    if (id.includes("citizen")) return <Users className="w-4 h-4 text-emerald-600" />;
    if (id.includes("exec")) return <Briefcase className="w-4 h-4 text-blue-600" />;
    return <HardHat className="w-4 h-4 text-amber-600" />;
  };

  return (
    <div className="space-y-4">
      {/* 1. Readability Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Readability Score */}
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Readability Score
            </span>
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900">
              {readability.readingScore}
            </span>
            <span className="text-xs text-slate-400">/ 10</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, readability.readingScore * 10)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Difficulty: <span className="font-semibold text-slate-700">{readability.readingDifficulty}</span>
          </div>
        </div>

        {/* Approximate Reading Level */}
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Reading Level
            </span>
            <Gauge className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 line-clamp-1">
            {readability.approxReadingLevel}
          </div>
          <p className="text-[11px] text-slate-500">
            Avg ~{readability.avgSentenceLength} words per sentence
          </p>
        </div>

        {/* Jargon Density */}
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Jargon Density
            </span>
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                readability.jargonDensity.toLowerCase() === "low"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : readability.jargonDensity.toLowerCase() === "medium"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {readability.jargonDensity}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {readability.jargonDensity.toLowerCase() === "low"
              ? "Accessible vocabulary for broad audiences"
              : "Contains specialized institutional terms"}
          </p>
        </div>

        {/* Action Clarity */}
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Action Clarity
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                readability.actionClarity.toLowerCase().includes("excellent") ||
                readability.actionClarity.toLowerCase().includes("good")
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {readability.actionClarity}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Clear directives and procedural guidance
          </p>
        </div>
      </div>

      {/* 2. Cross-Persona Summary & Alignment Row */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Cross-Persona Comprehension Matrix
            </h4>
            <p className="text-[11px] text-slate-500">
              Comparative benchmark across audience viewpoints
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-[11px]">
            {readability.bestSuitedAudience && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100/70 border border-emerald-200 text-emerald-800 font-semibold">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Best Suited: {readability.bestSuitedAudience}
              </span>
            )}
            {readability.audienceRequiringAdaptation && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100/70 border border-amber-200 text-amber-800 font-semibold">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                Adaptation Target: {readability.audienceRequiringAdaptation}
              </span>
            )}
          </div>
        </div>

        {/* Table Comparison View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-2 px-3">Audience Perspective</th>
                <th className="py-2 px-3 text-center">Clarity</th>
                <th className="py-2 px-3 text-center">Actionability</th>
                <th className="py-2 px-3 text-center">Comprehension</th>
                <th className="py-2 px-3 text-center">Jargon Flags</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {personas.map((p) => (
                <tr key={p.persona} className="hover:bg-white/80 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-2">
                    <div className="p-1 rounded bg-white border border-slate-200 shadow-2xs">
                      {getPersonaIcon(p.persona)}
                    </div>
                    <span>{p.personaName}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                    <span className={`px-2 py-0.5 rounded ${getScoreColor(p.clarityScore)}`}>
                      {p.clarityScore} / 10
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                    <span className={`px-2 py-0.5 rounded ${getScoreColor(p.actionabilityScore)}`}>
                      {p.actionabilityScore} / 10
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        p.comprehensionLevel === "High"
                          ? "bg-emerald-50 text-emerald-700"
                          : p.comprehensionLevel === "Moderate"
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {p.comprehensionLevel}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                    {p.jargonCount > 0 ? (
                      <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                        {p.jargonCount} {p.jargonCount === 1 ? "flag" : "flags"}
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium">None</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectPersonaForAnalysis(p)}
                        className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-[11px] font-medium text-slate-700 transition-colors cursor-pointer"
                      >
                        View Analysis
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectPersonaForAdapt(p)}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Adapt
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
