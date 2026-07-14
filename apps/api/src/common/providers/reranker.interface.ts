import { Document } from '@langchain/core/documents';

export interface RerankerProvider {
  rerank(query: string, documents: Document[]): Promise<RankedDocument[]>;
}

export interface RankedDocument {
  index: number;
  relevanceScore: number;
  document: Document;
}
