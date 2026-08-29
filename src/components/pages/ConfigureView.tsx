import React from "react";
import { ArrowLeft, AlertCircle, Plus } from "lucide-react";
import { ProjectDraft, TransformationConfig } from "../../types";
import { PageContainer } from "../layout/PageContainer";
import { PageHeader } from "../layout/PageHeader";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { ConfigurationWorkspace } from "../configuration/ConfigurationWorkspace";

export interface ConfigureViewProps {
  draft: ProjectDraft | null;
  config: TransformationConfig | null;
  onContinue: (config: TransformationConfig) => void;
  onNavigate: (route: string) => void;
  onCancel?: () => void;
}

export function ConfigureView({
  draft,
  config,
  onContinue,
  onNavigate,
  onCancel,
}: ConfigureViewProps) {
  // Graceful empty state if navigated directly without an active source draft
  if (!draft || !draft.isReady) {
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
            title="No source content found"
            description="A transformation project requires source material (uploaded document or pasted text) before configuration can begin."
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

  return (
    <PageContainer maxWidth="default">
      {/* Top back navigation */}
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => onNavigate("projects/new")}
          className="text-slate-500 hover:text-slate-900 -ml-2"
        >
          Back to Source Input
        </Button>

        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-slate-400 hover:text-red-600"
          >
            Cancel Project
          </Button>
        )}
      </div>

      {/* Main Page Header */}
      <PageHeader
        title="Configure your transformation"
        description="Tell the platform who you're communicating with, how the content should sound, and what you want to create."
        badge="Transformation Setup"
      />

      {/* Configuration Workspace */}
      <ConfigurationWorkspace
        draft={draft}
        initialConfig={config}
        onContinue={onContinue}
        onEditSource={() => onNavigate("projects/new")}
        onCancel={onCancel}
      />
    </PageContainer>
  );
}
