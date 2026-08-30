import React, { useState, useEffect } from "react";
import {
  ProjectDraft,
  TransformationConfig,
  GenerationSession,
  GeneratedDeliverable,
  DeliverableId,
  DeliverableDisplayMode,
} from "../../types";
import { Card } from "../ui/Card";
import { ResultsHeader } from "./ResultsHeader";
import { DeliverableNavigation } from "./DeliverableNavigation";
import { DeliverableMetadata } from "./DeliverableMetadata";
import { DeliverablePreview } from "./DeliverablePreview";
import { DeliverableEditor } from "./DeliverableEditor";
import { ExportControls } from "./ExportControls";
import { RegenerateDeliverableDialog } from "./RegenerateDeliverableDialog";
import { ResultsEmptyState } from "./ResultsEmptyState";
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
} from "../../services/db";

export interface ResultsWorkspaceProps {
  draft: ProjectDraft | null;
  config: TransformationConfig | null;
  session: GenerationSession | null;
  isOpenedFromHistory?: boolean;
  onUpdateSession?: (session: GenerationSession) => void;
  onNavigate: (route: string) => void;
  onRegenerateAll?: () => void;
}

export function ResultsWorkspace({
  draft,
  config,
  session,
  isOpenedFromHistory,
  onUpdateSession,
  onNavigate,
  onRegenerateAll,
}: ResultsWorkspaceProps) {
  const initialDeliverables: GeneratedDeliverable[] =
    session?.generatedDeliverables || [];

  const [deliverables, setDeliverables] = useState<GeneratedDeliverable[]>(initialDeliverables);
  const [selectedId, setSelectedId] = useState<DeliverableId>(() => {
    return initialDeliverables[0]?.deliverableId || "executive_summary";
  });
  const [displayMode, setDisplayMode] = useState<DeliverableDisplayMode>("preview");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState<boolean>(false);
  const [isRegeneratingSingle, setIsRegeneratingSingle] = useState<boolean>(false);
  const [singleRegenError, setSingleRegenError] = useState<string | null>(null);

  // Keep local deliverables synced with parent session if it changes externally
  useEffect(() => {
    if (session?.generatedDeliverables && session.generatedDeliverables.length > 0) {
      setDeliverables(session.generatedDeliverables);
      if (!session.generatedDeliverables.some((d) => d.deliverableId === selectedId)) {
        setSelectedId(session.generatedDeliverables[0].deliverableId);
      }
    }
  }, [session?.generatedDeliverables]);

  // Sync edits back up to session
  const updateSessionDeliverables = (updated: GeneratedDeliverable[]) => {
    setDeliverables(updated);
    if (session && onUpdateSession) {
      onUpdateSession({
        ...session,
        generatedDeliverables: updated,
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
        };
      }
      return d;
    });

    updateSessionDeliverables(updated);
    setIsEditing(false);

    // Persist edit to IndexedDB
    const targetGenId = session?.generationId || session?.sessionId;
    if (targetGenId) {
      updateDeliverableInGeneration(targetGenId, selectedId, newContent).catch((err) => {
        console.warn("[ResultsWorkspace] Could not persist edit to IndexedDB:", err);
      });
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

    updateSessionDeliverables(updated);
    setIsEditing(false);

    // Persist reset to IndexedDB
    const targetGenId = session?.generationId || session?.sessionId;
    if (targetGenId) {
      resetDeliverableInGeneration(targetGenId, selectedId).catch((err) => {
        console.warn("[ResultsWorkspace] Could not persist reset to IndexedDB:", err);
      });
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

      // Persist regenerated deliverable in IndexedDB
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
    } catch (err: any) {
      setSingleRegenError(err.message || "Failed to regenerate this deliverable.");
    } finally {
      setIsRegeneratingSingle(false);
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

  return (
    <div className="space-y-6">
      {/* Top Header & Status Banner */}
      <ResultsHeader
        draft={draft}
        deliverables={deliverables}
        modelUsed={session?.modelUsed || "gemini-3.7-flash"}
        sessionId={session?.sessionId}
        isOpenedFromHistory={isOpenedFromHistory}
        onNavigate={onNavigate}
        onExportAll={handleExportAll}
        onRegenerateAll={onRegenerateAll}
      />

      {/* Main Dual-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar / Mobile Selector */}
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isEditing
                      ? "bg-amber-100 border-amber-300 text-amber-900 shadow-2xs"
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
            />

            {/* Main Area: Preview or Local Editor */}
            <div className="p-6 bg-white min-h-[360px]">
              {isEditing ? (
                <DeliverableEditor
                  deliverable={activeDeliverable}
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
                onOpenRegenerate={() => {
                  setSingleRegenError(null);
                  setIsRegenerateDialogOpen(true);
                }}
              />
            </div>
          </Card>
        </div>
      </div>

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
