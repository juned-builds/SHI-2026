import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  Share2,
  Bell,
  BarChart2,
  Presentation,
  Video,
  Edit3,
  ChevronRight,
  Layers,
} from "lucide-react";
import { GeneratedDeliverable, DeliverableId } from "../../types";
import { DELIVERABLES_CATALOG } from "../../constants/transformationOptions";

export interface DeliverableNavigationProps {
  deliverables: GeneratedDeliverable[];
  selectedId: DeliverableId;
  onSelect: (id: DeliverableId) => void;
  isRegenerating?: boolean;
  regeneratingId?: DeliverableId | null;
}

const DELIVERABLE_ICONS: Record<DeliverableId, React.ReactNode> = {
  executive_summary: <FileText className="w-4 h-4" />,
  linkedin_post: <Share2 className="w-4 h-4" />,
  twitter_post: <Share2 className="w-4 h-4" />,
  advisory: <Bell className="w-4 h-4" />,
  infographic: <BarChart2 className="w-4 h-4" />,
  presentation: <Presentation className="w-4 h-4" />,
  video_package: <Video className="w-4 h-4" />,
};

export function DeliverableNavigation({
  deliverables,
  selectedId,
  onSelect,
  isRegenerating = false,
  regeneratingId = null,
}: DeliverableNavigationProps) {
  return (
    <div className="w-full">
      {/* Mobile Select View */}
      <div className="block lg:hidden mb-4">
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Select Deliverable
        </label>
        <div className="relative">
          <select
            value={selectedId}
            onChange={(e) => onSelect(e.target.value as DeliverableId)}
            className="w-full py-2.5 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
          >
            {deliverables.map((deliv) => {
              const meta = DELIVERABLES_CATALOG.find((m) => m.id === deliv.deliverableId);
              const label = meta?.name || deliv.title || deliv.deliverableId;
              const editedSuffix = deliv.isEdited ? " (Edited)" : "";
              const failedSuffix = deliv.status === "failed" ? " [Error]" : "";
              return (
                <option key={deliv.deliverableId} value={deliv.deliverableId}>
                  {label}{editedSuffix}{failedSuffix}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Desktop Sidebar Panel */}
      <div className="hidden lg:block space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1.5 flex items-center justify-between">
          <span>Deliverables ({deliverables.length})</span>
          <span className="text-[10px] text-slate-400 font-normal">Click to view/edit</span>
        </div>

        <div className="space-y-1">
          {deliverables.map((deliv) => {
            const isSelected = deliv.deliverableId === selectedId;
            const meta = DELIVERABLES_CATALOG.find((m) => m.id === deliv.deliverableId);
            const isFailed = deliv.status === "failed";
            const isItemRegenerating = isRegenerating && regeneratingId === deliv.deliverableId;
            const icon = DELIVERABLE_ICONS[deliv.deliverableId] || <FileText className="w-4 h-4" />;

            return (
              <button
                key={deliv.deliverableId}
                type="button"
                onClick={() => onSelect(deliv.deliverableId)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-start justify-between gap-2.5 border ${
                  isSelected
                    ? "bg-blue-50/80 border-blue-200 text-blue-950 shadow-xs ring-1 ring-blue-500/20"
                    : "bg-white hover:bg-slate-50/80 border-slate-200/80 text-slate-700 hover:text-slate-900"
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs truncate">
                        {meta?.name || deliv.title || deliv.deliverableId}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {meta?.category && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100/90 text-slate-600 capitalize">
                          {meta.category}
                        </span>
                      )}

                      {deliv.isEdited && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-medium">
                          <Edit3 className="w-2.5 h-2.5" />
                          Edited
                        </span>
                      )}

                      {isItemRegenerating && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 animate-pulse font-medium">
                          Regenerating...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 mt-1">
                  {isFailed ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  ) : isSelected ? (
                    <ChevronRight className="w-4 h-4 text-blue-600" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
