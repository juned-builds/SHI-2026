import React from "react";
import {
  FileText,
  Share2,
  MessageSquare,
  AlertTriangle,
  PieChart,
  Layers,
  Video,
  Check,
  Package,
} from "lucide-react";
import { DeliverableId } from "../../types";
import { DELIVERABLES_CATALOG } from "../../constants/transformationOptions";
import { Badge } from "../ui/Badge";

export interface DeliverableSelectorProps {
  selectedDeliverables: DeliverableId[];
  onToggleDeliverable: (id: DeliverableId) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  error?: string | null;
}

export function DeliverableSelector({
  selectedDeliverables,
  onToggleDeliverable,
  onSelectAll,
  onClearAll,
  error,
}: DeliverableSelectorProps) {
  const getIcon = (id: DeliverableId) => {
    switch (id) {
      case "executive_summary":
        return <FileText className="w-5 h-5" />;
      case "linkedin_post":
        return <Share2 className="w-5 h-5" />;
      case "twitter_post":
        return <MessageSquare className="w-5 h-5" />;
      case "advisory":
        return <AlertTriangle className="w-5 h-5" />;
      case "infographic":
        return <PieChart className="w-5 h-5" />;
      case "presentation":
        return <Layers className="w-5 h-5" />;
      case "video_package":
        return <Video className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const selectedCount = selectedDeliverables.length;
  const totalCount = DELIVERABLES_CATALOG.length;
  const isAllSelected = selectedCount === totalCount;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-600" />
            Deliverable Matrix
            <span className="text-red-500 text-xs">*</span>
          </label>
          <p className="text-xs text-slate-500 mt-0.5">
            Select one or more output formats to generate from the same source content.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={selectedCount > 0 ? "success" : "outline"}
            className="text-xs font-semibold py-1 px-2.5"
          >
            {selectedCount} {selectedCount === 1 ? "deliverable" : "deliverables"} selected
          </Badge>

          <div className="flex items-center gap-1 border-l border-slate-200 pl-2 text-xs">
            <button
              type="button"
              onClick={isAllSelected ? onClearAll : onSelectAll}
              className="text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-100 cursor-pointer"
            >
              {isAllSelected ? "Deselect All" : "Select All"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {DELIVERABLES_CATALOG.map((deliverable) => {
          const isSelected = selectedDeliverables.includes(deliverable.id);

          return (
            <button
              key={deliverable.id}
              type="button"
              onClick={() => onToggleDeliverable(deliverable.id)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative group ${
                isSelected
                  ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50/70"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-white/10 text-white"
                        : "bg-slate-100 text-slate-700 group-hover:bg-slate-200/70"
                    }`}
                  >
                    {getIcon(deliverable.id)}
                  </div>

                  {/* Multi-select check indicator */}
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-emerald-500 border-emerald-400 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <h4
                    className={`text-sm font-semibold ${
                      isSelected ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {deliverable.name}
                  </h4>
                </div>

                <p
                  className={`text-xs leading-relaxed ${
                    isSelected ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {deliverable.description}
                </p>
              </div>

              {deliverable.badgeLabel && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/20 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-medium tracking-wide uppercase ${
                      isSelected ? "text-slate-400" : "text-slate-400"
                    }`}
                  >
                    {deliverable.badgeLabel}
                  </span>

                  <span
                    className={`text-[11px] font-medium ${
                      isSelected ? "text-emerald-300" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  >
                    {isSelected ? "Included in generation" : "+ Select"}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
