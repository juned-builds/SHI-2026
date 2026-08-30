import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { FileCategory, ProjectDraft } from "../types";

// Configure pdfjs worker in browser environments safely using unpkg/cdn or worker
if (typeof window !== "undefined" && pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "4.10.38"}/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn("[DocumentExtractor] Failed to initialize PDF worker src:", e);
  }
}

export interface ExtractionResult {
  success: boolean;
  text: string;
  wordCount: number;
  charCount: number;
  pageCount?: number;
  error?: string | null;
  category: FileCategory;
  filename: string;
}

export const MIN_SOURCE_CHAR_LENGTH = 15;
export const MIN_SOURCE_WORD_COUNT = 3;

/**
 * Calculates accurate word count from text
 */
export function calculateWordCount(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Normalizes extracted text:
 * - Unifies line endings to \n
 * - Reduces excessive consecutive blank lines (max 2)
 * - Trims trailing/leading whitespace per line
 */
export function normalizeExtractedText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extracts plain text from an RTF string
 */
function extractTextFromRtf(rtf: string): string {
  // Strip RTF control groups and formatting commands
  let text = rtf
    .replace(/\\([a-z]{1,32})(-?\d+)? ?/gi, " ")
    .replace(/[\{\}]/g, "")
    .replace(/\\'[0-9a-fA-F]{2}/g, "");
  return normalizeExtractedText(text);
}

/**
 * Extracts selectable text from a PDF File using pdfjs-dist.
 * Preserves structural lines and page divisions.
 */
async function extractTextFromPdf(file: File): Promise<{ text: string; pageCount: number }> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Load the PDF document
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useWorkerFetch: false,
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Group text items by vertical position (Y coordinate) to preserve lines
    const items = textContent.items as Array<{
      str?: string;
      transform?: number[];
      hasEOL?: boolean;
    }>;

    if (!items || items.length === 0) {
      continue;
    }

    let lastY: number | null = null;
    let pageLines: string[] = [];
    let currentLine = "";

    for (const item of items) {
      if (typeof item.str !== "string") continue;
      
      const y = item.transform ? item.transform[5] : null;

      if (lastY !== null && y !== null && Math.abs(y - lastY) > 3) {
        // Line break detected
        if (currentLine.trim()) {
          pageLines.push(currentLine.trim());
        }
        currentLine = item.str;
      } else {
        // Same line
        if (currentLine && !currentLine.endsWith(" ") && !item.str.startsWith(" ")) {
          currentLine += " " + item.str;
        } else {
          currentLine += item.str;
        }
      }
      lastY = y;
    }

    if (currentLine.trim()) {
      pageLines.push(currentLine.trim());
    }

    const pageJoined = pageLines.join("\n").trim();
    if (pageJoined) {
      pageTexts.push(pageJoined);
    }
  }

  const fullText = pageTexts.join("\n\n");
  return {
    text: normalizeExtractedText(fullText),
    pageCount: numPages,
  };
}

/**
 * Extracts clean paragraph text from a DOCX File using mammoth.
 */
async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    const rawText = result.value || "";
    return normalizeExtractedText(rawText);
  } catch (err: any) {
    throw new Error(`Failed to parse Word document: ${err.message || "Unknown error"}`);
  }
}

/**
 * Main unified extraction contract used for every uploaded file.
 */
export async function extractTextFromSourceFile(file: File): Promise<ExtractionResult> {
  const filename = file.name || "Unnamed source";
  const lowerName = filename.toLowerCase();
  const lowerType = (file.type || "").toLowerCase();

  // 1. Plain Text / Markdown / Code / RTF / CSV / JSON
  if (
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".markdown") ||
    lowerName.endsWith(".rtf") ||
    lowerName.endsWith(".csv") ||
    lowerName.endsWith(".json") ||
    lowerType.startsWith("text/") ||
    lowerType === "application/json"
  ) {
    try {
      const rawText = await file.text();
      let cleanText = "";
      if (lowerName.endsWith(".rtf")) {
        cleanText = extractTextFromRtf(rawText);
      } else {
        cleanText = normalizeExtractedText(rawText);
      }

      if (!cleanText || cleanText.trim().length === 0) {
        return {
          success: false,
          text: "",
          wordCount: 0,
          charCount: 0,
          error: "The uploaded text file is empty. Please provide a document with text content.",
          category: lowerName.endsWith(".md") ? "text" : "text",
          filename,
        };
      }

      const wordCount = calculateWordCount(cleanText);
      const charCount = cleanText.length;

      return {
        success: true,
        text: cleanText,
        wordCount,
        charCount,
        category: "text",
        filename,
      };
    } catch (err: any) {
      return {
        success: false,
        text: "",
        wordCount: 0,
        charCount: 0,
        error: `Could not read text file: ${err.message || "Unknown read error"}`,
        category: "text",
        filename,
      };
    }
  }

  // 2. PDF Documents
  if (lowerName.endsWith(".pdf") || lowerType === "application/pdf") {
    try {
      const { text, pageCount } = await extractTextFromPdf(file);

      if (!text || text.trim().length === 0) {
        return {
          success: false,
          text: "",
          wordCount: 0,
          charCount: 0,
          pageCount,
          error:
            "No readable text was found in this PDF. It may contain scanned images or be password-protected. Please upload a text-based PDF or provide the content directly as text.",
          category: "pdf",
          filename,
        };
      }

      const wordCount = calculateWordCount(text);
      const charCount = text.length;

      if (charCount < MIN_SOURCE_CHAR_LENGTH || wordCount < MIN_SOURCE_WORD_COUNT) {
        return {
          success: false,
          text,
          wordCount,
          charCount,
          pageCount,
          error: `Extracted text from PDF is too sparse (${wordCount} words, ${charCount} chars). Please upload a document with substantive text content.`,
          category: "pdf",
          filename,
        };
      }

      return {
        success: true,
        text,
        wordCount,
        charCount,
        pageCount,
        category: "pdf",
        filename,
      };
    } catch (err: any) {
      console.error("[DocumentExtractor] PDF Extraction error:", err);
      return {
        success: false,
        text: "",
        wordCount: 0,
        charCount: 0,
        error: `Could not extract text from PDF: ${err.message || "Invalid or encrypted PDF file."}`,
        category: "pdf",
        filename,
      };
    }
  }

  // 3. Word Documents (.docx)
  if (
    lowerName.endsWith(".docx") ||
    lowerType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      const text = await extractTextFromDocx(file);

      if (!text || text.trim().length === 0) {
        return {
          success: false,
          text: "",
          wordCount: 0,
          charCount: 0,
          error:
            "No readable text was found in this Word document (.docx). Please ensure the document contains written content.",
          category: "docx",
          filename,
        };
      }

      const wordCount = calculateWordCount(text);
      const charCount = text.length;

      if (charCount < MIN_SOURCE_CHAR_LENGTH || wordCount < MIN_SOURCE_WORD_COUNT) {
        return {
          success: false,
          text,
          wordCount,
          charCount,
          error: `Extracted text from Word document is too sparse (${wordCount} words, ${charCount} chars). Please upload a document with substantive text content.`,
          category: "docx",
          filename,
        };
      }

      return {
        success: true,
        text,
        wordCount,
        charCount,
        category: "docx",
        filename,
      };
    } catch (err: any) {
      console.error("[DocumentExtractor] DOCX Extraction error:", err);
      return {
        success: false,
        text: "",
        wordCount: 0,
        charCount: 0,
        error: `Could not extract text from Word document: ${err.message || "Invalid or corrupt DOCX file."}`,
        category: "docx",
        filename,
      };
    }
  }

  // 4. Legacy Word (.doc)
  if (lowerName.endsWith(".doc") || lowerType === "application/msword") {
    // Attempt fallback text scan for ASCII/UTF-8 streams inside binary doc
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let extractedRun = "";
      const textChunks: string[] = [];

      for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i];
        // Select printable ASCII + tabs/newlines
        if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13 || byte === 9) {
          extractedRun += String.fromCharCode(byte);
        } else {
          if (extractedRun.length > 8) {
            textChunks.push(extractedRun);
          }
          extractedRun = "";
        }
      }
      if (extractedRun.length > 8) {
        textChunks.push(extractedRun);
      }

      const rawDocText = normalizeExtractedText(textChunks.join(" "));
      const wordCount = calculateWordCount(rawDocText);

      if (wordCount >= MIN_SOURCE_WORD_COUNT && rawDocText.length >= MIN_SOURCE_CHAR_LENGTH) {
        return {
          success: true,
          text: rawDocText,
          wordCount,
          charCount: rawDocText.length,
          category: "docx",
          filename,
        };
      } else {
        return {
          success: false,
          text: "",
          wordCount: 0,
          charCount: 0,
          error:
            "Legacy .doc format could not be fully parsed. For best accuracy, please save/convert your document to .docx or .pdf, or paste the text directly.",
          category: "docx",
          filename,
        };
      }
    } catch {
      return {
        success: false,
        text: "",
        wordCount: 0,
        charCount: 0,
        error:
          "Legacy .doc format is not directly supported. Please convert to modern .docx or .pdf, or copy/paste the content.",
        category: "docx",
        filename,
      };
    }
  }

  // 5. Unsupported media/binary types (Image, Video, Audio, Archives)
  const ext = filename.includes(".") ? filename.split(".").pop()?.toUpperCase() : "file";
  return {
    success: false,
    text: "",
    wordCount: 0,
    charCount: 0,
    error: `The selected file format (${ext}) does not contain direct extractable text for automated transformation. Please upload a PDF, DOCX, TXT, or Markdown document, or paste your content directly.`,
    category: "other",
    filename,
  };
}

/**
 * Validates whether a ProjectDraft has verified source text ready for generation.
 */
export function validateDraftSourceContract(draft: ProjectDraft | null): {
  valid: boolean;
  error?: string;
  trimmedText?: string;
} {
  if (!draft) {
    return { valid: false, error: "Project draft is missing." };
  }

  const text = (draft.sourceText || "").trim();

  if (!text) {
    if (draft.sourceType === "file" && draft.sourceFile) {
      return {
        valid: false,
        error: `No readable text has been extracted from "${draft.sourceFile.name}". Please re-upload or select a text-based document.`,
      };
    }
    return {
      valid: false,
      error: "Source text cannot be empty. Please provide source content before generating.",
    };
  }

  if (text.length < MIN_SOURCE_CHAR_LENGTH) {
    return {
      valid: false,
      error: `Source text is too short (${text.length} characters). A minimum of ${MIN_SOURCE_CHAR_LENGTH} characters is required.`,
    };
  }

  const wordCount = calculateWordCount(text);
  if (wordCount < MIN_SOURCE_WORD_COUNT) {
    return {
      valid: false,
      error: `Source text contains too few words (${wordCount} words). A minimum of ${MIN_SOURCE_WORD_COUNT} words is required.`,
    };
  }

  return { valid: true, trimmedText: text };
}
