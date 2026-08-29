"use client";

import React, { useState } from "react";
import { Plus, FolderKanban, Filter, Search } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");
  const [showModal, setShowModal] = useState(false);

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
            onClick={() => setShowModal(true)}
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
            className={`px-3 py-1.5 rounded-md transition-colors ${
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
            className={`px-3 py-1.5 rounded-md transition-colors ${
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
            className={`px-3 py-1.5 rounded-md transition-colors ${
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
            onClick: () => setShowModal(true),
          }}
        />
      </Card>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">New Transformation Project</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Project creation and ingestion pipelines will be enabled in <strong>Module 0.3</strong>.
            </p>
            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={() => setShowModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
