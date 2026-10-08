import MiniSearch from "minisearch";
import rawKbData from "../../data/kb.index.json";
import rawFaqData from "../../data/faq.json";

export interface KBChunk {
  id: string;
  topic: string;
  title: string;
  text: string;
  tags: string[];
}

export interface FAQItem {
  id: string;
  q: string;
  aliases: string[];
  a: string;
  cta?: boolean;
  tags: string[];
}

export const kbChunks: KBChunk[] = rawKbData as KBChunk[];
export const faqList: FAQItem[] = rawFaqData as FAQItem[];

let miniSearchInstance: MiniSearch<KBChunk> | null = null;

export function getKBIndex(): MiniSearch<KBChunk> {
  if (miniSearchInstance) return miniSearchInstance;

  miniSearchInstance = new MiniSearch<KBChunk>({
    fields: ["title", "text", "tags"],
    storeFields: ["id", "topic", "title", "text", "tags"],
    searchOptions: {
      boost: { title: 2.2, tags: 1.5, text: 1.0 },
      fuzzy: 0.2,
      prefix: true,
      combineWith: "OR",
    },
  });

  miniSearchInstance.addAll(kbChunks);
  return miniSearchInstance;
}
