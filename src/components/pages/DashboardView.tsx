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
  ShieldCheck,
  Users,
  Presentation,
  Video,
  PlayCircle,
  Zap,
} from "lucide-react";
import { PageContainer } from "../layout/PageContainer";
import { PageHeader } from "../layout/PageHeader";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { ProjectRecord, GenerationRecord } from "../../types";
import { getAllProjects, getGeneration, saveProject, saveGeneration } from "../../services/db";
import { DEMO_PROJECT_RECORD, DEMO_GENERATION_RECORD } from "../../constants/demoDataset";

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

  const handleOpenSampleProject = async () => {
    try {
      await saveProject(DEMO_PROJECT_RECORD);
      await saveGeneration(DEMO_GENERATION_RECORD);
      if (onOpenProject) {
        onOpenProject(DEMO_PROJECT_RECORD, DEMO_GENERATION_RECORD);
      } else {
        onNavigate("projects/results");
      }
    } catch (err) {
      console.error("Failed to load sample project dataset:", err);
      if (onOpenProject) {
        onOpenProject(DEMO_PROJECT_RECORD, DEMO_GENERATION_RECORD);
      }
    }
  };

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
        description="Transform multimodal source content into multiple structured, audience-ready deliverables."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Sparkles className="w-4 h-4 text-emerald-600" />}
              onClick={handleOpenSampleProject}
              className="text-xs border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-medium"
            >
              Explore Sample
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => onNavigate("projects/new")}
            >
              New Project
            </Button>
          </div>
        }
      />

      {/* Conceptual Transformation Workflow Blueprint */}
      <Card className="mb-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-0 shadow-md">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-lg">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 text-xs font-medium backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Multimodal Content Transformation</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Transform complex source material into multi-channel communication
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                One source input parsed and synthesized into executive summaries, field advisories, social posts, presentation decks, and video production packages.
              </p>
            </div>

            <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Button
                variant="primary"
                size="md"
                icon={<Sparkles className="w-4 h-4 fill-emerald-500 text-slate-900" />}
                onClick={handleOpenSampleProject}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-md"
              >
                Explore Sample
              </Button>
              <Button
                variant="secondary"
                size="md"
                icon={<Plus className="w-4 h-4 text-slate-900" />}
                onClick={() => onNavigate("projects/new")}
                className="bg-white text-slate-900 hover:bg-slate-100 font-semibold"
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

      {/* Sample Project Callout */}
      <div className="mb-8 p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Sample Project
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-medium text-slate-600">
                Policy Document Transformation
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Explore a Sample Project
            </h3>
            <p className="text-xs text-slate-600">
              See how TransformAI transforms a policy document into multiple ready-to-use deliverables.
            </p>
          </div>
          <div className="shrink-0">
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowRight className="w-3.5 h-3.5 text-slate-600" />}
              onClick={handleOpenSampleProject}
              className="bg-white hover:bg-slate-100 text-slate-800 border-slate-300 font-medium"
            >
              Explore Sample
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Projects Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-900">Recent Projects</h2>
            <button
              type="button"
              onClick={() => onNavigate("history")}
              className="text-xs text-slate-500 hover:text-emerald-700 font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View History</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
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
              description="Explore a sample project or create a new transformation project from your own source text or document."
              primaryAction={{
                label: "Explore Sample",
                icon: <Sparkles className="w-4 h-4" />,
                onClick: handleOpenSampleProject,
              }}
              secondaryAction={{
                label: "Create New Project",
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
                    className="text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 font-medium"
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
