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
          { label: "Configure" },
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
        return "Create Transformation";
      case "projects/new/configure":
        return "Configure Transformation";
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

  return (
    <AppShell
      title={getTitle()}
      breadcrumbs={getBreadcrumbs()}
      currentRoute={currentRoute}
      onNavigate={setCurrentRoute}
    >
      {currentRoute === "dashboard" && (
        <DashboardView onNavigate={setCurrentRoute} />
      )}
      {currentRoute === "projects" && (
        <ProjectsView onNavigate={setCurrentRoute} />
      )}
      {currentRoute === "projects/new" && (
        <NewProjectView
          initialDraft={projectDraft || undefined}
          onContinue={handleContinueToConfigure}
          onNavigate={setCurrentRoute}
        />
      )}
      {currentRoute === "projects/new/configure" && (
        <ConfigurePlaceholderView
          draft={projectDraft}
          onNavigate={setCurrentRoute}
        />
      )}
      {currentRoute === "settings" && <SettingsView />}
    </AppShell>
  );
}
