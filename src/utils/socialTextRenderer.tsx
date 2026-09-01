import React from "react";

/**
 * Deterministic Client-Side Social & Markdown Rich Text Normalizer and Renderer.
 * Converts markdown formatting (**bold**, *italic*, bullet points, hashtags, emojis)
 * into safe, accessible React elements without raw asterisks or HTML injection.
 */

export interface FormattedLineProps {
  text: string;
  isHeading?: boolean;
  isBullet?: boolean;
  bulletSymbol?: string;
  className?: string;
}

/**
 * Parses inline markdown formatting (**bold**, *italic*, `code`, [link](url))
 * and renders as React elements safely preserving all Unicode emojis.
 */
export function renderInlineSocialText(text: string): React.ReactNode {
  if (!text) return null;

  // Regex to split by inline code, bold, italic, URLs, and hashtags with Unicode 'u' flag
  const tokenRegex =
    /(`[^`]+`)|(\*\*\*.*?\*\*\*)|(\*\*.*?\*\*)|(__.*?__)|(\*.*?\*)|(_[a-zA-Z0-9_\-\s]+_)|(\[.*?\]\(.*?\))|(https?:\/\/[^\s]+)|(#[A-Za-z0-9_]+)/gu;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    // Plain text before token
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const matchedStr = match[0];
    const key = `token-${match.index}`;

    // Inline Code `...`
    if (matchedStr.startsWith("`") && matchedStr.endsWith("`")) {
      parts.push(
        <code
          key={key}
          className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-slate-800 border border-slate-200"
        >
          {matchedStr.slice(1, -1)}
        </code>
      );
    }
    // Bold Italic ***...***
    else if (matchedStr.startsWith("***") && matchedStr.endsWith("***")) {
      parts.push(
        <strong key={key} className="font-bold italic text-slate-900">
          {matchedStr.slice(3, -3)}
        </strong>
      );
    }
    // Bold **...** or __...__
    else if (
      (matchedStr.startsWith("**") && matchedStr.endsWith("**")) ||
      (matchedStr.startsWith("__") && matchedStr.endsWith("__"))
    ) {
      parts.push(
        <strong key={key} className="font-bold text-slate-900">
          {matchedStr.slice(2, -2)}
        </strong>
      );
    }
    // Italic *...* or _..._
    else if (
      (matchedStr.startsWith("*") && matchedStr.endsWith("*")) ||
      (matchedStr.startsWith("_") && matchedStr.endsWith("_"))
    ) {
      parts.push(
        <em key={key} className="italic text-slate-800">
          {matchedStr.slice(1, -1)}
        </em>
      );
    }
    // Link [label](url)
    else if (matchedStr.startsWith("[") && matchedStr.includes("](")) {
      const linkMatch = matchedStr.match(/^\[(.*?)\]\((.*?)\)$/u);
      if (linkMatch) {
        parts.push(
          <a
            key={key}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
            className="text-[#0a66c2] hover:underline font-medium"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        parts.push(matchedStr);
      }
    }
    // Raw URL https://...
    else if (matchedStr.startsWith("http://") || matchedStr.startsWith("https://")) {
      parts.push(
        <a
          key={key}
          href={matchedStr}
          target="_blank"
          rel="noreferrer"
          className="text-[#0a66c2] hover:underline font-medium break-all"
        >
          {matchedStr}
        </a>
      );
    }
    // Hashtags: #Tag
    else if (matchedStr.startsWith("#")) {
      parts.push(
        <span
          key={key}
          className="text-[#0a66c2] font-semibold hover:underline cursor-pointer inline-block"
        >
          {matchedStr}
        </span>
      );
    } else {
      parts.push(matchedStr);
    }

    lastIndex = match.index + matchedStr.length;
  }

  // Trailing text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

/**
 * Renders a full multi-paragraph social post (LinkedIn, X, Announcements)
 * with proper line rhythm, bold labels, list bullets, and hashtags.
 */
export function renderSocialPostContent(rawContent: string): React.ReactNode {
  if (!rawContent || !rawContent.trim()) {
    return <p className="text-slate-400 italic text-sm">No post content available.</p>;
  }

  const rawParagraphs = rawContent.split(/\n\s*\n/);

  return (
    <div className="space-y-3.5 text-slate-800 text-[14px] leading-[1.65]">
      {rawParagraphs.map((paragraph, pIdx) => {
        const lines = paragraph.split("\n");

        return (
          <div key={`p-${pIdx}`} className="space-y-1.5">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return null;

              // Check for Markdown Headings (# H1, ## H2, ### H3)
              const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
              if (headingMatch) {
                const headingText = headingMatch[2];
                return (
                  <h4
                    key={`h-${pIdx}-${lIdx}`}
                    className="font-bold text-slate-900 text-[15px] pt-1.5 pb-0.5 tracking-tight"
                  >
                    {renderInlineSocialText(headingText)}
                  </h4>
                );
              }

              // Check for Dedicated Hashtag Lines
              const isHashtagLine =
                trimmed.startsWith("#") &&
                !trimmed.startsWith("##") &&
                !trimmed.startsWith("###") &&
                trimmed.split(/\s+/).every((w) => w.startsWith("#"));

              if (isHashtagLine) {
                const tags = trimmed.match(/#[A-Za-z0-9_]+/g) || [trimmed];
                return (
                  <div key={`tags-${pIdx}-${lIdx}`} className="flex flex-wrap gap-2 pt-2">
                    {tags.map((tag, tIdx) => (
                      <span
                        key={`tag-${tIdx}`}
                        className="text-[#0a66c2] hover:underline font-semibold text-xs cursor-pointer bg-blue-50/60 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                );
              }

              // Check for Bullet Points & List Items (Unicode-safe: supports •, -, *, numbering, and all emojis including flags & dingbats)
              const bulletRegex =
                /^((?:[•\-\*]|(?:[\p{Extended_Pictographic}\uFE0F\u200D]|[\u{1F1E6}-\u{1F1FF}]|[\u{1F3FB}-\u{1F3FF}]|[\u{2600}-\u{27BF}])+|\d+[\.\)]))\s+(.*)$/u;
              const bulletMatch = trimmed.match(bulletRegex);

              if (bulletMatch) {
                const symbol = bulletMatch[1];
                const textContent = bulletMatch[2];

                return (
                  <div
                    key={`b-${pIdx}-${lIdx}`}
                    className="flex items-start gap-2 pl-1 text-slate-800"
                  >
                    <span className="shrink-0 text-slate-700 select-none font-medium mt-[1px]">
                      {symbol}
                    </span>
                    <div className="flex-1 min-w-0">
                      {renderInlineSocialText(textContent)}
                    </div>
                  </div>
                );
              }

              // Check if line is a label header like "**Section Name:**" or "Key Highlights:"
              const isLabelHeader =
                trimmed.endsWith(":") ||
                /^(\*\*.*?\*\*:\s*)$/u.test(trimmed) ||
                /^(Key|Why|Impact|Action|Summary|Overview|Takeaway)[\w\s]*:/iu.test(trimmed);

              return (
                <p
                  key={`line-${pIdx}-${lIdx}`}
                  className={`${
                    isLabelHeader ? "font-bold text-slate-900 pt-1" : "text-slate-800"
                  }`}
                >
                  {renderInlineSocialText(trimmed)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Produces clean plain-text suitable for copying to clipboard for LinkedIn.
 * Removes markdown symbols like `**`, `__`, `###` without losing the text content
 * or breaking paragraph line breaks, strictly preserving all Unicode emojis.
 */
export function getCleanSocialCopyText(rawContent: string): string {
  if (!rawContent) return "";

  return rawContent
    // Remove markdown headers: ### Heading -> Heading
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold asterisks: **text** -> text
    .replace(/\*\*(.*?)\*\*/gu, "$1")
    // Remove bold underscores: __text__ -> text
    .replace(/__(.*?)__/gu, "$1")
    // Remove inline italics: *text* -> text (when surrounded by spaces or punctuation)
    .replace(/(^|\s)\*([^\*\n]+)\*(\s|$)/gu, "$1$2$3")
    // Remove inline code ticks: `code` -> code
    .replace(/`([^`]+)`/gu, "$1")
    // Convert markdown links: [label](url) -> label (url)
    .replace(/\[(.*?)\]\((.*?)\)/gu, "$1: $2")
    // Clean up excessive blank lines
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}
