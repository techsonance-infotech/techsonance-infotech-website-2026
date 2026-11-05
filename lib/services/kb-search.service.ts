import "server-only";
import { getKBIndex, kbChunks, faqList, type KBChunk } from "../rag/kb";
import { expandQuerySynonyms } from "../rag/synonyms";

export interface RetrievedChunk {
  chunk: KBChunk;
  score: number;
  normalizedScore: number;
}

export class KBSearchService {
  retrieve(query: string, k = 3): RetrievedChunk[] {
    const index = getKBIndex();
    const expandedQuery = expandQuerySynonyms(query);

    const rawResults = index.search(expandedQuery, {
      boost: { title: 2.2, tags: 1.5, text: 1.0 },
      fuzzy: 0.2,
      prefix: true,
    });

    if (rawResults.length === 0) {
      return [];
    }

    const maxScore = rawResults[0].score || 1;

    const topResults = rawResults.slice(0, k).map((res) => {
      const chunk: KBChunk = {
        id: res.id,
        topic: res.topic,
        title: res.title,
        text: res.text,
        tags: res.tags || [],
      };
      return {
        chunk,
        score: res.score,
        normalizedScore: Math.min(1.0, res.score / Math.max(maxScore, 10)),
      };
    });

    return topResults;
  }

  getKBStats(): { totalChunks: number; faqCount: number } {
    return {
      totalChunks: kbChunks.length,
      faqCount: faqList.length,
    };
  }
}
