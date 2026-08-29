import React from "react";
import { CheckCircle2, Clock, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { PipelineStage, GenerationStatus } from "../../types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";

export interface PipelineProgressTrackerProps {
  stages: PipelineStage[];
  currentStageIndex: number;
  status: GenerationStatus;
  progressPercent: number;
}

export function PipelineProgressTracker({
  stages,
  currentStageIndex,
  status,
  progressPercent,
}: PipelineProgressTrackerProps) {
  const getStageIcon = (stage: PipelineStage, index: number) => {
    if (stage.status === "completed") {
      return (
        <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </span>
      );
    }
    if (stage.status === "in_progress") {
      return (
        <span className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
        </span>
      );
    }
    if (stage.status === "failed") {
      return (
        <span className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
          <AlertCircle className="w-4 h-4" />
        </span>
      );
    }
    return (
      <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
        <Clock className="w-3.5 h-3.5" />
      </span>
    );
  };

  const getStatusBadge = () => {
    switch (status) {
      case "preparing":
      case "validating":
        return <Badge variant="default" className="text-xs">Preparing Pipeline ({progressPercent}%)</Badge>;
      case "completed":
        return <Badge variant="success" className="text-xs">Pipeline Staged (100%)</Badge>;
      case "failed":
        return <Badge variant="outline" className="text-xs text-red-600 border-red-200">Preparation Failed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="text-xs text-slate-500">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Idle</Badge>;
    }
  };

  return (
    <Card className="border-slate-200 shadow-xs">
      <CardHeader className="py-4 px-6 bg-slate-50/60 border-b border-slate-200/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-700" />
            <CardTitle className="text-sm font-semibold text-slate-900">
              Local Generation Pipeline Staging
            </CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription className="text-xs text-slate-500">
          Validating source data and synthesizing prompt schemas in browser memory before GenAI execution.
        </CardDescription>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3 overflow-hidden">
          <div
            className="bg-slate-900 h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const isCurrent = stage.status === "in_progress";
            const isDone = stage.status === "completed";

            return (
              <div
                key={stage.id}
                className={`p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                  isCurrent
                    ? "bg-slate-50 border-slate-900/40 shadow-xs"
                    : isDone
                    ? "bg-white border-slate-200/80"
                    : "bg-slate-50/40 border-slate-200/40 opacity-70"
                }`}
              >
                {getStageIcon(stage, index)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h5
                      className={`text-xs font-semibold ${
                        isCurrent || isDone ? "text-slate-900" : "text-slate-500"
                      }`}
                    >
                      {stage.title}
                    </h5>

                    <span
                      className={`text-[10px] font-medium uppercase tracking-wider ${
                        isDone
                          ? "text-emerald-600"
                          : isCurrent
                          ? "text-slate-900 font-bold"
                          : "text-slate-400"
                      }`}
                    >
                      {stage.status === "completed"
                        ? "Completed"
                        : stage.status === "in_progress"
                        ? "Active"
                        : "Pending"}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    {stage.description}
                  </p>

                  {stage.detail && (isCurrent || isDone) && (
                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                      → {stage.detail}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
