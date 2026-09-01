export type SlideLayoutType =
  | "title_hero"
  | "key_metrics"
  | "two_column_comparison"
  | "timeline_roadmap"
  | "process_workflow"
  | "recommendations"
  | "executive_summary"
  | "standard_cards";

export interface MetricItem {
  value: string;
  label: string;
  subtext?: string;
  accentColor?: string;
}

export interface TimelineItem {
  dateOrPhase: string;
  title: string;
  description?: string;
  status?: "completed" | "active" | "upcoming";
}

export interface ProcessStepItem {
  stepNumber: number;
  title: string;
  description?: string;
  badge?: string;
}

export interface ComparisonData {
  leftHeading: string;
  leftItems: string[];
  rightHeading: string;
  rightItems: string[];
}

export interface RecommendationItem {
  priority?: "High" | "Medium" | "Strategic" | string;
  title: string;
  action: string;
  impact?: string;
}

export interface SlideData {
  slideNumber: number;
  title: string;
  subtitle?: string;
  categoryTag?: string;
  layoutType: SlideLayoutType;
  bulletPoints: string[];
  metrics?: MetricItem[];
  comparison?: ComparisonData;
  timeline?: TimelineItem[];
  processSteps?: ProcessStepItem[];
  recommendations?: RecommendationItem[];
  highlightTakeaway?: string;
  visualConcept?: string;
  speakerNotes?: string;
}

export interface PresentationDeckData {
  deckTitle: string;
  subtitle?: string;
  targetAudience?: string;
  totalSlides: number;
  theme: {
    primaryColor: string; // e.g. "1E3A8A" (Deep Navy)
    secondaryColor: string; // e.g. "0D9488" (Teal)
    accentColor: string; // e.g. "4338CA" (Indigo)
    backgroundColor: string; // e.g. "F8FAFC" (Light slate)
    cardBackground: string; // e.g. "FFFFFF"
    textColor: string; // e.g. "0F172A"
    mutedTextColor: string; // e.g. "64748B"
  };
  slides: SlideData[];
}
