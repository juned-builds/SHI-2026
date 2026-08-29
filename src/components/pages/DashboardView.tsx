import React, { useState } from "react";
import { Plus, Sparkles, FolderKanban } from "lucide-react";
import { PageContainer } from "../layout/PageContainer";
import { PageHeader } from "../layout/PageHeader";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";

export interface DashboardViewProps {
  onNavigate: (route: string) => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  return (
    <PageContainer>
      {/* Welcome Header */}
      <PageHeader
        title="Dashboard"
        description="Transform multimodal source content into multiple structured deliverables."
        badge="Module 0.3A"
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

      {/* Conceptual Transformation Workflow Blueprint */}
      <Card className="mb-8 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-0">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-lg">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-xs font-medium backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                <span>Transformation Pipeline</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Transform your next piece of content
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                One source input parsed and transformed into executive summaries, social posts, presentation decks, and video production packages.
              </p>
            </div>

            <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                variant="secondary"
                size="md"
                icon={<Plus className="w-4 h-4 text-slate-900" />}
                onClick={() => onNavigate("projects/new")}
                className="bg-white text-slate-900 hover:bg-slate-100 shadow-md font-semibold"
              >
                Create First Project
              </Button>
            </div>
          </div>

          {/* Workflow Step Indicators */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px] text-white">1</span>
              <span>Input Source</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px] text-white">2</span>
              <span>Understanding</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px] text-white">3</span>
              <span>Configuration</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px] text-white">4</span>
              <span>Deliverables</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Projects Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Recent Projects
          </h2>
          <span className="text-xs text-slate-500 font-medium">0 active</span>
        </div>

        {/* Clean Empty State */}
        <Card>
          <EmptyState
            icon={<FolderKanban className="w-6 h-6" />}
            title="No projects yet"
            description="Create your first project to begin transforming your source material into multiple deliverables."
            primaryAction={{
              label: "New Project",
              icon: <Plus className="w-4 h-4" />,
              onClick: () => onNavigate("projects/new"),
            }}
          />
        </Card>
      </section>
    </PageContainer>
  );
}
