import React, { useState, useEffect, useMemo } from "react";
import {
  Library as LibraryIcon,
  Search,
  Filter,
  FileText,
  Presentation,
  Share2,
  SlidersHorizontal,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Eye,
  Sparkles,
  Users,
  Clock,
  Layers,
  ArrowRight,
  FolderKanban,
  FileSpreadsheet,
  Film,
  ListOrdered,
  X,
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
  GeneratedDeliverable,
  DeliverableId,
} from "../../types";
import { getAllProjects, getAllGenerations, getProject } from "../../services/db";
import {
  DEMO_PROJECT_RECORD,
  DEMO_GENERATION_RECORD,
} from "../../constants/demoDataset";
import { DELIVERABLES_CATALOG } from "../../constants/transformationOptions";
import { generatePowerPointPresentation } from "../../services/presentation/pptxRenderer";
import { normalizePresentationData } from "../../services/presentation/presentationParser";
import { downloadTextFile } from "../../utils/exportHelpers";
import { MarkdownRenderer } from "../results/MarkdownRenderer";
import { LinkedInPostPreview } from "../results/linkedin/LinkedInPostPreview";
import { PresentationDeckViewer } from "../results/presentation/PresentationDeckViewer";

export type LibraryCategoryFilter =
  | "all"
  | "presentations"
  | "social"
  | "briefs"
  | "advisories"
  | "visuals";

export interface FlatDeliverableItem {
  id: string; // unique key
  deliverableId: string;
  title: string;
  content: string;
  structuredData?: any;
  status: string;
  projectId: string;
  projectName: string;
  generationId: string;
  createdAt: string;
  category: LibraryCategoryFilter;
  wordCount: number;
  factMeshAudit?: any;
  audienceLensReport?: any;
  isEdited?: boolean;
}

export interface LibraryViewProps {
  initialCategory?: LibraryCategoryFilter;
  onNavigate: (route: string) => void;
  onOpenDeliverable: (
    project: ProjectRecord,
    generation: GenerationRecord,
    deliverableId: string
  ) => void;
}

export function LibraryView({
  initialCategory = "all",
  onNavigate,
  onOpenDeliverable,
}: LibraryViewProps) {
  const [categoryFilter, setCategoryFilter] =
    useState<LibraryCategoryFilter>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [factMeshFilter, setFactMeshFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest");

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [generations, setGenerations] = useState<GenerationRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Quick preview modal state
  const [previewItem, setPreviewItem] = useState<FlatDeliverableItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportingPptxId, setExportingPptxId] = useState<string | null>(null);

  // Sync initialCategory prop if route changes
  useEffect(() => {
    setCategoryFilter(initialCategory);
  }, [initialCategory]);

  // Load all deliverables across projects & generations
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setIsLoading(true);
        const [loadedProjects, loadedGenerations] = await Promise.all([
          getAllProjects(),
          getAllGenerations(),
        ]);

        if (!isMounted) return;

        // If no stored projects exist, seed with Showcase Demo project for seamless discovery
        let allProjs = loadedProjects;
        let allGens = loadedGenerations;

        if (allProjs.length === 0) {
          allProjs = [DEMO_PROJECT_RECORD];
          allGens = [DEMO_GENERATION_RECORD];
        } else {
          // Check if demo project exists in list, if not add to available filter list
          const hasDemo = allProjs.some((p) => p.id === DEMO_PROJECT_RECORD.id);
          if (!hasDemo) {
            allProjs = [DEMO_PROJECT_RECORD, ...allProjs];
            allGens = [DEMO_GENERATION_RECORD, ...allGens];
          }
        }

        setProjects(allProjs);
        setGenerations(allGens);
      } catch (err) {
        console.warn("[LibraryView] Failed to load records:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Map deliverable ID to library category
  const getDeliverableCategory = (
    deliverableId: string
  ): LibraryCategoryFilter => {
    if (deliverableId === "presentation") return "presentations";
    if (
      deliverableId === "linkedin_post" ||
      deliverableId === "social_threads" ||
      deliverableId.includes("social")
    ) {
      return "social";
    }
    if (
      deliverableId === "executive_brief" ||
      deliverableId === "one_page_summary" ||
      deliverableId === "action_checklist" ||
      deliverableId.includes("brief")
    ) {
      return "briefs";
    }
    if (
      deliverableId === "field_advisory" ||
      deliverableId === "faq_guide" ||
      deliverableId.includes("advisory") ||
      deliverableId.includes("guideline")
    ) {
      return "advisories";
    }
    return "visuals";
  };

  // Flatten deliverables from all generations
  const allDeliverableItems = useMemo<FlatDeliverableItem[]>(() => {
    const items: FlatDeliverableItem[] = [];

    for (const gen of generations) {
      if (!gen.deliverables || gen.deliverables.length === 0) continue;
      const proj = projects.find((p) => p.id === gen.projectId);
      const projName = proj?.name || gen.projectName || "Transformation Project";

      for (const d of gen.deliverables) {
        const words = (d.content || "").trim().split(/\s+/).filter(Boolean).length;
        const cat = getDeliverableCategory(d.deliverableId);

        items.push({
          id: `${gen.id}_${d.deliverableId}`,
          deliverableId: d.deliverableId,
          title: d.title || d.deliverableId,
          content: d.content || "",
          structuredData: d.structuredData,
          status: d.status,
          projectId: gen.projectId,
          projectName: projName,
          generationId: gen.id,
          createdAt: gen.completedAt || gen.createdAt,
          category: cat,
          wordCount: words,
          factMeshAudit: d.factMeshAudit,
          audienceLensReport: d.audienceLensReport,
          isEdited: d.isEdited,
        });
      }
    }

    return items;
  }, [generations, projects]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...allDeliverableItems];

    // 1. Category Filter
    if (categoryFilter !== "all") {
      result = result.filter((item) => item.category === categoryFilter);
    }

    // 2. Project Filter
    if (selectedProjectId !== "all") {
      result = result.filter((item) => item.projectId === selectedProjectId);
    }

    // 3. FactMesh Filter
    if (factMeshFilter === "verified") {
      result = result.filter(
        (item) => item.factMeshAudit?.summary?.integrityScore !== undefined
      );
    }

    // 4. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.projectName.toLowerCase().includes(q) ||
          item.deliverableId.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q)
      );
    }

    // 5. Sorting
    result.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortBy === "newest" ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [
    allDeliverableItems,
    categoryFilter,
    selectedProjectId,
    factMeshFilter,
    searchQuery,
    sortBy,
  ]);

  // Count deliverables per category
  const categoryCounts = useMemo(() => {
    const counts: Record<LibraryCategoryFilter, number> = {
      all: allDeliverableItems.length,
      presentations: 0,
      social: 0,
      briefs: 0,
      advisories: 0,
      visuals: 0,
    };

    for (const item of allDeliverableItems) {
      if (counts[item.category] !== undefined) {
        counts[item.category]++;
      }
    }

    return counts;
  }, [allDeliverableItems]);

  const handleCopyContent = async (item: FlatDeliverableItem) => {
    try {
      await navigator.clipboard.writeText(item.content);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(null);
    }
  };

  const handleExportPptx = async (item: FlatDeliverableItem) => {
    if (item.deliverableId !== "presentation") return;
    try {
      setExportingPptxId(item.id);
      const deckData = normalizePresentationData(
        item.structuredData,
        item.content,
        item.title,
        item.projectName
      );
      await generatePowerPointPresentation(deckData, item.projectName);
    } catch (e) {
      console.warn("[LibraryView] PPTX export failed:", e);
    } finally {
      setExportingPptxId(null);
    }
  };

  const handleDownloadMarkdown = (item: FlatDeliverableItem) => {
    const filename = `${item.projectName.replace(/\s+/g, "_")}_${item.deliverableId}.md`;
    downloadTextFile(filename, item.content);
  };

  const handleOpenInWorkspace = (item: FlatDeliverableItem) => {
    const targetProj =
      projects.find((p) => p.id === item.projectId) || DEMO_PROJECT_RECORD;
    const targetGen =
      generations.find((g) => g.id === item.generationId) ||
      DEMO_GENERATION_RECORD;

    onOpenDeliverable(targetProj, targetGen, item.deliverableId);
  };

  const getCategoryBadgeColor = (cat: LibraryCategoryFilter) => {
    switch (cat) {
      case "presentations":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "social":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "briefs":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "advisories":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "visuals":
      default:
        return "bg-purple-50 text-purple-700 border-purple-200";
    }
  };

  const getCategoryIcon = (cat: LibraryCategoryFilter) => {
    switch (cat) {
      case "presentations":
        return Presentation;
      case "social":
        return Share2;
      case "briefs":
        return FileText;
      case "advisories":
        return ShieldCheck;
      case "visuals":
      default:
        return Layers;
    }
  };

  const getCategoryTitle = () => {
    switch (categoryFilter) {
      case "presentations":
        return "Presentations Library";
      case "social":
        return "Social Posts Library";
      case "briefs":
        return "Executive Briefs & Summaries";
      case "advisories":
        return "Operational & Field Advisories";
      case "visuals":
        return "Visual Outlines & Scripts";
      case "all":
      default:
        return "Deliverables Library";
    }
  };

  const getCategoryDescription = () => {
    switch (categoryFilter) {
      case "presentations":
        return "Explore, preview, and download generated 16:9 presentation slide decks with 1-click PowerPoint (.pptx) export.";
      case "social":
        return "Discover publication-ready LinkedIn and social deliverables formatted with structured insights and 1-click copy.";
      case "briefs":
        return "Review high-impact executive summaries, decision briefs, and operational action checklists.";
      case "advisories":
        return "Access citizen notices, farmer advisories, and frontline field execution protocols.";
      case "visuals":
      default:
        return "Search, filter, preview, and export all structured deliverables generated across your workspace.";
    }
  };

  return (
    <PageContainer>
      {/* Top Header */}
      <PageHeader
        title={getCategoryTitle()}
        description={getCategoryDescription()}
        action={
          <Button
            variant="primary"
            icon={<Sparkles className="w-4 h-4" />}
            onClick={() => onNavigate("projects/new")}
          >
            New Transformation
          </Button>
        }
      />

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 overflow-x-auto scrollbar-none">
          {(
            [
              { id: "all", label: "All Deliverables", icon: LibraryIcon },
              { id: "presentations", label: "Presentations", icon: Presentation },
              { id: "social", label: "Social Posts", icon: Share2 },
              { id: "briefs", label: "Briefs & Summaries", icon: FileText },
              { id: "advisories", label: "Field Advisories", icon: ShieldCheck },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = categoryFilter === tab.id;
            const count = categoryCounts[tab.id];

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-indigo-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-bold ${
                    active ? "bg-indigo-50 text-indigo-700" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter & Search Bar */}
        <Card className="p-4 border-slate-200/90 bg-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, project, or content..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-slate-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap justify-end">
              {/* Project Filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                >
                  <option value="all">All Projects ({projects.length})</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* FactMesh Filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={factMeshFilter}
                  onChange={(e) => setFactMeshFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                >
                  <option value="all">All Audits</option>
                  <option value="verified">FactMesh Verified</option>
                </select>
              </div>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Deliverables Grid */}
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading deliverables library...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={<LibraryIcon className="w-12 h-12 text-slate-400" />}
            title="No deliverables found"
            description={
              searchQuery
                ? `No deliverables matching "${searchQuery}". Try adjusting your search or filters.`
                : "No deliverables in this category yet. Run a content transformation to generate deliverables."
            }
            primaryAction={{
              label: "Create New Transformation",
              icon: <Sparkles className="w-4 h-4" />,
              onClick: () => onNavigate("projects/new"),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => {
              const Icon = getCategoryIcon(item.category);
              const isPresentation = item.deliverableId === "presentation";
              const isSocial = item.category === "social";
              const isCopied = copiedId === item.id;
              const isExportingPptx = exportingPptxId === item.id;

              // Slide count for presentations
              const slideCount =
                isPresentation &&
                item.structuredData?.slides &&
                Array.isArray(item.structuredData.slides)
                  ? item.structuredData.slides.length
                  : null;

              // Clean text excerpt
              const cleanExcerpt = item.content
                .replace(/^#+\s.*$/gm, "")
                .replace(/[*_`]/g, "")
                .trim()
                .substring(0, 140);

              return (
                <div key={item.id} className="h-full flex flex-col">
                  <Card
                    className="flex-1 flex flex-col justify-between hover:shadow-md transition-all duration-200 border-slate-200 group bg-white"
                  >
                  <div className="p-5 space-y-3.5">
                    {/* Card Top Meta */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${getCategoryBadgeColor(
                          item.category
                        )}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="capitalize">{item.category}</span>
                      </span>

                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-300" />
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Title & Project */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                        <FolderKanban className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{item.projectName}</span>
                      </p>
                    </div>

                    {/* Excerpt */}
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed bg-slate-50/60 p-2.5 rounded-lg border border-slate-100 font-sans">
                      {cleanExcerpt || "Structured transformation content."}
                    </p>

                    {/* Badges / Metrics Row */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      {slideCount ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium border border-amber-200">
                          <Presentation className="w-3 h-3 text-amber-600" />
                          {slideCount} Slides Deck
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          <FileText className="w-3 h-3 text-slate-400" />
                          {item.wordCount} words
                        </span>
                      )}

                      {/* FactMesh badge */}
                      {item.factMeshAudit?.summary?.integrityScore !== undefined ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          FactMesh: {item.factMeshAudit.summary.integrityScore}%
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          <ShieldCheck className="w-3 h-3 text-slate-400" />
                          Audit Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {/* Preview Button */}
                      <button
                        type="button"
                        onClick={() => setPreviewItem(item)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                        title="Quick Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Copy Button */}
                      <button
                        type="button"
                        onClick={() => handleCopyContent(item)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                        title={isCopied ? "Copied!" : "Copy Content"}
                      >
                        {isCopied ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      {/* Specialized PowerPoint Export Button */}
                      {isPresentation ? (
                        <button
                          type="button"
                          onClick={() => handleExportPptx(item)}
                          disabled={isExportingPptx}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-amber-800 bg-amber-100/70 hover:bg-amber-200 border border-amber-300 transition-colors cursor-pointer"
                          title="Download PowerPoint Presentation (.pptx)"
                        >
                          <Download className="w-3 h-3 text-amber-700" />
                          <span>{isExportingPptx ? "Exporting..." : ".pptx"}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDownloadMarkdown(item)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                          title="Download Markdown (.md)"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Open in Project Workspace */}
                    <button
                      type="button"
                      onClick={() => handleOpenInWorkspace(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors cursor-pointer"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Card>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Quick Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  {React.createElement(getCategoryIcon(previewItem.category), {
                    className: "w-5 h-5",
                  })}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {previewItem.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Project: {previewItem.projectName} • {previewItem.wordCount} words
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {previewItem.deliverableId === "presentation" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => handleExportPptx(previewItem)}
                  >
                    Download .pptx
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={
                      copiedId === previewItem.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )
                    }
                    onClick={() => handleCopyContent(previewItem)}
                  >
                    {copiedId === previewItem.id ? "Copied" : "Copy Content"}
                  </Button>
                )}

                <Button
                  variant="primary"
                  size="sm"
                  icon={<ExternalLink className="w-3.5 h-3.5" />}
                  onClick={() => {
                    const item = previewItem;
                    setPreviewItem(null);
                    handleOpenInWorkspace(item);
                  }}
                >
                  Open in Workspace
                </Button>

                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-2 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
              {previewItem.deliverableId === "presentation" ? (
                <PresentationDeckViewer
                  data={previewItem.structuredData}
                  markdownContent={previewItem.content}
                  deliverableTitle={previewItem.title}
                  projectName={previewItem.projectName}
                />
              ) : previewItem.category === "social" ? (
                <LinkedInPostPreview
                  content={previewItem.content}
                  projectName={previewItem.projectName}
                  isEditable={false}
                />
              ) : (
                <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs">
                  <MarkdownRenderer content={previewItem.content} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
