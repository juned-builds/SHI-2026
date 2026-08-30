/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { DashboardView } from "./components/pages/DashboardView";
import { ProjectsView } from "./components/pages/ProjectsView";
import { HistoryView } from "./components/pages/HistoryView";
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
  const [openedFromHistory, setOpenedFromHistory] = useState<boolean>(false);
  const [activeProjectName, setActiveProjectName] = useState<string>("");
  const [activeGenerationNumber, setActiveGenerationNumber] = useState<number>(1);

  const getBreadcrumbs = () => {
    switch (currentRoute) {
      case "projects":
        return [
          { label: "Workspace", id: "dashboard" },
          { label: "Projects" },
        ];
      case "history":
        return [
          { label: "Workspace", id: "dashboard" },
          { label: "History" },
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
        if (openedFromHistory) {
          return [
            { label: "Workspace", id: "dashboard" },
            { label: "History", id: "history" },
            { label: activeProjectName || "Project", id: "history" },
            { label: `Generation #${activeGenerationNumber}` },
          ];
        }
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
      case "history":
        return "Transformation History";
      case "projects/new":
        return "Create Transformation Project";
      case "projects/new/configure":
        return "Configure Transformation";
      case "projects/generate":
        return "Generation Workspace";
      case "projects/results":
        if (openedFromHistory) {
          return `${activeProjectName || "Project"} — Generation #${activeGenerationNumber}`;
        }
        return "Deliverable Results Workspace";
      case "settings":
        return "Settings";
      case "dashboard":
      default:
        return "Dashboard";
    }
  };

  const handleContinueToConfigure = (draft: ProjectDraft) => {
    setOpenedFromHistory(false);
    setProjectDraft(draft);
    setCurrentRoute("projects/new/configure");
  };

  const handleContinueToGenerate = (config: TransformationConfig) => {
    setOpenedFromHistory(false);
    setTransformationConfig(config);
    setCurrentRoute("projects/generate");
  };

  const handleCancelProject = () => {
    setOpenedFromHistory(false);
    setProjectDraft(null);
    setTransformationConfig(null);
    setGenerationSession(null);
    setCurrentRoute("projects");
  };

  const handleNavigate = (route: string) => {
    if (route !== "projects/results") {
      setOpenedFromHistory(false);
    }
    setCurrentRoute(route);
  };

  const handleOpenProject = (
    project: ProjectRecord,
    generation?: GenerationRecord,
    isFromHistory?: boolean
  ) => {
    setOpenedFromHistory(!!isFromHistory);
    setActiveProjectName(project.name || "Project");
    setActiveGenerationNumber(generation?.generationNumber || 1);
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
    setOpenedFromHistory(false);
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
          onOpenProject={(proj, gen) => handleOpenProject(proj, gen, false)}
        />
      )}
      {currentRoute === "projects" && (
        <ProjectsView
          onNavigate={handleNavigate}
          onOpenProject={(proj, gen) => handleOpenProject(proj, gen, false)}
          onNewTransformationForProject={handleNewTransformationForProject}
        />
      )}
      {currentRoute === "history" && (
        <HistoryView
          onNavigate={handleNavigate}
          onOpenGeneration={(proj, gen) => handleOpenProject(proj, gen, true)}
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
            isOpenedFromHistory={openedFromHistory}
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
