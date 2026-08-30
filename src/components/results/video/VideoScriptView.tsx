import React, { useState } from "react";
import {
  Mic,
  Copy,
  Check,
  Download,
  Clock,
  FileText,
  ZoomIn,
  ZoomOut,
  Sparkles,
} from "lucide-react";
import { VideoPackageData } from "../../../types";
import {
  generateContinuousScript,
  validateVideoPackage,
} from "../../../utils/videoPackageUtils";
import { downloadTextFile, sanitizeFilename } from "../../../utils/exportHelpers";

interface VideoScriptViewProps {
  data: VideoPackageData;
  projectName?: string;
}

export function VideoScriptView({ data, projectName }: VideoScriptViewProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");

  const validation = validateVideoPackage(data);
  const { totalNarrationWords, formattedReadingTime } = validation.stats;

  const handleCopyScript = async () => {
    try {
      const fullScript = generateContinuousScript(data);
      await navigator.clipboard.writeText(fullScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // ignore
    }
  };

  const handleDownloadScript = () => {
    const safeProject = sanitizeFilename(projectName || data.title || "video");
    const filename = `${safeProject}_teleprompter_script.md`;
    const fullScript = generateContinuousScript(data);
    downloadTextFile(filename, fullScript);
  };

  const fontSizeClass = {
    sm: "text-xs leading-relaxed",
    base: "text-sm leading-relaxed",
    lg: "text-base leading-loose",
  }[fontSize];

  return (
    <div className="space-y-4">
      {/* Teleprompter Header Toolbar */}
      <div className="p-3.5 bg-slate-900 text-white rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-wide text-purple-200 uppercase">
              Teleprompter & Narration Script
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-400" />
                {totalNarrationWords} words
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 text-purple-300 font-medium">
                <Clock className="w-3 h-3 text-purple-400" />
                Est. Voiceover: ~{formattedReadingTime} (@ 140 wpm)
              </span>
            </div>
          </div>
        </div>

        {/* Reader Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setFontSize("sm")}
              className={`px-2 py-1 text-[10px] rounded font-medium ${
                fontSize === "sm" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
              title="Small font"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSize("base")}
              className={`px-2 py-1 text-[10px] rounded font-medium ${
                fontSize === "base" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
              title="Medium font"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize("lg")}
              className={`px-2 py-1 text-[10px] rounded font-medium ${
                fontSize === "lg" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
              title="Large font"
            >
              A+
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyScript}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition-colors shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Script</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadScript}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-medium text-white transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .MD</span>
          </button>
        </div>
      </div>

      {/* Script Reader Body */}
      <div className="bg-white p-6 border border-slate-200/90 rounded-xl shadow-2xs space-y-6">
        {/* Hook Highlight */}
        {data.hook && (
          <div className="p-4 bg-amber-50/60 border-l-4 border-amber-500 rounded-r-lg space-y-1">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">
              🎯 Opening Hook (0:00 - 0:05)
            </span>
            <p className={`${fontSizeClass} font-serif italic text-slate-900 font-medium`}>
              "{typeof data.hook === "object" ? data.hook.headline : data.hook}"
            </p>
          </div>
        )}

        {/* Scene-by-Scene Script Blocks */}
        <div className="space-y-6">
          {data.scenes?.map((scene, idx) => (
            <div
              key={scene.sceneNumber || idx}
              className="pb-5 border-b border-slate-100 last:border-0 space-y-2"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span className="font-bold text-purple-700">
                  SCENE {scene.sceneNumber.toString().padStart(2, "0")} — {scene.sceneTitle}
                </span>
                {scene.timestamp && (
                  <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                    {scene.timestamp}
                  </span>
                )}
              </div>

              {scene.emphasis && (
                <p className="text-[11px] text-indigo-700 italic font-medium">
                  [Delivery note: {scene.emphasis}]
                </p>
              )}

              <p className={`${fontSizeClass} font-serif text-slate-900 leading-relaxed`}>
                "{scene.narration}"
              </p>

              {scene.onScreenText && (
                <div className="text-[11px] text-slate-500 font-mono pt-1">
                  📺 Visual graphic: <span className="text-slate-700 font-semibold">{scene.onScreenText}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Closing CTA */}
        {data.callToAction && (
          <div className="p-4 bg-purple-50/60 border-l-4 border-purple-600 rounded-r-lg space-y-1 mt-6">
            <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wide">
              📣 Closing Call to Action
            </span>
            <p className={`${fontSizeClass} font-serif italic text-purple-950 font-medium`}>
              "{data.callToAction}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
