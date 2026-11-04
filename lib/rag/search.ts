import { getContainer } from "../di/container";
import { KBSearchService, type RetrievedChunk } from "../services/kb-search.service";

export type { RetrievedChunk };

export function retrieve(query: string, k = 3): RetrievedChunk[] {
  return getContainer().get(KBSearchService).retrieve(query, k);
}
