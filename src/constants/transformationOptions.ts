import {
  AudienceType,
  ToneType,
  LanguageType,
  DetailLevelType,
  ObjectiveType,
  ContentStyleType,
  DeliverableId,
  DeliverableMeta,
  TransformationConfig,
} from "../types";

export interface OptionItem<T> {
  value: T;
  label: string;
  description?: string;
  badge?: string;
}

export const AUDIENCE_OPTIONS: OptionItem<AudienceType>[] = [
  {
    value: "general_public",
    label: "General Public",
    description: "Broad citizen audience with accessible, jargon-free phrasing",
  },
  {
    value: "government_officials",
    label: "Government Officials",
    description: "Policy makers, civil servants, and administrative authorities",
  },
  {
    value: "executives",
    label: "Executives / Decision Makers",
    description: "C-suite leadership, enterprise directors, and board members",
  },
  {
    value: "technical_professionals",
    label: "Technical Professionals",
    description: "Engineers, researchers, architects, and domain practitioners",
  },
  {
    value: "students_learners",
    label: "Students / Learners",
    description: "Academic clarity, conceptual breakdowns, and instructional flow",
  },
  {
    value: "media_journalists",
    label: "Media / Journalists",
    description: "Press outlets, reporters, and media communications",
  },
  {
    value: "internal_organization",
    label: "Internal Organization",
    description: "Employees, internal working groups, and departmental staff",
  },
  {
    value: "custom",
    label: "Custom",
    description: "Define a tailored audience persona or demographic",
  },
];

export const TONE_OPTIONS: OptionItem<ToneType>[] = [
  {
    value: "professional",
    label: "Professional",
    description: "Balanced, polished, workplace-standard delivery",
  },
  {
    value: "formal",
    label: "Formal",
    description: "Diplomatic, official, and institutional tone",
  },
  {
    value: "informative",
    label: "Informative",
    description: "Clear, neutral, and fact-focused exposition",
  },
  {
    value: "conversational",
    label: "Conversational",
    description: "Approachable, engaging, and easy to read",
  },
  {
    value: "persuasive",
    label: "Persuasive",
    description: "Compelling narrative driving action and alignment",
  },
  {
    value: "urgent",
    label: "Urgent",
    description: "Time-sensitive guidance, emergency alerts, or safety notices",
  },
  {
    value: "neutral",
    label: "Neutral",
    description: "Unbiased, objective, and matter-of-fact",
  },
];

export const LANGUAGE_OPTIONS: OptionItem<LanguageType>[] = [
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi (हिन्दी)" },
  { value: "marathi", label: "Marathi (मराठी)" },
  { value: "tamil", label: "Tamil (தமிழ்)" },
  { value: "telugu", label: "Telugu (తెలుగు)" },
  { value: "bengali", label: "Bengali (বাংলা)" },
  { value: "gujarati", label: "Gujarati (ગુજરાતી)" },
  { value: "kannada", label: "Kannada (ಕನ್ನಡ)" },
  { value: "malayalam", label: "Malayalam (മലയാളം)" },
  { value: "other", label: "Other Language" },
];

export const DETAIL_LEVEL_OPTIONS: OptionItem<DetailLevelType>[] = [
  {
    value: "concise",
    label: "Concise",
    description: "Key bullet points, core highlights, quick 1-2 min scan",
  },
  {
    value: "standard",
    label: "Standard",
    description: "Balanced depth with essential context for general review",
  },
  {
    value: "detailed",
    label: "Detailed",
    description: "Thorough breakdown, supporting rationale, and nuances",
  },
  {
    value: "comprehensive",
    label: "Comprehensive",
    description: "Exhaustive exploration, complete background, and deep appendices",
  },
];

export const OBJECTIVE_OPTIONS: OptionItem<ObjectiveType>[] = [
  {
    value: "inform",
    label: "Inform",
    description: "Deliver factual, transparent information clearly and accurately",
  },
  {
    value: "educate",
    label: "Educate",
    description: "Build foundational understanding with step-by-step context",
  },
  {
    value: "summarize",
    label: "Summarize",
    description: "Extract core takeaways and synthesize critical highlights",
  },
  {
    value: "alert_advise",
    label: "Alert / Advise",
    description: "Communicate essential guidance, warnings, or immediate action items",
  },
  {
    value: "persuade",
    label: "Persuade",
    description: "Influence stakeholder decisions and encourage strategic alignment",
  },
  {
    value: "explain",
    label: "Explain",
    description: "Demystify complex workflows, mechanisms, or domain logic",
  },
  {
    value: "promote_engage",
    label: "Promote / Engage",
    description: "Drive public engagement, awareness, and community interest",
  },
];

export const CONTENT_STYLE_OPTIONS: OptionItem<ContentStyleType>[] = [
  {
    value: "executive",
    label: "Executive",
    description: "High-level strategic briefing with decision points and metrics",
  },
  {
    value: "news_editorial",
    label: "News / Editorial",
    description: "Journalistic inverted pyramid structure with strong headlines",
  },
  {
    value: "technical",
    label: "Technical",
    description: "Precise terminology, structured specifications, and logic",
  },
  {
    value: "educational",
    label: "Educational",
    description: "Modular explanations, illustrative analogies, and summaries",
  },
  {
    value: "social_media",
    label: "Social Media",
    description: "Hook-driven, snackable formatting with hashtags and callouts",
  },
  {
    value: "public_advisory",
    label: "Public Advisory",
    description: "Direct citizen-oriented instructions, FAQs, and action tables",
  },
  {
    value: "storytelling",
    label: "Storytelling",
    description: "Narrative arc connecting real-world challenges to solutions",
  },
  {
    value: "minimal_direct",
    label: "Minimal / Direct",
    description: "Ultra-lean, zero filler, essential takeaways only",
  },
];

export const DELIVERABLES_CATALOG: DeliverableMeta[] = [
  {
    id: "executive_summary",
    name: "Executive Summary",
    description: "Concise briefing of the key information and decisions.",
    category: "briefing",
    badgeLabel: "Decision Brief",
  },
  {
    id: "linkedin_post",
    name: "LinkedIn Post",
    description: "Professional social post optimized for LinkedIn.",
    category: "social",
    badgeLabel: "Thought Leadership",
  },
  {
    id: "twitter_post",
    name: "Twitter/X Post",
    description: "Concise post optimized for short-form social communication.",
    category: "social",
    badgeLabel: "Micro-Content",
  },
  {
    id: "advisory",
    name: "Advisory",
    description: "Action-oriented advisory for communicating important guidance or alerts.",
    category: "advisory",
    badgeLabel: "Official Bulletin",
  },
  {
    id: "infographic",
    name: "Infographic",
    description: "Structured visual content plan with key facts, sections and visual recommendations.",
    category: "visual",
    badgeLabel: "Visual Asset Plan",
  },
  {
    id: "presentation",
    name: "Presentation",
    description: "Slide-by-slide presentation structure with content and speaker notes.",
    category: "visual",
    badgeLabel: "Slide Deck Outline",
  },
  {
    id: "video_package",
    name: "Video Package",
    description: "Script, storyboard, scenes, narration, subtitles and visual recommendations.",
    category: "multimedia",
    badgeLabel: "Production Script",
  },
];

export const INITIAL_TRANSFORMATION_CONFIG: TransformationConfig = {
  audience: "general_public",
  customAudience: "",
  tone: "professional",
  language: "english",
  customLanguage: "",
  detailLevel: "standard",
  objective: "inform",
  contentStyle: "executive",
  deliverables: ["executive_summary"],
};

export const EMPTY_TRANSFORMATION_CONFIG: TransformationConfig = {
  audience: null,
  customAudience: "",
  tone: null,
  language: null,
  customLanguage: "",
  detailLevel: null,
  objective: null,
  contentStyle: null,
  deliverables: [],
};
