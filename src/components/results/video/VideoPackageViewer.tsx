import React, { useState } from "react";
import {
  Film,
  FileText,
  MessageSquare,
  Sliders,
  Code2,
  AlertCircle,
  Sparkles,
  Download,
  Copy,
  Check,
} from "lucide-react";
import { VideoPackageData, VideoPackageViewMode } from "../../../types";
import {
  normalizeVideoPackageData,
  validateVideoPackage,
  generateStoryboardMarkdown,
  generateContinuousScript,
  generateSrtCaptions,
} from "../../../utils/videoPackageUtils";
import { VideoOverview } from "./VideoOverview";
import { VideoStoryboard } from "./VideoStoryboard";
import { VideoScriptView } from "./VideoScriptView";
import { VideoSubtitleView } from "./VideoSubtitleView";
import { VideoProductionNotes } from "./VideoProductionNotes";
import { downloadTextFile, sanitizeFilename } from "../../../utils/exportHelpers";

interface VideoPackageViewerProps {
  data: Record<string, any> | VideoPackageData;
  projectName?: string;
}

export function VideoPackageViewer({ data: rawData, projectName }: VideoPackageViewerProps) {
  const [activeTab, setActiveTab] = useState<VideoPackageViewMode>("storyboard");
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  // Normalize data safely
  const packageData = normalizeVideoPackageData(rawData, rawData.title || "Video Production Blueprint");
  const validation = validateVideoPackage(packageData);

  const handleCopyStoryboard = async () => {
    try {
      const md = generateStoryboardMarkdown(packageData);
      await navigator.clipboard.writeText(md);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadStoryboard = () => {
    const safeProject = sanitizeFilename(projectName || packageData.title || "video");
    const filename = `${safeProject}_storyboard.md`;
    const md = generateStoryboardMarkdown(packageData);
    downloadTextFile(filename, md);
  };

  return (
    <div className="space-y-4">
      {/* Overview Banner Card */}
      <VideoOverview data={packageData} readingStats={validation.stats} />

      {/* Validation Warnings (if any) */}
      {validation.warnings.length > 0 && (
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Quality Notice: </span>
            <span>{validation.warnings.join(" ")}</span>
          </div>
        </div>
      )}

      {/* Video Workspace Sub-Navigation Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-lg border border-slate-200/80 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("storyboard")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === "storyboard"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Film className="w-3.5 h-3.5 text-purple-600" />
            Storyboard & Scenes ({packageData.scenes.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("script")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === "script"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            Teleprompter Script
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("subtitles")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === "subtitles"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            Subtitles & Captions
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("production_notes")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === "production_notes"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-600" />
            Production Notes
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("raw_json")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === "raw_json"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-slate-600" />
            Schema JSON
          </button>
        </div>

        {/* Storyboard Export Actions (Available on Storyboard tab) */}
        {activeTab === "storyboard" && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyStoryboard}
              className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-2xs transition-colors"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Storyboard</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadStoryboard}
              className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-purple-700 shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .MD</span>
            </button>
          </div>
        )}
      </div>

      {/* Tab Panels */}
      {activeTab === "storyboard" && <VideoStoryboard data={packageData} />}
      {activeTab === "script" && <VideoScriptView data={packageData} projectName={projectName} />}
      {activeTab === "subtitles" && (
        <VideoSubtitleView data={packageData} projectName={projectName} />
      )}
      {activeTab === "production_notes" && <VideoProductionNotes data={packageData} />}
      {activeTab === "raw_json" && (
        <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[550px] scrollbar-thin shadow-inner">
          <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 mb-3 border-b border-slate-800">
            <span>Video Package Schema Data</span>
            <span>JSON Object</span>
          </div>
          <pre className="whitespace-pre">{JSON.stringify(packageData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
