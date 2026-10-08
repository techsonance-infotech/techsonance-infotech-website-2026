import fs from "node:fs";
import path from "node:path";

export interface KBChunk {
  id: string;
  topic: string;
  title: string;
  text: string;
  tags: string[];
}

export interface FAQEntry {
  id: string;
  q: string;
  aliases: string[];
  a: string;
  cta?: boolean;
  tags: string[];
}

function parseMarkdownIntoChunks(filePath: string, topic: string): KBChunk[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const chunks: KBChunk[] = [];

  let currentTitle = topic;
  let currentLines: string[] = [];
  let sectionIndex = 0;

  for (const line of lines) {
    if (line.startsWith("# ") || line.startsWith("## ") || line.startsWith("### ")) {
      if (currentLines.length > 0) {
        const text = currentLines.join("\n").trim();
        if (text) {
          chunks.push({
            id: `${topic}-${sectionIndex++}`,
            topic,
            title: currentTitle,
            text,
            tags: [topic, ...currentTitle.toLowerCase().split(/\s+/).filter(Boolean)],
          });
        }
        currentLines = [];
      }
      currentTitle = line.replace(/^#+\s*/, "").trim();
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    const text = currentLines.join("\n").trim();
    if (text) {
      chunks.push({
        id: `${topic}-${sectionIndex++}`,
        topic,
        title: currentTitle,
        text,
        tags: [topic, ...currentTitle.toLowerCase().split(/\s+/).filter(Boolean)],
      });
    }
  }

  return chunks;
}

export function buildKnowledgeBase() {
  const rootDir = process.cwd();
  const kbDir = path.resolve(rootDir, "data/kb");
  const faqFile = path.resolve(rootDir, "data/faq.json");
  const outputFile = path.resolve(rootDir, "data/kb.index.json");

  const isStrict =
    process.argv.includes("--strict") || process.env.ALLOW_PLACEHOLDERS === "false";

  console.log("🔨 Building Knowledge Base Index...");
  const allChunks: KBChunk[] = [];

  // 1. Process Markdown files
  if (fs.existsSync(kbDir)) {
    const files = fs.readdirSync(kbDir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const topic = path.basename(file, ".md");
      const filePath = path.join(kbDir, file);
      const chunks = parseMarkdownIntoChunks(filePath, topic);
      allChunks.push(...chunks);
    }
  }

  // 2. Process FAQ entries
  if (fs.existsSync(faqFile)) {
    const rawFAQ = fs.readFileSync(faqFile, "utf-8");
    const faqEntries: FAQEntry[] = JSON.parse(rawFAQ);

    for (const faq of faqEntries) {
      const aliasesStr = faq.aliases.join(" | ");
      allChunks.push({
        id: `faq-${faq.id}`,
        topic: "faq",
        title: faq.q,
        text: `Question: ${faq.q}\nAlternative phrasings: ${aliasesStr}\nAnswer: ${faq.a}`,
        tags: ["faq", ...(faq.tags || [])],
      });
    }
  }

  // 3. Strict mode placeholder check
  if (isStrict) {
    const placeholderRegex = /\{\{[^}]*\}\}/g;
    const violations: { id: string; match: string }[] = [];

    for (const chunk of allChunks) {
      const matches = chunk.text.match(placeholderRegex);
      if (matches) {
        for (const m of matches) {
          violations.push({ id: chunk.id, match: m });
        }
      }
    }

    if (violations.length > 0) {
      console.error(
        `\n❌ Strict validation failed: Found ${violations.length} unresolved placeholders {{...}}:`
      );
      for (const v of violations.slice(0, 10)) {
        console.error(`   • Chunk ${v.id}: ${v.match}`);
      }
      if (violations.length > 10) {
        console.error(`   ... and ${violations.length - 10} more.`);
      }
      process.exit(1);
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(allChunks, null, 2), "utf-8");
  console.log(`✅ Knowledge Base built successfully: ${allChunks.length} chunks indexed in data/kb.index.json`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildKnowledgeBase();
}
