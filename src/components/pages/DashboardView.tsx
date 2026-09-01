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
  Check,
  Zap,
  BarChart3,
  Share2,
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
  const [allProjects, setAllProjects] = useState<ProjectRecord[]>([]);
  const [recentProjects, setRecentProjects] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getAllProjects()
      .then((records) => {
        setAllProjects(records);
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

  // Aggregated quick stats
  const totalDeliverablesCount = allProjects.reduce(
    (acc, p) => acc + (p.deliverableCount || 0),
    0
  );

  return (
    <PageContainer>
      {/* Welcome Header */}
      <PageHeader
        title="Dashboard"
        description="Transform multimodal source content into multiple structured, audience-ready deliverables."
        action={
          <div className="flex items-center gap-2.5">
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

      {/* Main Hero Transformation Workflow Card */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white border border-slate-800 shadow-md overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="p-6 sm:p-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-medium backdrop-blur-xs border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Multimodal Content Intelligence Platform</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Transform complex source material into multi-channel communication
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                Parse input documents and synthesize executive briefs, field advisories, social posts, 16:9 presentation decks, and video packages with grounded verification.
              </p>
            </div>

            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Button
                variant="primary"
                size="md"
                icon={<Sparkles className="w-4 h-4 text-slate-950" />}
                onClick={handleOpenSampleProject}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-md border-0"
              >
                Explore Sample
              </Button>
              <Button
                variant="secondary"
                size="md"
                icon={<Plus className="w-4 h-4 text-slate-900" />}
                onClick={() => onNavigate("projects/new")}
                className="bg-white text-slate-900 hover:bg-slate-100 font-semibold border-0"
              >
                Create New Project
              </Button>
            </div>
          </div>

          {/* Workflow Step Indicators */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                1
              </span>
              <div>
                <p className="font-semibold text-white">Source Ingestion</p>
                <p className="text-[11px] text-slate-400">PDF, text, doc parsing</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                2
              </span>
              <div>
                <p className="font-semibold text-white">Understanding</p>
                <p className="text-[11px] text-slate-400">Claims & entity graph</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                3
              </span>
              <div>
                <p className="font-semibold text-white">Synthesis Engine</p>
                <p className="text-[11px] text-slate-400">Persona-aligned output</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                4
              </span>
              <div>
                <p className="font-semibold text-white">Multi-Deliverables</p>
                <p className="text-[11px] text-slate-400">Decks, posts, briefs, PPTX</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Explore a Sample Project Card - Dedicated Product Onboarding Experience */}
      <div className="mb-8 rounded-2xl bg-white border border-slate-200/90 p-6 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                Sample Project
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">
                National Education Policy & Implementation Strategy
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Explore a Sample Project
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              See how TransformAI transforms a complex policy document into multiple audience-ready deliverables with verifiable accuracy and zero API overhead.
            </p>

            {/* Compact Capability Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Multi-format transformation</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>FactMesh™ verification</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>AudienceLens™ analysis</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>PowerPoint export</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center">
            <Button
              variant="outline"
              size="md"
              icon={<ArrowRight className="w-4 h-4 text-emerald-700" />}
              onClick={handleOpenSampleProject}
              className="bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold px-5 shadow-2xs w-full sm:w-auto"
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
              View all ({allProjects.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* List of Recent Projects or Empty State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-6 rounded-xl border border-slate-200 bg-white animate-pulse space-y-3"
              >
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
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
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-slate-400">
                      {formatDate(project.updatedAt)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        project.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
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

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-sans">
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
