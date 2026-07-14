export interface Document {
  id: string;
  filename: string;
  sourceType: 'pdf' | 'markdown';
  status: 'pending' | 'processing' | 'ready' | 'failed';
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Chunk {
  id: string;
  documentId: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceCitation[];
  timestamp: string;
}

export interface SourceCitation {
  documentId: string;
  documentName: string;
  chunkId: string;
  content: string;
  relevance: number;
}

export interface RAGRequest {
  question: string;
  conversationId?: string;
}

export interface RAGResponse {
  answer: string;
  sources: SourceCitation[];
  conversationId: string;
}
