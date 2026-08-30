import React, { useState, useEffect } from "react";
import {
  Plus,
  Sparkles,
  FolderKanban,
  ArrowRight,
  History,
  Layers,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  UploadCloud,
} from "lucide-react";
import { PageContainer } from "../layout/PageContainer";
import { PageHeader } from "../layout/PageHeader";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { ProjectRecord, GenerationRecord } from "../../types";
import { getAllProjects, getGeneration } from "../../services/db";

export interface DashboardViewProps {
  onNavigate: (route: string) => void;
  onOpenProject?: (project: ProjectRecord, generation?: GenerationRecord) => void;
}

export function DashboardView({ onNavigate, onOpenProject }: DashboardViewProps) {
  const [recentProjects, setRecentProjects] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getAllProjects()
      .then((records) => {
        setRecentProjects(records.slice(0, 3));
      })
      .catch((err) => {
        console.error("Error loading dashboard projects:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleOpenLatest = async (project: ProjectRecord) => {
    if (!project.latestGenerationId) {
      onNavigate("projects/new/configure");
      return;
    }
    try {
      const gen = await getGeneration(project.latestGenerationId);
      if (gen && onOpenProject) {
        onOpenProject(project, gen);
      } else {
        onNavigate("projects/results");
      }
    } catch (err) {
      console.error("Failed to open project generation:", err);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "N/A";
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <PageContainer>
      {/* Welcome Header */}
      <PageHeader
        title="Dashboard"
        description="Transform multimodal source content into multiple structured deliverables."
        badge="Module 0.8 Live"
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
                Create New Project
              </Button>
            </div>
          </div>

          {/* Workflow Step Indicators */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px] text-white">
                1
              </span>
              <span>Input Source</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px] text-white">
                2
              </span>
              <span>Understanding</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px] text-white">
                3
              </span>
              <span>Configuration</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px] text-white">
                4
              </span>
              <span>Deliverables</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Projects Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Recent Projects</h2>
          {recentProjects.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate("projects")}
              className="text-xs text-emerald-700 font-medium hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              View all ({recentProjects.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* List of Recent Projects or Empty State */}
        {isLoading ? (
          <div className="p-6 rounded-xl border border-slate-200 bg-white animate-pulse space-y-3">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
          </div>
        ) : recentProjects.length === 0 ? (
          <Card>
            <EmptyState
              icon={<FolderKanban className="w-6 h-6 text-slate-400" />}
              title="No projects recorded yet"
              description="Create your first project to begin transforming your source material into multiple deliverables."
              primaryAction={{
                label: "New Project",
                icon: <Plus className="w-4 h-4" />,
                onClick: () => onNavigate("projects/new"),
              }}
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-slate-400">
                      {formatDate(project.updatedAt)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        project.status === "completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {project.status === "completed" ? (
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      ) : (
                        <Clock className="w-2.5 h-2.5" />
                      )}
                      <span className="capitalize">{project.status}</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                    {project.name}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {project.sourceMetadata.excerpt ||
                      `${project.sourceMetadata.wordCount} words analyzed`}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {project.generationCount} Gen • {project.deliverableCount} Deliv
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                    onClick={() => handleOpenLatest(project)}
                    className="text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                  >
                    Open
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
