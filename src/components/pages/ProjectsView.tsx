import React, { useState, useEffect } from "react";
import {
  Plus,
  FolderKanban,
  Search,
  Calendar,
  Layers,
  History,
  ArrowRight,
  Trash2,
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  Sparkles,
  Edit2,
  AlertCircle,
  X,
  PlayCircle,
} from "lucide-react";
import { PageContainer } from "../layout/PageContainer";
import { PageHeader } from "../layout/PageHeader";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Input } from "../ui/Input";
import { ProjectRecord, GenerationRecord } from "../../types";
import {
  getAllProjects,
  deleteProject,
  getGeneration,
  renameProject as dbRenameProject,
  saveProject,
  saveGeneration,
} from "../../services/db";
import { ProjectHistoryModal } from "./ProjectHistoryModal";
import {
  DEMO_PROJECT_RECORD,
  DEMO_GENERATION_RECORD,
} from "../../constants/demoDataset";

export interface ProjectsViewProps {
  onNavigate: (route: string) => void;
  onOpenProject?: (project: ProjectRecord, generation?: GenerationRecord) => void;
  onNewTransformationForProject?: (project: ProjectRecord) => void;
}

export function ProjectsView({
  onNavigate,
  onOpenProject,
  onNewTransformationForProject,
}: ProjectsViewProps) {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"all" | "completed" | "in_progress">("all");
  const [selectedProjectForHistory, setSelectedProjectForHistory] =
    useState<ProjectRecord | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<ProjectRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [projectToRename, setProjectToRename] = useState<ProjectRecord | null>(null);
  const [newProjectName, setNewProjectName] = useState<string>("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const records = await getAllProjects();
      setProjects(records);
    } catch (err) {
      console.error("[ProjectsView] Error loading projects:", err);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleLoadDemoDataset = async () => {
    try {
      await saveProject(DEMO_PROJECT_RECORD);
      await saveGeneration(DEMO_GENERATION_RECORD);
      await fetchProjects();
      setNotification("Showcase demo project (NIDCI 2026) loaded successfully.");
      setTimeout(() => setNotification(null), 4000);
      if (onOpenProject) {
        onOpenProject(DEMO_PROJECT_RECORD, DEMO_GENERATION_RECORD);
      }
    } catch (err) {
      console.error("Failed to load demo dataset:", err);
    }
  };

  const handleOpenLatest = async (project: ProjectRecord) => {
    if (!project.latestGenerationId) {
      if (onNewTransformationForProject) {
        onNewTransformationForProject(project);
      } else {
        onNavigate("projects/new/configure");
      }
      return;
    }

    try {
      const gen = await getGeneration(project.latestGenerationId);
      if (gen && onOpenProject) {
        onOpenProject(project, gen);
      } else if (onNewTransformationForProject) {
        onNewTransformationForProject(project);
      }
    } catch (err) {
      console.error("Failed to open latest generation:", err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProject(projectToDelete.id);
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      setNotification(`Project "${projectToDelete.name}" deleted successfully.`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error("Failed to delete project:", err);
    } finally {
      setIsDeleting(false);
      setProjectToDelete(null);
    }
  };

  const handleStartRename = (project: ProjectRecord) => {
    setProjectToRename(project);
    setNewProjectName(project.name);
    setRenameError(null);
  };

  const handleConfirmRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectToRename) return;
    const trimmed = newProjectName.trim();
    if (!trimmed) {
      setRenameError("Project name cannot be empty.");
      return;
    }

    setIsRenaming(true);
    try {
      const updated = await dbRenameProject(projectToRename.id, trimmed);
      if (updated) {
        setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setNotification(`Project renamed to "${updated.name}".`);
        setTimeout(() => setNotification(null), 4000);
      }
      setProjectToRename(null);
    } catch (err) {
      console.error("Failed to rename project:", err);
    } finally {
      setIsRenaming(false);
    }
  };

  const filteredProjects = projects.filter((proj) => {
    // Tab filter
    if (activeTab === "completed" && proj.status !== "completed") return false;
    if (activeTab === "in_progress" && proj.status === "completed") return false;

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchName = proj.name.toLowerCase().includes(query);
      const matchFile = proj.sourceMetadata.fileName?.toLowerCase().includes(query);
      const matchText = proj.sourceMetadata.excerpt?.toLowerCase().includes(query);
      return matchName || matchFile || matchText;
    }

    return true;
  });

  const formatDate = (isoString?: string) => {
    if (!isoString) return "N/A";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <PageContainer>
      {/* Notification toast */}
      {notification && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <span>{notification}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 font-semibold ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Projects"
        description="Organize your content transformation workspaces, generation history, and deliverables."
        badge={`${projects.length} Saved`}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<PlayCircle className="w-4 h-4 text-indigo-600" />}
              onClick={handleLoadDemoDataset}
              className="text-xs border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-900"
              title="Load full pre-computed NIDCI demo dataset (Zero Quota)"
            >
              Load Showcase Demo
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => onNavigate("projects/new")}
            >
              Create New Project
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Tabs */}
        <div className="flex items-center p-1 bg-slate-100/90 rounded-lg border border-slate-200/80 text-xs font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === "all"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "hover:text-slate-900"
            }`}
          >
            All Projects ({projects.length})
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
            Completed ({projects.filter((p) => p.status === "completed").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("in_progress")}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === "in_progress"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "hover:text-slate-900"
            }`}
          >
            Draft / Active ({projects.filter((p) => p.status !== "completed").length})
          </button>
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-72 relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects or sources..."
            className="text-xs bg-white pl-8 border-slate-200 focus:border-blue-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Projects List / Skeletons / Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-6 rounded-xl border border-slate-200 bg-white space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                <div className="h-4 bg-slate-200 rounded w-24"></div>
              </div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-3 bg-slate-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FolderKanban className="w-8 h-8 text-slate-400" />}
            title={
              searchQuery
                ? "No matching projects found"
                : "No saved transformation projects yet"
            }
            description={
              searchQuery
                ? `No projects matched the search query "${searchQuery}". Try a different keyword.`
                : "When you generate and click 'Save Project' in the results workspace, your projects and deliverables will be preserved here in local storage."
            }
            primaryAction={
              !searchQuery
                ? {
                    label: "Create First Project",
                    icon: <Plus className="w-4 h-4" />,
                    onClick: () => onNavigate("projects/new"),
                  }
                : undefined
            }
            secondaryAction={
              !searchQuery
                ? {
                    label: "Load Showcase Demo (Zero Quota)",
                    icon: <PlayCircle className="w-4 h-4" />,
                    onClick: handleLoadDemoDataset,
                  }
                : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProjects.map((project) => {
            const hasGenerations = project.generationCount > 0;

            return (
              <div
                key={project.id}
                className="p-5 sm:p-6 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between gap-5"
              >
                {/* Upper row: Title, Status, Metadata */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 tracking-tight">
                        {project.name}
                      </h3>

                      <button
                        type="button"
                        onClick={() => handleStartRename(project)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        title="Rename Project"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          project.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {project.status === "completed" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span className="capitalize">
                          {project.status === "completed" ? "Completed" : "In Progress"}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>Updated {formatDate(project.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Source Metadata & Excerpt */}
                  <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70">
                      {project.sourceType === "file" ? (
                        <UploadCloud className="w-3 h-3 text-slate-500" />
                      ) : (
                        <FileText className="w-3 h-3 text-slate-500" />
                      )}
                      {project.sourceMetadata.fileName || "Direct Text"}
                    </span>

                    <span>•</span>
                    <span>{project.sourceMetadata.wordCount.toLocaleString()} words</span>
                    <span>•</span>
                    <span>{project.sourceMetadata.charCount.toLocaleString()} chars</span>
                  </div>

                  {project.sourceMetadata.excerpt && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed italic bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                      "{project.sourceMetadata.excerpt}"
                    </p>
                  )}
                </div>

                {/* Lower row: Badges and Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  {/* Badges */}
                  <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 font-medium text-blue-800 bg-blue-50/80 px-2.5 py-1 rounded-md border border-blue-200/60">
                      <History className="w-3.5 h-3.5 text-blue-600" />
                      {project.generationCount} Generation
                      {project.generationCount === 1 ? "" : "s"}
                    </span>

                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      {project.deliverableCount} Deliverable
                      {project.deliverableCount === 1 ? "" : "s"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* View History */}
                    {hasGenerations && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<History className="w-3.5 h-3.5 text-slate-500" />}
                        onClick={() => setSelectedProjectForHistory(project)}
                        className="text-xs"
                      >
                        History
                      </Button>
                    )}

                    {/* New Generation */}
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Sparkles className="w-3.5 h-3.5 text-blue-600" />}
                      onClick={() => {
                        if (onNewTransformationForProject) {
                          onNewTransformationForProject(project);
                        } else {
                          onNavigate("projects/new/configure");
                        }
                      }}
                      className="text-xs border-blue-200 text-blue-800 hover:bg-blue-50"
                    >
                      New Generation
                    </Button>

                    {/* Open Latest Results */}
                    {hasGenerations && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<ArrowRight className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenLatest(project)}
                        className="text-xs shadow-2xs"
                      >
                        Open Project
                      </Button>
                    )}

                    {/* Delete Project */}
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-600" />}
                      onClick={() => setProjectToDelete(project)}
                      className="text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 p-2"
                      aria-label="Delete project"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rename Project Modal */}
      {projectToRename && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Rename Project</h4>
                  <p className="text-xs text-slate-500">Update project display name</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setProjectToRename(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRename} className="space-y-4 pt-1">
              <Input
                label="New Project Name"
                value={newProjectName}
                onChange={(e) => {
                  setNewProjectName(e.target.value);
                  if (renameError && e.target.value.trim()) setRenameError(null);
                }}
                error={renameError || undefined}
                required
                autoFocus
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setProjectToRename(null)}
                  disabled={isRenaming}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isRenaming}
                  className="text-xs"
                >
                  Save Name
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project History Modal */}
      <ProjectHistoryModal
        project={selectedProjectForHistory}
        isOpen={Boolean(selectedProjectForHistory)}
        onClose={() => setSelectedProjectForHistory(null)}
        onOpenGeneration={(proj, gen) => {
          if (onOpenProject) {
            onOpenProject(proj, gen);
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Delete Project</h4>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900">"{projectToDelete.name}"</strong>? All{" "}
              {projectToDelete.generationCount} generations and stored deliverables will be permanently
              removed from your local browser storage.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProjectToDelete(null)}
                disabled={isDeleting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="text-xs bg-red-600 hover:bg-red-700 border-red-700 text-white"
              >
                {isDeleting ? "Deleting..." : "Delete Project"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
