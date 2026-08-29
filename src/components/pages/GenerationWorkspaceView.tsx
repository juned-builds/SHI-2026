import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Sparkles,
  Play,
  XCircle,
  RotateCcw,
  AlertCircle,
  Plus,
  ShieldCheck,
} from "lucide-react";
import {
  ProjectDraft,
  TransformationConfig,
  GenerationSession,
  GenerationStatus,
  PipelineStage,
} from "../../types";
import { PageContainer } from "../layout/PageContainer";
import { PageHeader } from "../layout/PageHeader";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { GenerationSummaryCard } from "../generation/GenerationSummaryCard";
import { PipelineProgressTracker } from "../generation/PipelineProgressTracker";
import { PipelineReadyBanner } from "../generation/PipelineReadyBanner";
import {
  INITIAL_PIPELINE_STAGES,
  createDeliverablePipelineItems,
} from "../../constants/generationConstants";

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
  // Session initialization
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
    };
  });

  const [progressPercent, setProgressPercent] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync back to parent if session updates
  useEffect(() => {
    if (session && onUpdateSession) {
      onUpdateSession(session);
    }
  }, [session, onUpdateSession]);

  // Clean up any running timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Empty state guard if draft or config is missing
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

  // Handle Start Transformation Action (Simulated local preparation pipeline)
  const handleStartTransformation = () => {
    if (!draft || !config) return;

    // Reset stages
    const freshStages: PipelineStage[] = INITIAL_PIPELINE_STAGES.map((s, idx) => ({
      ...s,
      status: idx === 0 ? "in_progress" : "pending",
    }));

    const freshDeliverables = createDeliverablePipelineItems(config.deliverables);

    const newSession: GenerationSession = {
      sessionId: `gen_session_${Date.now()}`,
      createdAt: new Date().toISOString(),
      draft,
      config,
      status: "preparing",
      currentStageIndex: 0,
      stages: freshStages,
      deliverablesPipeline: freshDeliverables,
    };

    setSession(newSession);
    setProgressPercent(15);

    // Sequence through stages cleanly in memory
    // Stage 1 -> Stage 2 after 700ms
    timerRef.current = setTimeout(() => {
      setSession((prev) => {
        if (!prev || prev.status !== "preparing") return prev;
        const updatedStages = [...prev.stages];
        updatedStages[0].status = "completed";
        updatedStages[1].status = "in_progress";
        return {
          ...prev,
          currentStageIndex: 1,
          stages: updatedStages,
        };
      });
      setProgressPercent(45);

      // Stage 2 -> Stage 3 after another 700ms
      timerRef.current = setTimeout(() => {
        setSession((prev) => {
          if (!prev || prev.status !== "preparing") return prev;
          const updatedStages = [...prev.stages];
          updatedStages[1].status = "completed";
          updatedStages[2].status = "in_progress";
          const updatedDeliverables = prev.deliverablesPipeline.map((d) => ({
            ...d,
            status: "ready" as const,
            promptSchemaReady: true,
          }));
          return {
            ...prev,
            currentStageIndex: 2,
            stages: updatedStages,
            deliverablesPipeline: updatedDeliverables,
          };
        });
        setProgressPercent(75);

        // Stage 3 -> Stage 4 (Complete) after another 700ms
        timerRef.current = setTimeout(() => {
          setSession((prev) => {
            if (!prev || prev.status !== "preparing") return prev;
            const updatedStages = [...prev.stages];
            updatedStages[2].status = "completed";
            updatedStages[3].status = "completed";
            return {
              ...prev,
              status: "completed",
              currentStageIndex: 3,
              stages: updatedStages,
              preparedAt: new Date().toISOString(),
            };
          });
          setProgressPercent(100);
        }, 750);
      }, 750);
    }, 750);
  };

  // Handle Cancel Preparation
  const handleCancelPreparation = () => {
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

  // Handle Reset Pipeline Staging
  const handleResetStaging = () => {
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
        preparedAt: undefined,
      };
    });
    setProgressPercent(0);
  };

  const status = session?.status || "idle";
  const isPreparing = status === "preparing" || status === "validating";
  const isCompleted = status === "completed";

  return (
    <PageContainer maxWidth="default">
      {/* Top back navigation */}
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="w-4 h-4 text-slate-500" />}
          onClick={() => onNavigate("projects/new/configure")}
          disabled={isPreparing}
          className="text-slate-500 hover:text-slate-900 -ml-2"
        >
          Back to Configuration
        </Button>

        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isPreparing}
            className="text-slate-400 hover:text-red-600 text-xs"
          >
            Cancel Project
          </Button>
        )}
      </div>

      {/* Page Header */}
      <PageHeader
        title={isCompleted ? "Generation Pipeline Prepared" : "Your transformation is ready"}
        description={
          isCompleted
            ? "Your transformation parameters and prompt schemas are staged in memory for AI synthesis."
            : "Review your source material, target parameters, and deliverable outputs before starting the transformation pipeline."
        }
        badge="Generation Workspace"
      />

      <div className="space-y-6">
        {/* If completed, show the ready banner */}
        {isCompleted && (
          <PipelineReadyBanner
            onEditConfig={() => onNavigate("projects/new/configure")}
            onReset={handleResetStaging}
            deliverablesCount={config.deliverables.length}
          />
        )}

        {/* If preparing or completed, show pipeline stages tracker */}
        {(isPreparing || isCompleted) && (
          <PipelineProgressTracker
            stages={session?.stages || INITIAL_PIPELINE_STAGES}
            currentStageIndex={session?.currentStageIndex || 0}
            status={status}
            progressPercent={progressPercent}
          />
        )}

        {/* If cancelled, show warning alert */}
        {status === "cancelled" && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Transformation preparation was cancelled. You can restart staging or adjust configuration.</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetStaging}
              className="text-xs shrink-0"
            >
              Reset Staging
            </Button>
          </div>
        )}

        {/* Source & Configuration Summary */}
        <GenerationSummaryCard
          draft={draft}
          config={config}
          onEditSource={() => onNavigate("projects/new")}
          onEditConfig={() => onNavigate("projects/new/configure")}
          isLocked={isPreparing}
        />

        {/* Action Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-8 border-t border-slate-200">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onNavigate("projects/new/configure")}
              disabled={isPreparing}
              className="w-full sm:w-auto text-xs"
            >
              Edit Configuration
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => onNavigate("projects")}
              disabled={isPreparing}
              className="w-full sm:w-auto text-xs text-slate-600"
            >
              Back to Projects
            </Button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isPreparing ? (
              <Button
                type="button"
                variant="outline"
                icon={<XCircle className="w-4 h-4 text-red-500" />}
                onClick={handleCancelPreparation}
                className="w-full sm:w-auto text-xs border-red-200 text-red-700 hover:bg-red-50"
              >
                Cancel Preparation
              </Button>
            ) : isCompleted ? (
              <Button
                type="button"
                variant="outline"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={handleResetStaging}
                className="w-full sm:w-auto text-xs"
              >
                Re-stage Pipeline
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
      </div>
    </PageContainer>
  );
}
