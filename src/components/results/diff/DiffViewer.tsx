import React from "react";
import { DiffSegment } from "../../../utils/localIntelligence";

export interface DiffViewerProps {
  diffs: DiffSegment[];
  mode?: "inline" | "side-by-side";
  className?: string;
}

export function DiffViewer({ diffs, mode = "inline", className = "" }: DiffViewerProps) {
  if (!diffs || diffs.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-500 italic bg-slate-50 rounded-lg">
        No differences detected.
      </div>
    );
  }

  if (mode === "side-by-side") {
    const originalText = diffs
      .filter((d) => d.type === "unchanged" || d.type === "removed")
      .map((d) => d.value)
      .join("");

    const modifiedText = diffs
      .filter((d) => d.type === "unchanged" || d.type === "added")
      .map((d) => d.value)
      .join("");

    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 text-xs ${className}`}>
        {/* Original */}
        <div className="flex flex-col border border-slate-200 rounded-lg overflow-hidden bg-white">
          <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 font-semibold text-slate-700 text-[11px]">
            Original
          </div>
          <div className="p-3 font-mono whitespace-pre-wrap leading-relaxed max-h-[350px] overflow-y-auto text-slate-800">
            {diffs.map((segment, idx) => {
              if (segment.type === "removed") {
                return (
                  <span
                    key={idx}
                    className="bg-rose-100 text-rose-900 line-through decoration-rose-500 rounded-2xs px-0.5"
                  >
                    {segment.value}
                  </span>
                );
              }
              if (segment.type === "unchanged") {
                return <span key={idx}>{segment.value}</span>;
              }
              return null;
            })}
          </div>
        </div>

        {/* Modified */}
        <div className="flex flex-col border border-indigo-200 rounded-lg overflow-hidden bg-white">
          <div className="px-3 py-1.5 bg-indigo-50 border-b border-indigo-200 font-semibold text-indigo-900 text-[11px]">
            Modified (Proposed)
          </div>
          <div className="p-3 font-mono whitespace-pre-wrap leading-relaxed max-h-[350px] overflow-y-auto text-slate-900">
            {diffs.map((segment, idx) => {
              if (segment.type === "added") {
                return (
                  <span
                    key={idx}
                    className="bg-emerald-100 text-emerald-950 font-medium rounded-2xs px-0.5"
                  >
                    {segment.value}
                  </span>
                );
              }
              if (segment.type === "unchanged") {
                return <span key={idx}>{segment.value}</span>;
              }
              return null;
            })}
          </div>
        </div>
      </div>
    );
  }

  // Inline mode
  return (
    <div
      className={`p-3.5 bg-white border border-slate-200 rounded-lg font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto ${className}`}
    >
      {diffs.map((segment, idx) => {
        if (segment.type === "added") {
          return (
            <span
              key={idx}
              className="bg-emerald-100 text-emerald-950 font-semibold rounded-2xs px-1 py-0.5 mx-0.5 border border-emerald-300"
            >
              {segment.value}
            </span>
          );
        }
        if (segment.type === "removed") {
          return (
            <span
              key={idx}
              className="bg-rose-100 text-rose-900 line-through decoration-rose-500 rounded-2xs px-1 py-0.5 mx-0.5 border border-rose-300 opacity-80"
            >
              {segment.value}
            </span>
          );
        }
        return <span key={idx}>{segment.value}</span>;
      })}
    </div>
  );
}
