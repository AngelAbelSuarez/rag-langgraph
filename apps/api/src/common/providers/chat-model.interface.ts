import { Document } from '@langchain/core/documents';
import { ChatMessage } from '@rag/shared';

export interface ChatModelProvider {
  generate(systemPrompt: string, messages: ChatMessage[], context: Document[]): Promise<GenerationResult>;
  generateStream(systemPrompt: string, messages: ChatMessage[], context: Document[]): AsyncIterable<GenerationResult>;
}

export interface GenerationResult {
  content: string;
  tokenUsage?: { prompt: number; completion: number; total: number };
}
