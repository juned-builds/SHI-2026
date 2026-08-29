import React, { useState } from "react";
import { Plus, FolderKanban } from "lucide-react";
import { PageContainer } from "../layout/PageContainer";
import { PageHeader } from "../layout/PageHeader";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Input } from "../ui/Input";

export interface ProjectsViewProps {
  onNavigate: (route: string) => void;
}

export function ProjectsView({ onNavigate }: ProjectsViewProps) {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Projects"
        description="Organize your content transformation workspaces and deliverables."
        badge="0 Total"
        action={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => onNavigate("projects/new")}
          >
            New Project
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Tabs */}
        <div className="flex items-center p-1 bg-slate-100/80 rounded-lg border border-slate-200/80 text-xs font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === "all"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "hover:text-slate-900"
            }`}
          >
            All Projects
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === "active"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "hover:text-slate-900"
            }`}
          >
            In Progress
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === "completed"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "hover:text-slate-900"
            }`}
          >
            Completed
          </button>
        </div>

        {/* Search placeholder */}
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search projects..."
            disabled
            className="text-xs bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      {/* Projects List / Empty State */}
      <Card>
        <EmptyState
          icon={<FolderKanban className="w-6 h-6" />}
          title="No transformation projects found"
          description="Your transformation projects will appear here once created. Start by creating your first project workspace."
          primaryAction={{
            label: "Create Project",
            icon: <Plus className="w-4 h-4" />,
            onClick: () => onNavigate("projects/new"),
          }}
        />
      </Card>
    </PageContainer>
  );
}
