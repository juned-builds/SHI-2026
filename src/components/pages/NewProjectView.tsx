import React from "react";
import { ArrowLeft } from "lucide-react";
import { ProjectDraft } from "../../types";
import { PageContainer } from "../layout/PageContainer";
import { PageHeader } from "../layout/PageHeader";
import { Button } from "../ui/Button";
import { SourceInputWorkspace } from "../source/SourceInputWorkspace";

export interface NewProjectViewProps {
  initialDraft?: Partial<ProjectDraft>;
  onContinue: (draft: ProjectDraft) => void;
  onNavigate: (route: string) => void;
  onCancel?: () => void;
}

export function NewProjectView({
  initialDraft,
  onContinue,
  onNavigate,
  onCancel,
}: NewProjectViewProps) {
  const handleBackOrCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onNavigate("projects");
    }
  };

  return (
    <PageContainer maxWidth="narrow">
      {/* Top back button navigation */}
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={handleBackOrCancel}
          className="text-slate-500 hover:text-slate-900 -ml-2"
        >
          Back to Projects
        </Button>
      </div>

      {/* Page Header */}
      <PageHeader
        title="Create a transformation project"
        description="Start with the source content you want to transform."
        badge="Source Input"
      />

      {/* Main Workspace Form */}
      <SourceInputWorkspace
        initialDraft={initialDraft}
        onContinue={onContinue}
        onCancel={handleBackOrCancel}
      />
    </PageContainer>
  );
}
