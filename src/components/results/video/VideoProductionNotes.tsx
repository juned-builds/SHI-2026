import React from "react";
import {
  Sliders,
  Music,
  Palette,
  UserCheck,
  Eye,
  Tv,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Megaphone,
} from "lucide-react";
import { VideoPackageData } from "../../../types";

interface VideoProductionNotesProps {
  data: VideoPackageData;
}

export function VideoProductionNotes({ data }: VideoProductionNotesProps) {
  const prodNotes =
    typeof data.productionNotes === "object" && data.productionNotes !== null
      ? data.productionNotes
      : null;

  const visualRecs = Array.isArray(data.visualRecommendations)
    ? data.visualRecommendations
    : data.visualRecommendations
    ? [String(data.visualRecommendations)]
    : [];

  const onScreenTexts = Array.isArray(data.onScreenText)
    ? data.onScreenText
    : data.onScreenText
    ? [String(data.onScreenText)]
    : [];

  return (
    <div className="space-y-4">
      {/* 4-Card Production Guidelines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
        {/* Audio & Pacing */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold">
            <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <span>Audio Cadence & Voiceover Pacing</span>
          </div>
          <p className="text-slate-700 leading-relaxed">
            {prodNotes?.audioPacing ||
              "Natural conversational tempo (130-145 WPM). Emphasize key statistics and pause momentarily after scene transitions."}
          </p>
        </div>

        {/* Music & Sound Design */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold">
            <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Music className="w-3.5 h-3.5" />
            </div>
            <span>Soundtrack & Audio Mood</span>
          </div>
          <p className="text-slate-700 leading-relaxed">
            {prodNotes?.musicGenre ||
              "Subtle, uplifting modern corporate electronic score with gentle acoustic accents. Audio ducked at -18dB during voiceover."}
          </p>
        </div>

        {/* Visual Palette & Styling */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold">
            <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center">
              <Palette className="w-3.5 h-3.5" />
            </div>
            <span>Visual Theme & Color Palette</span>
          </div>
          <p className="text-slate-700 leading-relaxed">
            {prodNotes?.colorPalette ||
              "High-contrast color scheme (60% slate neutral, 30% deep navy, 10% vivid purple/cyan accents for callouts)."}
          </p>
        </div>

        {/* Talent & Delivery Guidance */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold">
            <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <span>Talent & Presenter Delivery</span>
          </div>
          <p className="text-slate-700 leading-relaxed">
            {prodNotes?.talentInstructions ||
              "Confident, direct eye-contact with lens. Maintain professional yet accessible energy with natural hand gestures."}
          </p>
        </div>
      </div>

      {/* Visual Recommendations */}
      {visualRecs.length > 0 && (
        <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Eye className="w-4 h-4 text-purple-600" />
            <span>Motion Graphics & Visual Layout Guidance</span>
          </div>
          <ul className="space-y-1.5 list-disc list-inside text-slate-700 leading-relaxed">
            {visualRecs.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* On-Screen Text Summary */}
      {onScreenTexts.length > 0 && (
        <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Tv className="w-4 h-4 text-blue-600" />
            <span>Key On-Screen Graphics & Stat Callouts</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {onScreenTexts.map((text, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px] shadow-2xs"
              >
                {text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Transition & Flow Guidance */}
      {data.transitionNotes && (
        <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <ArrowRight className="w-4 h-4 text-indigo-600" />
            <span>Pacing & Scene Continuity Notes</span>
          </div>
          <p className="text-slate-700 leading-relaxed">{data.transitionNotes}</p>
        </div>
      )}

      {/* Call to Action Card */}
      {data.callToAction && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-xl shadow-md space-y-2">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-purple-200" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-200">
              Closing Call to Action (CTA)
            </span>
          </div>
          <p className="text-sm sm:text-base font-bold font-serif leading-snug">
            "{data.callToAction}"
          </p>
        </div>
      )}
    </div>
  );
}
