import React, { useState, useEffect, useRef } from "react";
import { Search, BookOpen, Hash, FileText, ArrowRight, ExternalLink } from "lucide-react";
import { SourceEvidenceUnit } from "../../../types";

export interface SourceEvidencePanelProps {
  sourceUnits: SourceEvidenceUnit[];
  highlightedUnitIds: string[];
  selectedUnitId?: string | null;
  onSelectUnit?: (unitId: string) => void;
  sourceName?: string;
}

export function SourceEvidencePanel({
  sourceUnits,
  highlightedUnitIds,
  selectedUnitId,
  onSelectUnit,
  sourceName = "Source Material",
}: SourceEvidencePanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const unitRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto-scroll to first highlighted unit if active
  useEffect(() => {
    const targetId = selectedUnitId || highlightedUnitIds[0];
    if (targetId && unitRefs.current[targetId]) {
      unitRefs.current[targetId]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedUnitId, highlightedUnitIds]);

  const filteredUnits = sourceUnits.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.id.toLowerCase().includes(q) ||
      u.text.toLowerCase().includes(q) ||
      (u.section && u.section.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
      {/* Panel Header */}
      <div className="p-3.5 bg-slate-50/80 border-b border-slate-200">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Authoritative Source Evidence
              </h3>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                {sourceName} ({sourceUnits.length} Evidence Units)
              </p>
            </div>
          </div>

          {highlightedUnitIds.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
              {highlightedUnitIds.length} Linked
            </span>
          )}
        </div>

        {/* Source search bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search source sentences, pages, keywords..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Units Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[640px] divide-y divide-slate-100/50">
        {filteredUnits.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No source evidence units match &quot;{searchQuery}&quot;
          </div>
        ) : (
          filteredUnits.map((unit) => {
            const isHighlighted = highlightedUnitIds.includes(unit.id);
            const isSelected = selectedUnitId === unit.id;

            return (
              <div
                key={unit.id}
                ref={(el) => { unitRefs.current[unit.id] = el; }}
                onClick={() => onSelectUnit && onSelectUnit(unit.id)}
                className={`p-3 rounded-lg border text-xs transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-300/80 shadow-xs"
                    : isHighlighted
                    ? "bg-indigo-50/60 border-indigo-300 ring-1 ring-indigo-200"
                    : "bg-slate-50/40 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 text-slate-700"
                }`}
              >
                {/* Meta bar: Unit ID, Page, Section */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isHighlighted || isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-200/90 text-slate-700"
                      }`}
                    >
                      {unit.id}
                    </span>

                    {unit.pageNumber && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200/60">
                        Page {unit.pageNumber}
                      </span>
                    )}

                    {unit.section && (
                      <span className="text-[10px] text-slate-500 font-medium truncate max-w-[140px]">
                        § {unit.section}
                      </span>
                    )}
                  </div>

                  {isHighlighted && (
                    <span className="text-[10px] font-semibold text-indigo-700 flex items-center gap-0.5">
                      Grounding Evidence
                    </span>
                  )}
                </div>

                {/* Text Content with highlighted search terms */}
                <p className="text-slate-800 leading-relaxed text-[11.5px]">
                  {unit.text}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info bar */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Click any claim on right to highlight its source proof.</span>
        <span className="font-mono text-[10px] text-slate-400">Deterministic IDs</span>
      </div>
    </div>
  );
}
