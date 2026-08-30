import React from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Custom High-Fidelity Markdown Parser and Renderer.
 * Renders Markdown into clean, accessible, styled semantic HTML elements
 * without external heavy parser dependencies.
 */
export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (!content || !content.trim()) {
    return <p className="text-slate-400 italic text-sm">No content to display.</p>;
  }

  const elements = parseMarkdownToReact(content);

  return (
    <div className={`markdown-body space-y-3.5 text-slate-800 font-sans leading-relaxed text-sm ${className}`}>
      {elements}
    </div>
  );
}

function parseMarkdownToReact(markdown: string): React.ReactNode[] {
  const lines = markdown.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let i = 0;
  let keyIndex = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Code Block (```)
    if (line.trim().startsWith("```")) {
      const lang = line.trim().replace(/^```/, "").trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```
      elements.push(
        <div
          key={`code-block-${keyIndex++}`}
          className="my-4 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shadow-xs"
        >
          {lang && (
            <div className="bg-slate-800/90 px-3.5 py-1.5 text-[11px] font-mono text-slate-300 border-b border-slate-700 flex items-center justify-between">
              <span>{lang}</span>
              <span className="text-slate-400">code snippet</span>
            </div>
          )}
          <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre leading-normal">
            <code>{codeLines.join("\n")}</code>
          </pre>
        </div>
      );
      continue;
    }

    // 2. Headings (# H1 to #### H4)
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];

      if (level === 1) {
        elements.push(
          <h1
            key={`h1-${keyIndex++}`}
            className="text-2xl font-bold text-slate-900 tracking-tight pt-3 pb-1 border-b border-slate-200"
          >
            {renderInlineMarkdown(headingText)}
          </h1>
        );
      } else if (level === 2) {
        elements.push(
          <h2
            key={`h2-${keyIndex++}`}
            className="text-lg font-semibold text-slate-900 tracking-tight pt-2.5 pb-0.5"
          >
            {renderInlineMarkdown(headingText)}
          </h2>
        );
      } else if (level === 3) {
        elements.push(
          <h3
            key={`h3-${keyIndex++}`}
            className="text-base font-semibold text-slate-800 pt-2"
          >
            {renderInlineMarkdown(headingText)}
          </h3>
        );
      } else {
        elements.push(
          <h4
            key={`h4-${keyIndex++}`}
            className="text-sm font-semibold text-slate-800 pt-1"
          >
            {renderInlineMarkdown(headingText)}
          </h4>
        );
      }
      i++;
      continue;
    }

    // 3. Horizontal Rule (---, ***, ___)
    if (line.trim().match(/^([-*_]){3,}$/)) {
      elements.push(
        <hr key={`hr-${keyIndex++}`} className="my-5 border-t border-slate-200" />
      );
      i++;
      continue;
    }

    // 4. Blockquote (> ...)
    if (line.trim().startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      elements.push(
        <blockquote
          key={`quote-${keyIndex++}`}
          className="my-3 pl-4 py-2 border-l-4 border-emerald-500 bg-emerald-50/40 rounded-r-lg text-slate-700 italic text-sm space-y-1.5"
        >
          {quoteLines.map((q, idx) => (
            <p key={idx}>{renderInlineMarkdown(q)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // 5. Table (| Header | Header |)
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      if (tableLines.length >= 2) {
        const parseRow = (rowStr: string) =>
          rowStr
            .split("|")
            .slice(1, -1)
            .map((c) => c.trim());

        const headers = parseRow(tableLines[0]);
        const isSeparator = (rowStr: string) => /^[|\s-:]+$/.test(rowStr);
        const dataRows = tableLines.slice(1).filter((r) => !isSeparator(r));

        elements.push(
          <div key={`table-${keyIndex++}`} className="my-4 overflow-x-auto rounded-lg border border-slate-200 shadow-2xs">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  {headers.map((h, hIdx) => (
                    <th
                      key={hIdx}
                      className="px-3.5 py-2.5 text-left font-semibold text-slate-900"
                    >
                      {renderInlineMarkdown(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {dataRows.map((rowStr, rIdx) => {
                  const cells = parseRow(rowStr);
                  return (
                    <tr key={rIdx} className="hover:bg-slate-50/60 transition-colors">
                      {cells.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2 text-slate-700">
                          {renderInlineMarkdown(cell)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 6. Unordered List (- or * or +)
    if (line.trim().match(/^[-*+]\s+/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^[-*+]\s+/)) {
        listItems.push(lines[i].replace(/^[-*+]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={`ul-${keyIndex++}`} className="my-2.5 list-disc list-inside space-y-1.5 pl-2 text-slate-700">
          {listItems.map((item, itemIdx) => (
            <li key={itemIdx} className="leading-normal">
              <span className="text-slate-800">{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 7. Ordered List (1. 2. 3.)
    if (line.trim().match(/^\d+\.\s+/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s+/)) {
        listItems.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${keyIndex++}`} className="my-2.5 list-decimal list-inside space-y-1.5 pl-2 text-slate-700">
          {listItems.map((item, itemIdx) => (
            <li key={itemIdx} className="leading-normal">
              <span className="text-slate-800">{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 8. Empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // 9. Standard Paragraph
    const paraLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().match(/^[-*+]\s+/) &&
      !lines[i].trim().match(/^\d+\.\s+/) &&
      !lines[i].trim().match(/^([-*_]){3,}$/)
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    elements.push(
      <p key={`p-${keyIndex++}`} className="text-slate-800 leading-relaxed">
        {renderInlineMarkdown(paraLines.join(" "))}
      </p>
    );
  }

  return elements;
}

/**
 * Parses inline formatting: **bold**, *italic*, `code`, and [links](url).
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Split by inline code, links, bold, and italic regex tokens
  const tokenRegex = /(`[^`]+`)|(\*\*.*?\*\*)|(\*.*?\*)|(__.*?__)|(_.*?_)|(\[.*?\]\(.*?\))/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const matchedStr = match[0];

    // Inline Code: `...`
    if (matchedStr.startsWith("`") && matchedStr.endsWith("`")) {
      parts.push(
        <code
          key={`code-${match.index}`}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[12px] text-emerald-800"
        >
          {matchedStr.slice(1, -1)}
        </code>
      );
    }
    // Bold: **...** or __...__
    else if (
      (matchedStr.startsWith("**") && matchedStr.endsWith("**")) ||
      (matchedStr.startsWith("__") && matchedStr.endsWith("__"))
    ) {
      parts.push(
        <strong key={`bold-${match.index}`} className="font-semibold text-slate-900">
          {matchedStr.slice(2, -2)}
        </strong>
      );
    }
    // Italic: *...* or _..._
    else if (
      (matchedStr.startsWith("*") && matchedStr.endsWith("*")) ||
      (matchedStr.startsWith("_") && matchedStr.endsWith("_"))
    ) {
      parts.push(
        <em key={`italic-${match.index}`} className="italic text-slate-800">
          {matchedStr.slice(1, -1)}
        </em>
      );
    }
    // Link: [text](url)
    else if (matchedStr.startsWith("[") && matchedStr.includes("](")) {
      const linkMatch = matchedStr.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        parts.push(
          <a
            key={`link-${match.index}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-700 font-medium underline underline-offset-2 hover:text-emerald-800"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        parts.push(matchedStr);
      }
    } else {
      parts.push(matchedStr);
    }

    lastIndex = match.index + matchedStr.length;
  }

  // Add trailing text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
