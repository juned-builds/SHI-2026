import React, { useState, useEffect, useRef } from "react";
import {
  Check,
  X,
  RotateCcw,
  Save,
  Edit3,
  FileText,
  AlertCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import { GeneratedDeliverable } from "../../types";
import { Button } from "../ui/Button";
import { InlineRefinerPopover } from "./refiner/InlineRefinerPopover";
import { ConsistencyWarningModal } from "./diff/ConsistencyWarningModal";
import { generateConsistencyReport, ConsistencyIssue } from "../../utils/localIntelligence";

export interface DeliverableEditorProps {
  deliverable: GeneratedDeliverable;
  allDeliverables?: GeneratedDeliverable[];
  sourceText?: string;
  language?: string;
  onSave: (updatedContent: string) => void;
  onResetToOriginal: () => void;
  onCancel: () => void;
}

export function DeliverableEditor({
  deliverable,
  allDeliverables = [],
  sourceText,
  language,
  onSave,
  onResetToOriginal,
  onCancel,
}: DeliverableEditorProps) {
  const [content, setContent] = useState<string>(deliverable.content);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Selection & Refiner State
  const [selectedRange, setSelectedRange] = useState<{
    start: number;
    end: number;
    text: string;
  } | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [floatingTriggerPos, setFloatingTriggerPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isRefinerOpen, setIsRefinerOpen] = useState<boolean>(false);

  // Local Cross-Deliverable Consistency State
  const [consistencyIssues, setConsistencyIssues] = useState<ConsistencyIssue[]>([]);
  const [isConsistencyModalOpen, setIsConsistencyModalOpen] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync if deliverable changes
  useEffect(() => {
    setContent(deliverable.content);
    setHasUnsavedChanges(false);
    setIsRefinerOpen(false);
    setSelectedRange(null);
    setFloatingTriggerPos(null);
    setConsistencyIssues([]);
    setIsConsistencyModalOpen(false);
  }, [deliverable.deliverableId, deliverable.content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setHasUnsavedChanges(val !== deliverable.content);

    // Compute local consistency report against all other project deliverables
    if (allDeliverables.length > 1 && deliverable.content) {
      const report = generateConsistencyReport(
        allDeliverables.map((d) => ({
          deliverableId: d.deliverableId,
          title: d.title,
          content: d.deliverableId === deliverable.deliverableId ? val : d.content,
        })),
        deliverable.deliverableId,
        deliverable.content,
        val
      );
      setConsistencyIssues(report.issues);
    }
  };

  const handleSave = () => {
    onSave(content);
    setHasUnsavedChanges(false);
    setIsRefinerOpen(false);
    setSelectedRange(null);
    setFloatingTriggerPos(null);
  };

  const handleCancel = () => {
    setContent(deliverable.content);
    setHasUnsavedChanges(false);
    setIsRefinerOpen(false);
    setSelectedRange(null);
    setFloatingTriggerPos(null);
    onCancel();
  };

  // Handle text selection in textarea
  const handleSelectText = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end).trim();

    if (selected && selected.length >= 3) {
      setSelectedRange({ start, end, text: selected });

      // Compute bounding coordinates of textarea to position floating trigger
      const rect = textarea.getBoundingClientRect();
      // Estimate vertical offset based on line height
      const linesBefore = textarea.value.substring(0, start).split("\n").length;
      const lineHeight = 18;
      const estimatedTop = Math.min(
        rect.top + linesBefore * lineHeight - textarea.scrollTop + 10,
        rect.bottom - 40
      );

      const triggerTop = Math.max(rect.top + 10, estimatedTop);
      const triggerLeft = Math.min(rect.right - 180, window.innerWidth - 200);

      setFloatingTriggerPos({ top: triggerTop, left: triggerLeft });
    } else {
      if (!isRefinerOpen) {
        setSelectedRange(null);
        setFloatingTriggerPos(null);
      }
    }
  };

  const handleOpenRefinerFromTrigger = () => {
    if (!selectedRange) return;
    if (floatingTriggerPos) {
      setPopoverPosition({
        top: Math.min(floatingTriggerPos.top, window.innerHeight - 380),
        left: Math.max(20, floatingTriggerPos.left - 100),
      });
    } else if (textareaRef.current) {
      const rect = textareaRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: Math.min(rect.top + 40, window.innerHeight - 380),
        left: Math.min(rect.left + 50, window.innerWidth - 380),
      });
    }
    setIsRefinerOpen(true);
    setFloatingTriggerPos(null);
  };

  // Apply surgical replacement to textarea content
  const handleApplyRefinement = (originalText: string, refinedText: string) => {
    if (!selectedRange) {
      // Fallback: replace first occurrence of original text
      const newContent = content.replace(originalText, refinedText);
      setContent(newContent);
      setHasUnsavedChanges(newContent !== deliverable.content);
      setIsRefinerOpen(false);
      return;
    }

    const { start, end } = selectedRange;
    const before = content.substring(0, start);
    const after = content.substring(end);
    const newContent = before + refinedText + after;

    setContent(newContent);
    setHasUnsavedChanges(newContent !== deliverable.content);
    setIsRefinerOpen(false);
    setSelectedRange(null);
    setFloatingTriggerPos(null);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const lineCount = content.split("\n").length;

  const canResetToOriginal =
    deliverable.isEdited &&
    deliverable.originalContent !== undefined &&
    deliverable.originalContent !== null;

  return (
    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
      {/* Editor Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center">
            <Edit3 className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold text-slate-900">
                In-Memory Content Editor
              </h4>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-medium">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                AI Refiner Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Highlight any sentence or paragraph to trigger the Surgical AI Refiner.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono self-end sm:self-auto">
          <span>{lineCount} lines</span>
          <span>&bull;</span>
          <span>{wordCount} words</span>
          <span>&bull;</span>
          <span>{charCount} chars</span>
        </div>
      </div>

      {/* Editor Textarea with Refiner Overlay */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onSelect={handleSelectText}
          onMouseUp={handleSelectText}
          onKeyUp={handleSelectText}
          rows={16}
          className="w-full p-4 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs resize-y min-h-[260px]"
          placeholder="Edit markdown or text content here... Highlight text to surgically refine."
        />

        {/* Floating Trigger Button when text is selected */}
        {floatingTriggerPos && selectedRange && !isRefinerOpen && (
          <div
            style={{
              position: "fixed",
              top: floatingTriggerPos.top,
              left: floatingTriggerPos.left,
              zIndex: 40,
            }}
            className="animate-in fade-in zoom-in-95 duration-100"
          >
            <button
              type="button"
              onClick={handleOpenRefinerFromTrigger}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-semibold shadow-lg shadow-indigo-600/30 hover:scale-105 transition-all cursor-pointer border border-indigo-400"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>✨ Refine Selection</span>
            </button>
          </div>
        )}

        {/* Inline Surgical Directive Refiner Popover */}
        {isRefinerOpen && selectedRange && popoverPosition && (
          <InlineRefinerPopover
            selectedText={selectedRange.text}
            surroundingContext={content.slice(
              Math.max(0, selectedRange.start - 200),
              Math.min(content.length, selectedRange.end + 200)
            )}
            sourceText={sourceText}
            deliverableType={deliverable.title || deliverable.deliverableId}
            language={language}
            position={popoverPosition}
            onApplyRefinement={handleApplyRefinement}
            onClose={() => {
              setIsRefinerOpen(false);
              setSelectedRange(null);
              setFloatingTriggerPos(null);
            }}
          />
        )}
      </div>

      {/* Local Cross-Deliverable Consistency Alert Banner */}
      {consistencyIssues.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Consistency Alert:</strong> {consistencyIssues.length} cross-deliverable discrepancy detected (e.g. conflicting dates or numbers).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsConsistencyModalOpen(true)}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-semibold text-[11px] shrink-0 transition-colors cursor-pointer"
          >
            Review Discrepancies
          </button>
        </div>
      )}

      {/* Footer Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2">
          {canResetToOriginal && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5 text-slate-500" />}
              onClick={onResetToOriginal}
              className="text-xs text-slate-600 hover:text-slate-900"
            >
              Reset to Generated Version
            </Button>
          )}

          {selectedRange && !isRefinerOpen && (
            <button
              type="button"
              onClick={handleOpenRefinerFromTrigger}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-indigo-700 hover:bg-indigo-50 rounded-md border border-indigo-200 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-indigo-600" />
              Refine Selected Text ({selectedRange.text.length} chars)
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-xs text-slate-600"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={<Save className="w-3.5 h-3.5" />}
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className="text-xs shadow-xs"
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Consistency Warning Review Modal */}
      <ConsistencyWarningModal
        isOpen={isConsistencyModalOpen}
        issues={consistencyIssues}
        onClose={() => setIsConsistencyModalOpen(false)}
      />
    </div>
  );
}
