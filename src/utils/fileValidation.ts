import { FileCategory, SourceFileMetadata } from "../types";

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
export const MAX_FILE_SIZE_LABEL = "50 MB";

const SUPPORTED_EXTENSIONS = [
  // Document
  ".pdf",
  ".docx",
  ".doc",
  ".txt",
  ".md",
  ".rtf",
  // Image
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".svg",
  // Video
  ".mp4",
  ".mov",
  ".webm",
  ".mkv",
];

const SUPPORTED_MIME_PREFIXES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "text/markdown",
  "text/rtf",
  "image/",
  "video/",
];

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileCategory(file: File): FileCategory {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (name.endsWith(".pdf") || type.includes("pdf")) return "pdf";
  if (name.endsWith(".docx") || name.endsWith(".doc") || type.includes("word") || type.includes("officedocument")) return "docx";
  if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".rtf") || type.startsWith("text/")) return "text";
  if (type.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(name)) return "image";
  if (type.startsWith("video/") || /\.(mp4|mov|webm|mkv)$/i.test(name)) return "video";

  return "other";
}

export function getFileTypeLabel(category: FileCategory, file: File): string {
  const ext = file.name.split(".").pop()?.toUpperCase();
  switch (category) {
    case "pdf":
      return "PDF Document";
    case "docx":
      return ext ? `${ext} Document` : "Word Document";
    case "text":
      return ext === "MD" ? "Markdown Document" : "Plain Text Document";
    case "image":
      return ext ? `${ext} Image` : "Image File";
    case "video":
      return ext ? `${ext} Video` : "Video File";
    default:
      return ext ? `${ext} File` : "Source File";
  }
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  metadata?: SourceFileMetadata;
}

export function validateSourceFile(file: File): ValidationResult {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds the maximum client-side limit of ${MAX_FILE_SIZE_LABEL}.`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: "The selected file is empty (0 bytes). Please select a valid document or media file.",
    };
  }

  // Check supported extension or mime type
  const hasSupportedExt = SUPPORTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  const hasSupportedMime = SUPPORTED_MIME_PREFIXES.some((mime) =>
    mime.endsWith("/") ? type.startsWith(mime) : type === mime
  );

  if (!hasSupportedExt && !hasSupportedMime && type !== "") {
    return {
      valid: false,
      error: `Unsupported file format (${name.split(".").pop() || "unknown"}). Supported formats include PDF, DOCX, TXT, Images (PNG, JPG, WEBP), and Video (MP4, MOV, WEBM).`,
    };
  }

  const category = getFileCategory(file);
  const metadata: SourceFileMetadata = {
    file,
    name: file.name,
    size: file.size,
    type: file.type || `application/${name.split(".").pop() || "octet-stream"}`,
    formattedSize: formatFileSize(file.size),
    category,
  };

  return {
    valid: true,
    metadata,
  };
}
