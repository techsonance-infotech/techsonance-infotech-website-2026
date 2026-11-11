import { marked } from "marked";
import hljs from "highlight.js";
import nomnoml from "nomnoml";

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface TocItem {
  id: string;
  text: string;
  depth: number;
}

/**
 * Detects whether a code block represents a Mermaid diagram.
 */
export function isMermaidCode(lang?: string, text: string = ""): boolean {
  const rawLang = (lang || "").trim().toLowerCase();
  if (rawLang === "mermaid") return true;

  // If no language or generic code/text/markdown, inspect the content
  if (!rawLang || ["code", "text", "markdown", "markup"].includes(rawLang)) {
    const trimmed = text.trim();
    const mermaidStarters = [
      "flowchart",
      "graph",
      "sequencediagram",
      "classdiagram",
      "statediagram",
      "erdiagram",
      "journey",
      "gantt",
      "pie",
      "gitgraph",
      "mindmap",
      "timeline",
      "quadrantchart",
      "c4context",
      "sankey-beta",
      "block-beta",
    ];
    const firstWord = (trimmed.split(/[\s\n\r]/)[0] || "").toLowerCase();
    return mermaidStarters.includes(firstWord);
  }

  return false;
}

/**
 * Normalizes AI-generated Mermaid code to prevent syntax errors:
 * - Merges node labels split across line breaks
 * - Decodes HTML entities (&gt;, &lt;, &amp;, &quot;)
 * - Normalizes box drawing (─) and unicode arrows (→, ➔, ➜, —, –) to standard ASCII -->
 * - Fixes trailing dashes and broken arrow fragments
 * - Fixes spaces between arrow and pipe (`--> |label|` -> `-->|label|`)
 * - Fixes double/stray pipes (`|label| | Target` -> `|label| Target`)
 * - Replaces literal \n inside node quotes with <br/>
 * - Quotes node labels that contain parentheses, colons, or slashes
 * - Splits chained edge lines (`A -->|L1| B -->|L2| C`) into discrete valid statements
 */
export function normalizeMermaidCode(raw: string): string {
  if (!raw) return "";
  let code = raw.trim();

  // 1. Merge node labels or quotes that got accidentally split across line breaks
  code = code.replace(/\["([^"]*)\r?\n([^"]*)"\]/g, '["$1 $2"]');
  code = code.replace(/(\[[^\]\r\n]*)\r?\n([^\]\r\n]*\])/g, "$1 $2");

  // 2. Decode HTML entities and normalize non-breaking hyphens (U+2011)
  code = code
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\u2011/g, "-");

  // Protect edge labels inside pipes so internal text like `|Fetch prompt → LLM API|`
  // does not have its arrows converted into structural `-->` syntax.
  const pipeLabels: string[] = [];
  code = code.replace(/\|([^|\r\n]+)\|/g, (_, labelContent: string) => {
    const safeLabel = labelContent.replace(/[\u2192\u2794\u279c→]/g, "->");
    pipeLabels.push(safeLabel);
    return `__PIPE_LABEL_${pipeLabels.length - 1}__`;
  });

  // 3. Normalize all unicode arrows & box drawing characters:
  // \u2500 is ─ (box drawing), \u2014 is —, \u2013 is –, \u2192 is →, \u2794 is ➔, \u279c is ➜
  code = code.replace(/[\u2500—–-]+>/g, "-->");
  code = code.replace(/[\u2500—–-]+\s*[\u2192\u2794\u279c→]/g, "-->");
  code = code.replace(/[\u2192\u2794\u279c→]/g, "-->");
  code = code.replace(/-\s*-->/g, "-->");
  code = code.replace(/-->\s*-->/g, "-->");

  // Restore protected pipe labels
  code = code.replace(/__PIPE_LABEL_(\d+)__/g, (_, idx: string) => {
    const orig = pipeLabels[Number(idx)];
    return orig !== undefined ? `|${orig}|` : "||";
  });

  // 4. Clean trailing dashes on node names e.g. "APIGW -" -> "APIGW"
  code = code.replace(/\b([A-Za-z0-9_]+)\s+-\s*$/gm, "$1");
  code = code.replace(/\b([A-Za-z0-9_]+)\s+-\s*-->/g, "$1 -->");

  // 5. Clean arrow and pipe spaces: `--> |label|` -> `-->|label|`
  code = code.replace(/-->\s*\|/g, "-->|");

  // 6. Clean double pipes: `|label| | Target` -> `|label| Target`
  code = code.replace(/\|(\s*\|)+/g, "|");

  // 7. Replace literal \n inside quotes with <br/>
  code = code.replace(/"([^"]*)"/g, (_, inner: string) => {
    return '"' + inner.replace(/\\n/g, "<br/>") + '"';
  });

  // 8. Wrap unquoted node labels containing parentheses, colons, or slashes in double quotes
  code = code.replace(/([A-Za-z0-9_-]+)\[([^"\]\r\n]*[():/][^"\]\r\n]*)\]/g, (match, id, label) => {
    if (label.startsWith('"') && label.endsWith('"')) return match;
    return `${id}["${label}"]`;
  });

  // 9. Split chained edges on single lines with labels (e.g. A -->|L1| B -->|L2| C)
  const lines = code.split("\n");
  const processedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const arrowMatches = trimmed.match(/-->/g);

    if (arrowMatches && arrowMatches.length > 1) {
      const chainedParts = trimmed.split(/\s*-->\s*/);
      if (chainedParts.length >= 3) {
        let prevNode = chainedParts[0];
        for (let i = 1; i < chainedParts.length; i++) {
          const part = chainedParts[i];
          const pipeMatch = part.match(/^\|([^|]+)\|\s*(.+)$/);
          if (pipeMatch) {
            const label = pipeMatch[1];
            const nextNode = pipeMatch[2];
            processedLines.push(`  ${prevNode} -->|${label}| ${nextNode}`);
            prevNode = nextNode;
          } else {
            processedLines.push(`  ${prevNode} --> ${part}`);
            prevNode = part;
          }
        }
        continue;
      }
    }
    processedLines.push(trimmed);
  }

  return processedLines.join("\n");
}

/**
 * Formats mathematical metrics and LaTeX percentiles (e.g. $P_{99}$, $p_{99}$, $TPMS):
 * - ($P_{99}$) -> (P<sub>99</sub>)
 * - $P_{99}$ -> P<sub>99</sub>
 * - ($TPMS) -> (TPMS)
 * - $TPMS$ -> TPMS
 * Preserves currency like $10, $0.002, $500/mo.
 */
export function formatMathAndMetrics(text: string): string {
  if (!text) return "";

  // 1. Parenthesized LaTeX percentiles: ($P_{99}$) or ($p_{99}$) or ($P_{50}$)
  let res = text.replace(/\(\s*\$([A-Za-z]+)_\{?([0-9a-zA-Z.]+)\}?\$?\s*\)/g, "($1<sub>$2</sub>)");

  // 2. Unparenthesized LaTeX subscripts with dollar signs: $P_{99}$, $p_{99}$, $T_{max}$, $N_1$
  res = res.replace(/\$([A-Za-z]+)_\{?([0-9a-zA-Z.]+)\}?\$?/g, "$1<sub>$2</sub>");

  // 3. Parenthesized acronyms prefixed with dollar: ($TPMS) -> (TPMS)
  res = res.replace(/\(\s*\$([A-Za-z]{2,})\s*\)/g, "($1)");

  // 4. Standalone dollar-wrapped variables/acronyms: $TPMS$ -> TPMS
  res = res.replace(/\$([A-Za-z]{2,})\$/g, "$1");

  // 5. Big-O notation: $O(N)$ or $O(1)$ -> O($1)
  res = res.replace(/\$O\(([^$]+)\)\$/g, "O($1)");

  // 6. Exponents: $N^2$ or $2^{10}$ -> N<sup>2</sup>
  res = res.replace(/\$([A-Za-z0-9]+)\^\{?([0-9a-zA-Z.]+)\}?\$?/g, "$1<sup>$2</sup>");

  return res;
}

/**
 * Preprocesses markdown to format math notation and metrics while leaving
 * fenced code blocks and inline code spans intact.
 */
export function preprocessMarkdownMath(md: string): string {
  if (!md || typeof md !== "string") return "";

  const parts = md.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part) => {
      if (part.startsWith("```")) {
        return part; // keep code block verbatim
      }
      // Also protect inline code `...`
      const inlineParts = part.split(/(`[^`\n]+`)/g);
      return inlineParts
        .map((subPart) => {
          if (subPart.startsWith("`")) {
            return subPart; // keep inline code verbatim
          }
          return formatMathAndMetrics(subPart);
        })
        .join("");
    })
    .join("");
}

/**
 * Translates Mermaid flowchart / graph syntax to Nomnoml syntax for robust,
 * unclipped SVG diagram rendering.
 */
export function mermaidToNomnoml(mermaidCode: string): string {
  const lines = mermaidCode.split("\n");
  let direction = "right";

  const nodeMap = new Map<string, string>();
  const edgeList: { from: string; to: string; label: string }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      !trimmed ||
      trimmed.startsWith("style ") ||
      trimmed.startsWith("classDef ") ||
      trimmed.startsWith("class ")
    )
      continue;

    const lower = trimmed.toLowerCase();
    if (
      lower.includes("flowchart td") ||
      lower.includes("graph td") ||
      lower.includes("flowchart tb") ||
      lower.includes("graph tb")
    ) {
      direction = "down";
      continue;
    }
    if (lower.includes("flowchart lr") || lower.includes("graph lr")) {
      direction = "right";
      continue;
    }

    // Match participant definitions in sequence diagrams e.g. participant E as Edge Function
    const participantMatch = trimmed.match(/^participant\s+([A-Za-z0-9_]+)(?:\s+as\s+(.+))?$/i);
    if (participantMatch) {
      nodeMap.set(participantMatch[1], participantMatch[2]?.trim() || participantMatch[1]);
      continue;
    }

    // Match sequence diagram message e.g. A->>B: message
    const seqMatch = trimmed.match(/^([A-Za-z0-9_]+)\s*(?:->>|-->>)\s*([A-Za-z0-9_]+)\s*:\s*(.+)$/);
    if (seqMatch) {
      const fromLabel = nodeMap.get(seqMatch[1]) || seqMatch[1];
      const toLabel = nodeMap.get(seqMatch[2]) || seqMatch[2];
      const label = seqMatch[3].trim();
      if (fromLabel && toLabel) {
        edgeList.push({ from: fromLabel, to: toLabel, label });
      }
      continue;
    }

    // Match edge: from -->|label| to or from --> to
    const edgeMatch = trimmed.match(/^(.+?)\s*(?:-->|-.->|==>)\s*(?:\|([^|]+)\|\s*)?(.+)$/);
    if (edgeMatch) {
      const parseNode = (raw: string): string => {
        const s = raw.trim();
        const namedMatch = s.match(/^([A-Za-z0-9_]+)\s*\["?(.*?)"?\]$/);
        if (namedMatch) {
          const id = namedMatch[1];
          const label = namedMatch[2] || id;
          nodeMap.set(id, label);
          return label;
        }
        const bracketMatch = s.match(/^\["?(.*?)"?\]$/);
        if (bracketMatch) {
          return bracketMatch[1];
        }
        if (nodeMap.has(s)) {
          return nodeMap.get(s)!;
        }
        return s.replace(/[[\]"']/g, "").trim();
      };

      const fromLabel = parseNode(edgeMatch[1]);
      const toLabel = parseNode(edgeMatch[3]);
      const edgeLabel = edgeMatch[2]?.trim() || "";

      if (fromLabel && toLabel) {
        edgeList.push({ from: fromLabel, to: toLabel, label: edgeLabel });
      }
    }
  }

  const nomnomlLines = [
    `#direction: ${direction}`,
    "#font: Inter, system-ui, sans-serif",
    "#fontSize: 13",
    "#stroke: #1155cc",
    "#fill: #f8fafd",
    "#lineWidth: 1.5",
    "#edgeMargin: 16",
    "#padding: 16",
  ];

  for (const edge of edgeList) {
    if (edge.label) {
      nomnomlLines.push(`[${edge.from}] - ${edge.label} > [${edge.to}]`);
    } else {
      nomnomlLines.push(`[${edge.from}] -> [${edge.to}]`);
    }
  }

  return nomnomlLines.join("\n");
}

/**
 * Extracts h2 and h3 headings from Markdown to generate a Table of Contents.
 * Deduplicates heading IDs to avoid duplicate HTML anchors and duplicate React keys.
 */
export function extractTableOfContents(markdown: string): TocItem[] {
  if (!markdown || typeof markdown !== "string") return [];
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const items: TocItem[] = [];
  const idCounts = new Map<string, number>();
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const depth = match[1].length;
    const rawHeading = match[2].trim();
    const formatted = formatMathAndMetrics(rawHeading);
    const text = formatted
      .replace(/[*_`#]/g, "")
      .replace(/<[^>]*>/g, "")
      .trim();
    const baseId = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    if (baseId && text) {
      const count = idCounts.get(baseId) ?? 0;
      idCounts.set(baseId, count + 1);
      const uniqueId = count === 0 ? baseId : `${baseId}-${count}`;
      items.push({ id: uniqueId, text, depth });
    }
  }
  return items;
}

const headingIdCounts = new Map<string, number>();

/**
 * Resets heading ID counter for unique markdown anchor generation.
 */
export function resetHeadingIdCounts(): void {
  headingIdCounts.clear();
}

/**
 * Custom renderer for production-ready engineering typography:
 * - Mermaid diagrams rendered as sleek architecture cards
 * - Code blocks with mac controls, language tag, syntax highlighting, and copy button
 * - Enterprise tables with rounded card styling and zebra rows
 * - Styled Sora headings with deep anchors
 * - Sleek callouts, lists, and inline code badges
 */
const customRenderer = {
  heading({ text, depth }: { text: string; depth: number }): string {
    const baseId = text
      .replace(/<[^>]*>/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const count = headingIdCounts.get(baseId) ?? 0;
    headingIdCounts.set(baseId, count + 1);
    const cleanId = count === 0 ? baseId : `${baseId}-${count}`;

    if (depth === 2) {
      return `
        <h2 id="${cleanId}" class="group mt-14 mb-5 flex items-center gap-3 border-t border-slate-100 pt-8 font-sora text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 scroll-mt-28">
          <span class="inline-block h-6 w-1 rounded-full bg-[#1155CC] shrink-0"></span>
          <span>${text}</span>
          <a href="#${cleanId}" class="opacity-0 transition-opacity group-hover:opacity-100 text-slate-300 hover:text-[#1155CC] text-lg" aria-label="Link to section">#</a>
        </h2>
      `;
    }
    if (depth === 3) {
      return `
        <h3 id="${cleanId}" class="group mt-10 mb-4 flex items-center gap-2 font-sora text-xl sm:text-2xl font-bold tracking-tight text-slate-900 scroll-mt-28">
          <span>${text}</span>
          <a href="#${cleanId}" class="opacity-0 transition-opacity group-hover:opacity-100 text-slate-300 hover:text-[#1155CC] text-base" aria-label="Link to section">#</a>
        </h3>
      `;
    }
    if (depth === 4) {
      return `
        <h4 id="${cleanId}" class="mt-8 mb-3 font-sora text-lg font-semibold text-slate-800 scroll-mt-28">
          ${text}
        </h4>
      `;
    }
    return `<h${depth} class="mt-6 mb-2 font-sora font-semibold text-slate-800">${text}</h${depth}>`;
  },

  code({ text, lang }: { text: string; lang?: string }): string {
    if (isMermaidCode(lang, text)) {
      const normalizedMermaid = normalizeMermaidCode(text);
      const nomnomlCode = mermaidToNomnoml(normalizedMermaid);
      const encodedNomnoml = encodeURIComponent(nomnomlCode);
      const encodedMermaid = encodeURIComponent(normalizedMermaid);
      const encodedRaw = encodeURIComponent(text);

      let renderedNomnomlSvg = "";
      try {
        renderedNomnomlSvg = nomnoml.renderSvg(nomnomlCode);
        renderedNomnomlSvg = renderedNomnomlSvg.replace(
          /<svg\b/,
          '<svg class="nomnoml-svg mx-auto max-w-full h-auto" style="max-width: 100%; height: auto;"',
        );
      } catch {
        renderedNomnomlSvg = "";
      }

      return `
        <div class="mermaid-diagram-card my-10 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs" data-card="diagram">
          <div class="mermaid-diagram-header flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
            <div class="flex items-center gap-2">
              <span class="inline-block h-2 w-2 rounded-full bg-[#1155CC]"></span>
              <span class="font-mono text-[11px] font-bold tracking-wider text-slate-700 uppercase">Architecture Diagram</span>
            </div>
            
            <div class="flex items-center gap-2">
              <!-- Parallel Renderer Switcher Tabs -->
              <div class="diagram-engine-tabs flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                <button type="button" class="tab-nomnoml-btn rounded-md bg-[#1155CC] px-2.5 py-1 font-mono text-[10px] font-bold text-white transition-all shadow-xs" data-mode="nomnoml">
                  Nomnoml (Full Labels)
                </button>
                <button type="button" class="tab-mermaid-btn rounded-md px-2.5 py-1 font-mono text-[10px] font-bold text-slate-500 transition-all hover:text-slate-900" data-mode="mermaid">
                  Mermaid
                </button>
              </div>

              <button type="button" class="copy-code-btn flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 shadow-2xs" data-code="${encodedRaw}">
                <svg class="h-3 w-3 copy-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                <span class="copy-text">Copy</span>
              </button>
            </div>
          </div>

          <!-- Nomnoml Container (Active by default: pristine unclipped labels pre-rendered server-side) -->
          <div class="nomnoml-diagram-view flex justify-center p-6 sm:p-8 overflow-x-auto text-center" data-nomnoml="${encodedNomnoml}">
            ${
              renderedNomnomlSvg
                ? renderedNomnomlSvg
                : `
              <div class="flex items-center gap-2 text-xs text-slate-400 py-4">
                <svg class="h-4 w-4 animate-spin text-[#1155CC]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Rendering Nomnoml architecture...</span>
              </div>
            `
            }
          </div>

          <!-- Mermaid Container (Parallel rendering, accessible via tab) -->
          <div class="mermaid-diagram-view hidden flex justify-center p-6 sm:p-8 overflow-x-auto text-center" data-mermaid="${encodedMermaid}">
            <div class="mermaid-diagram flex justify-center w-full" data-mermaid="${encodedMermaid}">
              <div class="flex items-center gap-2 text-xs text-slate-400 py-4">
                <svg class="h-4 w-4 animate-spin text-[#1155CC]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Rendering Mermaid architecture...</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    const rawLang = (lang || "").trim().toLowerCase();
    const validLang = rawLang && hljs.getLanguage(rawLang) ? rawLang : undefined;
    let highlighted: string;

    try {
      if (validLang) {
        highlighted = hljs.highlight(text, { language: validLang, ignoreIllegals: true }).value;
      } else {
        const auto = hljs.highlightAuto(text);
        highlighted = auto.value || escapeHtml(text);
      }
    } catch {
      highlighted = escapeHtml(text);
    }

    const displayLang = (rawLang || "CODE").toUpperCase();

    return `
      <div class="code-block-wrapper my-8 overflow-hidden rounded-2xl border border-slate-800 bg-[#0c1222] shadow-xl">
        <div class="code-block-header flex items-center justify-between border-b border-slate-800/80 bg-[#080d1a] px-4 py-2.5">
          <div class="flex items-center gap-2">
            <span class="h-2.5 w-2.5 rounded-full bg-[#ff5f56]"></span>
            <span class="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]"></span>
            <span class="h-2.5 w-2.5 rounded-full bg-[#27c93f]"></span>
            <span class="ml-2 font-mono text-[10px] font-bold tracking-wider text-slate-400 uppercase">${displayLang}</span>
          </div>
          <button type="button" class="copy-code-btn flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 px-2.5 py-1 text-[10px] font-bold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white" data-code="${encodeURIComponent(text)}">
            <svg class="h-3 w-3 copy-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            <span class="copy-text">Copy</span>
          </button>
        </div>
        <pre class="overflow-x-auto p-4 sm:p-5 text-xs sm:text-[13px] font-mono leading-relaxed text-slate-100"><code class="hljs ${validLang ? `language-${validLang}` : ""}">${highlighted}</code></pre>
      </div>
    `;
  },

  table(this: any, token: { header: any[]; rows: any[][] }): string {
    let headerCells = "";
    for (let r = 0; r < token.header.length; r++) {
      headerCells += this.tablecell(token.header[r]);
    }
    const headerRow = this.tablerow({ text: headerCells });

    let bodyRows = "";
    for (let r = 0; r < token.rows.length; r++) {
      const row = token.rows[r];
      let rowCells = "";
      for (let i = 0; i < row.length; i++) {
        rowCells += this.tablecell(row[i]);
      }
      bodyRows += this.tablerow({ text: rowCells });
    }

    return `
      <div class="my-8 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-left text-xs sm:text-sm">
            <thead class="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold tracking-wider text-slate-700 uppercase">
              ${headerRow}
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-600">
              ${bodyRows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  tablerow({ text }: { text: string }): string {
    return `<tr class="transition-colors hover:bg-blue-50/20 odd:bg-white even:bg-slate-50/40">${text}</tr>`;
  },

  tablecell(this: any, cell: { tokens: any[]; header: boolean; align?: string | null }): string {
    const content = this.parser ? this.parser.parseInline(cell.tokens) : "";
    const alignAttr = cell.align ? ` align="${cell.align}"` : "";
    if (cell.header) {
      return `<th class="px-5 py-3.5 font-bold text-slate-900"${alignAttr}>${content}</th>`;
    }
    return `<td class="px-5 py-3.5 leading-relaxed text-slate-600"${alignAttr}>${content}</td>`;
  },

  blockquote(this: any, token: { text: string; tokens?: any[] }): string {
    const body = this.parser && token.tokens ? this.parser.parse(token.tokens) : token.text;
    return `
      <blockquote class="my-8 rounded-2xl border-l-4 border-[#1155CC] bg-blue-50/50 p-5 shadow-xs">
        <div class="italic leading-relaxed text-slate-700 text-sm sm:text-base [&>p]:m-0">
          ${body}
        </div>
      </blockquote>
    `;
  },

  codespan({ text }: { text: string }): string {
    return `<code class="rounded-md border border-slate-200/80 bg-blue-50/70 px-2 py-0.5 font-mono text-xs font-semibold text-[#1155CC]">${text}</code>`;
  },

  image({ href, title, text }: { href: string; title?: string | null; text: string }): string {
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    return `
      <figure class="my-8 max-w-full">
        <img
          src="${escapeHtml(href)}"
          alt="${escapeHtml(text || "Article illustration")}"
          loading="lazy"
          class="w-full h-auto max-w-full rounded-2xl border border-slate-100 object-cover shadow-md"
          ${titleAttr}
        />
        ${text ? `<figcaption class="mt-2.5 text-center text-xs font-medium text-slate-400">${escapeHtml(text)}</figcaption>` : ""}
      </figure>
    `;
  },

  hr(): string {
    return `<hr class="my-12 border-slate-200/80" />`;
  },
};

/**
 * Cleans dangling bullet points or unclosed blocks from articles that may have been
 * cut off during generation.
 */
export function cleanTrailingCutoffs(md: string): string {
  if (!md || typeof md !== "string") return "";
  let cleaned = md.trim();
  // Strip trailing dangling bullet points cut off mid-sentence (e.g. `* **Why` or `- **` or `• **`)
  cleaned = cleaned.replace(/[\n\r]\s*[-*•]\s*\*\*[^*]*$/g, "");
  // Close unclosed fenced code blocks
  const codeBlockCount = (cleaned.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) {
    cleaned += "\n```";
  }
  return cleaned;
}

// Apply custom renderer & options
marked.use({
  gfm: true,
  breaks: true,
  renderer: customRenderer,
});

/**
 * Converts Markdown text into production-ready semantic HTML with rich styling.
 */
export function renderMarkdownToHtml(markdown: string): string {
  if (!markdown || typeof markdown !== "string") {
    return "";
  }

  try {
    resetHeadingIdCounts();
    const cleaned = cleanTrailingCutoffs(markdown);
    const preprocessed = preprocessMarkdownMath(cleaned);
    const html = marked.parse(preprocessed);
    if (typeof html === "string") {
      return html;
    }
    return String(html);
  } catch {
    return markdown;
  }
}

/**
 * Converts Markdown text into bulletproof, 100% inline-styled HTML for email clients
 * (Gmail, Outlook, Apple Mail, newsletter distribution).
 * Completely eliminates stripped classes, client-side scripts, and broken flexbox/grid.
 */
export function renderMarkdownForEmail(markdown: string): string {
  if (!markdown || typeof markdown !== "string") {
    return "";
  }

  try {
    const cleaned = cleanTrailingCutoffs(markdown);
    const preprocessed = preprocessMarkdownMath(cleaned);

    const emailRenderer = new marked.Renderer();

    emailRenderer.heading = ({ text, depth }: { text: string; depth: number }) => {
      const cleanText = text.replace(/<[^>]*>/g, "");
      const fontSize = depth === 2 ? "20px" : depth === 3 ? "17px" : "15px";
      const borderTop =
        depth === 2
          ? "border-top: 1px solid #e2e8f0; padding-top: 18px; margin-top: 24px;"
          : "margin-top: 18px;";
      return `<h${depth} style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: ${fontSize}; font-weight: 800; color: #0f172a; margin-bottom: 8px; line-height: 1.3; ${borderTop}">${cleanText}</h${depth}>`;
    };

    emailRenderer.paragraph = ({ text }: { text: string }) => {
      return `<p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.65; color: #334155; margin-top: 0; margin-bottom: 14px;">${text}</p>`;
    };

    emailRenderer.code = ({ text, lang }: { text: string; lang?: string }) => {
      if (isMermaidCode(lang, text)) {
        return `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
            <tr>
              <td style="padding: 12px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 700; color: #1155cc; border-bottom: 1px solid #e2e8f0;">
                ❖ Architecture Diagram
              </td>
            </tr>
            <tr>
              <td style="padding: 14px 16px; font-family: Consolas, Monaco, monospace; font-size: 11px; line-height: 1.5; color: #475569; background: #ffffff;">
                <pre style="margin: 0; white-space: pre-wrap; font-family: Consolas, Monaco, monospace;">${escapeHtml(text.slice(0, 300))}${text.length > 300 ? "..." : ""}</pre>
                <div style="margin-top: 8px; font-size: 11px; font-weight: 600; color: #1155cc;">Interactive diagram renders on the web version &rarr;</div>
              </td>
            </tr>
          </table>
        `;
      }

      return `
        <div style="margin: 16px 0; background: #0c1222; border: 1px solid #1e293b; border-radius: 8px; overflow: hidden;">
          <div style="background: #080d1a; padding: 6px 12px; border-bottom: 1px solid #1e293b; font-family: monospace; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">
            ${escapeHtml((lang || "code").toUpperCase())}
          </div>
          <pre style="margin: 0; padding: 12px 14px; background: #0c1222; color: #f1f5f9; font-family: Consolas, Monaco, 'Courier New', monospace; font-size: 12px; line-height: 1.5; overflow-x: auto; white-space: pre;"><code>${escapeHtml(text)}</code></pre>
        </div>
      `;
    };

    emailRenderer.codespan = ({ text }: { text: string }) => {
      return `<code style="font-family: Consolas, Monaco, monospace; font-size: 12px; background: #eff6ff; color: #1155cc; padding: 2px 5px; border-radius: 4px; border: 1px solid #dbeafe;">${text}</code>`;
    };

    emailRenderer.blockquote = ({ text }: { text: string }) => {
      return `<div style="margin: 16px 0; padding: 12px 16px; border-left: 4px solid #1155cc; background: #eff6ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-style: italic; color: #1e3a8a; border-radius: 0 8px 8px 0;"><p style="margin: 0; font-size: 13px; line-height: 1.6;">${text}</p></div>`;
    };

    emailRenderer.image = ({ href, text }: { href: string; text: string }) => {
      return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text || "Article Graphic")}" style="width: 100%; max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; display: block; border: 1px solid #e2e8f0;" />`;
    };

    emailRenderer.table = function (this: any, token: { header: any[]; rows: any[][] }) {
      let headerCells = "";
      for (let r = 0; r < token.header.length; r++) {
        headerCells += `<th style="border: 1px solid #e2e8f0; padding: 8px 12px; background: #f8fafc; font-weight: 700; color: #0f172a;">${this.parser ? this.parser.parseInline(token.header[r].tokens) : ""}</th>`;
      }
      let bodyRows = "";
      for (let r = 0; r < token.rows.length; r++) {
        let rowCells = "";
        for (let i = 0; i < token.rows[r].length; i++) {
          rowCells += `<td style="border: 1px solid #e2e8f0; padding: 8px 12px; color: #334155;">${this.parser ? this.parser.parseInline(token.rows[r][i].tokens) : ""}</td>`;
        }
        bodyRows += `<tr>${rowCells}</tr>`;
      }

      return `
        <div style="margin: 16px 0; overflow-x: auto;">
          <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; border: 1px solid #e2e8f0;">
            <thead style="background: #f8fafc; color: #0f172a; text-align: left;"><tr>${headerCells}</tr></thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </div>
      `;
    };

    const parsed = marked.parse(preprocessed, {
      renderer: emailRenderer,
      gfm: true,
      breaks: true,
    });
    return typeof parsed === "string" ? parsed : String(parsed);
  } catch {
    return `<p style="font-family: sans-serif; font-size: 14px; line-height: 1.6; color: #334155;">${escapeHtml(markdown).replace(/\n/g, "<br/>")}</p>`;
  }
}
