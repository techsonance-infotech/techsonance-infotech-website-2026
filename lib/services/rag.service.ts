import { evaluateGate, type GateResult } from "../rag/gate";
import { retrieve, type RetrievedChunk } from "../rag/search";

export class RAGService {
  evaluateGate(query: string): GateResult {
    return evaluateGate(query);
  }

  search(query: string, k = 3): RetrievedChunk[] {
    return retrieve(query, k);
  }
}
