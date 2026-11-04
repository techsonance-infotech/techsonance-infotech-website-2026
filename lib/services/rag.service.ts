import { evaluateGate, type GateResult } from "../rag/gate";
import { retrieve, type RetrievedChunk } from "../rag/search";
import { kbChunks, faqList } from "../rag/kb";

export class RAGService {
  evaluateGate(query: string): GateResult {
    return evaluateGate(query);
  }

  search(query: string, k = 3): RetrievedChunk[] {
    return retrieve(query, k);
  }

  getKBStats(): { totalChunks: number; faqCount: number } {
    return {
      totalChunks: kbChunks.length,
      faqCount: faqList.length,
    };
  }
}
