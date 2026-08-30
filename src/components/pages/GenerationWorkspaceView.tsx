import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Sparkles,
  Play,
  XCircle,
  RotateCcw,
  AlertCircle,
  Plus,
  Edit2,
  Cpu,
} from "lucide-react";
import {
  ProjectDraft,
  TransformationConfig,
  GenerationSession,
  PipelineStage,
} from "../../types";
import { PageContainer } from "../layout/PageContainer";
import { PageHeader } from "../layout/PageHeader";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { GenerationSummaryCard } from "../generation/GenerationSummaryCard";
import { PipelineProgressTracker } from "../generation/PipelineProgressTracker";
import { ResultsWorkspace } from "../results/ResultsWorkspace";
import {
  INITIAL_PIPELINE_STAGES,
  createDeliverablePipelineItems,
} from "../../constants/generationConstants";
import { executeTransformationApi } from "../../services/generationApi";
import { validateDraftSourceContract } from "../../utils/documentExtractor";

export interface GenerationWorkspaceViewProps {
  draft: ProjectDraft | null;
  config: TransformationConfig | null;
  session?: GenerationSession | null;
  onUpdateSession?: (session: GenerationSession) => void;
  onNavigate: (route: string) => void;
  onCancel?: () => void;
}

export function GenerationWorkspaceView({
  draft,
  config,
  session: initialSession,
  onUpdateSession,
  onNavigate,
  onCancel,
}: GenerationWorkspaceViewProps) {
  // Session state initialization
  const [session, setSession] = useState<GenerationSession | null>(() => {
    if (initialSession) return initialSession;
    if (!draft || !config) return null;

    return {
      sessionId: `gen_session_${Date.now()}`,
      createdAt: new Date().toISOString(),
      draft,
      config,
      status: "idle",
      currentStageIndex: 0,
      stages: INITIAL_PIPELINE_STAGES.map((s) => ({ ...s, status: "pending" })),
      deliverablesPipeline: createDeliverablePipelineItems(config.deliverables),
      persistenceStatus: "unsaved",
      isSaved: false,
    };
  });

  // Synchronize with parent's initialSession when it changes
  useEffect(() => {
    if (initialSession) {
      setSession(initialSession);
    }
  }, [initialSession]);

  const [progressPercent, setProgressPercent] = useState<number>(() => {
    return initialSession?.status === "completed" ? 100 : 0;
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleUpdateSession = (updatedSession: GenerationSession) => {
    setSession(updatedSession);
    if (onUpdateSession) {
      onUpdateSession(updatedSession);
    }
  };

  // Clean up timers & pending fetches on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Empty state guard
  if (!draft || !draft.isReady || !config) {
    return (
      <PageContainer maxWidth="narrow">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4 text-slate-500" />}
            onClick={() => onNavigate("projects")}
            className="text-slate-500 hover:text-slate-900 -ml-2"
          >
            Back to Projects
          </Button>
        </div>

        <Card>
          <EmptyState
            title="Incomplete Transformation Session"
            description="Both source content and transformation configuration must be provided before accessing the generation workspace."
            icon={<AlertCircle className="w-6 h-6 text-slate-400" />}
            primaryAction={{
              label: "Start New Project",
              icon: <Plus className="w-4 h-4" />,
              onClick: () => onNavigate("projects/new"),
            }}
          />
        </Card>
      </PageContainer>
    );
  }

  // Handle Real AI Transformation Execution
  const handleStartTransformation = async () => {
    if (!draft || !config) return;

    // Validate source contract before starting
    const contract = validateDraftSourceContract(draft);
    if (!contract.valid) {
      setErrorMessage(contract.error || "Source content is incomplete.");
      return;
    }

    setErrorMessage(null);

    // Abort any prior request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Reset stages
    const freshStages: PipelineStage[] = INITIAL_PIPELINE_STAGES.map((s, idx) => ({
      ...s,
      status: idx === 0 ? "in_progress" : "pending",
    }));

    const freshDeliverables = createDeliverablePipelineItems(config.deliverables);

    const activeSession: GenerationSession = {
      sessionId: `gen_session_${Date.now()}`,
      projectId: session?.projectId, // Preserve projectId if re-generating an existing saved project
      createdAt: new Date().toISOString(),
      draft,
      config,
      status: "generating",
      currentStageIndex: 0,
      stages: freshStages,
      deliverablesPipeline: freshDeliverables,
      error: null,
      isSaved: Boolean(session?.projectId),
    };

    setSession(activeSession);
    setProgressPercent(20);

    // Transition Stage 1 -> Stage 2 -> Stage 3 (Awaiting Gemini API)
    timerRef.current = setTimeout(async () => {
      setSession((prev) => {
        if (!prev || prev.status !== "generating") return prev;
        const updated = [...prev.stages];
        updated[0].status = "completed";
        updated[1].status = "in_progress";
        return { ...prev, currentStageIndex: 1, stages: updated };
      });
      setProgressPercent(45);

      timerRef.current = setTimeout(async () => {
        setSession((prev) => {
          if (!prev || prev.status !== "generating") return prev;
          const updated = [...prev.stages];
          updated[1].status = "completed";
          updated[2].status = "in_progress";
          return { ...prev, currentStageIndex: 2, stages: updated };
        });
        setProgressPercent(65);

        // Execute live backend request
        try {
          const apiResponse = await executeTransformationApi(draft, config, controller.signal);

          if (!apiResponse.success && (!apiResponse.deliverables || apiResponse.deliverables.length === 0)) {
            throw new Error(apiResponse.error || "Transformation returned no deliverables.");
          }

          // Complete all stages WITHOUT automatically writing to IndexedDB.
          // The generation produces an Unsaved Session for user inspection and review.
          setSession((prev) => {
            if (!prev) return null;
            const updatedStages: PipelineStage[] = prev.stages.map((s) => ({
              ...s,
              status: "completed",
            }));

            const updatedDeliverables = prev.deliverablesPipeline.map((item) => {
              const matching = apiResponse.deliverables.find((d) => d.deliverableId === item.deliverableId);
              return {
                ...item,
                status: matching?.status === "completed" ? ("ready" as const) : ("failed" as const),
                promptSchemaReady: true,
              };
            });

            const completedSession: GenerationSession = {
              ...prev,
              status: "completed",
              persistenceStatus: Boolean(prev.projectId) ? "saved" : "unsaved",
              isSaved: Boolean(prev.projectId),
              currentStageIndex: 3,
              stages: updatedStages,
              deliverablesPipeline: updatedDeliverables,
              generatedDeliverables: apiResponse.deliverables,
              modelUsed: apiResponse.model || "gemini-3.7-flash",
              completedAt: apiResponse.generatedAt,
            };

            if (onUpdateSession) {
              onUpdateSession(completedSession);
            }

            return completedSession;
          });

          setProgressPercent(100);
        } catch (err: any) {
          if (controller.signal.aborted) {
            return;
          }

          const errMsg = err.message || "An unexpected error occurred during AI transformation.";
          setErrorMessage(errMsg);

          setSession((prev) => {
            if (!prev) return null;
            const updatedStages = [...prev.stages];
            if (updatedStages[2]) updatedStages[2].status = "failed";
            return {
              ...prev,
              status: "failed",
              stages: updatedStages,
              error: errMsg,
            };
          });
          setProgressPercent(0);
        }
      }, 400);
    }, 300);
  };

  // Handle Cancel
  const handleCancelTransformation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: "cancelled",
      };
    });
    setProgressPercent(0);
  };

  // Handle Reset / Re-run
  const handleResetSession = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    const resetStages = INITIAL_PIPELINE_STAGES.map((s) => ({
      ...s,
      status: "pending" as const,
    }));
    setSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: "idle",
        currentStageIndex: 0,
        stages: resetStages,
        generatedDeliverables: undefined,
        error: null,
      };
    });
    setErrorMessage(null);
    setProgressPercent(0);
  };

  // Handle Discard from Results
  const handleDiscardSession = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (onCancel) {
      onCancel();
    } else {
      onNavigate("projects");
    }
  };

  const status = session?.status || "idle";
  const isGenerating = status === "generating" || status === "preparing" || status === "validating";
  const isCompleted = status === "completed" && session?.generatedDeliverables && session.generatedDeliverables.length > 0;
  const isFailed = status === "failed";

  return (
    <PageContainer maxWidth="default">
      {/* Top back navigation */}
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="w-4 h-4 text-slate-500" />}
          onClick={() => onNavigate("projects/new/configure")}
          disabled={isGenerating}
          className="text-slate-500 hover:text-slate-900 -ml-2"
        >
          Back to Configuration
        </Button>

        {onCancel && !isCompleted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isGenerating}
            className="text-slate-400 hover:text-red-600 text-xs"
          >
            Cancel Session
          </Button>
        )}
      </div>

      {/* Page Header (shown during idle, generating, or failed) */}
      {!isCompleted && (
        <PageHeader
          title="GenAI Content Transformation Workspace"
          description="Review parameters and execute structured multi-deliverable content transformation through the GenAI pipeline."
          badge="Module 0.6 Core Engine"
        />
      )}

      <div className="space-y-6">
        {/* Error Alert with categorized guidance */}
        {isFailed && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-red-950">Transformation Generation Error</span>
                <p className="text-red-700 mt-0.5">{errorMessage || session?.error || "AI generation failed."}</p>
                {errorMessage?.toLowerCase().includes("source") && (
                  <p className="text-red-600 mt-1 font-medium">
                    Tip: Check that your uploaded document or raw text contains readable content.
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <Button
                variant="outline"
                size="sm"
                icon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={() => onNavigate("projects/new")}
                className="text-xs bg-white text-slate-700 hover:bg-slate-50"
              >
                Edit Source
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={handleStartTransformation}
                className="text-xs bg-white border-red-300 text-red-700 hover:bg-red-50"
              >
                Retry Transformation
              </Button>
            </div>
          </div>
        )}

        {/* Cancelled Alert */}
        {status === "cancelled" && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Transformation was cancelled. You can restart or adjust your configuration.</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetSession}
              className="text-xs shrink-0"
            >
              Reset Workspace
            </Button>
          </div>
        )}

        {/* If generating or failed, show pipeline stages tracker */}
        {(isGenerating || isFailed) && (
          <PipelineProgressTracker
            stages={session?.stages || INITIAL_PIPELINE_STAGES}
            currentStageIndex={session?.currentStageIndex || 0}
            status={status}
            progressPercent={progressPercent}
          />
        )}

        {/* Deliverables Results Workspace (Unsaved or Saved) */}
        {isCompleted && session?.generatedDeliverables && (
          <ResultsWorkspace
            draft={draft}
            config={config}
            session={session}
            onUpdateSession={handleUpdateSession}
            onNavigate={onNavigate}
            onRegenerateAll={handleStartTransformation}
            onDiscard={handleDiscardSession}
          />
        )}

        {/* Source & Configuration Summary (when idle or generating) */}
        {!isCompleted && (
          <GenerationSummaryCard
            draft={draft}
            config={config}
            onEditSource={() => onNavigate("projects/new")}
            onEditConfig={() => onNavigate("projects/new/configure")}
            isLocked={isGenerating}
          />
        )}

        {/* Action Controls Bar (when idle or generating or failed) */}
        {!isCompleted && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-8 border-t border-slate-200">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate("projects/new/configure")}
                disabled={isGenerating}
                className="w-full sm:w-auto text-xs"
              >
                Edit Configuration
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => onNavigate("projects")}
                disabled={isGenerating}
                className="w-full sm:w-auto text-xs text-slate-600"
              >
                Back to Projects
              </Button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {isGenerating ? (
                <Button
                  type="button"
                  variant="outline"
                  icon={<XCircle className="w-4 h-4 text-red-500" />}
                  onClick={handleCancelTransformation}
                  className="w-full sm:w-auto text-xs border-red-200 text-red-700 hover:bg-red-50"
                >
                  Cancel Transformation
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  icon={<Play className="w-4 h-4 fill-current" />}
                  onClick={handleStartTransformation}
                  className="w-full sm:w-auto text-sm shadow-xs hover:shadow-sm"
                >
                  Start Transformation
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
