export interface VectorStoreProvider {
  upsert(points: Point[]): Promise<void>;
  search(query: number[], filter?: Record<string, unknown>, topK?: number): Promise<ScoredPoint[]>;
  delete(ids: string[]): Promise<void>;
  listCollections(): Promise<string[]>;
}

export interface Point {
  id: string;
  vector: number[];
  payload?: Record<string, unknown>;
}

export interface ScoredPoint {
  id: string;
  score: number;
  payload?: Record<string, unknown>;
}
