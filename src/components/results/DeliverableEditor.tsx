import React, { useState, useEffect } from "react";
import {
  Check,
  X,
  RotateCcw,
  Save,
  Edit3,
  FileText,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { GeneratedDeliverable } from "../../types";
import { Button } from "../ui/Button";

export interface DeliverableEditorProps {
  deliverable: GeneratedDeliverable;
  onSave: (updatedContent: string) => void;
  onResetToOriginal: () => void;
  onCancel: () => void;
}

export function DeliverableEditor({
  deliverable,
  onSave,
  onResetToOriginal,
  onCancel,
}: DeliverableEditorProps) {
  const [content, setContent] = useState<string>(deliverable.content);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Sync if deliverable changes
  useEffect(() => {
    setContent(deliverable.content);
    setHasUnsavedChanges(false);
  }, [deliverable.deliverableId, deliverable.content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setHasUnsavedChanges(val !== deliverable.content);
  };

  const handleSave = () => {
    onSave(content);
    setHasUnsavedChanges(false);
  };

  const handleCancel = () => {
    setContent(deliverable.content);
    setHasUnsavedChanges(false);
    onCancel();
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const lineCount = content.split("\n").length;

  const canResetToOriginal =
    deliverable.isEdited &&
    deliverable.originalContent !== undefined &&
    deliverable.originalContent !== null;

  return (
    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
      {/* Editor Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center">
            <Edit3 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-900">
              In-Memory Content Editor
            </h4>
            <p className="text-[11px] text-slate-500">
              Refine markdown content locally. Changes are preserved in the current session.
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

      {/* Editor Textarea */}
      <div className="relative">
        <textarea
          value={content}
          onChange={handleChange}
          rows={16}
          className="w-full p-4 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs resize-y min-h-[260px]"
          placeholder="Edit markdown or text content here..."
        />
      </div>

      {/* Footer Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
        <div>
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
    </div>
  );
}
