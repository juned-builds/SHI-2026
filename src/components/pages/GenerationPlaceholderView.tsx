import React from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Edit3,
  Layers,
  Package,
  AlertCircle,
  Plus,
  Info,
} from "lucide-react";
import { ProjectDraft, TransformationConfig } from "../../types";
import { PageContainer } from "../layout/PageContainer";
import { PageHeader } from "../layout/PageHeader";
import { Button } from "../ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { TransformationSummary } from "../configuration/TransformationSummary";
import { CompactSourceBanner } from "../configuration/CompactSourceBanner";
import { DELIVERABLES_CATALOG } from "../../constants/transformationOptions";

export interface GenerationPlaceholderViewProps {
  draft: ProjectDraft | null;
  config: TransformationConfig | null;
  onNavigate: (route: string) => void;
  onCancel?: () => void;
}

export function GenerationPlaceholderView({
  draft,
  config,
  onNavigate,
  onCancel,
}: GenerationPlaceholderViewProps) {
  // Empty state guard
  if (!draft || !draft.isReady || !config) {
    return (
      <PageContainer maxWidth="narrow">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => onNavigate("projects")}
            className="text-slate-500 hover:text-slate-900 -ml-2"
          >
            Back to Projects
          </Button>
        </div>

        <Card>
          <EmptyState
            title="Incomplete transformation session"
            description="Both source content and transformation configuration must be provided before entering the generation stage."
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

  const selectedDeliverables = DELIVERABLES_CATALOG.filter((d) =>
    config.deliverables.includes(d.id)
  );

  return (
    <PageContainer maxWidth="default">
      {/* Top back navigation */}
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => onNavigate("projects/new/configure")}
          className="text-slate-500 hover:text-slate-900 -ml-2"
        >
          Back to Configuration
        </Button>

        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-slate-400 hover:text-red-600"
          >
            Cancel Session
          </Button>
        )}
      </div>

      {/* Page Header */}
      <PageHeader
        title="Ready to generate"
        description="Your source and transformation configuration are ready for the AI generation step."
        badge="Ready for Pipeline"
      />

      <div className="space-y-6">
        {/* Source banner */}
        <CompactSourceBanner
          draft={draft}
          onEditSource={() => onNavigate("projects/new")}
        />

        {/* Deliverable Readiness Highlight Card */}
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardHeader className="py-4 px-6 border-b border-emerald-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <CardTitle className="text-sm sm:text-base text-slate-900">
                  Transformation Matrix Prepared
                </CardTitle>
              </div>
              <Badge variant="success">
                {selectedDeliverables.length} Deliverables Queued
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-600">
              The platform has staged the prompt parameters, tone constraints, and schema mappings for execution.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedDeliverables.map((del) => (
                <div
                  key={del.id}
                  className="p-3 bg-white border border-emerald-100 rounded-lg shadow-2xs flex items-start gap-3"
                >
                  <div className="w-7 h-7 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">
                      {del.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {del.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Configuration Summary Card */}
        <TransformationSummary draft={draft} config={config} />

        {/* Informational Guidance Notice (Module Boundaries) */}
        <div className="p-4 sm:p-5 bg-slate-100/90 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Architectural Boundary — AI Pipeline Integration (Module 0.5)</span>
          </div>
          <p className="leading-relaxed">
            Module 0.4 successfully captures and validates the multi-deliverable transformation configuration in browser memory. The actual GenAI model orchestration, automated prompt synthesis, and deliverable content rendering will be executed in <strong>Module 0.5 (Transformation Pipeline)</strong> and <strong>Module 0.6 (Presentation & Visual Engine)</strong>.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 pb-6 border-t border-slate-200/80">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              icon={<Edit3 className="w-3.5 h-3.5" />}
              onClick={() => onNavigate("projects/new/configure")}
              className="w-full sm:w-auto text-xs"
            >
              Edit Configuration
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => onNavigate("projects")}
              className="w-full sm:w-auto text-xs text-slate-600"
            >
              Back to Projects
            </Button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Clearly disabled / placeholder generation action */}
            <Button
              type="button"
              variant="primary"
              disabled={true}
              icon={<Sparkles className="w-4 h-4" />}
              className="w-full sm:w-auto opacity-70 cursor-not-allowed"
              title="Generation engine will be unlocked in Module 0.5"
            >
              Execute Generation (Available in Module 0.5)
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
