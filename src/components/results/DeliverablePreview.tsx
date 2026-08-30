import React from "react";
import {
  FileText,
  Layers,
  Code2,
  AlertCircle,
  Presentation,
  Video,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { GeneratedDeliverable, DeliverableDisplayMode } from "../../types";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { VideoPackageViewer } from "./video/VideoPackageViewer";

export interface DeliverablePreviewProps {
  deliverable: GeneratedDeliverable;
  displayMode: DeliverableDisplayMode;
  onChangeDisplayMode: (mode: DeliverableDisplayMode) => void;
  projectName?: string;
}

export function DeliverablePreview({
  deliverable,
  displayMode,
  onChangeDisplayMode,
  projectName,
}: DeliverablePreviewProps) {
  const hasStructuredData =
    deliverable.structuredData &&
    typeof deliverable.structuredData === "object" &&
    Object.keys(deliverable.structuredData).length > 0;

  if (deliverable.status === "failed") {
    return (
      <div className="p-8 text-center bg-amber-50/50 border border-amber-200 rounded-xl">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
        <h4 className="text-sm font-semibold text-amber-900 mb-1">
          Deliverable Incomplete
        </h4>
        <p className="text-xs text-amber-700 max-w-md mx-auto">
          {deliverable.error || "The AI transformation engine was unable to synthesize this specific deliverable."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Switcher Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-lg border border-slate-200/80">
          <button
            type="button"
            onClick={() => onChangeDisplayMode("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              displayMode === "preview"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Formatted Preview
          </button>

          {hasStructuredData && (
            <button
              type="button"
              onClick={() => onChangeDisplayMode("structured")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                displayMode === "structured"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Structured Schema
            </button>
          )}

          {hasStructuredData && (
            <button
              type="button"
              onClick={() => onChangeDisplayMode("raw_json")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                displayMode === "raw_json"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Raw JSON
            </button>
          )}
        </div>

        <span className="text-[11px] text-slate-400 hidden sm:inline">
          {displayMode === "preview" && "Markdown rendering"}
          {displayMode === "structured" && "Structured data view"}
          {displayMode === "raw_json" && "Pydantic contract schema"}
        </span>
      </div>

      {/* Mode 1: Formatted Markdown / Rich Document Preview */}
      {displayMode === "preview" && (
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <MarkdownRenderer content={deliverable.content} />
        </div>
      )}

      {/* Mode 2: Structured Component Data View */}
      {displayMode === "structured" && hasStructuredData && (
        <StructuredDataVisualizer
          deliverableId={deliverable.deliverableId}
          data={deliverable.structuredData!}
          projectName={projectName}
        />
      )}

      {/* Mode 3: Raw JSON Inspector */}
      {displayMode === "raw_json" && hasStructuredData && (
        <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-inner max-h-[600px] scrollbar-thin">
          <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 mb-3 border-b border-slate-800">
            <span>Payload Output: {deliverable.deliverableId}</span>
            <span>JSON Validated</span>
          </div>
          <pre className="whitespace-pre">{JSON.stringify(deliverable.structuredData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

/**
 * Visual breakdown for structured deliverable schemas.
 */
function StructuredDataVisualizer({
  deliverableId,
  data,
  projectName,
}: {
  deliverableId: string;
  data: Record<string, any>;
  projectName?: string;
}) {
  switch (deliverableId) {
    case "presentation":
      return <PresentationDeckViewer data={data} />;
    case "video_package":
      return <VideoPackageViewer data={data} projectName={projectName} />;
    case "infographic":
      return <InfographicViewer data={data} />;
    case "executive_summary":
      return <ExecutiveSummaryViewer data={data} />;
    case "advisory":
      return <AdvisoryViewer data={data} />;
    default:
      return <GenericStructuredViewer data={data} />;
  }
}

function PresentationDeckViewer({ data }: { data: Record<string, any> }) {
  const slides = Array.isArray(data.slides) ? data.slides : [];

  return (
    <div className="space-y-4">
      {data.title && (
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
          <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wide">
            Presentation Title
          </span>
          <h4 className="text-sm font-bold text-blue-950 mt-0.5">{data.title}</h4>
          {data.total_slides && (
            <span className="text-xs text-blue-700 mt-1 inline-block">
              {data.total_slides} Total Slides Planned
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {slides.map((slide: any, idx: number) => (
          <div
            key={idx}
            className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-[11px] font-bold text-blue-600 uppercase">
                  Slide {slide.slide_number || idx + 1}
                </span>
                <Presentation className="w-3.5 h-3.5 text-slate-400" />
              </div>

              <h5 className="font-semibold text-slate-900 text-xs mb-2">
                {slide.slide_title || "Untitled Slide"}
              </h5>

              {Array.isArray(slide.bullet_points) && slide.bullet_points.length > 0 && (
                <ul className="space-y-1 mb-3 text-xs text-slate-600 list-disc list-inside">
                  {slide.bullet_points.map((pt: string, pidx: number) => (
                    <li key={pidx} className="leading-snug">
                      {pt}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-[11px]">
              {slide.visual_concept && (
                <div className="p-2 bg-slate-50 rounded text-slate-600">
                  <strong className="text-slate-800 font-medium">Visual: </strong>
                  {slide.visual_concept}
                </div>
              )}
              {slide.speaker_notes && (
                <div className="p-2 bg-amber-50/60 rounded text-amber-900">
                  <strong className="text-amber-950 font-medium">Speaker Notes: </strong>
                  {slide.speaker_notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfographicViewer({ data }: { data: Record<string, any> }) {
  const metrics = Array.isArray(data.key_facts_and_metrics) ? data.key_facts_and_metrics : [];
  const sections = Array.isArray(data.sections) ? data.sections : [];

  return (
    <div className="space-y-4">
      {data.core_message && (
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
            Core Infographic Message
          </span>
          <p className="text-xs text-emerald-950 font-medium mt-0.5">{data.core_message}</p>
        </div>
      )}

      {metrics.length > 0 && (
        <div>
          <h5 className="text-xs font-semibold text-slate-700 mb-2">Key Metric Callouts</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {metrics.map((metric: string, idx: number) => (
              <div
                key={idx}
                className="p-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 flex items-start gap-2 shadow-2xs"
              >
                <BarChart2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{metric}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {sections.length > 0 && (
        <div className="space-y-2.5">
          <h5 className="text-xs font-semibold text-slate-700">Content Flow Sections</h5>
          {sections.map((sec: any, idx: number) => (
            <div
              key={idx}
              className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-1 text-xs"
            >
              <h6 className="font-semibold text-slate-900">{sec.heading || `Section ${idx + 1}`}</h6>
              <p className="text-slate-600 leading-relaxed">{sec.content}</p>
              {sec.visual_cue && (
                <p className="text-[11px] text-emerald-700 font-medium pt-1">
                  Visual Layout Cue: {sec.visual_cue}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExecutiveSummaryViewer({ data }: { data: Record<string, any> }) {
  return (
    <div className="space-y-3.5 text-xs">
      {data.summary && (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="font-semibold text-slate-900 block mb-1 text-xs">Executive Overview</span>
          <p className="text-slate-700 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {Array.isArray(data.key_points) && data.key_points.length > 0 && (
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg">
          <span className="font-semibold text-slate-900 block mb-2 text-xs">Key Strategic Points</span>
          <ul className="space-y-1.5 list-disc list-inside text-slate-700">
            {data.key_points.map((pt: string, idx: number) => (
              <li key={idx}>{pt}</li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(data.important_findings) && data.important_findings.length > 0 && (
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg">
          <span className="font-semibold text-slate-900 block mb-2 text-xs">Important Findings</span>
          <ul className="space-y-1.5 list-disc list-inside text-slate-700">
            {data.important_findings.map((f: string, idx: number) => (
              <li key={idx}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(data.recommended_actions) && data.recommended_actions.length > 0 && (
        <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-lg">
          <span className="font-semibold text-blue-950 block mb-2 text-xs">Recommended Actions</span>
          <ul className="space-y-1.5 list-disc list-inside text-blue-900">
            {data.recommended_actions.map((act: string, idx: number) => (
              <li key={idx}>{act}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AdvisoryViewer({ data }: { data: Record<string, any> }) {
  return (
    <div className="space-y-3 text-xs">
      {data.context && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="font-semibold text-slate-900 block mb-1">Context & Advisory Purpose</span>
          <p className="text-slate-700 leading-relaxed">{data.context}</p>
        </div>
      )}

      {Array.isArray(data.key_information) && data.key_information.length > 0 && (
        <div className="p-3 bg-white border border-slate-200 rounded-lg">
          <span className="font-semibold text-slate-900 block mb-1.5">Critical Information</span>
          <ul className="space-y-1 list-disc list-inside text-slate-700">
            {data.key_information.map((item: string, idx: number) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(data.action_items) && data.action_items.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="font-semibold text-blue-950 block mb-1.5">Prescribed Action Items</span>
          <ul className="space-y-1 list-disc list-inside text-blue-900">
            {data.action_items.map((item: string, idx: number) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(data.cautions_or_notes) && data.cautions_or_notes.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <span className="font-semibold text-amber-950 block mb-1.5">Cautions & Policy Notes</span>
          <ul className="space-y-1 list-disc list-inside text-amber-900">
            {data.cautions_or_notes.map((item: string, idx: number) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function GenericStructuredViewer({ data }: { data: Record<string, any> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
      {Object.entries(data).map(([key, val]) => (
        <div key={key} className="p-3 bg-white border border-slate-200 rounded-lg">
          <span className="font-semibold text-slate-800 uppercase text-[10px] tracking-wider block mb-1">
            {key.replace(/_/g, " ")}
          </span>
          <div className="text-slate-700">
            {typeof val === "object" ? (
              <pre className="text-[11px] font-mono whitespace-pre-wrap">{JSON.stringify(val, null, 2)}</pre>
            ) : (
              String(val)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
