/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { DashboardView } from "./components/pages/DashboardView";
import { ProjectsView } from "./components/pages/ProjectsView";
import { HistoryView } from "./components/pages/HistoryView";
import { LibraryView, LibraryCategoryFilter } from "./components/pages/LibraryView";
import { IntelligenceView, IntelligenceTab } from "./components/pages/IntelligenceView";
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
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string | undefined>(undefined);

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
      case "library":
      case "library/all":
        return [
          { label: "Workspace", id: "dashboard" },
          { label: "Library" },
          { label: "All Deliverables" },
        ];
      case "library/presentations":
        return [
          { label: "Workspace", id: "dashboard" },
          { label: "Library", id: "library" },
          { label: "Presentations" },
        ];
      case "library/social":
        return [
          { label: "Workspace", id: "dashboard" },
          { label: "Library", id: "library" },
          { label: "Social Posts" },
        ];
      case "library/briefs":
        return [
          { label: "Workspace", id: "dashboard" },
          { label: "Library", id: "library" },
          { label: "Briefs & Summaries" },
        ];
      case "library/advisories":
        return [
          { label: "Workspace", id: "dashboard" },
          { label: "Library", id: "library" },
          { label: "Field Advisories" },
        ];
      case "intelligence/factmesh":
        return [
          { label: "Workspace", id: "dashboard" },
          { label: "Intelligence" },
          { label: "FactMesh™ Audit" },
        ];
      case "intelligence/audiencelens":
        return [
          { label: "Workspace", id: "dashboard" },
          { label: "Intelligence" },
          { label: "AudienceLens™" },
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
      case "library":
      case "library/all":
        return "All Deliverables Library";
      case "library/presentations":
        return "Presentations Library";
      case "library/social":
        return "Social Posts Library";
      case "library/briefs":
        return "Executive Briefs Library";
      case "library/advisories":
        return "Field Advisories Library";
      case "intelligence/factmesh":
        return "FactMesh™ Verification Intelligence";
      case "intelligence/audiencelens":
        return "AudienceLens™ Suitability Intelligence";
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
    setSelectedDeliverableId(undefined);
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
    isFromHistory?: boolean,
    targetDeliverableId?: string
  ) => {
    setOpenedFromHistory(!!isFromHistory);
    setActiveProjectName(project.name || "Project");
    setActiveGenerationNumber(generation?.generationNumber || 1);
    setProjectDraft(project.draft);
    setSelectedDeliverableId(targetDeliverableId);

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
        persistenceStatus: "saved",
        isSaved: true,
      };
      setGenerationSession(restoredSession);
      setCurrentRoute("projects/results");
    } else {
      setTransformationConfig(null);
      setGenerationSession(null);
      setCurrentRoute("projects/new/configure");
    }
  };

  const handleOpenDeliverableFromLibrary = (
    project: ProjectRecord,
    generation: GenerationRecord,
    deliverableId: string
  ) => {
    handleOpenProject(project, generation, false, deliverableId);
  };

  const handleUpdateSession = (updatedSession: GenerationSession | null) => {
    setGenerationSession(updatedSession);
    if (updatedSession?.draft) {
      setProjectDraft(updatedSession.draft);
    }
  };

  const handleNewTransformationForProject = (project: ProjectRecord) => {
    setOpenedFromHistory(false);
    setProjectDraft(project.draft);
    setTransformationConfig(null);
    setGenerationSession(null);
    setSelectedDeliverableId(undefined);
    setCurrentRoute("projects/new/configure");
  };

  // Helper to extract library filter from route
  const getLibraryCategoryFromRoute = (route: string): LibraryCategoryFilter => {
    if (route === "library/presentations") return "presentations";
    if (route === "library/social") return "social";
    if (route === "library/briefs") return "briefs";
    if (route === "library/advisories") return "advisories";
    return "all";
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
      {currentRoute.startsWith("library") && (
        <LibraryView
          initialCategory={getLibraryCategoryFromRoute(currentRoute)}
          onNavigate={handleNavigate}
          onOpenDeliverable={handleOpenDeliverableFromLibrary}
        />
      )}
      {currentRoute === "intelligence/factmesh" && (
        <IntelligenceView
          initialTab="factmesh"
          onNavigate={handleNavigate}
          onOpenDeliverable={handleOpenDeliverableFromLibrary}
        />
      )}
      {currentRoute === "intelligence/audiencelens" && (
        <IntelligenceView
          initialTab="audiencelens"
          onNavigate={handleNavigate}
          onOpenDeliverable={handleOpenDeliverableFromLibrary}
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
          onUpdateSession={handleUpdateSession}
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
            initialDeliverableId={selectedDeliverableId}
            onUpdateSession={handleUpdateSession}
            onNavigate={handleNavigate}
            onRegenerateAll={() => setCurrentRoute("projects/generate")}
            onDiscard={handleCancelProject}
          />
        </PageContainer>
      )}
      {currentRoute === "settings" && <SettingsView />}
    </AppShell>
  );
}
