import { describe, it, expect } from "vitest";
import {
  renderMarkdownToHtml,
  extractTableOfContents,
  mermaidToNomnoml,
  normalizeMermaidCode,
} from "@/lib/utils/markdown";

describe("renderMarkdownToHtml", () => {
  it("returns empty string for empty input", () => {
    expect(renderMarkdownToHtml("")).toBe("");
  });

  it("converts headings with anchors and ids", () => {
    const md = "## Section Heading\n\n### Subheading";
    const html = renderMarkdownToHtml(md);
    expect(html).toContain('<h2 id="section-heading"');
    expect(html).toContain("Section Heading");
    expect(html).toContain('<h3 id="subheading"');
    expect(html).toContain("Subheading");
  });

  it("renders blockquotes with parsed inline formatting like bold and italics", () => {
    const md =
      "> **Bottom line:** Zero-cold-start is not a magical claim; it is a *deterministic* budget with **connection pooling**.";
    const html = renderMarkdownToHtml(md);
    expect(html).toContain("<strong>Bottom line:</strong>");
    expect(html).toContain("<em>deterministic</em>");
    expect(html).toContain("<strong>connection pooling</strong>");
  });

  it("strips dangling unfinished bullet points cut off at article end", () => {
    const mdWithCutoff = "Paragraph text.\n\n• **Why";
    const html = renderMarkdownToHtml(mdWithCutoff);
    expect(html).not.toContain("• **Why");
    expect(html).toContain("Paragraph text.");
  });

  it("converts bold and inline code with styled badge", () => {
    const md = "This is **bold** text and `code snippet`.";
    const html = renderMarkdownToHtml(md);
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("code snippet");
    expect(html).toContain("<code class=");
  });

  it("converts code blocks with syntax highlighting and copy button", () => {
    const md = "```typescript\nconst x = 42;\n```";
    const html = renderMarkdownToHtml(md);
    expect(html).toContain("code-block-wrapper");
    expect(html).toContain("copy-code-btn");
    expect(html).toContain("TYPESCRIPT");
    expect(html).toContain("hljs-keyword");
  });

  it("converts unordered and ordered lists", () => {
    const md = "- Item 1\n- Item 2\n\n1. First\n2. Second";
    const html = renderMarkdownToHtml(md);
    expect(html).toContain("<ul");
    expect(html).toContain("<li>Item 1</li>");
    expect(html).toContain("<ol");
    expect(html).toContain("<li>First</li>");
  });

  it("preserves existing HTML blocks alongside markdown", () => {
    const mixed = '<div class="test-block"><p>Legacy content</p></div>\n\n## Markdown Header';
    const html = renderMarkdownToHtml(mixed);
    expect(html).toContain('<div class="test-block"><p>Legacy content</p></div>');
    expect(html).toContain("Markdown Header");
  });

  it("renders tables with responsive container and zebra rows", () => {
    const md = `| Col 1 | Col 2 |\n|---|---|\n| Val 1 | Val 2 |`;
    const html = renderMarkdownToHtml(md);
    expect(html).toContain("<table");
    expect(html).toContain("<th");
    expect(html).toContain("Col 1");
    expect(html).toContain("Val 1");
  });

  it("renders mermaid diagrams as interactive architecture cards with parallel Nomnoml support", () => {
    const mdWithMermaidTag = "```mermaid\nflowchart TD\nA[Start] --> B[End]\n```";
    const html1 = renderMarkdownToHtml(mdWithMermaidTag);
    expect(html1).toContain("mermaid-diagram-card");
    expect(html1).toContain("data-mermaid");
    expect(html1).toContain("data-nomnoml");
    expect(html1).toContain("Architecture Diagram");
    expect(html1).toContain("Nomnoml (Full Labels)");
    expect(html1).toContain("Mermaid");
    expect(html1).toContain("nomnoml-svg");
    expect(html1).toContain("<svg");
    expect(html1).toContain('data-mode="nomnoml"');
    expect(html1).toContain('data-mode="mermaid"');

    const mdUntaggedFlowchart =
      "```\ngraph LR\nA[Client] -->|Write| B[Primary DB (region us-east-1)]\n```";
    const html2 = renderMarkdownToHtml(mdUntaggedFlowchart);
    expect(html2).toContain("mermaid-diagram-card");
    expect(html2).toContain("data-mermaid");
    // Verify quotes are added to handle parentheses in node labels
    const mermaidMatch2 = html2.match(/data-mermaid="([^"]+)"/);
    expect(decodeURIComponent(mermaidMatch2?.[1] || "")).toContain(
      'B["Primary DB (region us-east-1)"]',
    );

    // Test complex AI generated flowchart with unicode arrows, escaped newlines, and chained arrows
    const mdComplexAI = `\`\`\`mermaid
flowchart LR
Client["Browser / Mobile"] → |HTTPS| APIGW["API Gateway (Supabase Edge)"]
APIGW → |POST /functions/v1/*| EdgeFn["Supabase Edge Function\\n(Drizzle ORM)"]
Postgres → |row-level security (RLS)| | EdgeFn
EdgeFn → |JSON payload| APIGW → |HTTPS| Client
\`\`\``;
    const html3 = renderMarkdownToHtml(mdComplexAI);
    expect(html3).toContain("mermaid-diagram-card");
    const mermaidMatch3 = html3.match(/data-mermaid="([^"]+)"/);
    const decoded3 = decodeURIComponent(mermaidMatch3?.[1] || "");
    expect(decoded3).toContain("-->|HTTPS| APIGW");
    expect(decoded3).toContain("<br/>");
    expect(decoded3).toContain("-->|row-level security (RLS)| EdgeFn");
    expect(decoded3).toContain("-->|JSON payload| APIGW");
    expect(decoded3).toContain("APIGW -->|HTTPS| Client");
  });

  it("formats math subscripts and metric percentiles", () => {
    const md = `
| DATA ACCESS LAYER | COLD-START LATENCY ($P_{99}$) | WARM-INVOCATION LATENCY ($P_{50}$) |
|---|---|---|
| Drizzle ORM | 215 ms | 19 ms |

* 99th-Percentile Latency ($p_{99}$): Captures the tail-end distribution. In serverless, $p_{99}$ spikes occur.
* Total Cost Per Million Requests ($TPMS): A composite financial metric.
* Pricing is $10.50 per month and $0.002 /gen.
* Inline code \`const $p_{99} = 100;\` is preserved.
    `;
    const html = renderMarkdownToHtml(md);
    expect(html).toContain("COLD-START LATENCY (P<sub>99</sub>)");
    expect(html).toContain("WARM-INVOCATION LATENCY (P<sub>50</sub>)");
    expect(html).toContain("99th-Percentile Latency (p<sub>99</sub>)");
    expect(html).toContain("serverless, p<sub>99</sub> spikes");
    expect(html).toContain("Total Cost Per Million Requests (TPMS)");
    expect(html).toContain("$10.50");
    expect(html).toContain("$0.002");
    expect(html).toContain("const $p_{99} = 100;");
    expect(html).toContain("<code class=");
  });
});

describe("extractTableOfContents", () => {
  it("extracts h2 and h3 headings with slugs", () => {
    const md = `
# Title (ignored)
## Architecture Overview
Some intro text.
### Component Diagram
More text.
## Deployment Strategy
    `;
    const toc = extractTableOfContents(md);
    expect(toc).toHaveLength(3);
    expect(toc[0]).toEqual({
      id: "architecture-overview",
      text: "Architecture Overview",
      depth: 2,
    });
    expect(toc[1]).toEqual({
      id: "component-diagram",
      text: "Component Diagram",
      depth: 3,
    });
    expect(toc[2]).toEqual({
      id: "deployment-strategy",
      text: "Deployment Strategy",
      depth: 2,
    });
  });
});

describe("mermaidToNomnoml", () => {
  it("translates flowchart LR with edge labels to Nomnoml format", () => {
    const mermaid = `
flowchart LR
Client["Browser / Mobile"] -->|Write| PrimaryDB["Primary DB"]
Client -->|Read| ReadReplica["Read-Replica"]
PrimaryDB -->|Edge Function| Supabase["Supabase"]
PrimaryDB -->|Logical Replication| ReadReplica
    `;
    const nomnoml = mermaidToNomnoml(mermaid);
    expect(nomnoml).toContain("#direction: right");
    expect(nomnoml).toContain("#stroke: #1155cc");
    expect(nomnoml).toContain("[Browser / Mobile] - Write > [Primary DB]");
    expect(nomnoml).toContain("[Browser / Mobile] - Read > [Read-Replica]");
    expect(nomnoml).toContain("[Primary DB] - Edge Function > [Supabase]");
    expect(nomnoml).toContain("[Primary DB] - Logical Replication > [Read-Replica]");
  });

  it("translates flowchart TD to down direction", () => {
    const mermaid = `
flowchart TD
A[Start] --> B[Processing]
B --> C[Done]
    `;
    const nomnoml = mermaidToNomnoml(mermaid);
    expect(nomnoml).toContain("#direction: down");
    expect(nomnoml).toContain("[Start] -> [Processing]");
    expect(nomnoml).toContain("[Processing] -> [Done]");
  });

  it("normalizes unicode arrows outside labels while preserving arrows inside pipe labels", () => {
    const raw = `
flowchart TD
    A[Browser] → B[Edge POP]
    B -->|Fetch prompt → LLM API| C[LLM Provider]
    `;
    const normalized = normalizeMermaidCode(raw);
    expect(normalized).toContain("A[Browser] --> B[Edge POP]");
    expect(normalized).toContain("|Fetch prompt -> LLM API|");
    expect(normalized).not.toContain("|Fetch prompt --> LLM API|");
  });
});
