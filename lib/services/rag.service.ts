import { inject } from "@needle-di/core";
import { evaluateGate, type GateResult } from "../rag/gate";
import { KBSearchService, type RetrievedChunk } from "./kb-search.service";

export class RAGService {
  constructor(private searchService: KBSearchService = inject(KBSearchService)) {}

  evaluateGate(query: string): GateResult {
    return evaluateGate(query);
  }

  search(query: string, k = 3): RetrievedChunk[] {
    return this.searchService.retrieve(query, k);
  }

  getKBStats(): { totalChunks: number; faqCount: number } {
    return this.searchService.getKBStats();
  }
}
