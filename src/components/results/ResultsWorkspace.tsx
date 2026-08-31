import React, { useState, useEffect } from "react";
import {
  ProjectDraft,
  TransformationConfig,
  GenerationSession,
  GeneratedDeliverable,
  DeliverableId,
  DeliverableDisplayMode,
  PersistenceStatus,
  FactMeshAudit,
} from "../../types";
import { Card } from "../ui/Card";
import { ResultsHeader } from "./ResultsHeader";
import { DeliverableNavigation } from "./DeliverableNavigation";
import { DeliverableMetadata } from "./DeliverableMetadata";
import { DeliverablePreview } from "./DeliverablePreview";
import { DeliverableEditor } from "./DeliverableEditor";
import { ExportControls } from "./ExportControls";
import { RegenerateDeliverableDialog } from "./RegenerateDeliverableDialog";
import { SaveProjectModal } from "./SaveProjectModal";
import { DiscardProjectModal } from "./DiscardProjectModal";
import { ResultsEmptyState } from "./ResultsEmptyState";
import { FactMeshAuditView } from "./audit/FactMeshAuditView";
import { regenerateSingleDeliverableApi } from "../../services/generationApi";
import {
  buildCombinedExportMarkdown,
  downloadTextFile,
  sanitizeFilename,
} from "../../utils/exportHelpers";
import { DELIVERABLES_CATALOG } from "../../constants/transformationOptions";
import {
  updateDeliverableInGeneration,
  resetDeliverableInGeneration,
  saveGenerationAndSyncProject,
  renameProject as dbRenameProject,
} from "../../services/db";

export interface ResultsWorkspaceProps {
  draft: ProjectDraft | null;
  config: TransformationConfig | null;
  session: GenerationSession | null;
  isOpenedFromHistory?: boolean;
  onUpdateSession?: (session: GenerationSession) => void;
  onNavigate: (route: string) => void;
  onRegenerateAll?: () => void;
  onDiscard?: () => void;
}

export function ResultsWorkspace({
  draft,
  config,
  session,
  isOpenedFromHistory,
  onUpdateSession,
  onNavigate,
  onRegenerateAll,
  onDiscard,
}: ResultsWorkspaceProps) {
  const initialDeliverables: GeneratedDeliverable[] =
    session?.generatedDeliverables || [];

  const [deliverables, setDeliverables] = useState<GeneratedDeliverable[]>(initialDeliverables);
  const [selectedId, setSelectedId] = useState<DeliverableId>(() => {
    return initialDeliverables[0]?.deliverableId || "executive_summary";
  });
  const [displayMode, setDisplayMode] = useState<DeliverableDisplayMode>("preview");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isFactMeshAuditOpen, setIsFactMeshAuditOpen] = useState<boolean>(false);
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState<boolean>(false);
  const [isRegeneratingSingle, setIsRegeneratingSingle] = useState<boolean>(false);
  const [singleRegenError, setSingleRegenError] = useState<string | null>(null);

  // Persistence State Machine
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus>(() => {
    if (session?.persistenceStatus) return session.persistenceStatus;
    if (session?.projectId || session?.isSaved || isOpenedFromHistory) return "saved";
    return "unsaved";
  });

  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessNotification, setSaveSuccessNotification] = useState<string | null>(null);

  // Keep local deliverables and persistence status synced with session updates
  useEffect(() => {
    if (session?.generatedDeliverables && session.generatedDeliverables.length > 0) {
      setDeliverables(session.generatedDeliverables);
      if (!session.generatedDeliverables.some((d) => d.deliverableId === selectedId)) {
        setSelectedId(session.generatedDeliverables[0].deliverableId);
      }
    }
    if (session?.persistenceStatus) {
      setPersistenceStatus(session.persistenceStatus);
    } else if (session?.projectId || session?.isSaved || isOpenedFromHistory) {
      setPersistenceStatus((prev) => (prev === "dirty" ? "dirty" : "saved"));
    }
  }, [session?.generatedDeliverables, session?.persistenceStatus, session?.projectId, session?.isSaved, isOpenedFromHistory]);

  // Sync edits back up to session
  const updateSessionDeliverables = (updated: GeneratedDeliverable[], newStatus?: PersistenceStatus) => {
    setDeliverables(updated);
    const statusToUse = newStatus !== undefined ? newStatus : persistenceStatus;
    if (session && onUpdateSession) {
      onUpdateSession({
        ...session,
        generatedDeliverables: updated,
        persistenceStatus: statusToUse,
        isSaved: statusToUse === "saved" || statusToUse === "dirty",
      });
    }
  };

  if (!draft || !config || deliverables.length === 0) {
    return (
      <ResultsEmptyState
        onStartNew={() => onNavigate("projects/new")}
        onBackToConfig={() => onNavigate("projects/new/configure")}
      />
    );
  }

  const activeDeliverable =
    deliverables.find((d) => d.deliverableId === selectedId) || deliverables[0];
  const activeMeta = DELIVERABLES_CATALOG.find(
    (m) => m.id === activeDeliverable?.deliverableId
  );

  // Handle switching deliverable selection
  const handleSelectDeliverable = (id: DeliverableId) => {
    setSelectedId(id);
    setIsEditing(false);
    setDisplayMode("preview");
  };

  // Handle caching and persisting FactMesh Grounding audit results
  const handleUpdateDeliverableAudit = (audit: FactMeshAudit) => {
    const updated = deliverables.map((d) => {
      if (d.deliverableId === selectedId) {
        return {
          ...d,
          factMeshAudit: audit,
          factMeshAuditStale: false,
        };
      }
      return d;
    });

    setDeliverables(updated);
    if (session && onUpdateSession) {
      onUpdateSession({
        ...session,
        generatedDeliverables: updated,
      });
    }

    // If project is already saved in IndexedDB, update the generation record
    const isProjectAlreadySaved = Boolean(
      session?.projectId || session?.isSaved || persistenceStatus === "saved" || persistenceStatus === "dirty"
    );
    if (isProjectAlreadySaved) {
      const targetGenId = session?.generationId || session?.sessionId;
      if (targetGenId) {
        // Automatically save updated deliverable with audit into current generation record
        saveGenerationAndSyncProject(draft, config, updated, {
          projectId: session?.projectId,
          generationId: targetGenId,
          modelUsed: session?.modelUsed || "gemini-3.7-flash",
        }).catch((err) => {
          console.warn("[ResultsWorkspace] Could not auto-sync FactMesh audit to IndexedDB:", err);
        });
      }
    }
  };

  // Handle local save of deliverable edits
  const handleSaveEdit = (newContent: string) => {
    const updated = deliverables.map((d) => {
      if (d.deliverableId === selectedId) {
        return {
          ...d,
          content: newContent,
          isEdited: true,
          originalContent: d.originalContent !== undefined ? d.originalContent : d.content,
          lastEditedAt: new Date().toISOString(),
          factMeshAuditStale: Boolean(d.factMeshAudit),
        };
      }
      return d;
    });

    const isProjectAlreadySaved = Boolean(session?.projectId || session?.isSaved || persistenceStatus === "saved" || persistenceStatus === "dirty");
    const nextStatus: PersistenceStatus = isProjectAlreadySaved ? "dirty" : "unsaved";
    setPersistenceStatus(nextStatus);

    updateSessionDeliverables(updated, nextStatus);
    setIsEditing(false);

    // Persist edit to IndexedDB ONLY if the project has already been saved to DB
    if (isProjectAlreadySaved) {
      const targetGenId = session?.generationId || session?.sessionId;
      if (targetGenId) {
        updateDeliverableInGeneration(targetGenId, selectedId, newContent).catch((err) => {
          console.warn("[ResultsWorkspace] Could not persist edit to IndexedDB:", err);
        });
      }
    }
  };

  // Handle reset deliverable back to original generated version
  const handleResetToOriginal = () => {
    const updated = deliverables.map((d) => {
      if (d.deliverableId === selectedId) {
        return {
          ...d,
          content: d.originalContent !== undefined ? d.originalContent : d.content,
          isEdited: false,
          lastEditedAt: undefined,
        };
      }
      return d;
    });

    const hasAnyOtherEdits = updated.some((d) => d.isEdited);
    const isProjectAlreadySaved = Boolean(session?.projectId || session?.isSaved);
    const nextStatus: PersistenceStatus = isProjectAlreadySaved ? (hasAnyOtherEdits ? "dirty" : "saved") : "unsaved";
    setPersistenceStatus(nextStatus);

    updateSessionDeliverables(updated, nextStatus);
    setIsEditing(false);

    // Persist reset to IndexedDB ONLY if saved
    if (isProjectAlreadySaved) {
      const targetGenId = session?.generationId || session?.sessionId;
      if (targetGenId) {
        resetDeliverableInGeneration(targetGenId, selectedId).catch((err) => {
          console.warn("[ResultsWorkspace] Could not persist reset to IndexedDB:", err);
        });
      }
    }
  };

  // Handle single deliverable regeneration
  const handleConfirmRegenerate = async () => {
    if (!activeDeliverable) return;
    setIsRegeneratingSingle(true);
    setSingleRegenError(null);

    try {
      const regenerated = await regenerateSingleDeliverableApi(
        draft,
        config,
        activeDeliverable.deliverableId
      );

      const updated = deliverables.map((d) => {
        if (d.deliverableId === activeDeliverable.deliverableId) {
          return {
            ...regenerated,
            isEdited: false,
            originalContent: regenerated.content,
            originalStructuredData: regenerated.structuredData,
            generatedAt: new Date().toISOString(),
          };
        }
        return d;
      });

      updateSessionDeliverables(updated);
      setIsRegenerateDialogOpen(false);
      setIsEditing(false);

      // Persist regenerated deliverable in IndexedDB ONLY if saved
      const isProjectAlreadySaved = Boolean(session?.projectId || session?.isSaved);
      if (isProjectAlreadySaved) {
        const targetGenId = session?.generationId || session?.sessionId;
        if (targetGenId) {
          saveGenerationAndSyncProject(draft, config, updated, {
            projectId: session?.projectId,
            generationId: targetGenId,
            modelUsed: session?.modelUsed,
          }).catch((err) => {
            console.warn("[ResultsWorkspace] Could not persist regenerated deliverable:", err);
          });
        }
      }
    } catch (err: any) {
      setSingleRegenError(err.message || "Failed to regenerate this deliverable.");
    } finally {
      setIsRegeneratingSingle(false);
    }
  };

  // Handle Explicit "Save Project" (First Save or Rename)
  const handleConfirmSaveProject = async (customProjectName: string) => {
    if (isSaving) return; // Prevent double-submit
    setIsSaving(true);
    setPersistenceStatus("saving");

    try {
      const updatedDraft: ProjectDraft = {
        ...draft,
        name: customProjectName.trim() || draft.name,
      };

      const targetProjectId = session?.projectId;
      const targetGenerationId = session?.generationId || session?.sessionId;

      const saved = await saveGenerationAndSyncProject(
        updatedDraft,
        config,
        deliverables,
        {
          projectId: targetProjectId,
          generationId: targetGenerationId,
          modelUsed: session?.modelUsed || "gemini-3.7-flash",
        }
      );

      setPersistenceStatus("saved");

      if (session && onUpdateSession) {
        onUpdateSession({
          ...session,
          projectId: saved.project.id,
          generationId: saved.generation.id,
          draft: updatedDraft,
          persistenceStatus: "saved",
          isSaved: true,
        });
      }

      setIsSaveModalOpen(false);
      setSaveSuccessNotification(`Project "${saved.project.name}" saved to My Projects.`);
      setTimeout(() => setSaveSuccessNotification(null), 5000);
    } catch (err: any) {
      console.error("[ResultsWorkspace] Failed to save project:", err);
      setPersistenceStatus("save_failed");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Quick "Save Changes" for Dirty State
  const handleSaveChanges = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setPersistenceStatus("saving");

    try {
      const targetProjectId = session?.projectId;
      const targetGenerationId = session?.generationId || session?.sessionId;

      const saved = await saveGenerationAndSyncProject(
        draft,
        config,
        deliverables,
        {
          projectId: targetProjectId,
          generationId: targetGenerationId,
          modelUsed: session?.modelUsed || "gemini-3.7-flash",
        }
      );

      setPersistenceStatus("saved");

      if (session && onUpdateSession) {
        onUpdateSession({
          ...session,
          projectId: saved.project.id,
          generationId: saved.generation.id,
          draft,
          persistenceStatus: "saved",
          isSaved: true,
        });
      }

      setSaveSuccessNotification(`Changes saved to project "${saved.project.name}".`);
      setTimeout(() => setSaveSuccessNotification(null), 4000);
    } catch (err: any) {
      console.error("[ResultsWorkspace] Failed to save changes:", err);
      setPersistenceStatus("save_failed");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Discard Transformation
  const handleConfirmDiscard = () => {
    setIsDiscardModalOpen(false);
    if (onDiscard) {
      onDiscard();
    } else {
      onNavigate("projects");
    }
  };

  const handleExportAll = () => {
    const safeProject = sanitizeFilename(draft.name || "project");
    const filename = `${safeProject}_full_transformation_bundle.md`;
    const fullMarkdown = buildCombinedExportMarkdown(
      draft,
      config,
      deliverables,
      session?.modelUsed || "gemini-3.7-flash",
      session?.sessionId
    );
    downloadTextFile(filename, fullMarkdown);
  };

  const hasEdits = deliverables.some((d) => d.isEdited);

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {saveSuccessNotification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold">{saveSuccessNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccessNotification(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header & Status Banner */}
      <ResultsHeader
        draft={draft}
        deliverables={deliverables}
        modelUsed={session?.modelUsed || "gemini-3.7-flash"}
        sessionId={session?.sessionId}
        persistenceStatus={persistenceStatus}
        isSaved={persistenceStatus === "saved" || persistenceStatus === "dirty"}
        isSaving={isSaving}
        isOpenedFromHistory={isOpenedFromHistory}
        onNavigate={onNavigate}
        onExportAll={handleExportAll}
        onSaveProject={() => setIsSaveModalOpen(true)}
        onSaveChanges={handleSaveChanges}
        onDiscardProject={() => setIsDiscardModalOpen(true)}
        onRenameProject={() => setIsSaveModalOpen(true)}
        onRegenerateAll={onRegenerateAll}
      />

      {/* Main Content Layout: FactMesh Audit View OR Dual-Column Deliverable Workspace */}
      {isFactMeshAuditOpen ? (
        <FactMeshAuditView
          deliverable={activeDeliverable}
          draft={draft}
          onUpdateDeliverableAudit={handleUpdateDeliverableAudit}
          onExit={() => setIsFactMeshAuditOpen(false)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Navigation Sidebar / Deliverable Selector */}
          <div className="lg:col-span-4 xl:col-span-3">
            <Card className="p-3 shadow-xs border-slate-200">
              <DeliverableNavigation
                deliverables={deliverables}
                selectedId={selectedId}
                onSelect={handleSelectDeliverable}
                isRegenerating={isRegeneratingSingle}
                regeneratingId={isRegeneratingSingle ? selectedId : null}
              />
            </Card>
          </div>

          {/* Content Viewer / Editor Main Card */}
          <div className="lg:col-span-8 xl:col-span-9">
            <Card className="p-0 overflow-hidden shadow-xs border-slate-200">
              {/* Deliverable Header */}
              <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {activeDeliverable.title || activeMeta?.name || activeDeliverable.deliverableId}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeMeta?.description || "Structured content transformation deliverable."}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      isEditing
                        ? "bg-amber-100 border-amber-300 text-amber-900 shadow-2xs font-semibold"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {isEditing ? "Exit Edit Mode" : "Edit Locally"}
                  </button>
                </div>
              </div>

              {/* Non-sensitive Generation Metadata Bar */}
              <DeliverableMetadata
                deliverable={activeDeliverable}
                modelUsed={session?.modelUsed || "gemini-3.7-flash"}
                projectName={draft.name}
                onOpenFactMeshAudit={() => setIsFactMeshAuditOpen(true)}
              />

              {/* Main Area: Preview or Local Editor */}
              <div className="p-6 bg-white min-h-[360px]">
                {isEditing ? (
                  <DeliverableEditor
                    deliverable={activeDeliverable}
                    sourceText={draft.sourceText}
                    language={config.language}
                    onSave={handleSaveEdit}
                    onResetToOriginal={handleResetToOriginal}
                    onCancel={() => setIsEditing(false)}
                  />
                ) : (
                  <DeliverablePreview
                    deliverable={activeDeliverable}
                    displayMode={displayMode}
                    onChangeDisplayMode={setDisplayMode}
                    projectName={draft.name}
                  />
                )}
              </div>

              {/* Bottom Export & Action Toolbar */}
              <div className="p-4 bg-slate-50/50 border-t border-slate-200">
                <ExportControls
                  activeDeliverable={activeDeliverable}
                  allDeliverables={deliverables}
                  draft={draft}
                  config={config}
                  modelUsed={session?.modelUsed || "gemini-3.7-flash"}
                  sessionId={session?.sessionId}
                  isEditing={isEditing}
                  onToggleEdit={() => setIsEditing(!isEditing)}
                  onOpenFactMeshAudit={() => setIsFactMeshAuditOpen(true)}
                  onOpenRegenerate={() => {
                    setSingleRegenError(null);
                    setIsRegenerateDialogOpen(true);
                  }}
                />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Save Project Modal */}
      <SaveProjectModal
        isOpen={isSaveModalOpen}
        draft={draft}
        deliverables={deliverables}
        isSaving={isSaving}
        onSave={handleConfirmSaveProject}
        onClose={() => setIsSaveModalOpen(false)}
      />

      {/* Discard Project Modal */}
      <DiscardProjectModal
        isOpen={isDiscardModalOpen}
        hasEdits={hasEdits}
        onConfirm={handleConfirmDiscard}
        onClose={() => setIsDiscardModalOpen(false)}
      />

      {/* Regeneration Modal Dialog */}
      <RegenerateDeliverableDialog
        isOpen={isRegenerateDialogOpen}
        deliverable={activeDeliverable}
        isRegenerating={isRegeneratingSingle}
        error={singleRegenError}
        onConfirm={handleConfirmRegenerate}
        onClose={() => {
          if (!isRegeneratingSingle) {
            setIsRegenerateDialogOpen(false);
            setSingleRegenError(null);
          }
        }}
      />
    </div>
  );
}
