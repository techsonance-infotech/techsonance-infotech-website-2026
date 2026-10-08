import { getKBIndex, type KBChunk } from "./kb";
import { expandQuerySynonyms } from "./synonyms";

export interface RetrievedChunk {
  chunk: KBChunk;
  score: number;
  normalizedScore: number;
}

export function retrieve(query: string, k = 3): RetrievedChunk[] {
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

  // MiniSearch scores are based on BM25-like weights
  // Normalize top scores to 0..1 scale
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
