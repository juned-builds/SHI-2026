import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Users,
  ExternalLink,
  FolderKanban,
  FileText,
  Sparkles,
} from "lucide-react";
import { PageContainer } from "../layout/PageContainer";
import { PageHeader } from "../layout/PageHeader";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import {
  ProjectRecord,
  GenerationRecord,
  GeneratedDeliverable,
  FactMeshAudit,
  AudienceLensReport,
} from "../../types";
import { getAllProjects, getAllGenerations } from "../../services/db";
import {
  DEMO_PROJECT_RECORD,
  DEMO_GENERATION_RECORD,
} from "../../constants/demoDataset";
import { FactMeshAuditView } from "../results/audit/FactMeshAuditView";
import { AudienceLensView } from "../results/audiencelens/AudienceLensView";

export type IntelligenceTab = "factmesh" | "audiencelens";

export interface IntelligenceViewProps {
  initialTab?: IntelligenceTab;
  onNavigate: (route: string) => void;
  onOpenDeliverable?: (
    project: ProjectRecord,
    generation: GenerationRecord,
    deliverableId: string
  ) => void;
}

export function IntelligenceView({
  initialTab = "factmesh",
  onNavigate,
  onOpenDeliverable,
}: IntelligenceViewProps) {
  const [activeTab, setActiveTab] = useState<IntelligenceTab>(initialTab);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [generations, setGenerations] = useState<GenerationRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(DEMO_PROJECT_RECORD.id);
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string>("executive_summary");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Load database records
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

        let allProjs = loadedProjects;
        let allGens = loadedGenerations;

        // Ensure showcase demo is available
        if (allProjs.length === 0 || !allProjs.some((p) => p.id === DEMO_PROJECT_RECORD.id)) {
          allProjs = [DEMO_PROJECT_RECORD, ...allProjs];
          allGens = [DEMO_GENERATION_RECORD, ...allGens];
        }

        setProjects(allProjs);
        setGenerations(allGens);

        // Default project
        if (allProjs.length > 0) {
          setSelectedProjectId(allProjs[0].id);
        }
      } catch (err) {
        console.warn("[IntelligenceView] Error loading data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Find active project and generation
  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0] || DEMO_PROJECT_RECORD;
  }, [projects, selectedProjectId]);

  const activeGeneration = useMemo(() => {
    return (
      generations.find((g) => g.projectId === activeProject.id) ||
      DEMO_GENERATION_RECORD
    );
  }, [generations, activeProject]);

  const availableDeliverables = useMemo(() => {
    return activeGeneration.deliverables || [];
  }, [activeGeneration]);

  // Automatically select first deliverable if current selection is invalid
  useEffect(() => {
    if (availableDeliverables.length > 0) {
      const exists = availableDeliverables.some((d) => d.deliverableId === selectedDeliverableId);
      if (!exists) {
        setSelectedDeliverableId(availableDeliverables[0].deliverableId);
      }
    }
  }, [availableDeliverables, selectedDeliverableId]);

  const activeDeliverable = useMemo(() => {
    return (
      availableDeliverables.find((d) => d.deliverableId === selectedDeliverableId) ||
      availableDeliverables[0]
    );
  }, [availableDeliverables, selectedDeliverableId]);

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title={
          activeTab === "factmesh"
            ? "FactMesh™ Verification Intelligence"
            : "AudienceLens™ Suitability Intelligence"
        }
        description={
          activeTab === "factmesh"
            ? "Automated grounded fact-checking engine auditing numerical accuracy, claims, and dates against source truth."
            : "Multi-persona cognitive analysis scoring readability, tone alignment, and audience suitability."
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === "factmesh" ? "primary" : "outline"}
              size="sm"
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
              onClick={() => {
                setActiveTab("factmesh");
                onNavigate("intelligence/factmesh");
              }}
            >
              FactMesh™ Audit
            </Button>
            <Button
              variant={activeTab === "audiencelens" ? "primary" : "outline"}
              size="sm"
              icon={<Users className="w-3.5 h-3.5" />}
              onClick={() => {
                setActiveTab("audiencelens");
                onNavigate("intelligence/audiencelens");
              }}
            >
              AudienceLens™
            </Button>
          </div>
        }
      />

      {/* Control Bar: Project & Deliverable Selector */}
      <Card className="p-4 bg-white border-slate-200/90 shadow-2xs mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto flex-wrap">
            {/* Project Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
                Project:
              </span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Deliverable Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Deliverable:
              </span>
              <select
                value={selectedDeliverableId}
                onChange={(e) => setSelectedDeliverableId(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {availableDeliverables.map((d) => (
                  <option key={d.deliverableId} value={d.deliverableId}>
                    {d.title || d.deliverableId}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeDeliverable && onOpenDeliverable && (
            <Button
              variant="outline"
              size="sm"
              icon={<ExternalLink className="w-3.5 h-3.5" />}
              onClick={() =>
                onOpenDeliverable(
                  activeProject,
                  activeGeneration,
                  activeDeliverable.deliverableId
                )
              }
            >
              Open in Project Workspace
            </Button>
          )}
        </div>
      </Card>

      {/* Main Intelligence Engine */}
      {activeDeliverable ? (
        activeTab === "factmesh" ? (
          <FactMeshAuditView
            deliverable={activeDeliverable}
            draft={activeProject.draft}
            onUpdateDeliverableAudit={() => {}}
            onExit={() => onNavigate("dashboard")}
          />
        ) : (
          <AudienceLensView
            deliverable={activeDeliverable}
            draft={activeProject.draft}
            config={activeGeneration.config}
            onUpdateDeliverableReport={() => {}}
            onApplyAdaptation={() => {}}
            onExit={() => onNavigate("dashboard")}
          />
        )
      ) : (
        <Card className="p-8 text-center bg-white border-slate-200">
          <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            No Deliverables Available
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Create or generate a project first to inspect grounded fact-checking and multi-audience cognitive evaluations.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate("projects/new")}
          >
            Create New Project
          </Button>
        </Card>
      )}
    </PageContainer>
  );
}
