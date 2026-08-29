# Module 0.3 Handoff Specification — Project Creation & Source Ingestion

**Problem Statement 26154**: Gen AI Platform for Automated Content Transformation  
**Module**: 0.3 (0.3A & 0.3B)  
**Status**: Completed & Validated  
**Execution Environment**: Local-First / In-Memory (Zero cloud lock-in, zero external databases)

---

## 1. Overview & Purpose

Module 0.3 establishes the frontend source ingestion workflow for SIH 26154. It provides users with a distraction-free interface to create a project draft and provide source content via either:
1. **Document / Media File Upload** (PDF, Word DOCX/DOC, Plain Text/Markdown, Images, Audio/Video media)
2. **Raw Pasted Text** (Articles, meeting notes, transcripts, or research excerpts)

It culminates in the `/projects/new/configure` source summary screen, which serves as the deterministic handoff point for **Module 0.4: Transformation Configuration (Audience, Tone, Objectives, and Deliverable Matrix)**.

---

## 2. In-Memory Project Draft Contract

The client-side `ProjectDraft` interface is defined in `src/types.ts`:

```typescript
export type SourceType = "file" | "text";

export type FileCategory = "pdf" | "docx" | "text" | "image" | "video" | "other";

export interface SourceFileMetadata {
  file: File;
  name: string;
  size: number;
  type: string;
  formattedSize: string;
  category: FileCategory;
}

export interface ProjectDraft {
  name: string;
  sourceType: SourceType;
  sourceFile: SourceFileMetadata | null;
  sourceText: string;
  charCount: number;
  wordCount: number;
  isReady: boolean;
}
```

### In-Memory Lifecycle Rules:
- **No Local Storage / No Databases**: Draft state resides strictly in React state in memory (`App.tsx`).
- **Single Source Integrity**: When submitting a draft, `sourceType` is strictly either `"file"` or `"text"`, never ambiguous.
- **Refresh Behavior**: Page refresh gracefully resets memory state without throwing errors, showing a friendly "No source content found" state on the configuration screen with a one-click CTA to start a new project.
- **Cancellation**: Explicit cancel actions discard the in-memory draft (`setProjectDraft(null)`) and safely return the user to the projects list.

---

## 3. Workflow & Navigation Routes

| Route | View Component | Description |
|---|---|---|
| `/projects` | `ProjectsView` | Projects listing with primary CTA to create a new project. |
| `/projects/new` | `NewProjectView` | Main workspace for entering project name and uploading a file or pasting text. |
| `/projects/new/configure` | `ConfigurePlaceholderView` | Clean, read-only summary screen verifying source readiness for Module 0.4. |

---

## 4. Source Ingestion Validation Rules

1. **File Source**:
   - Max file size: 50MB (client-side validation via `src/utils/fileValidation.ts`).
   - Supported extensions: `.pdf`, `.docx`, `.doc`, `.txt`, `.md`, `.rtf`, `.jpg`, `.jpeg`, `.png`, `.webp`, `.mp4`, `.mp3`, `.wav`, `.m4a`.
   - Category detection: PDF, Word document, Text, Image, Media.
   - Selected file display includes file name, size, category tag, and one-click remove action.

2. **Text Source**:
   - Non-whitespace validation required before submission.
   - Dynamic real-time character count and word count feedback.
   - One-click clear content action.

3. **Active Mode Switching**:
   - The user switches between **Upload File** and **Paste Text** via segmented controls.
   - The active tab dictates the source mode for validation and submission.
   - If content exists on the inactive tab, informative indicators clarify which mode will be used.

---

## 5. Handoff Contract for Module 0.4

When Module 0.4 is implemented, it will consume the `ProjectDraft` passed from `App.tsx` and render the interactive configuration workspace on `/projects/new/configure`:
- Target audience selection (Executive, Technical, General Public, Students, etc.)
- Tone selection (Formal, Conversational, Urgent, Educational, etc.)
- Communication objective definition (Inform, Persuade, Instruct, Summarize)
- Deliverable matrix selection (Executive Brief, Slide Deck, Social Post, Infographic, Script)
- AI model parameter customization (Gemini 2.5 Flash / Pro, output length, detail level)
