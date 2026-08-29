# Module 0.4 Handoff Specification — Transformation Configuration Workspace

**Problem Statement 26154**: Gen AI Platform for Automated Content Transformation  
**Module**: 0.4 (Transformation Configuration Workspace)  
**Status**: Completed & Validated  
**Execution Environment**: Local-First / In-Memory (Zero cloud lock-in, zero external databases, zero backend modifications)

---

## 1. Overview & Architectural Boundaries

Module 0.4 establishes the multi-dimensional transformation configuration workspace for SIH 26154. It empowers users to define how a single source document or text payload should be synthesized into one or more multimodal deliverables.

### Strict Boundaries Adhered:
- **Frontend-Only**: All configuration parameters reside strictly in React state in memory (`TransformationConfig`).
- **No AI Execution**: No Gemini API or OpenAI API calls are made; no simulated or fake generation occurs.
- **No Persistence / No Backend Calls**: Zero cloud databases, zero local storage, and the FastAPI backend remains completely untouched.
- **Multiple Output Mapping**: Single source + single configuration = multi-deliverable generation queue.

---

## 2. Configuration State Model

Defined in `src/types.ts`:

```typescript
export type AudienceType =
  | "general_public"
  | "government_officials"
  | "executives"
  | "technical_professionals"
  | "students_learners"
  | "media_journalists"
  | "internal_organization"
  | "custom";

export type ToneType =
  | "professional"
  | "formal"
  | "informative"
  | "conversational"
  | "persuasive"
  | "urgent"
  | "neutral";

export type LanguageType =
  | "english"
  | "hindi"
  | "marathi"
  | "tamil"
  | "telugu"
  | "bengali"
  | "gujarati"
  | "kannada"
  | "malayalam"
  | "other";

export type DetailLevelType = "concise" | "standard" | "detailed" | "comprehensive";

export type ObjectiveType =
  | "inform"
  | "educate"
  | "summarize"
  | "alert_advise"
  | "persuade"
  | "explain"
  | "promote_engage";

export type ContentStyleType =
  | "executive"
  | "news_editorial"
  | "technical"
  | "educational"
  | "social_media"
  | "public_advisory"
  | "storytelling"
  | "minimal_direct";

export type DeliverableId =
  | "executive_summary"
  | "linkedin_post"
  | "twitter_post"
  | "advisory"
  | "infographic"
  | "presentation"
  | "video_package";

export interface TransformationConfig {
  audience: AudienceType | null;
  customAudience: string;
  tone: ToneType | null;
  language: LanguageType | null;
  customLanguage: string;
  detailLevel: DetailLevelType | null;
  objective: ObjectiveType | null;
  contentStyle: ContentStyleType | null;
  deliverables: DeliverableId[];
}

export interface TransformationSession {
  draft: ProjectDraft;
  config: TransformationConfig;
}
```

---

## 3. Implemented Sections & Deliverable Matrix

| Section | UI Control | Options / Behavior |
|---|---|---|
| **Compact Source Banner** | Summary Header | Displays source project name, classification (PDF/Word/Text), size/word metrics, and "Edit Source" navigation. |
| **Target Audience** | Single-select Grid | 8 options including custom audience text input field with validation. |
| **Communication Tone** | Single-select Grid | 7 distinct tones (Professional, Formal, Informative, Conversational, Persuasive, Urgent, Neutral). |
| **Target Language** | Multi-chip Selector | 9 Indian & global languages + "Other" with custom language input. |
| **Detail Level** | Single-select Grid | 4 density levels (Concise, Standard, Detailed, Comprehensive). |
| **Communication Objective** | Single-select Grid | 7 strategic goals (Inform, Educate, Summarize, Alert/Advise, Persuade, Explain, Promote/Engage). |
| **Content Style** | Single-select Grid | 8 editorial archetypes (Executive, News/Editorial, Technical, Educational, Social Media, Public Advisory, Storytelling, Minimal/Direct). |
| **Deliverable Matrix** | Multi-select Grid | 7 deliverables: Executive Summary, LinkedIn Post, Twitter/X Post, Advisory, Infographic, Presentation, Video Package with live selection counter and Select/Deselect All. |
| **Transformation Summary** | Live Review Card | Compact overview of all 7 configuration dimensions + deliverable chips. |

---

## 4. Navigation & Flow Lifecycle

```
Dashboard
   │
   ▼
/projects/new (Source Input & File Upload / Pasted Text)
   │
   ▼ (onContinue)
/projects/new/configure (Transformation Configuration Workspace)
   │ ◄─── (Edit Source) ───┐
   │                       │
   ▼ (onContinue)          │
/projects/generate (Ready to Generate Placeholder)
   │                       │
   └─── (Edit Config) ─────┘
```

---

## 5. Handoff Contract for Module 0.5 (AI Pipeline)

When Module 0.5 is implemented, it will receive the `TransformationSession` object containing:
1. `draft`: Sanitized source content, raw text or parsed file metadata.
2. `config`: Exact audience, tone, language, detail, objective, style, and array of selected `deliverables`.
3. The prompt engineering pipeline will formulate dedicated system instructions and schema requirements for each selected deliverable from the matrix.
