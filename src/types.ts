export type SourceType = "file" | "text" | null;

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
}
