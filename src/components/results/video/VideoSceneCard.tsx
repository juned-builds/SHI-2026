import React, { useState } from "react";
import {
  Video,
  Mic,
  Clapperboard,
  Tv,
  Film,
  ArrowRight,
  Sparkles,
  Volume2,
  Copy,
  Check,
} from "lucide-react";
import { VideoScene } from "../../../types";

interface VideoSceneCardProps {
  key?: React.Key;
  scene: VideoScene;
  index: number;
  totalScenes: number;
}

export const VideoSceneCard: React.FC<VideoSceneCardProps> = ({
  scene,
  index,
  totalScenes,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyNarration = async () => {
    try {
      await navigator.clipboard.writeText(scene.narration);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs hover:border-slate-300 transition-all">
      {/* Scene Card Header */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200 font-mono text-xs font-bold">
            Scene {scene.sceneNumber.toString().padStart(2, "0")}
          </div>
          <h4 className="text-xs font-bold text-slate-900">
            {scene.sceneTitle || `Scene ${scene.sceneNumber}`}
          </h4>
        </div>

        <div className="flex items-center gap-2">
          {scene.timestamp && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
              ⏱️ {scene.timestamp}
            </span>
          )}

          {scene.transition && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <ArrowRight className="w-2.5 h-2.5" />
              {scene.transition}
            </span>
          )}

          <button
            type="button"
            onClick={handleCopyNarration}
            className="p-1 hover:bg-slate-200/60 rounded text-slate-500 hover:text-slate-800 transition-colors"
            title="Copy scene narration"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content Grid: Visual Direction vs Narration */}
      <div className="p-4 space-y-3 text-xs">
        {/* Visual Direction Box */}
        <div className="p-3 bg-blue-50/40 border border-blue-100 rounded-lg space-y-1.5">
          <div className="flex items-center gap-1.5 text-blue-900 font-semibold text-[11px] uppercase tracking-wide">
            <Video className="w-3.5 h-3.5 text-blue-600" />
            <span>Visual Direction & Camera Framing</span>
          </div>
          <p className="text-slate-700 leading-relaxed pl-5">
            {scene.visualDirection}
          </p>
        </div>

        {/* Voiceover Narration Box */}
        <div className="p-3 bg-purple-50/30 border border-purple-100 rounded-lg space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-purple-900 font-semibold text-[11px] uppercase tracking-wide">
              <Mic className="w-3.5 h-3.5 text-purple-600" />
              <span>Voiceover Narration (Spoken Script)</span>
            </div>
            {scene.emphasis && (
              <span className="text-[10px] text-purple-700 font-medium italic">
                Pacing: {scene.emphasis}
              </span>
            )}
          </div>
          <blockquote className="text-slate-900 font-serif italic text-xs sm:text-sm leading-relaxed pl-5 border-l-2 border-purple-400 my-1">
            "{scene.narration}"
          </blockquote>
        </div>

        {/* Lower Third / On-Screen Overlay Text */}
        {scene.onScreenText && (
          <div className="flex items-start gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg">
            <Tv className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                On-Screen Graphic / Lower-Third Overlay
              </span>
              <p className="font-mono text-[11px] font-semibold text-slate-800 mt-0.5">
                {scene.onScreenText}
              </p>
            </div>
          </div>
        )}

        {/* B-Roll Suggestions & Subtitles */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {scene.bRollSuggestions && scene.bRollSuggestions.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Film className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] text-slate-400 font-medium">B-Roll Footage:</span>
              {scene.bRollSuggestions.map((broll, bIdx) => (
                <span
                  key={bIdx}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {broll}
                </span>
              ))}
            </div>
          )}

          {scene.subtitleText && (
            <span className="text-[10px] text-slate-400 italic">
              Caption: "{scene.subtitleText}"
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
