import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  History as HistoryIcon,
  Search,
  Plus,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Trash2,
  Sparkles,
  Calendar,
  Layers,
  Cpu,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UploadCloud,
  Edit3,
  ExternalLink,
  FolderKanban,
  Filter,
  RefreshCw,
  X,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import { PageContainer } from "../layout/PageContainer";
import { PageHeader } from "../layout/PageHeader";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Input } from "../ui/Input";
import {
  ProjectRecord,
  GenerationRecord,
  DeliverableId,
  GeneratedDeliverable,
} from "../../types";
import {
  getAllProjects,
  getAllGenerations,
  getHistoryStats,
  deleteGeneration,
  deleteProject,
  getProject,
  HistoryStats,
} from "../../services/db";
import {
  AUDIENCE_OPTIONS,
  TONE_OPTIONS,
  LANGUAGE_OPTIONS,
  DETAIL_LEVEL_OPTIONS,
  OBJECTIVE_OPTIONS,
  CONTENT_STYLE_OPTIONS,
  DELIVERABLES_CATALOG,
} from "../../constants/transformationOptions";

export interface HistoryViewProps {
  onNavigate: (route: string) => void;
  onOpenGeneration: (
    project: ProjectRecord,
    generation: GenerationRecord,
    openedFromHistory?: boolean
  ) => void;
}

type StatusFilterType = "all" | "completed" | "partial" | "failed";
type SourceFilterType = "all" | "text" | "file";
type SortOrderType = "newest" | "oldest";
type ViewModeType = "chronological" | "by_project";

interface DeleteTarget {
  type: "generation" | "project";
  generation?: GenerationRecord;
  project?: ProjectRecord;
  title: string;
  warningMessage: string;
}

export function HistoryView({ onNavigate, onOpenGeneration }: HistoryViewProps) {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [generations, setGenerations] = useState<GenerationRecord[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilterType>("all");
  const [deliverableFilter, setDeliverableFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<SortOrderType>("newest");
  const [viewMode, setViewMode] = useState<ViewModeType>("chronological");

  // Interaction state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Load data from IndexedDB
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [projList, genList, statsData] = await Promise.all([
        getAllProjects(),
        getAllGenerations(),
        getHistoryStats(),
      ]);
      setProjects(projList);
      setGenerations(genList);
      setStats(statsData);
    } catch (err) {
      console.error("[HistoryView] Error loading history from IndexedDB:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle escape key to close delete modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && deleteTarget) {
        setDeleteTarget(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteTarget]);

  // Helper map for quick project lookup
  const projectMap = useMemo(() => {
    const map = new Map<string, ProjectRecord>();
    for (const p of projects) {
      map.set(p.id, p);
    }
    return map;
  }, [projects]);

  // Helpers for human-readable label lookup
  const getDeliverableName = (id: string) => {
    const item = DELIVERABLES_CATALOG.find((d) => d.id === id);
    return item ? item.name : id.replace(/_/g, " ");
  };

  const getAudienceLabel = (val: string | null) => {
    if (!val) return "Not specified";
    const found = AUDIENCE_OPTIONS.find((o) => o.value === val);
    return found ? found.label : val;
  };

  const getToneLabel = (val: string | null) => {
    if (!val) return "Not specified";
    const found = TONE_OPTIONS.find((o) => o.value === val);
    return found ? found.label : val;
  };

  const getLanguageLabel = (val: string | null) => {
    if (!val) return "Not specified";
    const found = LANGUAGE_OPTIONS.find((o) => o.value === val);
    return found ? found.label : val;
  };

  const getDetailLabel = (val: string | null) => {
    if (!val) return "Not specified";
    const found = DETAIL_LEVEL_OPTIONS.find((o) => o.value === val);
    return found ? found.label : val;
  };

  const getObjectiveLabel = (val: string | null) => {
    if (!val) return "Not specified";
    const found = OBJECTIVE_OPTIONS.find((o) => o.value === val);
    return found ? found.label : val;
  };

  const getStyleLabel = (val: string | null) => {
    if (!val) return "Not specified";
    const found = CONTENT_STYLE_OPTIONS.find((o) => o.value === val);
    return found ? found.label : val;
  };

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return "N/A";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const formatDateOnly = (isoString?: string) => {
    if (!isoString) return "N/A";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  // Toggle detail expansion
  const toggleExpand = (genId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(genId)) {
        next.delete(genId);
      } else {
        next.add(genId);
      }
      return next;
    });
  };

  // Handle opening a generation
  const handleOpen = async (generation: GenerationRecord) => {
    let project = projectMap.get(generation.projectId);
    if (!project) {
      const fetched = await getProject(generation.projectId);
      if (fetched) project = fetched;
    }

    if (!project) {
      // Fallback: construct ephemeral project record from generation draft
      project = {
        id: generation.projectId,
        name: generation.projectName || "Transformation Project",
        createdAt: generation.createdAt,
        updatedAt: generation.completedAt || generation.createdAt,
        latestGenerationId: generation.id,
        sourceType: generation.draft?.sourceType || "text",
        sourceText: generation.draft?.sourceText || "",
        sourceMetadata: {
          fileName: generation.draft?.sourceFile?.name,
          charCount: generation.draft?.charCount || 0,
          wordCount: generation.draft?.wordCount || 0,
          excerpt: generation.draft?.sourceText?.slice(0, 180),
        },
        draft: generation.draft,
        generationCount: 1,
        deliverableCount: generation.deliverables?.length || 0,
        status: generation.status === "completed" ? "completed" : "in_progress",
      };
    }

    onOpenGeneration(project, generation, true);
  };

  // Delete handlers
  const handleRequestDeleteGen = (generation: GenerationRecord, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeleteTarget({
      type: "generation",
      generation,
      title: `Delete Generation #${generation.generationNumber || 1}`,
      warningMessage: "This will remove this generation from local history.",
    });
  };

  const handleRequestDeleteProj = (project: ProjectRecord, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeleteTarget({
      type: "project",
      project,
      title: `Delete Project "${project.name}"`,
      warningMessage:
        "This will permanently remove the project and all saved generations from this browser.",
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      if (deleteTarget.type === "generation" && deleteTarget.generation) {
        const genId = deleteTarget.generation.id;
        await deleteGeneration(genId);
        setGenerations((prev) => prev.filter((g) => g.id !== genId));
        setNotification(`Generation #${deleteTarget.generation.generationNumber} removed from history.`);
      } else if (deleteTarget.type === "project" && deleteTarget.project) {
        const projId = deleteTarget.project.id;
        await deleteProject(projId);
        setProjects((prev) => prev.filter((p) => p.id !== projId));
        setGenerations((prev) => prev.filter((g) => g.projectId !== projId));
        setNotification(`Project "${deleteTarget.project.name}" and all associated generations removed.`);
      }
      // Refresh stats
      const newStats = await getHistoryStats();
      setStats(newStats);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error("[HistoryView] Delete failed:", err);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Filter & Search Logic
  const filteredGenerations = useMemo(() => {
    return generations.filter((gen) => {
      // 1. Status Filter
      if (statusFilter !== "all" && gen.status !== statusFilter) {
        return false;
      }

      // 2. Source Filter
      if (sourceFilter !== "all") {
        const isFile = gen.draft?.sourceType === "file" || !!gen.draft?.sourceFile;
        if (sourceFilter === "file" && !isFile) return false;
        if (sourceFilter === "text" && isFile) return false;
      }

      // 3. Deliverable Type Filter
      if (deliverableFilter !== "all") {
        const hasDeliverable = gen.deliverables?.some(
          (d) => d.deliverableId === deliverableFilter
        );
        if (!hasDeliverable) return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchProject = gen.projectName?.toLowerCase().includes(q);
        const matchDraftName = gen.draft?.name?.toLowerCase().includes(q);
        const matchFileName = gen.draft?.sourceFile?.name?.toLowerCase().includes(q);
        const matchExcerpt = gen.draft?.sourceText?.toLowerCase().includes(q);
        const matchModel = gen.modelUsed?.toLowerCase().includes(q);
        const matchDeliverableTitle = gen.deliverables?.some(
          (d) => d.title?.toLowerCase().includes(q) || d.deliverableId?.toLowerCase().includes(q)
        );
        const matchAudience = gen.config?.audience?.toLowerCase().includes(q);
        const matchObjective = gen.config?.objective?.toLowerCase().includes(q);

        if (
          !matchProject &&
          !matchDraftName &&
          !matchFileName &&
          !matchExcerpt &&
          !matchModel &&
          !matchDeliverableTitle &&
          !matchAudience &&
          !matchObjective
        ) {
          return false;
        }
      }

      return true;
    });
  }, [generations, statusFilter, sourceFilter, deliverableFilter, searchQuery]);

  // Sort generations
  const sortedGenerations = useMemo(() => {
    const list = [...filteredGenerations];
    list.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });
    return list;
  }, [filteredGenerations, sortOrder]);

  // Grouping by Date bucket for chronological view
  const dateGroupedGenerations = useMemo(() => {
    if (viewMode !== "chronological" || sortOrder !== "newest") {
      return null;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const weekAgo = today - 86400000 * 7;

    const groups: {
      today: GenerationRecord[];
      yesterday: GenerationRecord[];
      thisWeek: GenerationRecord[];
      earlier: GenerationRecord[];
    } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      earlier: [],
    };

    for (const gen of sortedGenerations) {
      const t = new Date(gen.createdAt).getTime();
      if (t >= today) {
        groups.today.push(gen);
      } else if (t >= yesterday) {
        groups.yesterday.push(gen);
      } else if (t >= weekAgo) {
        groups.thisWeek.push(gen);
      } else {
        groups.earlier.push(gen);
      }
    }

    return groups;
  }, [sortedGenerations, viewMode, sortOrder]);

  // Grouping by Project for project view
  const projectGroupedData = useMemo(() => {
    if (viewMode !== "by_project") return null;

    const map = new Map<string, { project: ProjectRecord; generations: GenerationRecord[] }>();

    // Seed map with filtered generations
    for (const gen of sortedGenerations) {
      const p = projectMap.get(gen.projectId) || {
        id: gen.projectId,
        name: gen.projectName || "Transformation Project",
        createdAt: gen.createdAt,
        updatedAt: gen.createdAt,
        latestGenerationId: gen.id,
        sourceType: gen.draft?.sourceType || "text",
        sourceText: gen.draft?.sourceText || "",
        sourceMetadata: {
          fileName: gen.draft?.sourceFile?.name,
          charCount: gen.draft?.charCount || 0,
          wordCount: gen.draft?.wordCount || 0,
        },
        draft: gen.draft,
        generationCount: 1,
        deliverableCount: gen.deliverables?.length || 0,
        status: "completed",
      };

      if (!map.has(p.id)) {
        map.set(p.id, { project: p, generations: [] });
      }
      map.get(p.id)!.generations.push(gen);
    }

    return Array.from(map.values()).sort((a, b) => {
      const timeA = new Date(a.project.updatedAt || a.project.createdAt).getTime();
      const timeB = new Date(b.project.updatedAt || b.project.createdAt).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });
  }, [sortedGenerations, viewMode, projectMap, sortOrder]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    sourceFilter !== "all" ||
    deliverableFilter !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSourceFilter("all");
    setDeliverableFilter("all");
  };

  return (
    <PageContainer>
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between shadow-xs animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 font-semibold text-xs ml-3 cursor-pointer"
            aria-label="Dismiss notification"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Transformation History"
        description="Browse, reopen, and manage your previous content transformations."
        badge={`${generations.length} Generations`}
        action={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => onNavigate("projects/new")}
            className="shadow-xs"
          >
            New Project
          </Button>
        }
      />

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Projects</span>
            <FolderKanban className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {isLoading ? "—" : stats?.totalProjects ?? projects.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1">Independent workspaces</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Generations</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {isLoading ? "—" : stats?.totalGenerations ?? generations.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1">Saved execution runs</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Deliverables</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {isLoading ? "—" : stats?.totalDeliverables ?? 0}
          </div>
          <span className="text-[11px] text-slate-400 mt-1">Formats synthesized</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Last Activity</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {isLoading
              ? "—"
              : stats?.lastActivity
              ? formatTimestamp(stats.lastActivity)
              : "No activity yet"}
          </div>
          <span className="text-[11px] text-slate-400 mt-1">Local browser persistence</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs mb-6 space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history by project name, source file, excerpt, or deliverable..."
              className="w-full pl-9 pr-9 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Grouping & Sort Controls */}
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0 flex-wrap">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("chronological")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  viewMode === "chronological"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Chronological
              </button>
              <button
                type="button"
                onClick={() => setViewMode("by_project")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  viewMode === "by_project"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                By Project
              </button>
            </div>

            {/* Sort Order Selector */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrderType)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 flex-wrap text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">
              Filters:
            </span>

            {/* Status Filter */}
            <div className="inline-flex items-center gap-1">
              <span className="text-slate-500 font-medium text-[11px]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="partial">In Progress / Partial</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Source Filter */}
            <div className="inline-flex items-center gap-1">
              <span className="text-slate-500 font-medium text-[11px]">Source:</span>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as SourceFilterType)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">All Sources</option>
                <option value="text">Pasted Text</option>
                <option value="file">Uploaded File</option>
              </select>
            </div>

            {/* Deliverable Type Filter */}
            <div className="inline-flex items-center gap-1">
              <span className="text-slate-500 font-medium text-[11px]">Deliverable:</span>
              <select
                value={deliverableFilter}
                onChange={(e) => setDeliverableFilter(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">All Deliverables</option>
                {DELIVERABLES_CATALOG.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filter Reset */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="space-y-4 py-8">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-5 rounded-xl border border-slate-200 bg-white animate-pulse space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-4 bg-slate-200 rounded w-20"></div>
              </div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              <div className="h-8 bg-slate-100 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : generations.length === 0 ? (
        /* Empty State: No History Recorded Yet */
        <Card className="py-12 border-dashed">
          <EmptyState
            icon={<HistoryIcon className="w-8 h-8 text-slate-400" />}
            title="Your transformation history is empty"
            description="Completed transformations will appear here so you can reopen and continue working on them."
            primaryAction={{
              label: "Create New Project",
              icon: <Plus className="w-4 h-4" />,
              onClick: () => onNavigate("projects/new"),
            }}
            secondaryAction={{
              label: "Go to Dashboard",
              onClick: () => onNavigate("dashboard"),
            }}
          />
        </Card>
      ) : sortedGenerations.length === 0 ? (
        /* Filter Empty State */
        <Card className="py-12 text-center border-dashed">
          <div className="max-w-md mx-auto space-y-3">
            <Filter className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">
              No matching transformations found
            </h3>
            <p className="text-xs text-slate-500">
              No previous generation matched your search query or active filter settings.
            </p>
            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={handleResetFilters}
              >
                Clear all filters
              </Button>
            </div>
          </div>
        </Card>
      ) : viewMode === "by_project" && projectGroupedData ? (
        /* Group By Project Mode */
        <div className="space-y-6">
          {projectGroupedData.map(({ project, generations: projGens }) => (
            <div
              key={project.id}
              className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs"
            >
              {/* Project Group Header */}
              <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
                      Project
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{project.name}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>
                      {projGens.length} {projGens.length === 1 ? "generation" : "generations"}
                    </span>
                    <span>•</span>
                    <span>Updated {formatDateOnly(project.updatedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                    onClick={(e) => handleRequestDeleteProj(project, e)}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200/60"
                  >
                    Delete Project
                  </Button>
                </div>
              </div>

              {/* Project Generations List */}
              <div className="p-4 space-y-3 divide-y divide-slate-100">
                {projGens.map((gen, idx) => (
                  <div key={gen.id} className={idx > 0 ? "pt-3" : ""}>
                    <HistoryCard
                      generation={gen}
                      projectName={project.name}
                      isExpanded={expandedIds.has(gen.id)}
                      onToggleExpand={() => toggleExpand(gen.id)}
                      onOpen={() => handleOpen(gen)}
                      onDelete={(e) => handleRequestDeleteGen(gen, e)}
                      getAudienceLabel={getAudienceLabel}
                      getToneLabel={getToneLabel}
                      getLanguageLabel={getLanguageLabel}
                      getDetailLabel={getDetailLabel}
                      getObjectiveLabel={getObjectiveLabel}
                      getStyleLabel={getStyleLabel}
                      getDeliverableName={getDeliverableName}
                      formatTimestamp={formatTimestamp}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : dateGroupedGenerations ? (
        /* Chronological View with Date Bucketing */
        <div className="space-y-6">
          {dateGroupedGenerations.today.length > 0 && (
            <DateSection
              title="Today"
              generations={dateGroupedGenerations.today}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              handleOpen={handleOpen}
              handleRequestDeleteGen={handleRequestDeleteGen}
              getAudienceLabel={getAudienceLabel}
              getToneLabel={getToneLabel}
              getLanguageLabel={getLanguageLabel}
              getDetailLabel={getDetailLabel}
              getObjectiveLabel={getObjectiveLabel}
              getStyleLabel={getStyleLabel}
              getDeliverableName={getDeliverableName}
              formatTimestamp={formatTimestamp}
            />
          )}

          {dateGroupedGenerations.yesterday.length > 0 && (
            <DateSection
              title="Yesterday"
              generations={dateGroupedGenerations.yesterday}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              handleOpen={handleOpen}
              handleRequestDeleteGen={handleRequestDeleteGen}
              getAudienceLabel={getAudienceLabel}
              getToneLabel={getToneLabel}
              getLanguageLabel={getLanguageLabel}
              getDetailLabel={getDetailLabel}
              getObjectiveLabel={getObjectiveLabel}
              getStyleLabel={getStyleLabel}
              getDeliverableName={getDeliverableName}
              formatTimestamp={formatTimestamp}
            />
          )}

          {dateGroupedGenerations.thisWeek.length > 0 && (
            <DateSection
              title="This Week"
              generations={dateGroupedGenerations.thisWeek}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              handleOpen={handleOpen}
              handleRequestDeleteGen={handleRequestDeleteGen}
              getAudienceLabel={getAudienceLabel}
              getToneLabel={getToneLabel}
              getLanguageLabel={getLanguageLabel}
              getDetailLabel={getDetailLabel}
              getObjectiveLabel={getObjectiveLabel}
              getStyleLabel={getStyleLabel}
              getDeliverableName={getDeliverableName}
              formatTimestamp={formatTimestamp}
            />
          )}

          {dateGroupedGenerations.earlier.length > 0 && (
            <DateSection
              title="Earlier"
              generations={dateGroupedGenerations.earlier}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              handleOpen={handleOpen}
              handleRequestDeleteGen={handleRequestDeleteGen}
              getAudienceLabel={getAudienceLabel}
              getToneLabel={getToneLabel}
              getLanguageLabel={getLanguageLabel}
              getDetailLabel={getDetailLabel}
              getObjectiveLabel={getObjectiveLabel}
              getStyleLabel={getStyleLabel}
              getDeliverableName={getDeliverableName}
              formatTimestamp={formatTimestamp}
            />
          )}
        </div>
      ) : (
        /* Flat Chronological View */
        <div className="space-y-3.5">
          {sortedGenerations.map((gen) => (
            <HistoryCard
              key={gen.id}
              generation={gen}
              projectName={gen.projectName}
              isExpanded={expandedIds.has(gen.id)}
              onToggleExpand={() => toggleExpand(gen.id)}
              onOpen={() => handleOpen(gen)}
              onDelete={(e) => handleRequestDeleteGen(gen, e)}
              getAudienceLabel={getAudienceLabel}
              getToneLabel={getToneLabel}
              getLanguageLabel={getLanguageLabel}
              getDetailLabel={getDetailLabel}
              getObjectiveLabel={getObjectiveLabel}
              getStyleLabel={getStyleLabel}
              getDeliverableName={getDeliverableName}
              formatTimestamp={formatTimestamp}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 id="delete-dialog-title" className="text-base font-bold text-slate-900">
                  {deleteTarget.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {deleteTarget.warningMessage}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
              This action cannot be undone. Any local edits or generated deliverables associated with
              this selection will be permanently erased.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

// Sub-component for Date Section in Chronological Mode
function DateSection({
  title,
  generations,
  expandedIds,
  toggleExpand,
  handleOpen,
  handleRequestDeleteGen,
  getAudienceLabel,
  getToneLabel,
  getLanguageLabel,
  getDetailLabel,
  getObjectiveLabel,
  getStyleLabel,
  getDeliverableName,
  formatTimestamp,
}: {
  title: string;
  generations: GenerationRecord[];
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  handleOpen: (g: GenerationRecord) => void;
  handleRequestDeleteGen: (g: GenerationRecord, e: React.MouseEvent) => void;
  getAudienceLabel: (v: string | null) => string;
  getToneLabel: (v: string | null) => string;
  getLanguageLabel: (v: string | null) => string;
  getDetailLabel: (v: string | null) => string;
  getObjectiveLabel: (v: string | null) => string;
  getStyleLabel: (v: string | null) => string;
  getDeliverableName: (id: string) => string;
  formatTimestamp: (iso?: string) => string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</h3>
        <div className="h-px bg-slate-200 flex-1"></div>
        <span className="text-[11px] text-slate-400 font-medium">
          {generations.length} {generations.length === 1 ? "transformation" : "transformations"}
        </span>
      </div>

      <div className="space-y-3">
        {generations.map((gen) => (
          <HistoryCard
            key={gen.id}
            generation={gen}
            projectName={gen.projectName}
            isExpanded={expandedIds.has(gen.id)}
            onToggleExpand={() => toggleExpand(gen.id)}
            onOpen={() => handleOpen(gen)}
            onDelete={(e) => handleRequestDeleteGen(gen, e)}
            getAudienceLabel={getAudienceLabel}
            getToneLabel={getToneLabel}
            getLanguageLabel={getLanguageLabel}
            getDetailLabel={getDetailLabel}
            getObjectiveLabel={getObjectiveLabel}
            getStyleLabel={getStyleLabel}
            getDeliverableName={getDeliverableName}
            formatTimestamp={formatTimestamp}
          />
        ))}
      </div>
    </div>
  );
}

// History Entry Card
interface HistoryCardProps {
  key?: React.Key;
  generation: GenerationRecord;
  projectName?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onOpen: () => void;
  onDelete: (e: React.MouseEvent) => void;
  getAudienceLabel: (v: string | null) => string;
  getToneLabel: (v: string | null) => string;
  getLanguageLabel: (v: string | null) => string;
  getDetailLabel: (v: string | null) => string;
  getObjectiveLabel: (v: string | null) => string;
  getStyleLabel: (v: string | null) => string;
  getDeliverableName: (id: string) => string;
  formatTimestamp: (iso?: string) => string;
}

function HistoryCard({
  generation,
  projectName,
  isExpanded,
  onToggleExpand,
  onOpen,
  onDelete,
  getAudienceLabel,
  getToneLabel,
  getLanguageLabel,
  getDetailLabel,
  getObjectiveLabel,
  getStyleLabel,
  getDeliverableName,
  formatTimestamp,
}: HistoryCardProps) {
  const isFile =
    generation.draft?.sourceType === "file" || !!generation.draft?.sourceFile?.name;
  const fileName = generation.draft?.sourceFile?.name;
  const charCount =
    generation.draft?.charCount || generation.draft?.sourceText?.length || 0;
  const wordCount =
    generation.draft?.wordCount ||
    (generation.draft?.sourceText
      ? generation.draft.sourceText.trim().split(/\s+/).filter(Boolean).length
      : 0);

  const deliverables = generation.deliverables || [];
  const completedCount = deliverables.filter((d) => d.status === "completed").length;
  const editedCount = deliverables.filter((d) => d.isEdited).length;
  const hasEdits = editedCount > 0;

  const config = generation.config;

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs transition-all overflow-hidden">
      <div className="p-4 sm:p-5">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-900">
                {projectName || generation.projectName || generation.draft?.name || "Untitled transformation"}
              </h4>

              <span className="text-slate-300">•</span>

              <span className="text-xs font-semibold text-slate-600">
                Generation {generation.generationNumber || 1}
              </span>

              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  generation.status === "completed"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                    : generation.status === "partial"
                    ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                    : "bg-red-50 text-red-700 border border-red-200/60"
                }`}
              >
                {generation.status === "completed" ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Clock className="w-3 h-3 text-amber-600" />
                )}
                <span className="capitalize">{generation.status}</span>
              </span>

              {/* Edited Locally Pill */}
              {hasEdits && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/70">
                  <Edit3 className="w-2.5 h-2.5" />
                  <span>Edited Locally ({editedCount})</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Calendar className="w-3 h-3" />
                {formatTimestamp(generation.completedAt || generation.createdAt)}
              </span>

              {generation.modelUsed && (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                  <Cpu className="w-3 h-3 text-blue-500" />
                  {generation.modelUsed}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Button
              variant="primary"
              size="sm"
              icon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={onOpen}
              className="text-xs shadow-xs"
            >
              Open Generation
            </Button>

            <button
              type="button"
              onClick={onToggleExpand}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
              aria-expanded={isExpanded}
            >
              <span>{isExpanded ? "Less" : "Details"}</span>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Delete generation from history"
              aria-label="Delete generation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Middle Metadata Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3.5 text-xs">
          {/* Source Section */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Source
            </span>
            <div className="flex items-center gap-1.5 text-slate-800 font-medium truncate">
              {isFile ? (
                <UploadCloud className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              )}
              <span className="truncate">
                {isFile ? fileName || "Uploaded File" : "Pasted Text"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {wordCount > 0 ? `${wordCount} words • ` : ""}
              {charCount} characters
            </p>
          </div>

          {/* Configuration Summary Section */}
          <div className="space-y-1 md:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Configuration
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                {getAudienceLabel(config?.audience)}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                {getToneLabel(config?.tone)}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                {getLanguageLabel(config?.language)}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                {getDetailLabel(config?.detailLevel)}
              </span>
            </div>
          </div>

          {/* Deliverables Summary Section */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Deliverables ({deliverables.length} generated)
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {deliverables.slice(0, 3).map((d) => (
                <span
                  key={d.deliverableId}
                  className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/50 text-[11px] font-medium truncate max-w-[140px]"
                >
                  {getDeliverableName(d.deliverableId)}
                </span>
              ))}
              {deliverables.length > 3 && (
                <span className="text-[11px] text-slate-400 font-medium">
                  +{deliverables.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Details Accordion */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-200/80 bg-slate-50/60 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-4 sm:p-5 space-y-4 text-xs animate-in fade-in">
            {/* Full Configuration Matrix */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                Full Transformation Configuration
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-medium">Target Audience</span>
                  <span className="font-semibold text-slate-800 block truncate mt-0.5">
                    {config?.audience === "custom" && config.customAudience
                      ? config.customAudience
                      : getAudienceLabel(config?.audience)}
                  </span>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-medium">Delivery Tone</span>
                  <span className="font-semibold text-slate-800 block truncate mt-0.5">
                    {getToneLabel(config?.tone)}
                  </span>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-medium">Target Language</span>
                  <span className="font-semibold text-slate-800 block truncate mt-0.5">
                    {config?.language === "other" && config.customLanguage
                      ? config.customLanguage
                      : getLanguageLabel(config?.language)}
                  </span>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-medium">Detail Level</span>
                  <span className="font-semibold text-slate-800 block truncate mt-0.5">
                    {getDetailLabel(config?.detailLevel)}
                  </span>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-medium">Core Objective</span>
                  <span className="font-semibold text-slate-800 block truncate mt-0.5">
                    {getObjectiveLabel(config?.objective)}
                  </span>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-medium">Content Style</span>
                  <span className="font-semibold text-slate-800 block truncate mt-0.5">
                    {getStyleLabel(config?.contentStyle)}
                  </span>
                </div>
              </div>
            </div>

            {/* Deliverables Breakdown List */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                Generated Deliverables Breakdown
              </span>
              <div className="space-y-1.5">
                {deliverables.map((d) => (
                  <div
                    key={d.deliverableId}
                    className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-900 truncate">
                        {d.title || getDeliverableName(d.deliverableId)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({d.deliverableId})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {d.isEdited && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                          <Edit3 className="w-2.5 h-2.5" />
                          Edited
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 font-medium">
                        {d.content
                          ? `${d.content.trim().split(/\s+/).filter(Boolean).length} words`
                          : "Empty"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Source Content Excerpt */}
            {generation.draft?.sourceText && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  Source Text Excerpt
                </span>
                <p className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed font-mono line-clamp-3">
                  {generation.draft.sourceText}
                </p>
              </div>
            )}

            {/* Technical Metadata Footer */}
            <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <span className="font-mono">Generation ID: {generation.id}</span>
              <span className="font-mono">Project ID: {generation.projectId}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
