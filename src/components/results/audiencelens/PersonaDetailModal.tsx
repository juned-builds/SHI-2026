import React, { useState } from "react";
import {
  X,
  Users,
  Briefcase,
  HardHat,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Lightbulb,
  FileText,
} from "lucide-react";
import { AudiencePersonaEvaluation } from "../../../types";
import { Button } from "../../ui/Button";

export interface PersonaDetailModalProps {
  isOpen: boolean;
  evaluation: AudiencePersonaEvaluation | null;
  onClose: () => void;
  onAdapt: (evaluation: AudiencePersonaEvaluation) => void;
}

export function PersonaDetailModal({
  isOpen,
  evaluation,
  onClose,
  onAdapt,
}: PersonaDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "jargon" | "confusing" | "recommendations">("overview");

  if (!isOpen || !evaluation) return null;

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              {personaIcon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">
                  {evaluation.personaName} Analysis
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  AudienceLens™
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed communication breakdown and comprehension assessment.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Ribbon */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-200 bg-white py-2.5 px-4 text-center">
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Clarity Score</div>
            <div className="text-base font-bold text-indigo-700 font-mono">
              {evaluation.clarityScore} <span className="text-xs text-slate-400">/ 10</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Actionability</div>
            <div className="text-base font-bold text-emerald-700 font-mono">
              {evaluation.actionabilityScore} <span className="text-xs text-slate-400">/ 10</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Comprehension</div>
            <div className="text-base font-bold text-slate-900">
              {evaluation.comprehensionLevel}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 pt-2 border-b border-slate-200 bg-slate-50/50 overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`py-2 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "overview"
                ? "border-indigo-600 text-indigo-700 font-bold bg-white rounded-t"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Overview & Strengths
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("jargon")}
            className={`py-2 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "jargon"
                ? "border-indigo-600 text-indigo-700 font-bold bg-white rounded-t"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Jargon Detection</span>
            {evaluation.jargonCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                {evaluation.jargonCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("confusing")}
            className={`py-2 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "confusing"
                ? "border-indigo-600 text-indigo-700 font-bold bg-white rounded-t"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Confusing Sections</span>
            {evaluation.confusingSections?.length > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded-full text-[10px] font-bold">
                {evaluation.confusingSections.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("recommendations")}
            className={`py-2 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "recommendations"
                ? "border-indigo-600 text-indigo-700 font-bold bg-white rounded-t"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Recommendations
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Tab 1: Overview */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Adaptation Suggestion Banner */}
              <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-indigo-900 text-xs">
                    Audience Adaptation Guidance
                  </span>
                  <p className="text-slate-700 leading-relaxed text-xs">
                    {evaluation.adaptationSuggestion}
                  </p>
                </div>
              </div>

              {/* Strengths */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Key Strengths for {evaluation.personaName}</span>
                </h4>
                <div className="space-y-1.5">
                  {evaluation.strengths && evaluation.strengths.length > 0 ? (
                    evaluation.strengths.map((str, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100 text-slate-700 leading-relaxed flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{str}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 italic">No specific strengths recorded.</p>
                  )}
                </div>
              </div>

              {/* Weaknesses / Friction Points */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Potential Friction Points</span>
                </h4>
                <div className="space-y-1.5">
                  {evaluation.weaknesses && evaluation.weaknesses.length > 0 ? (
                    evaluation.weaknesses.map((w, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-amber-50/50 rounded-lg border border-amber-100 text-slate-700 leading-relaxed flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{w}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 italic">No critical friction points identified.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Jargon Detection */}
          {activeTab === "jargon" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    Terminology & Jargon Analysis
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Terms that may be difficult or ambiguous for {evaluation.personaName}.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  {evaluation.jargonTerms?.length || 0} flagged terms
                </span>
              </div>

              {evaluation.jargonTerms && evaluation.jargonTerms.length > 0 ? (
                <div className="space-y-2.5">
                  {evaluation.jargonTerms.map((j, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900 font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          "{j.term}"
                        </span>
                        <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Potentially difficult
                        </span>
                      </div>

                      <div className="text-slate-600 text-xs">
                        <span className="font-semibold text-slate-700">Issue: </span>
                        {j.issue}
                      </div>

                      <div className="p-2 bg-emerald-50/70 rounded-lg border border-emerald-200 text-emerald-900 text-xs">
                        <span className="font-bold text-emerald-800">Suggested plain explanation: </span>
                        "{j.suggestedExplanation}"
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-800">No Complex Jargon Detected</p>
                  <p className="text-[11px] text-slate-500">
                    The deliverable uses vocabulary accessible to {evaluation.personaName}.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Confusing Sections */}
          {activeTab === "confusing" && (
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 text-xs">
                  Confusing Section Detection
                </h4>
                <p className="text-[11px] text-slate-500">
                  Phrases or structures requiring simplification or clearer restructuring.
                </p>
              </div>

              {evaluation.confusingSections && evaluation.confusingSections.length > 0 ? (
                <div className="space-y-3">
                  {evaluation.confusingSections.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 w-fit">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Potential comprehension issue</span>
                      </div>

                      {/* Original Excerpt */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Original Excerpt:
                        </span>
                        <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-mono text-[11px] leading-relaxed">
                          "{c.excerpt}"
                        </p>
                      </div>

                      {/* Issue */}
                      <div className="text-xs text-slate-700">
                        <span className="font-semibold text-slate-900">Why it may be confusing: </span>
                        {c.issue}
                      </div>

                      {/* Suggestion */}
                      <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-950 space-y-1">
                        <span className="font-bold text-emerald-900 text-[11px] uppercase tracking-wider block">
                          Suggested Improvement:
                        </span>
                        <p className="leading-relaxed font-medium">"{c.suggestion}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-800">Clear Sentence Flow</p>
                  <p className="text-[11px] text-slate-500">
                    No severely confusing sentence structures found for this audience.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Recommendations */}
          {activeTab === "recommendations" && (
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 text-xs">
                  Actionable Recommendations
                </h4>
                <p className="text-[11px] text-slate-500">
                  Specific adjustments to improve comprehension and engagement for {evaluation.personaName}.
                </p>
              </div>

              <div className="space-y-2">
                {evaluation.recommendations && evaluation.recommendations.length > 0 ? (
                  evaluation.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-start gap-2.5 text-xs text-slate-700"
                    >
                      <span className="p-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] w-5 h-5 flex items-center justify-center shrink-0 border border-indigo-200 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{rec}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic">No specific recommendations.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Close
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={<Sparkles className="w-3.5 h-3.5 text-white" />}
            onClick={() => {
              onClose();
              onAdapt(evaluation);
            }}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          >
            Adapt for {evaluation.personaName}
          </Button>
        </div>
      </div>
    </div>
  );
}
