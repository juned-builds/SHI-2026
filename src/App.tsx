/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { DashboardView } from "./components/pages/DashboardView";
import { ProjectsView } from "./components/pages/ProjectsView";
import { SettingsView } from "./components/pages/SettingsView";
import { NewProjectView } from "./components/pages/NewProjectView";
import { ConfigureView } from "./components/pages/ConfigureView";
import { GenerationWorkspaceView } from "./components/pages/GenerationWorkspaceView";
import { ResultsWorkspace } from "./components/results/ResultsWorkspace";
import { PageContainer } from "./components/layout/PageContainer";
import {
  ProjectDraft,
  TransformationConfig,
  GenerationSession,
  ProjectRecord,
  GenerationRecord,
} from "./types";
import {
  INITIAL_PIPELINE_STAGES,
  createDeliverablePipelineItems,
} from "./constants/generationConstants";

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>("dashboard");
  const [projectDraft, setProjectDraft] = useState<ProjectDraft | null>(null);
  const [transformationConfig, setTransformationConfig] =
    useState<TransformationConfig | null>(null);
  const [generationSession, setGenerationSession] =
    useState<GenerationSession | null>(null);

  const getBreadcrumbs = () => {
    switch (currentRoute) {
      case "projects":
        return [
          { label: "Workspace", id: "dashboard" },
          { label: "Projects" },
        ];
      case "projects/new":
        return [
          { label: "Workspace", id: "dashboard" },
          { label: "Projects", id: "projects" },
          { label: "New Project" },
        ];
      case "projects/new/configure":
        return [
          { label: "Workspace", id: "dashboard" },
          { label: "Projects", id: "projects" },
          { label: "New Project", id: "projects/new" },
          { label: "Configure" },
        ];
      case "projects/generate":
        return [
          { label: "Workspace", id: "dashboard" },
          { label: "Projects", id: "projects" },
          { label: "New Project", id: "projects/new" },
          { label: "Configure", id: "projects/new/configure" },
          { label: "Generation Workspace" },
        ];
      case "projects/results":
        return [
          { label: "Workspace", id: "dashboard" },
          { label: "Projects", id: "projects" },
          { label: "New Project", id: "projects/new" },
          { label: "Configure", id: "projects/new/configure" },
          { label: "Results Workspace" },
        ];
      case "settings":
        return [
          { label: "Workspace", id: "dashboard" },
          { label: "Settings" },
        ];
      case "dashboard":
      default:
        return [
          { label: "Workspace", id: "dashboard" },
          { label: "Dashboard" },
        ];
    }
  };

  const getTitle = () => {
    switch (currentRoute) {
      case "projects":
        return "Projects";
      case "projects/new":
        return "Create Transformation Project";
      case "projects/new/configure":
        return "Configure Transformation";
      case "projects/generate":
        return "Generation Workspace";
      case "projects/results":
        return "Deliverable Results Workspace";
      case "settings":
        return "Settings";
      case "dashboard":
      default:
        return "Dashboard";
    }
  };

  const handleContinueToConfigure = (draft: ProjectDraft) => {
    setProjectDraft(draft);
    setCurrentRoute("projects/new/configure");
  };

  const handleContinueToGenerate = (config: TransformationConfig) => {
    setTransformationConfig(config);
    setCurrentRoute("projects/generate");
  };

  const handleCancelProject = () => {
    setProjectDraft(null);
    setTransformationConfig(null);
    setGenerationSession(null);
    setCurrentRoute("projects");
  };

  const handleNavigate = (route: string) => {
    setCurrentRoute(route);
  };

  const handleOpenProject = (project: ProjectRecord, generation?: GenerationRecord) => {
    setProjectDraft(project.draft);

    if (generation && generation.deliverables && generation.deliverables.length > 0) {
      setTransformationConfig(generation.config);
      const restoredSession: GenerationSession = {
        sessionId: generation.id,
        projectId: project.id,
        generationId: generation.id,
        createdAt: generation.createdAt,
        completedAt: generation.completedAt,
        draft: generation.draft || project.draft,
        config: generation.config,
        status: "completed",
        currentStageIndex: 3,
        stages: INITIAL_PIPELINE_STAGES.map((s) => ({ ...s, status: "completed" })),
        deliverablesPipeline: createDeliverablePipelineItems(generation.config.deliverables).map(
          (item) => ({
            ...item,
            status: "ready",
            promptSchemaReady: true,
          })
        ),
        generatedDeliverables: generation.deliverables,
        modelUsed: generation.modelUsed || "gemini-3.7-flash",
      };
      setGenerationSession(restoredSession);
      setCurrentRoute("projects/results");
    } else {
      setTransformationConfig(null);
      setGenerationSession(null);
      setCurrentRoute("projects/new/configure");
    }
  };

  const handleNewTransformationForProject = (project: ProjectRecord) => {
    setProjectDraft(project.draft);
    setTransformationConfig(null);
    setGenerationSession(null);
    setCurrentRoute("projects/new/configure");
  };

  return (
    <AppShell
      title={getTitle()}
      breadcrumbs={getBreadcrumbs()}
      currentRoute={currentRoute}
      onNavigate={handleNavigate}
    >
      {currentRoute === "dashboard" && (
        <DashboardView
          onNavigate={handleNavigate}
          onOpenProject={handleOpenProject}
        />
      )}
      {currentRoute === "projects" && (
        <ProjectsView
          onNavigate={handleNavigate}
          onOpenProject={handleOpenProject}
          onNewTransformationForProject={handleNewTransformationForProject}
        />
      )}
      {currentRoute === "projects/new" && (
        <NewProjectView
          initialDraft={projectDraft || undefined}
          onContinue={handleContinueToConfigure}
          onNavigate={handleNavigate}
          onCancel={handleCancelProject}
        />
      )}
      {currentRoute === "projects/new/configure" && (
        <ConfigureView
          draft={projectDraft}
          config={transformationConfig}
          onContinue={handleContinueToGenerate}
          onNavigate={handleNavigate}
          onCancel={handleCancelProject}
        />
      )}
      {currentRoute === "projects/generate" && (
        <GenerationWorkspaceView
          draft={projectDraft}
          config={transformationConfig}
          session={generationSession}
          onUpdateSession={setGenerationSession}
          onNavigate={handleNavigate}
          onCancel={handleCancelProject}
        />
      )}
      {currentRoute === "projects/results" && (
        <PageContainer maxWidth="default">
          <ResultsWorkspace
            draft={projectDraft}
            config={transformationConfig}
            session={generationSession}
            onUpdateSession={setGenerationSession}
            onNavigate={handleNavigate}
            onRegenerateAll={() => setCurrentRoute("projects/generate")}
          />
        </PageContainer>
      )}
      {currentRoute === "settings" && <SettingsView />}
    </AppShell>
  );
}
