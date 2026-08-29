# Module 0.5 Handoff Specification — Generation Workspace & Local AI Pipeline Preparation

**Problem Statement 26154**: Gen AI Platform for Automated Content Transformation  
**Module**: 0.5 (Generation Workspace & Local AI Pipeline Preparation)  
**Status**: Completed & Validated  
**Execution Environment**: Local-First / In-Memory (Zero cloud lock-in, zero external databases, zero backend modifications)

---

## 1. Overview & Architectural Boundaries

Module 0.5 establishes the comprehensive **Generation Workspace** and in-memory **Generation Session Contract** for SIH 26154. It forms the final review and preparation checkpoint immediately before the upcoming real AI model orchestration layer.

### Strict Boundaries Adhered:
- **No Gemini API Calls / No Real AI Yet**: No external network requests or AI endpoints are invoked in this module.
- **No Mock/Fake Output Generation**: The platform explicitly does not generate or invent fake AI articles, social posts, or summaries. It validates inputs, formats parameters, and stages the pipeline contract.
- **No Persistence / No Backend Modifications**: Zero cloud databases, zero local storage persistence, and the FastAPI backend remains completely untouched.
- **Pure In-Memory State**: All `GenerationSession` data lives strictly in transient React memory.

---

## 2. Generation Session Contract

Defined in `src/types.ts`:

```typescript
export type GenerationStatus =
  | "idle"
  | "validating"
  | "preparing"
  | "generating"
  | "completed"
  | "failed"
  | "cancelled";

export type PipelineStageStatus = "pending" | "in_progress" | "completed" | "failed";

export interface PipelineStage {
  id: string;
  title: string;
  description: string;
  status: PipelineStageStatus;
  detail?: string;
}

export interface DeliverablePipelineItem {
  deliverableId: DeliverableId;
  name: string;
  description: string;
  category: string;
  status: "queued" | "preparing" | "ready" | "failed";
  promptSchemaReady: boolean;
}

export interface GenerationSession {
  sessionId: string;
  createdAt: string;
  draft: ProjectDraft;
  config: TransformationConfig;
  status: GenerationStatus;
  currentStageIndex: number;
  stages: PipelineStage[];
  deliverablesPipeline: DeliverablePipelineItem[];
  preparedAt?: string;
  error?: string | null;
}
```

---

## 3. Implemented Workspace & Pipeline Components

| Component | Path | Description & Behavior |
|---|---|---|
| **GenerationWorkspaceView** | `src/components/pages/GenerationWorkspaceView.tsx` | Main page view at `/projects/generate`. Handles `idle`, `preparing`, `completed`, `cancelled`, and graceful empty states. |
| **GenerationSummaryCard** | `src/components/generation/GenerationSummaryCard.tsx` | Comprehensive review displaying Source document/text statistics, 6 transformation dimensions, and queued deliverables with quick "Edit" access. |
| **PipelineProgressTracker** | `src/components/generation/PipelineProgressTracker.tsx` | Visual multi-stage progress tracker with animated status indicators, active pulse states, and percentage progress bar. |
| **PipelineReadyBanner** | `src/components/generation/PipelineReadyBanner.tsx` | Post-staging status card confirming that schemas are assembled in memory and ready for future AI execution with zero data leakage. |
| **generationConstants** | `src/constants/generationConstants.ts` | Factory functions and initial pipeline stage definitions. |

---

## 4. Frontend State Flow & Navigation

```
Dashboard
   │
   ▼
/projects/new (Source Input & File Upload / Pasted Text)
   │
   ▼ (onContinue)
/projects/new/configure (Transformation Configuration Workspace)
   │
   ▼ (onContinue)
/projects/generate (Generation Workspace)
   ├── [Start Transformation] ──> Advances through 4 local staging stages:
   │                               1. Source Content Verification
   │                               2. Transformation Constraints Formulation
   │                               3. Deliverable Schemas & Prompts Assembly
   │                               4. Generation Pipeline Staged
   ├── [Cancel Preparation] ────> Aborts staging back to "cancelled" state
   ├── [Edit Source] ───────────> Returns to /projects/new (preserves state)
   ├── [Edit Configuration] ────> Returns to /projects/new/configure (preserves state)
   └── [Cancel Project] ────────> Clears in-memory draft & config -> /projects
```

---

## 5. What Is Intentionally NOT Implemented

1. **Gemini API Execution**: No API key or model calls were made; this will be connected in future modules.
2. **Fabricated Content**: No fake generated summaries, social posts, or slides are rendered.
3. **Database / Cloud Storage**: No backend or cloud databases were created or modified.
4. **Backend Modifications**: The FastAPI backend remains identical to Module 0.1 (`/api/health`).

---

## 6. How the Next AI Module Should Consume the Session

When the GenAI model integration module is implemented:
1. It will read `GenerationSession.draft` for sanitized source text.
2. It will read `GenerationSession.config` for target audience persona, tone guidelines, language localization, detail level, objective, and content style.
3. For each item in `GenerationSession.deliverablesPipeline`, it will format the prompt, invoke Gemini via server-side/local route, and stream or parse the response into structured deliverable views.
