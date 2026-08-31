import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Info,
} from "lucide-react";
import {
  FactMeshAudit,
  GeneratedDeliverable,
  ProjectDraft,
  FactMeshClaim,
  FactMeshAuditStatus,
  FactMeshApiError,
} from "../../../types";
import { auditGroundingApi, FactMeshException } from "../../../services/factMeshApi";
import { FactMeshHeader } from "./FactMeshHeader";
import { FactMeshSummaryCards } from "./FactMeshSummaryCards";
import { SourceEvidencePanel } from "./SourceEvidencePanel";
import { ClaimMatrixPanel } from "./ClaimMatrixPanel";
import { ClaimEvidenceDetailCard } from "./ClaimEvidenceDetailCard";
import { Button } from "../../ui/Button";

export interface FactMeshAuditViewProps {
  deliverable: GeneratedDeliverable;
  draft: ProjectDraft;
  onUpdateDeliverableAudit: (audit: FactMeshAudit) => void;
  onExit: () => void;
}

function StageStatusIcon({ step, currentStage }: { step: number; currentStage: number }) {
  if (currentStage > step) {
    return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
  }
  if (currentStage === step) {
    return <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />;
  }
  return <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />;
}

export function FactMeshAuditView({
  deliverable,
  draft,
  onUpdateDeliverableAudit,
  onExit,
}: FactMeshAuditViewProps) {
  // Preserve existing cached audit if present
  const [audit, setAudit] = useState<FactMeshAudit | null>(() => deliverable.factMeshAudit || null);
  const [status, setStatus] = useState<FactMeshAuditStatus>(() =>
    deliverable.factMeshAudit ? "completed" : "auditing"
  );
  const [activeError, setActiveError] = useState<FactMeshApiError | null>(null);
  const [loadingStage, setLoadingStage] = useState<number>(1);

  const [selectedClaim, setSelectedClaim] = useState<FactMeshClaim | null>(null);
  const [selectedSourceUnitId, setSelectedSourceUnitId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // In-flight mutex lock to prevent duplicate rapid requests
  const isInFlightRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Multi-stage loading animation step progression
  useEffect(() => {
    if (status !== "auditing" && status !== "retrying") return;
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

  // Cleanup abort controller on unmount
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

  // Primary execution function with idempotency guard
  const runAudit = async (isManualRetry = false) => {
    // 1. Idempotency Guard: prevent rapid concurrent duplicate calls
    if (isInFlightRef.current) {
      console.log("[FactMeshAuditView] Audit already in-flight. Ignoring duplicate trigger.");
      return;
    }

    isInFlightRef.current = true;
    setStatus(isManualRetry ? "retrying" : "auditing");
    setActiveError(null);

    // Cancel any previous pending request
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch {
        // ignore
      }
    }
    abortControllerRef.current = new AbortController();

    try {
      const sourceTextToAudit = draft.sourceText || "";
      if (!sourceTextToAudit.trim()) {
        throw new FactMeshException({
          code: "VALIDATION_ERROR",
          message: "Source text is missing. Please ensure your project has source content.",
          retryable: false,
          attempts: 0,
        });
      }

      const result = await auditGroundingApi(
        {
          sourceText: sourceTextToAudit,
          sourceMetadata: {
            name: draft.name || draft.sourceFile?.name || "Source Document",
            type: draft.sourceFile?.type || "Text",
          },
          deliverableId: deliverable.deliverableId,
          deliverableName: deliverable.title,
          generatedContent: deliverable.content,
          structuredData: deliverable.structuredData,
        },
        { signal: abortControllerRef.current.signal }
      );

      // On successful audit
      setAudit(result);
      setStatus("completed");
      setActiveError(null);
      onUpdateDeliverableAudit(result);

      // Default select the first unsupported claim if present, otherwise first claim
      const firstUnsupported = result.claims.find((c) => c.status === "unsupported");
      if (firstUnsupported) {
        setSelectedClaim(firstUnsupported);
      } else if (result.claims.length > 0) {
        setSelectedClaim(result.claims[0]);
      }
    } catch (err: any) {
      console.warn("[FactMeshAuditView] Handled FactMesh audit error:", err?.message || err);

      let classifiedApiError: FactMeshApiError;
      if (err instanceof FactMeshException) {
        classifiedApiError = {
          code: err.code,
          message: err.message,
          retryable: err.retryable,
          attempts: err.attempts,
          maxAttempts: err.maxAttempts,
        };
      } else {
        classifiedApiError = {
          code: "MODEL_UNAVAILABLE",
          message:
            err?.message ||
            "The AI verification service is experiencing temporary demand. Your deliverable is safe and unchanged.",
          retryable: true,
          attempts: 3,
          maxAttempts: 3,
        };
      }

      setActiveError(classifiedApiError);
      if (classifiedApiError.code === "QUOTA_EXHAUSTED") {
        setStatus("quota_exhausted");
      } else if (classifiedApiError.retryable) {
        setStatus("temporarily_unavailable");
      } else {
        setStatus("failed");
      }

      // CRITICAL RULE: NEVER destroy existing valid audit data on 503 / quota failure.
      // If we already have a cached audit, it stays in state `audit`.
    } finally {
      isInFlightRef.current = false;
    }
  };

  // Run audit on mount only if not already cached
  useEffect(() => {
    if (!deliverable.factMeshAudit) {
      runAudit(false);
    } else {
      setAudit(deliverable.factMeshAudit);
      setStatus("completed");
      if (!selectedClaim && deliverable.factMeshAudit.claims.length > 0) {
        const firstUnsupported = deliverable.factMeshAudit.claims.find((c) => c.status === "unsupported");
        setSelectedClaim(firstUnsupported || deliverable.factMeshAudit.claims[0]);
      }
    }
  }, [deliverable.deliverableId]);

  // When a claim is selected
  const handleSelectClaim = (claim: FactMeshClaim) => {
    setSelectedClaim(claim);
    if (claim.supportingSourceIds.length > 0) {
      setSelectedSourceUnitId(claim.supportingSourceIds[0]);
    }
  };

  // Jump to first unsupported claim
  const handleJumpToUnsupported = () => {
    if (!audit) return;
    const unsupp = audit.claims.find((c) => c.status === "unsupported");
    if (unsupp) {
      setActiveFilter("unsupported");
      setSelectedClaim(unsupp);
    }
  };

  const isOperationInProgress = status === "auditing" || status === "retrying";

  // -------------------------------------------------------------
  // VIEW 1: Loading / Retrying Screen (when no prior audit exists)
  // -------------------------------------------------------------
  if (isOperationInProgress && !audit) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-12 shadow-sm text-center space-y-6 max-w-2xl mx-auto my-8 animate-in fade-in duration-200">
        <div className="relative w-16 h-16 mx-auto">
          <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center animate-pulse">
            <ShieldCheck className="w-8 h-8 text-indigo-600 animate-bounce" />
          </div>
          <Loader2 className="w-20 h-20 text-indigo-600/30 animate-spin absolute -top-2 -left-2" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Sparkles className="w-3.5 h-3.5" />
            FactMesh™ Grounding & Provenance Engine
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {status === "retrying"
              ? "FactMesh is retrying the verification..."
              : "Auditing Deliverable Factual Integrity..."}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Cross-referencing deliverable claims, numbers, and dates against authoritative source evidence units.
          </p>
        </div>

        {/* Multi-stage pipeline progress */}
        <div className="max-w-md mx-auto bg-slate-50 rounded-xl p-4 border border-slate-200 text-left space-y-2.5 text-xs">
          <div className={`flex items-center gap-2 ${loadingStage >= 1 ? "text-indigo-900 font-semibold" : "text-slate-400"}`}>
            <StageStatusIcon step={1} currentStage={loadingStage} />
            <span>1. Segmenting authoritative source into evidence units</span>
          </div>

          <div className={`flex items-center gap-2 ${loadingStage >= 2 ? "text-indigo-900 font-semibold" : "text-slate-400"}`}>
            <StageStatusIcon step={2} currentStage={loadingStage} />
            <span>2. Extracting claims, numerical metrics, and dates</span>
          </div>

          <div className={`flex items-center gap-2 ${loadingStage >= 3 ? "text-indigo-900 font-semibold" : "text-slate-400"}`}>
            <StageStatusIcon step={3} currentStage={loadingStage} />
            <span>3. Cross-verifying citations & detecting hallucinations</span>
          </div>

          <div className={`flex items-center gap-2 ${loadingStage >= 4 ? "text-indigo-900 font-semibold" : "text-slate-400"}`}>
            <StageStatusIcon step={4} currentStage={loadingStage} />
            <span>4. Computing deterministic FactMesh integrity score</span>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onExit}
          className="text-xs text-slate-500 hover:text-slate-800"
        >
          Cancel & Return to Deliverable
        </Button>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: Temporary Unavailability / Quota / Error Screen (when no prior audit exists)
  // -------------------------------------------------------------
  if ((status === "temporarily_unavailable" || status === "quota_exhausted" || status === "failed") && !audit) {
    const isQuota = status === "quota_exhausted" || activeError?.code === "QUOTA_EXHAUSTED";
    const attempts = activeError?.attempts ?? (isQuota ? 1 : 3);
    const maxAttempts = activeError?.maxAttempts ?? 3;

    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-10 shadow-sm max-w-xl mx-auto my-8 animate-in fade-in duration-200">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-2xs">
            <Clock className="w-7 h-7 text-amber-600" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <ShieldAlert className="w-3 h-3 text-amber-600" />
              FactMesh Grounding Service
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {isQuota ? "AI Usage Limit Reached" : "FactMesh Audit Temporarily Unavailable"}
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              {isQuota
                ? "FactMesh verification is temporarily unavailable because the AI usage limit has been reached. Your deliverable is safe, intact, and unchanged."
                : "The AI verification service is experiencing temporary demand. Your deliverable is safe, intact, and unchanged."}
            </p>
          </div>

          {/* Clarity & Assurance Box */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-left space-y-2 text-xs text-slate-600">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 pb-1.5 border-b border-slate-200/70">
              <span>{isQuota ? "Availability State" : "Automatic retry attempts"}</span>
              <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {isQuota ? "Provider Quota Exhausted" : `${attempts} / ${maxAttempts}`}
              </span>
            </div>
            <ul className="space-y-1.5 text-[11.5px] text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Your generated deliverable content is saved and ready for export.</span>
              </li>
              <li className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>FactMesh citation analysis is an independent verification step.</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>You can retry verification later or inspect and export your deliverable directly.</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isOperationInProgress}
              icon={
                isOperationInProgress ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )
              }
              onClick={() => runAudit(true)}
              className="text-xs w-full sm:w-auto border-amber-300 text-amber-900 hover:bg-amber-50"
            >
              {isOperationInProgress ? "Retrying FactMesh Audit..." : "Retry Later"}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onExit}
              className="text-xs w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 font-semibold"
            >
              Back to Deliverable
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!audit) {
    return null;
  }

  const unsupportedCount = audit.summary.unsupportedClaims;
  const highlightedSourceUnitIds = selectedClaim ? selectedClaim.supportingSourceIds : [];

  // -------------------------------------------------------------
  // VIEW 3: Full FactMesh Workbench (Preserves Cached Audit)
  // -------------------------------------------------------------
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Warning Banner if subsequent audit attempt failed or quota reached */}
      {(status === "temporarily_unavailable" || status === "quota_exhausted") && activeError && (
        <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-100 rounded-lg text-amber-800 shrink-0">
              <Clock className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                {status === "quota_exhausted" ? "AI usage limit reached for re-audit" : "Latest verification attempt unavailable"}
              </h4>
              <p className="text-[11px] text-amber-800">
                {status === "quota_exhausted"
                  ? "Gemini usage quota was reached during the latest refresh. Your previously verified audit data is preserved and shown below."
                  : "The AI service is experiencing high demand. Your previously verified audit data is preserved and shown below."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isOperationInProgress}
              icon={
                isOperationInProgress ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3 text-amber-800" />
                )
              }
              onClick={() => runAudit(true)}
              className="text-xs border-amber-300 text-amber-900 hover:bg-amber-100 bg-white"
            >
              Retry Later
            </Button>
          </div>
        </div>
      )}

      {/* Retrying Banner if in background */}
      {status === "retrying" && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 text-xs text-indigo-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
            <span className="font-semibold">FactMesh is retrying the grounding verification...</span>
          </div>
          <span className="text-[11px] text-indigo-600 font-mono">Stage {loadingStage}/4</span>
        </div>
      )}

      {/* Top Header */}
      <FactMeshHeader
        audit={audit}
        projectName={draft.name}
        isAuditing={isOperationInProgress}
        onRerunAudit={() => runAudit(true)}
        onExit={onExit}
      />

      {/* Stale Audit Warning Banner if content was refined/edited after audit */}
      {deliverable.factMeshAuditStale && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950">
                Content Modified After FactMesh Verification
              </h4>
              <p className="text-[11.5px] text-amber-800 mt-0.5">
                The deliverable text was modified or surgically refined after this audit was generated. Re-run FactMesh verification to audit the updated text.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={isOperationInProgress}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => runAudit(true)}
            className="text-xs bg-amber-600 hover:bg-amber-700 text-white shrink-0 font-semibold shadow-xs"
          >
            Re-verify Deliverable
          </Button>
        </div>
      )}

      {/* Hallucination Alert Banner (Visible only if unsupported claims > 0) */}
      {unsupportedCount > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg text-rose-700 shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-900">
                {unsupportedCount} Unsupported {unsupportedCount === 1 ? "Claim" : "Claims"} Detected
              </h4>
              <p className="text-[11.5px] text-rose-700 mt-0.5">
                The generated deliverable asserts facts or numbers not found in your source document. Inspect before publishing.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleJumpToUnsupported}
            className="text-xs border-rose-300 text-rose-900 hover:bg-rose-100/80 shrink-0 bg-white"
          >
            Review Unsupported Claims
          </Button>
        </div>
      )}

      {/* Summary Metrics Grid */}
      <FactMeshSummaryCards
        summary={audit.summary}
        activeFilter={activeFilter}
        onFilterStatus={setActiveFilter}
      />

      {/* Active Selected Claim Inspection Card */}
      {selectedClaim && (
        <ClaimEvidenceDetailCard
          claim={selectedClaim}
          sourceUnits={audit.sourceUnits}
          onSelectSourceUnit={(uId) => setSelectedSourceUnitId(uId)}
          onClose={() => setSelectedClaim(null)}
        />
      )}

      {/* Split-Screen Workbench: Left = Source Evidence, Right = Generated Claim Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Authoritative Source Evidence Units */}
        <div className="lg:col-span-5 xl:col-span-5 h-[680px]">
          <SourceEvidencePanel
            sourceUnits={audit.sourceUnits}
            highlightedUnitIds={highlightedSourceUnitIds}
            selectedUnitId={selectedSourceUnitId}
            onSelectUnit={(unitId) => setSelectedSourceUnitId(unitId)}
            sourceName={draft.name || draft.sourceFile?.name || "Source Document"}
          />
        </div>

        {/* Right Column: Generated Deliverable Claims Ledger & Citations */}
        <div className="lg:col-span-7 xl:col-span-7 h-[680px]">
          <ClaimMatrixPanel
            claims={audit.claims}
            rawContent={deliverable.content}
            selectedClaimId={selectedClaim?.claimId || null}
            onSelectClaim={handleSelectClaim}
            onSelectSourceUnit={(unitId) => setSelectedSourceUnitId(unitId)}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>
      </div>
    </div>
  );
}
