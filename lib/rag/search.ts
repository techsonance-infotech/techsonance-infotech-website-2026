import { KBSearchService, type RetrievedChunk } from "../services/kb-search.service";

export type { RetrievedChunk };

let defaultSearchService: KBSearchService | null = null;

function getSearchService(): KBSearchService {
  if (!defaultSearchService) {
    defaultSearchService = new KBSearchService();
  }
  return defaultSearchService;
}

export function retrieve(query: string, k = 3): RetrievedChunk[] {
  return getSearchService().retrieve(query, k);
}
