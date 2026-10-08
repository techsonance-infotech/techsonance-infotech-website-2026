import { faqList, type FAQItem } from "./kb";
import { BOT_CONFIG } from "../config";
import { expandQuerySynonyms } from "./synonyms";

export interface FAQMatchResult {
  faq: FAQItem;
  score: number;
  isDirect: boolean;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchFAQ(query: string): FAQMatchResult | null {
  const normQuery = normalizeText(query);
  if (!normQuery) return null;

  // 1. Exact or Substring match on Question or Aliases (Score = 1.0)
  for (const faq of faqList) {
    const normQ = normalizeText(faq.q);
    if (normQ === normQuery) {
      return { faq, score: 1.0, isDirect: true };
    }
    for (const alias of faq.aliases) {
      const normAlias = normalizeText(alias);
      if (normAlias === normQuery) {
        return { faq, score: 1.0, isDirect: true };
      }
      // Substring check for short queries or direct intent phrases
      if (normQuery.length > 5 && normAlias.length > 5) {
        if (normQuery.includes(normAlias) || normAlias.includes(normQuery)) {
          return { faq, score: 0.95, isDirect: true };
        }
      }
    }
  }

  // 2. Token-overlap / Jaccard similarity across questions and aliases
  const queryTokens = new Set(normalizeText(expandQuerySynonyms(query)).split(" "));
  let bestFaq: FAQItem | null = null;
  let bestScore = 0;

  for (const faq of faqList) {
    const candidateTexts = [faq.q, ...faq.aliases];
    for (const cand of candidateTexts) {
      const candTokens = new Set(normalizeText(cand).split(" "));
      let intersection = 0;
      for (const t of queryTokens) {
        if (candTokens.has(t) && t.length > 2) {
          intersection++;
        }
      }
      const union = new Set([...queryTokens, ...candTokens]).size;
      const jaccard = union > 0 ? (intersection * 1.5) / union : 0;

      if (jaccard > bestScore) {
        bestScore = jaccard;
        bestFaq = faq;
      }
    }
  }

  const threshold = BOT_CONFIG.thresholds.faqDirectMinScore;
  if (bestFaq && bestScore >= threshold) {
    return {
      faq: bestFaq,
      score: Math.min(1.0, bestScore),
      isDirect: true,
    };
  }

  return null;
}
