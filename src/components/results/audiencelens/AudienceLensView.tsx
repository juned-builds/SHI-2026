import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  ArrowLeft,
  RotateCcw,
  Check,
} from "lucide-react";
import {
  GeneratedDeliverable,
  ProjectDraft,
  TransformationConfig,
  AudienceLensReport,
  AudiencePersonaEvaluation,
} from "../../../types";
import {
  simulatePersonasApi,
  adaptForPersonaApi,
  computeClientContentHash,
  AudienceLensException,
  AdaptForPersonaApiResponse,
} from "../../../services/audienceLensApi";
import {
  DEMO_AUDIENCELENS_REPORT,
  DEMO_ADAPTATIONS,
  isShowcaseDemo,
} from "../../../constants/demoDataset";
import { AudienceLensHeader } from "./AudienceLensHeader";
import { ReadabilitySection } from "./ReadabilitySection";
import { PersonaCard } from "./PersonaCard";
import { PersonaDetailModal } from "./PersonaDetailModal";
import { AudienceAdaptationModal } from "./AudienceAdaptationModal";
import { Button } from "../../ui/Button";

export interface AudienceLensViewProps {
  deliverable: GeneratedDeliverable;
  draft: ProjectDraft;
  config: TransformationConfig;
  onUpdateDeliverableReport: (report: AudienceLensReport) => void;
  onApplyAdaptation: (adaptedContent: string, personaName: string) => void;
  onExit: () => void;
}

export function AudienceLensView({
  deliverable,
  draft,
  config,
  onUpdateDeliverableReport,
  onApplyAdaptation,
  onExit,
}: AudienceLensViewProps) {
  const isDemo = isShowcaseDemo(draft, deliverable);

  // Determine initial report and status based on priority:
  // 1. Valid cached report on deliverable
  // 2. Showcase precomputed report if demo dataset
  // 3. Stale report on deliverable
  // 4. Idle (ready for manual trigger)
  const initialReport: AudienceLensReport | null =
    deliverable.audienceLensReport || (isDemo ? DEMO_AUDIENCELENS_REPORT : null);

  const initialStatus: "idle" | "evaluating" | "completed" | "error" =
    initialReport ? "completed" : "idle";

  const [report, setReport] = useState<AudienceLensReport | null>(initialReport);
  const [status, setStatus] = useState<"idle" | "evaluating" | "completed" | "error">(initialStatus);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<number>(1);

  // Cache fallback ref in case a live re-evaluation fails
  const cachedReportRef = useRef<AudienceLensReport | null>(initialReport);

  // Modal states
  const [detailPersona, setDetailPersona] = useState<AudiencePersonaEvaluation | null>(null);
  const [adaptPersona, setAdaptPersona] = useState<AudiencePersonaEvaluation | null>(null);
  const [isAdapting, setIsAdapting] = useState<boolean>(false);
  const [adaptedResult, setAdaptedResult] = useState<AdaptForPersonaApiResponse | null>(null);
  const [adaptError, setAdaptError] = useState<string | null>(null);

  // In-flight mutex & abort controller
  const isInFlightRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check staleness against current deliverable content
  const currentContentHash = computeClientContentHash(deliverable.content);
  const isStale = Boolean(
    report && (deliverable.audienceLensStale || report.contentHash !== currentContentHash)
  );

  // Ensure demo report is saved in deliverable state if initially missing
  useEffect(() => {
    if (isDemo && !deliverable.audienceLensReport) {
      onUpdateDeliverableReport(DEMO_AUDIENCELENS_REPORT);
      cachedReportRef.current = DEMO_AUDIENCELENS_REPORT;
    }
  }, [isDemo, deliverable.audienceLensReport, onUpdateDeliverableReport]);

  // Keep cached ref updated whenever report is valid
  useEffect(() => {
    if (report) {
      cachedReportRef.current = report;
    }
  }, [report]);

  // Progressive loading animation steps when evaluating
  useEffect(() => {
    if (status !== "evaluating") return;
    setLoadingStage(1);
    const t1 = setTimeout(() => setLoadingStage(2), 1200);
    const t2 = setTimeout(() => setLoadingStage(3), 2600);
    const t3 = setTimeout(() => setLoadingStage(4), 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [status]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Primary evaluation runner with mutex protection (manual or explicit trigger)
  const runEvaluation = async (isManual = false) => {
    // 1. Mutex Guard
    if (isInFlightRef.current) {
      console.log("[AudienceLensView] Evaluation already in-flight. Ignoring trigger.");
      return;
    }

    // 2. Fresh cache check
    if (!isManual && report && !isStale) {
      setStatus("completed");
      return;
    }

    isInFlightRef.current = true;
    setStatus("evaluating");
    setErrorMessage(null);
    setIsQuotaError(false);

    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch {
        // ignore
      }
    }
    abortControllerRef.current = new AbortController();

    try {
      const generatedReport = await simulatePersonasApi(
        {
          sourceText: draft.sourceText,
          generatedDeliverableText: deliverable.content,
          selectedLanguage: config.language,
          targetAudience: config.audience || "general_public",
          deliverableType: deliverable.deliverableId,
          personaIdentifiers: ["rural_citizen", "senior_executive", "field_worker"],
        },
        abortControllerRef.current.signal
      );

      setReport(generatedReport);
      cachedReportRef.current = generatedReport;
      setStatus("completed");
      onUpdateDeliverableReport(generatedReport);
    } catch (err: any) {
      if (err.name === "AbortError" || err.code === "CANCELLED") {
        return;
      }
      const isQuota =
        err instanceof AudienceLensException
          ? err.isQuotaExhausted
          : Boolean(err?.message?.includes("quota") || err?.httpStatus === 429);

      setIsQuotaError(isQuota);
      setErrorMessage(
        isQuota
          ? "AudienceLens is temporarily unavailable because Gemini usage quota has been reached. Your generated deliverable is safe and unchanged."
          : err?.message || "AudienceLens evaluation failed. Please try again."
      );
      setStatus("error");
    } finally {
      isInFlightRef.current = false;
    }
  };

  // Handle trigger for persona adaptation
  const handleOpenAdaptation = async (persona: AudiencePersonaEvaluation) => {
    setAdaptPersona(persona);
    setAdaptError(null);
    setAdaptedResult(null);

    // Fast-path: Showcase Demo precomputed adaptation (0ms, zero quota)
    if (isDemo && DEMO_ADAPTATIONS[persona.persona]) {
      setIsAdapting(false);
      setAdaptedResult({
        success: true,
        originalContent: deliverable.content,
        adaptedContent: DEMO_ADAPTATIONS[persona.persona].adaptedContent,
        personaId: persona.persona,
        personaName: persona.personaName,
        explanation: DEMO_ADAPTATIONS[persona.persona].explanation,
        changed: true,
        model: "gemini-3.7-flash (Showcase Precomputed)",
      });
      return;
    }

    // Live AI adaptation path
    setIsAdapting(true);
    try {
      const res = await adaptForPersonaApi({
        deliverableContent: deliverable.content,
        personaId: persona.persona,
        personaName: persona.personaName,
        evaluationFindings: persona,
        sourceText: draft.sourceText,
        language: config.language,
        deliverableType: deliverable.deliverableId,
      });

      setAdaptedResult(res);
    } catch (err: any) {
      const isQuota =
        err instanceof AudienceLensException
          ? err.isQuotaExhausted
          : Boolean(err?.message?.includes("quota") || err?.httpStatus === 429);
      setAdaptError(
        isQuota
          ? "Audience adaptation is temporarily unavailable because Gemini usage quota has been reached. Your existing content is safe and unchanged."
          : err?.message || "Audience adaptation failed."
      );
    } finally {
      setIsAdapting(false);
    }
  };

  // Apply adaptation to workspace
  const handleConfirmApplyAdaptation = (adaptedText: string) => {
    if (!adaptPersona) return;
    onApplyAdaptation(adaptedText, adaptPersona.personaName);
    setAdaptPersona(null);
    setAdaptedResult(null);
  };

  // Restore cached result if user cancels out of error state
  const handleUseCachedResult = () => {
    if (cachedReportRef.current) {
      setReport(cachedReportRef.current);
      setStatus("completed");
      setErrorMessage(null);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Header */}
      <AudienceLensHeader
        deliverable={deliverable}
        report={report}
        isEvaluating={status === "evaluating"}
        isStale={isStale}
        isDemoMode={isDemo}
        onReevaluate={() => runEvaluation(true)}
        onExit={onExit}
      />

      {/* 2. Stale Warning Banner */}
      {isStale && report && status !== "evaluating" && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-start gap-2.5 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-amber-950">
                Evaluation Outdated
              </span>
              <p className="text-amber-800 mt-0.5">
                The deliverable content was modified after this evaluation. Scores and jargon analysis may not reflect your latest edits.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => runEvaluation(true)}
            icon={<RefreshCw className="w-3.5 h-3.5 text-amber-800" />}
            className="text-xs text-amber-900 border-amber-300 bg-white hover:bg-amber-100 font-semibold shrink-0"
          >
            Re-evaluate Updated Deliverable
          </Button>
        </div>
      )}

      {/* 3. Main Workspace Area: Idle / Evaluating / Error / Completed Content */}
      {status === "idle" ? (
        <div className="p-8 sm:p-12 bg-white rounded-xl border border-slate-200 shadow-xs text-center space-y-5">
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-xs inline-flex">
            <Users className="w-10 h-10 text-indigo-600" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">
              Ready for Communication Intelligence Analysis
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              AudienceLens™ simulates comprehension across Rural Citizen, Senior Executive, and Field Worker perspectives, identifying jargon and readability indices before publishing.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => runEvaluation(true)}
              icon={<Sparkles className="w-4 h-4" />}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Run Live AI Analysis
            </Button>

            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onExit}
              className="text-xs"
            >
              Back to Deliverable
            </Button>
          </div>
        </div>
      ) : status === "evaluating" ? (
        <div className="p-8 sm:p-12 bg-white rounded-xl border border-slate-200 shadow-xs text-center space-y-6">
          <div className="relative inline-flex items-center justify-center">
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-xs">
              <Users className="w-10 h-10 text-indigo-600 animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1">
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
            </div>
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">
              Evaluating Communication Intelligence
            </h3>
            <p className="text-xs text-slate-500">
              Simulating comprehension across Rural Citizen, Senior Executive, and Field Worker perspectives...
            </p>
          </div>

          {/* Progressive Loading Steps */}
          <div className="max-w-md mx-auto bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2.5 text-xs">
            <div className="flex items-center gap-2.5">
              {loadingStage > 1 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : loadingStage === 1 ? (
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
              )}
              <span className={loadingStage >= 1 ? "font-semibold text-slate-800" : "text-slate-400"}>
                Evaluating Rural Citizen accessibility & jargon...
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {loadingStage > 2 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : loadingStage === 2 ? (
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
              )}
              <span className={loadingStage >= 2 ? "font-semibold text-slate-800" : "text-slate-400"}>
                Simulating Senior Executive strategic clarity & brevity...
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {loadingStage > 3 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : loadingStage === 3 ? (
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
              )}
              <span className={loadingStage >= 3 ? "font-semibold text-slate-800" : "text-slate-400"}>
                Assessing Field Implementation Worker feasibility...
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {loadingStage > 4 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : loadingStage === 4 ? (
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
              )}
              <span className={loadingStage >= 4 ? "font-semibold text-slate-800" : "text-slate-400"}>
                Synthesizing readability indices & action clarity...
              </span>
            </div>
          </div>
        </div>
      ) : status === "error" ? (
        <div className="p-8 sm:p-10 bg-white rounded-xl border border-slate-200 shadow-xs text-center space-y-4">
          <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 inline-flex">
            <ShieldAlert className="w-8 h-8 text-rose-600" />
          </div>

          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">
              {isQuotaError ? "AudienceLens Temporarily Unavailable" : "Evaluation Error"}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {errorMessage}
            </p>
            <p className="text-[11.5px] text-slate-400">
              Your generated deliverable content is completely safe and unchanged.
            </p>
          </div>

          {/* If a previous cached result exists, provide a quick recovery option */}
          {cachedReportRef.current && (
            <div className="max-w-md mx-auto p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-center justify-between gap-3 text-left">
              <span>Your previous evaluation result is still available.</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseCachedResult}
                className="text-xs font-semibold shrink-0 bg-white hover:bg-slate-100"
              >
                Use Cached Result
              </Button>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => runEvaluation(true)}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Retry Evaluation
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onExit}
              className="text-xs bg-slate-900 text-white"
            >
              Back to Deliverable
            </Button>
          </div>
        </div>
      ) : report ? (
        <div className="space-y-5">
          {/* Readability & Cross-Persona Benchmarking Section */}
          <ReadabilitySection
            readability={report.readability}
            personas={report.personas}
            onSelectPersonaForAnalysis={(p) => setDetailPersona(p)}
            onSelectPersonaForAdapt={(p) => handleOpenAdaptation(p)}
          />

          {/* Persona Evaluation Cards Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Target Audience Persona Evaluations
                </h4>
                <p className="text-[11px] text-slate-500">
                  Independent comprehension simulation for each stakeholder profile
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {report.personas.map((persona) => (
                <PersonaCard
                  key={persona.persona}
                  evaluation={persona}
                  onViewAnalysis={(p) => setDetailPersona(p)}
                  onAdaptForAudience={(p) => {
                    handleOpenAdaptation(p);
                  }}
                  isAdapting={isAdapting && adaptPersona?.persona === persona.persona}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* 4. Persona Detail Analysis Modal */}
      <PersonaDetailModal
        isOpen={Boolean(detailPersona)}
        evaluation={detailPersona}
        onClose={() => setDetailPersona(null)}
        onAdapt={(p) => {
          setDetailPersona(null);
          handleOpenAdaptation(p);
        }}
      />

      {/* 5. Audience Adaptation Modal */}
      <AudienceAdaptationModal
        isOpen={Boolean(adaptPersona)}
        persona={adaptPersona}
        originalContent={deliverable.content}
        adaptedContent={adaptedResult?.adaptedContent || null}
        explanation={adaptedResult?.explanation}
        isGenerating={isAdapting}
        error={adaptError}
        onApply={handleConfirmApplyAdaptation}
        onDiscard={() => {
          setAdaptPersona(null);
          setAdaptedResult(null);
          setAdaptError(null);
        }}
        onRetry={() => {
          if (adaptPersona) handleOpenAdaptation(adaptPersona);
        }}
      />
    </div>
  );
}

