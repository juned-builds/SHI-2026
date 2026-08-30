import React from "react";
import { Layers, Plus, ArrowLeft, AlertCircle } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

export interface ResultsEmptyStateProps {
  onStartNew: () => void;
  onBackToConfig?: () => void;
  title?: string;
  description?: string;
}

export function ResultsEmptyState({
  onStartNew,
  onBackToConfig,
  title = "No Generated Deliverables Found",
  description = "There are currently no generated deliverables available in this workspace session. Start a new transformation project or return to the configuration step.",
}: ResultsEmptyStateProps) {
  return (
    <Card className="p-12 text-center max-w-xl mx-auto border-slate-200 shadow-xs">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
        <Layers className="w-7 h-7" />
      </div>

      <h3 className="text-base font-semibold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto mb-6">
        {description}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {onBackToConfig && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={onBackToConfig}
            className="w-full sm:w-auto text-xs"
          >
            Configure Transformation
          </Button>
        )}

        <Button
          type="button"
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={onStartNew}
          className="w-full sm:w-auto text-xs shadow-xs"
        >
          Start New Project
        </Button>
      </div>
    </Card>
  );
}
