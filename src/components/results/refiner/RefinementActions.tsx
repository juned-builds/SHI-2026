import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  Users,
  Briefcase,
  List,
  Minimize2,
  ArrowRight,
  Send,
  Loader2,
} from "lucide-react";

export interface RefinementActionItem {
  id: string;
  label: string;
  description: string;
  instruction: string;
  icon: React.ReactNode;
}

export const REFINEMENT_QUICK_ACTIONS: RefinementActionItem[] = [
  {
    id: "simplify",
    label: "Simplify",
    description: "Simpler, clearer language preserving all meaning",
    instruction: "Rewrite the selected text in simpler language while preserving its meaning.",
    icon: <Sparkles className="w-3.5 h-3.5 text-indigo-600" />,
  },
  {
    id: "make_punchier",
    label: "Make Punchier",
    description: "Concise, direct, and impactful",
    instruction: "Make the selected text more concise, direct, and impactful while preserving all factual information.",
    icon: <Zap className="w-3.5 h-3.5 text-amber-600" />,
  },
  {
    id: "citizen_friendly",
    label: "Citizen-Friendly",
    description: "Accessible, jargon-free public communication",
    instruction: "Rewrite the selected text so that an ordinary citizen can understand it easily. Remove unnecessary bureaucratic jargon.",
    icon: <Users className="w-3.5 h-3.5 text-emerald-600" />,
  },
  {
    id: "professional",
    label: "Professional",
    description: "Polished executive communication style",
    instruction: "Rewrite the selected text in a polished professional communication style while preserving meaning and factual accuracy.",
    icon: <Briefcase className="w-3.5 h-3.5 text-blue-600" />,
  },
  {
    id: "convert_to_bullets",
    label: "Convert to Bullets",
    description: "Concise, logically ordered bullet points",
    instruction: "Convert the selected content into concise, logically ordered bullet points without losing important information.",
    icon: <List className="w-3.5 h-3.5 text-purple-600" />,
  },
  {
    id: "shorten",
    label: "Shorten",
    description: "Reduce length preserving all facts & metrics",
    instruction: "Reduce the length of the selected content while preserving all essential facts, numbers, dates, names, and meaning.",
    icon: <Minimize2 className="w-3.5 h-3.5 text-rose-600" />,
  },
];

export interface RefinementActionsProps {
  isLoading: boolean;
  onSelectAction: (instruction: string, actionLabel: string) => void;
}

export function RefinementActions({ isLoading, onSelectAction }: RefinementActionsProps) {
  const [customInstruction, setCustomInstruction] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInstruction.trim() || isLoading) return;
    onSelectAction(customInstruction.trim(), "Custom Instruction");
  };

  return (
    <div className="space-y-2.5">
      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {REFINEMENT_QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            disabled={isLoading}
            onClick={() => onSelectAction(action.instruction, action.label)}
            className="flex items-center gap-2 p-2 rounded-lg text-left bg-slate-50/80 hover:bg-indigo-50/80 hover:border-indigo-200 border border-slate-200/80 transition-all text-xs text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          >
            <div className="p-1 rounded-md bg-white border border-slate-200/60 shadow-2xs shrink-0 group-hover:border-indigo-200">
              {action.icon}
            </div>
            <div className="min-w-0">
              <span className="font-semibold block truncate text-[11.5px] group-hover:text-indigo-950">
                {action.label}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Custom Instruction Input */}
      {!showCustomInput ? (
        <button
          type="button"
          disabled={isLoading}
          onClick={() => setShowCustomInput(true)}
          className="w-full py-1.5 px-2.5 text-left text-[11px] font-medium text-slate-600 hover:text-indigo-700 bg-slate-100/70 hover:bg-slate-100 rounded-lg border border-dashed border-slate-300 flex items-center justify-between transition-all cursor-pointer disabled:opacity-50"
        >
          <span>✎ Custom instruction...</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
        </button>
      ) : (
        <form onSubmit={handleCustomSubmit} className="space-y-1.5 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              autoFocus
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="e.g. Translate to simpler bulleted terms..."
              disabled={isLoading}
              className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1.5 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!customInstruction.trim() || isLoading}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors cursor-pointer shrink-0 shadow-2xs"
              title="Apply custom refinement"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
