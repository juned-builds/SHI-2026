# Module 0.9 Handoff Document — Professional Video Package Generation Workspace

## 1. Overview
Module 0.9 elevates the "Video Package" deliverable into a production-ready, interactive video planning workspace for the SIH 26154 platform:
1. **Strongly Typed Video Package Contract**: Comprehensive schema covering title, objective, audience, language, duration, format/aspect ratio, tone, attention-grabbing opening hook, scene-by-scene storyboard, continuous spoken narration, synchronized subtitles/captions, visual directions, B-roll recommendations, transition cues, and production notes.
2. **Specialized Multi-View Video Workspace**: Dedicated sub-navigation with 5 specialized views:
   - 🎬 **Storyboard & Scenes View**: Scene-by-scene sequence with camera framing, lower-third overlays, audio emphasis, and B-roll suggestions.
   - 📜 **Teleprompter & Script View**: Continuous spoken narration reader with reading time calculator (~140 WPM), word count telemetry, and font scaling controls (A-, A, A+).
   - 💬 **Closed Captions & Subtitles View**: Synced captions timeline with one-click export for SubRip (`.srt`) and clean transcript (`.txt`).
   - 📋 **Production Guide & Direction View**: Audio cadence notes, music scoring guidelines, color palette recommendations, presenter/talent instructions, and closing Call-to-Action (CTA).
   - ⚙️ **Schema Data View**: Complete JSON data contract inspector.
3. **Upgraded Gemini Prompt & Server Normalization**: High-fidelity prompt engineering in `server/promptBuilder.ts` and automated normalization in `server/generationService.ts` to guarantee clean structured payloads and rich fallback Markdown representations.
4. **Dedicated Export & Action Suite**: Instant single-click actions to copy or download Storyboard Markdown, Teleprompter Script, SubRip captions (`.srt`), and full package JSON.
5. **Lossless Persistence & Editing**: Full compatibility with Module 0.8 IndexedDB persistence, local in-memory editing, and lossless reversion to original AI-generated syntheses.

---

## 2. Data Contract Specification

The Video Package data model is defined in `src/types.ts`:

```typescript
export interface VideoScene {
  sceneNumber: number;
  timestamp?: string;
  durationSeconds?: number;
  sceneTitle: string;
  narration: string;
  onScreenText?: string;
  visualDirection: string;
  bRollSuggestions?: string[];
  transition?: string;
  emphasis?: string;
  subtitleText?: string;
}

export interface VideoHook {
  headline: string;
  technique?: string;
  rationale?: string;
}

export interface VideoProductionNotes {
  audioPacing?: string;
  musicGenre?: string;
  colorPalette?: string;
  talentInstructions?: string;
}

export interface VideoPackageData {
  title: string;
  objective?: string;
  targetAudience?: string;
  targetLanguage?: string;
  estimatedDuration?: string;
  format?: string;
  tone?: string;
  hook?: VideoHook | string;
  scenes: VideoScene[];
  narration: string;
  subtitles: string;
  visualRecommendations?: string[] | string;
  onScreenText?: string[] | string;
  transitionNotes?: string;
  callToAction?: string;
  productionNotes?: VideoProductionNotes | string;
  validationWarnings?: string[];
}
```

---

## 3. Architecture & Modular File Suite

The Video Package workspace is organized into clean, single-responsibility components:

- **`src/types.ts`**: Core TypeScript contracts for `VideoPackageData`, `VideoScene`, `VideoHook`, and `VideoProductionNotes`.
- **`src/utils/videoPackageUtils.ts`**:
  - `normalizeVideoPackageData()`: Resilient data normalization handling camelCase and snake_case model variations.
  - `validateVideoPackage()`: Telemetry validation checks for scene counts, voiceover word counts, and estimated reading durations.
  - `generateSrtCaptions()`: Standard SubRip `.srt` subtitle file generator.
  - `generateContinuousScript()`: Formatted Teleprompter Markdown script generator.
  - `generateStoryboardMarkdown()`: Production-grade Storyboard Markdown generator.
- **`src/components/results/video/`**:
  - `VideoOverview.tsx`: Header card with title, objective, duration, aspect ratio, tone, language, and audience badges.
  - `VideoHook.tsx`: Highlighted opening hook card with headline quote, hook technique badge, and attention rationale.
  - `VideoSceneCard.tsx`: Individual scene block with visual directions, narration voiceover, lower-third overlays, B-roll pills, transitions, and quick-copy.
  - `VideoStoryboard.tsx`: Storyboard timeline with quick scene filtering and jump selector.
  - `VideoScriptView.tsx`: Teleprompter script reader with font-sizing and reading time estimation.
  - `VideoSubtitleView.tsx`: Subtitle/caption inspector with `.srt` and `.txt` format preview and downloads.
  - `VideoProductionNotes.tsx`: 4-card production guidelines grid (audio pacing, music underscore, color palette, talent instructions) plus CTA banner.
  - `VideoPackageViewer.tsx`: Master coordinator component hosting sub-navigation tabs and validation notices.
- **`src/components/results/ExportControls.tsx`**: Updated with video-aware quick export buttons (`Download .SRT`, `Download Script`).
- **`server/promptBuilder.ts`**: Upgraded prompt specifications for video packages, emphasizing natural spoken voiceover, hook-driven openings, and scene-level visual cues.
- **`server/generationService.ts`**: Video package normalization and Markdown generator for seamless cross-mode fidelity.

---

## 4. Verification & Testing

- **Compilation**: Verified via `compile_applet` and `lint_applet` with zero TypeScript errors.
- **Backwards Compatibility**: All existing Module 0.8 deliverables (Executive Summaries, Social Media posts, Advisories, Infographics, Presentation Decks) continue to operate with zero regressions.
- **Export Formats**: Validated `.md`, `.srt`, `.txt`, `.json`, and combined bundle exports.
- **Persistence**: Edits to video deliverables seamlessly save to IndexedDB and restore across sessions.
