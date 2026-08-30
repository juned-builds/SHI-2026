import React, { useState, useEffect } from "react";
import {
  X,
  History,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  Edit3,
  Trash2,
} from "lucide-react";
import { ProjectRecord, GenerationRecord } from "../../types";
import { getGenerationsForProject } from "../../services/db";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { DELIVERABLES_CATALOG } from "../../constants/transformationOptions";

export interface ProjectHistoryModalProps {
  project: ProjectRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenGeneration: (project: ProjectRecord, generation: GenerationRecord) => void;
}

export function ProjectHistoryModal({
  project,
  isOpen,
  onClose,
  onOpenGeneration,
}: ProjectHistoryModalProps) {
  const [generations, setGenerations] = useState<GenerationRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && project) {
      setIsLoading(true);
      getGenerationsForProject(project.id)
        .then((records) => {
          setGenerations(records);
        })
        .catch((err) => {
          console.error("Failed to load project generation history:", err);
          setGenerations([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  const formatDate = (isoString?: string) => {
    if (!isoString) return "N/A";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const getDeliverableName = (id: string) => {
    const found = DELIVERABLES_CATALOG.find((d) => d.id === id);
    return found ? found.name : id.replace(/_/g, " ");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100/80 border border-emerald-200/90 flex items-center justify-center text-emerald-700 shadow-2xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 leading-tight">
                Generation History
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1 max-w-md">
                {project.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="space-y-3 py-6">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 animate-pulse space-y-3"
                >
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                  <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : generations.length === 0 ? (
            <div className="py-12 text-center">
              <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-800">
                No generations recorded yet
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                Execute a transformation session to record your first deliverable batch for this project.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {generations.map((gen, idx) => {
                const totalGenCount = generations.length;
                const genNum = gen.generationNumber || totalGenCount - idx;
                const completedCount = gen.deliverables.filter(
                  (d) => d.status === "completed"
                ).length;
                const hasEdits = gen.deliverables.some((d) => d.isEdited);

                return (
                  <div
                    key={gen.id}
                    className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-emerald-300/80 hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      {/* Title & Status */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">
                          Generation #{genNum}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            gen.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                              : gen.status === "partial"
                              ? "bg-amber-50 text-amber-700 border border-amber-200/70"
                              : "bg-red-50 text-red-700 border border-red-200/70"
                          }`}
                        >
                          {gen.status === "completed" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          <span className="capitalize">{gen.status}</span>
                        </span>

                        {hasEdits && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                            <Edit3 className="w-3 h-3" />
                            Edited
                          </span>
                        )}

                        <span className="text-[11px] text-slate-400 font-mono">
                          {gen.modelUsed || "gemini-3.6-flash"}
                        </span>
                      </div>

                      {/* Timestamp & Metadata */}
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(gen.createdAt)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          {completedCount} of {gen.deliverables.length} deliverables
                        </span>
                      </div>

                      {/* Deliverables tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {gen.deliverables.map((d) => (
                          <span
                            key={d.deliverableId}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80"
                          >
                            {getDeliverableName(d.deliverableId)}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<ArrowRight className="w-3.5 h-3.5" />}
                        onClick={() => {
                          onOpenGeneration(project, gen);
                          onClose();
                        }}
                        className="w-full sm:w-auto text-xs border-emerald-200 text-emerald-800 hover:bg-emerald-50 hover:border-emerald-300"
                      >
                        Open Results
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            {generations.length} total generation{generations.length === 1 ? "" : "s"}
          </span>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
