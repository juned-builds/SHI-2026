import React, { useState } from "react";
import { MessageSquare, Copy, Check, Download, FileCode, FileText } from "lucide-react";
import { VideoPackageData } from "../../../types";
import { generateSrtCaptions } from "../../../utils/videoPackageUtils";
import { downloadTextFile, sanitizeFilename } from "../../../utils/exportHelpers";

interface VideoSubtitleViewProps {
  data: VideoPackageData;
  projectName?: string;
}

export function VideoSubtitleView({ data, projectName }: VideoSubtitleViewProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [subtitleFormat, setSubtitleFormat] = useState<"srt" | "text">("srt");

  const srtContent = generateSrtCaptions(data);
  const textContent =
    data.subtitles ||
    data.scenes
      ?.map((s) => `[${s.timestamp || `Scene ${s.sceneNumber}`}] ${s.subtitleText || s.narration}`)
      .join("\n\n") ||
    "";

  const activeContent = subtitleFormat === "srt" ? srtContent : textContent;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    const safeProject = sanitizeFilename(projectName || data.title || "video");
    const extension = subtitleFormat === "srt" ? "srt" : "txt";
    const filename = `${safeProject}_captions.${extension}`;
    downloadTextFile(filename, activeContent);
  };

  return (
    <div className="space-y-4">
      {/* Subtitles Header Toolbar */}
      <div className="p-3.5 bg-slate-900 text-white rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-wide text-emerald-200 uppercase">
              Closed Captions & Subtitles
            </h4>
            <p className="text-[11px] text-slate-400">
              Synchronized caption lines formatted for video editors, YouTube, and player overlays.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setSubtitleFormat("srt")}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded font-medium ${
                subtitleFormat === "srt"
                  ? "bg-emerald-600 text-white shadow-2xs font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileCode className="w-3 h-3" />
              SubRip (.SRT)
            </button>
            <button
              type="button"
              onClick={() => setSubtitleFormat("text")}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded font-medium ${
                subtitleFormat === "text"
                  ? "bg-emerald-600 text-white shadow-2xs font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-3 h-3" />
              Clean Transcript
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
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
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-medium text-white transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .{subtitleFormat === "srt" ? "SRT" : "TXT"}</span>
          </button>
        </div>
      </div>

      {/* Subtitles Content Block */}
      <div className="bg-slate-950 text-emerald-400 p-5 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto max-h-[500px] scrollbar-thin shadow-inner">
        <div className="flex items-center justify-between text-[11px] text-slate-500 pb-2 mb-3 border-b border-slate-800">
          <span>Format: {subtitleFormat === "srt" ? "SubRip Subtitle Specification (UTF-8)" : "Sequential Transcript"}</span>
          <span>Target Language: {data.targetLanguage || "English"}</span>
        </div>
        <pre className="whitespace-pre font-mono leading-relaxed">{activeContent}</pre>
      </div>
    </div>
  );
}
