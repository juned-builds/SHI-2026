import React, { useState } from "react";
import {
  Copy,
  Check,
  Download,
  Share2,
  Sparkles,
  Sliders,
  ThumbsUp,
  MessageSquare,
  Repeat,
  Send,
  Globe,
  Clock,
  Hash,
  FileText,
} from "lucide-react";
import { Button } from "../../ui/Button";
import {
  LinkedInStyle,
  LinkedInEmojiDensity,
  formatLinkedInPost,
  getLinkedInPostStats,
} from "../../../utils/linkedinFormatter";

export interface LinkedInPostPreviewProps {
  content: string;
  projectName?: string;
  onUpdateContent?: (newContent: string) => void;
  isEditable?: boolean;
}

export function LinkedInPostPreview({
  content,
  projectName,
  onUpdateContent,
  isEditable = true,
}: LinkedInPostPreviewProps) {
  const [selectedStyle, setSelectedStyle] = useState<LinkedInStyle>("professional");
  const [emojiDensity, setEmojiDensity] = useState<LinkedInEmojiDensity>("balanced");
  const [copied, setCopied] = useState<boolean>(false);
  const [showStyleControls, setShowStyleControls] = useState<boolean>(false);

  const stats = getLinkedInPostStats(content);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `linkedin-post-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyFormatting = (style: LinkedInStyle, density: LinkedInEmojiDensity) => {
    setSelectedStyle(style);
    setEmojiDensity(density);
    const reformatted = formatLinkedInPost(content, {
      style,
      emojiDensity: density,
    });
    if (onUpdateContent) {
      onUpdateContent(reformatted);
    }
  };

  // Render paragraphs with bold formatting and hashtags styled as blue pills/links
  const renderFormattedBody = (raw: string) => {
    const paragraphs = raw.split("\n\n");
    return paragraphs.map((para, pIdx) => {
      const lines = para.split("\n");
      return (
        <div key={pIdx} className="space-y-1">
          {lines.map((line, lIdx) => {
            const isHashtagLine = line.trim().startsWith("#") && !line.startsWith("##");

            if (isHashtagLine) {
              const tags = line.match(/#[A-Za-z0-9_]+/g) || [line];
              return (
                <div key={lIdx} className="flex flex-wrap gap-1.5 pt-2">
                  {tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[#0a66c2] hover:underline font-semibold text-xs cursor-pointer"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              );
            }

            // Highlight bullet points and headers
            const isBullet =
              line.startsWith("•") ||
              line.startsWith("-") ||
              line.startsWith("🔹") ||
              line.startsWith("📌") ||
              line.startsWith("📊") ||
              line.startsWith("⚡") ||
              line.startsWith("💡") ||
              line.startsWith("✅") ||
              line.startsWith("🚀");

            return (
              <p
                key={lIdx}
                className={`text-slate-800 text-sm leading-relaxed ${
                  isBullet ? "pl-2 font-medium" : ""
                } ${
                  line.endsWith(":") || line.startsWith("Key ") || line.startsWith("Why ")
                    ? "font-semibold text-slate-900 pt-1"
                    : ""
                }`}
              >
                {line}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Controls & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-3 flex-wrap text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 font-medium bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>{stats.wordCount} words</span>
          </span>
          <span className="inline-flex items-center gap-1 font-medium bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            <span>{stats.hashtags} hashtags</span>
          </span>
          <span className="inline-flex items-center gap-1 font-medium bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{stats.formattedReadingTime}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isEditable && onUpdateContent && (
            <button
              type="button"
              onClick={() => setShowStyleControls(!showStyleControls)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                showStyleControls
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Style Controls</span>
            </button>
          )}

          <Button
            variant="outline"
            size="sm"
            icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            onClick={handleCopy}
            className={copied ? "text-emerald-700 border-emerald-300 bg-emerald-50" : ""}
          >
            {copied ? "Copied" : "Copy Post"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={handleDownload}
            title="Download formatted text"
          >
            .txt
          </Button>
        </div>
      </div>

      {/* Style Controls Drawer */}
      {showStyleControls && (
        <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-4 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                LinkedIn Styling Engine
              </h5>
            </div>
            <span className="text-[11px] text-indigo-700 font-medium">
              Client-side Instant Reformatting • 0 API Quota
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tone / Style */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Post Voice & Structure
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {(
                  [
                    { id: "professional", label: "Professional" },
                    { id: "thought_leadership", label: "Thought Leader" },
                    { id: "storytelling", label: "Storytelling" },
                    { id: "government", label: "Gov / Public" },
                    { id: "executive", label: "Executive" },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleApplyFormatting(s.id, emojiDensity)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left border ${
                      selectedStyle === s.id
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Emoji Usage */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Emoji Density
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: "none", label: "None (Clean •)" },
                    { id: "balanced", label: "Balanced (🔹📌)" },
                    { id: "expressive", label: "Expressive (🚀💡)" },
                  ] as const
                ).map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => handleApplyFormatting(selectedStyle, e.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-center border ${
                      emojiDensity === e.id
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Realistic LinkedIn Feed Card Preview */}
      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Post Header */}
        <div className="p-4 flex items-start justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              TA
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-900 truncate">
                  TransformAI
                </span>
                <span className="text-[11px] text-slate-400 font-medium">• 1st</span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                Content Transformation Platform • {projectName || "Official Release"}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                <span>Just now</span>
                <span>•</span>
                <Globe className="w-3 h-3 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10.5px] font-semibold">
              LinkedIn
            </span>
          </div>
        </div>

        {/* Post Content Body */}
        <div className="p-4 sm:p-5 space-y-3 bg-white text-slate-900">
          {renderFormattedBody(content)}
        </div>

        {/* Feed Engagement Mock Bar */}
        <div className="px-4 py-2.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="flex -space-x-1">
              <span className="w-4 h-4 rounded-full bg-[#0a66c2] text-white text-[9px] flex items-center justify-center font-bold">
                👍
              </span>
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold">
                💡
              </span>
            </span>
            <span className="text-[11px] font-medium text-slate-600">Ready for distribution</span>
          </div>
          <span className="text-[11px] text-slate-400">{stats.charCount} characters</span>
        </div>

        {/* Action Buttons Mock Footer */}
        <div className="px-4 py-2 border-t border-slate-100 grid grid-cols-4 gap-1 text-xs text-slate-600 font-semibold bg-white">
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ThumbsUp className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Like</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Comment</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Repeat className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Repost</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-slate-50 transition-colors text-indigo-600"
          >
            <Send className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Copy Post</span>
          </button>
        </div>
      </div>
    </div>
  );
}
