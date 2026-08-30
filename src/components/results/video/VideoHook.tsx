import React, { useState } from "react";
import { Sparkles, Zap, Copy, Check } from "lucide-react";
import { VideoHook as VideoHookType } from "../../../types";

interface VideoHookProps {
  hook: VideoHookType | string;
}

export function VideoHook({ hook }: VideoHookProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const headline = typeof hook === "object" ? hook.headline : hook;
  const technique = typeof hook === "object" ? hook.technique : "Opening Hook Strategy";
  const rationale = typeof hook === "object" ? hook.rationale : null;

  if (!headline) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(headline);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50/50 border border-amber-200 rounded-xl space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center shadow-2xs">
            <Zap className="w-3 h-3" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
            Opening Hook (First 0:00 - 0:05)
          </span>
          {technique && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-200/80 text-amber-950 border border-amber-300">
              {technique}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 bg-white/80 hover:bg-white border border-amber-200 rounded-md text-[11px] font-medium text-amber-900 transition-colors shadow-2xs"
          title="Copy Hook"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-amber-700" />
              <span>Copy Hook</span>
            </>
          )}
        </button>
      </div>

      <blockquote className="text-sm font-semibold text-slate-900 italic font-serif leading-relaxed pl-3 border-l-2 border-amber-500">
        "{headline}"
      </blockquote>

      {rationale && (
        <p className="text-[11px] text-amber-900/80 pl-3">
          <span className="font-semibold">Engagement Rationale: </span>
          {rationale}
        </p>
      )}
    </div>
  );
}
