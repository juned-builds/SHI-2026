# Module 0.8 Handoff Document — Product Experience, Rendered Results & Local Project History

## 1. Overview
Module 0.8 upgrades the SIH 26154 platform into a complete, local-first product experience by integrating:
1. High-fidelity semantic Markdown rendering inside the Deliverable Results Workspace.
2. Local IndexedDB persistence for Projects, Generations, and Deliverable edits.
3. Multi-generation project history with independent restoration capabilities.
4. Upgraded Projects dashboard with search, status filtering, and one-click workspace restoration.
5. Persistent deliverable edits and lossless reversion to original AI-generated syntheses.

---

## 2. Persistence Architecture & Stores

The storage layer is purely in-browser and local-first via browser IndexedDB (`sih_content_transformation_db`, version 1) with an automatic in-memory fallback for restricted runtime environments.

### Object Stores
1. **`projects` store** (Key: `id`):
   - `id`: Unique stable identifier (e.g. `proj_<timestamp>_<rand>`)
   - `name`: Project display name
   - `createdAt`, `updatedAt`: ISO timestamps
   - `latestGenerationId`: Pointer to the most recent generation record
   - `sourceType`: `"file" | "text"`
   - `sourceText`: Serialized raw text content
   - `sourceMetadata`: File metadata, character count, word count, and text excerpt
   - `draft`: Sanitized, serializable `ProjectDraft` model
   - `generationCount`: Total number of transformation batches executed
   - `deliverableCount`: Total deliverables in latest generation
   - `status`: `"draft" | "in_progress" | "completed" | "failed"`

2. **`generations` store** (Key: `id`, Index: `projectId`):
   - `id`: Stable generation identifier (e.g. `gen_<timestamp>_<rand>`)
   - `projectId`: Parent project foreign key
   - `projectName`: Parent project title snapshot
   - `generationNumber`: 1-indexed generation counter within the project
   - `createdAt`, `completedAt`: ISO timestamps
   - `status`: `"completed" | "partial" | "failed"`
   - `modelUsed`: e.g. `"gemini-3.7-flash"`
   - `config`: Complete `TransformationConfig` matrix
   - `draft`: Snapshot of `ProjectDraft`
   - `deliverables`: Array of `GeneratedDeliverable` objects
   - `deliverableCount`: Number of deliverables in this generation
   - `error`: Error message if generation failed

---

## 3. Deliverable Results Workspace Markdown Rendering

- **`src/components/results/MarkdownRenderer.tsx`**:
  - Replaces raw `whitespace-pre-wrap` text dumps in Formatted Preview mode.
  - Correctly parses and renders headings (`H1`–`H4`), paragraphs, inline formatting (`**bold**`, `*italic*`, `` `code` ``), links, blockquotes, styled tables with header/body borders, and code blocks.
  - Retains existing multi-mode inspection: **Formatted Preview**, **Structured Schema Visualizer**, and **Raw JSON Inspector**.

---

## 4. Edit & Regeneration Persistence Lifecycle

- **Edit Deliverable**: Edits made via `DeliverableEditor` are saved locally and synced directly to the active generation record in IndexedDB (`updateDeliverableInGeneration`).
  - Sets `isEdited: true` and updates `lastEditedAt`.
  - The original AI synthesis is preserved in `originalContent`.
- **Reset to Generated Version**: Reverts `content` back to `originalContent`, resets `isEdited: false`, and updates the IndexedDB store (`resetDeliverableInGeneration`).
- **Single Deliverable Regeneration**: Re-executes the single deliverable through the backend API and persists the regenerated deliverable in IndexedDB without overwriting other deliverables.

---

## 5. Projects Dashboard & Generation History View

- **Projects Dashboard (`src/components/pages/ProjectsView.tsx`)**:
  - Displays all locally saved projects with word/char statistics, source badges, generation counters, deliverable counters, and status pills.
  - Live search filter across project titles, filenames, and source excerpts.
  - Tab filters for *All Projects*, *Completed*, and *Draft / Active*.
  - Project deletion with confirmation modal, removing all associated generation records safely.
- **Generation History View (`src/components/pages/ProjectHistoryModal.tsx`)**:
  - Displays all generation runs for a project sorted newest to oldest.
  - Shows generation timestamp, model used, deliverable counts, and deliverable type chips.
  - "Open Results" action immediately restores that specific generation into the Results Workspace.

---

## 6. Scope Discipline & Strict Boundaries

- **Zero Cloud Databases**: No Firestore, Supabase, PostgreSQL, MySQL, or MongoDB.
- **No External Authentication**: Local-first and entirely privacy-preserving.
- **Gemini API Key Security**: Server-side only via Express / FastAPI proxy; never exposed to browser client code.
- **Strictly Local**: All records exist solely in browser-local storage.
