import React from "react";
import { Clock, Film, Globe, MessageSquare, Target, Users, Volume2 } from "lucide-react";
import { VideoPackageData } from "../../../types";

interface VideoOverviewProps {
  data: VideoPackageData;
  readingStats?: {
    sceneCount: number;
    totalNarrationWords: number;
    formattedReadingTime: string;
  };
}

export function VideoOverview({ data, readingStats }: VideoOverviewProps) {
  return (
    <div className="p-4 sm:p-5 bg-gradient-to-br from-purple-50/70 via-indigo-50/40 to-slate-50 border border-purple-200/80 rounded-xl space-y-4">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-purple-200/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-600 text-white shadow-2xs">
              Video Blueprint
            </span>
            {data.format && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                {data.format}
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {data.title || "Video Production Package"}
          </h3>
          {data.objective && (
            <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl">
              <span className="font-semibold text-slate-800">Objective: </span>
              {data.objective}
            </p>
          )}
        </div>

        {/* Duration Badge */}
        {data.estimatedDuration && (
          <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-purple-200 rounded-lg shadow-2xs self-start md:self-auto">
            <Clock className="w-4 h-4 text-purple-600" />
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Target Duration</span>
              <span className="text-xs font-bold text-slate-800">{data.estimatedDuration}</span>
            </div>
          </div>
        )}
      </div>

      {/* Metadata Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-2.5 bg-white/90 border border-purple-100/90 rounded-lg flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <div className="overflow-hidden">
            <span className="text-[10px] text-slate-400 block">Tone</span>
            <span className="font-semibold text-slate-800 truncate block">{data.tone || "Engaging"}</span>
          </div>
        </div>

        <div className="p-2.5 bg-white/90 border border-purple-100/90 rounded-lg flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          <div className="overflow-hidden">
            <span className="text-[10px] text-slate-400 block">Target Audience</span>
            <span className="font-semibold text-slate-800 truncate block">{data.targetAudience || "General"}</span>
          </div>
        </div>

        <div className="p-2.5 bg-white/90 border border-purple-100/90 rounded-lg flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <div className="overflow-hidden">
            <span className="text-[10px] text-slate-400 block">Language</span>
            <span className="font-semibold text-slate-800 truncate block">{data.targetLanguage || "English"}</span>
          </div>
        </div>

        <div className="p-2.5 bg-white/90 border border-purple-100/90 rounded-lg flex items-center gap-2">
          <Film className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <div className="overflow-hidden">
            <span className="text-[10px] text-slate-400 block">Story Pace</span>
            <span className="font-semibold text-slate-800 truncate block">
              {readingStats ? `${readingStats.sceneCount} Scenes (${readingStats.formattedReadingTime})` : `${data.scenes?.length || 0} Scenes`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
