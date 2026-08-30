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

export interface DeliverableMeta {
  id: DeliverableId;
  name: string;
  description: string;
  category: "briefing" | "social" | "advisory" | "visual" | "multimedia";
  badgeLabel?: string;
}

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

export interface GeneratedDeliverable {
  deliverableId: DeliverableId;
  title: string;
  content: string;
  structuredData?: Record<string, any> | null;
  status: "completed" | "failed";
  error?: string | null;
  isEdited?: boolean;
  originalContent?: string;
  originalStructuredData?: Record<string, any> | null;
  generatedAt?: string;
  lastEditedAt?: string;
}

export type DeliverableDisplayMode = "preview" | "structured" | "raw_json";

export interface GenerationApiResponse {
  success: boolean;
  sessionId: string;
  status: "completed" | "partial" | "failed";
  model?: string | null;
  deliverables: GeneratedDeliverable[];
  error?: string | null;
  generatedAt: string;
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
  generatedDeliverables?: GeneratedDeliverable[];
  modelUsed?: string;
  preparedAt?: string;
  completedAt?: string;
  error?: string | null;
}
