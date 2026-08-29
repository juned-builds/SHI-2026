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
import { ConfigurePlaceholderView } from "./components/pages/ConfigurePlaceholderView";
import { ProjectDraft } from "./types";

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>("dashboard");
  const [projectDraft, setProjectDraft] = useState<ProjectDraft | null>(null);

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
          { label: "Source Ready" },
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
        return "Source Ready";
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

  const handleCancelProject = () => {
    setProjectDraft(null);
    setCurrentRoute("projects");
  };

  const handleNavigate = (route: string) => {
    // If navigating to /projects/new directly (e.g. from sidebar or dashboard CTA),
    // allow fresh project draft or maintain existing if already in progress
    setCurrentRoute(route);
  };

  return (
    <AppShell
      title={getTitle()}
      breadcrumbs={getBreadcrumbs()}
      currentRoute={currentRoute}
      onNavigate={handleNavigate}
    >
      {currentRoute === "dashboard" && (
        <DashboardView onNavigate={handleNavigate} />
      )}
      {currentRoute === "projects" && (
        <ProjectsView onNavigate={handleNavigate} />
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
        <ConfigurePlaceholderView
          draft={projectDraft}
          onNavigate={handleNavigate}
          onCancel={handleCancelProject}
        />
      )}
      {currentRoute === "settings" && <SettingsView />}
    </AppShell>
  );
}
