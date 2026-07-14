import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Document } from '@langchain/core/documents';
import { RAGResponse, SourceCitation } from '@rag/shared';
import { EmbeddingProvider } from '../common/providers/embedding-provider.interface.js';
import { VectorStoreProvider } from '../common/providers/vector-store.interface.js';
import { ChatModelProvider } from '../common/providers/chat-model.interface.js';
import { RerankerProvider } from '../common/providers/reranker.interface.js';
import { RagState } from './graph/state.js';
import { createGraph } from './graph/graph.definition.js';
import { LangSmithTracer } from './langsmith.tracer.js';

@Injectable()
export class RagService {
  constructor(
    @Inject('EMBEDDING_PROVIDER') private readonly embeddingProvider: EmbeddingProvider,
    @Inject('VECTOR_STORE_PROVIDER') private readonly vectorStoreProvider: VectorStoreProvider,
    @Inject('CHAT_MODEL_PROVIDER') private readonly chatModelProvider: ChatModelProvider,
    @Inject('RERANKER_PROVIDER') private readonly rerankerProvider: RerankerProvider,
    private readonly tracer: LangSmithTracer,
  ) {}

  async answer(question: string, conversationId?: string): Promise<RAGResponse> {
    const convId = conversationId ?? randomUUID();

    const app = createGraph({
      embeddingProvider: this.embeddingProvider,
      vectorStoreProvider: this.vectorStoreProvider,
      chatModelProvider: this.chatModelProvider,
      rerankerProvider: this.rerankerProvider,
    });

    let finalState: typeof RagState.State | undefined;

    await this.tracer.trace(question, async () => {
      const initialState = {
        question,
        documents: [],
        relevantDocuments: [],
        rewrittenQuestion: '',
        generation: '',
        isGrounded: false,
        retrievalAttempts: 0,
        generationAttempts: 0,
        conversationId: convId,
      };

      const stream = await app.stream(initialState, {
        streamMode: 'values',
      });

      for await (const event of stream) {
        finalState = event;
      }
    });

    if (!finalState) {
      return { answer: '', sources: [], conversationId: convId };
    }

    return {
      answer: finalState.generation ?? '',
      sources: this.buildCitations(finalState.relevantDocuments ?? []),
      conversationId: convId,
    };
  }

  async *answerStream(question: string, conversationId?: string): AsyncIterable<RAGResponse> {
    const convId = conversationId ?? randomUUID();

    const app = createGraph({
      embeddingProvider: this.embeddingProvider,
      vectorStoreProvider: this.vectorStoreProvider,
      chatModelProvider: this.chatModelProvider,
      rerankerProvider: this.rerankerProvider,
    });

    const initialState = {
      question,
      documents: [],
      relevantDocuments: [],
      rewrittenQuestion: '',
      generation: '',
      isGrounded: false,
      retrievalAttempts: 0,
      generationAttempts: 0,
      conversationId: convId,
    };

    const stream = await app.stream(initialState, {
      streamMode: 'values',
    });

    for await (const event of stream) {
      if (event.generation) {
        yield {
          answer: event.generation,
          sources: this.buildCitations(event.relevantDocuments ?? []),
          conversationId: convId,
        };
      }
    }
  }

  private buildCitations(documents: Document[]): SourceCitation[] {
    return documents.map((doc) => ({
      documentId: (doc.metadata?.documentId as string) ?? '',
      documentName: (doc.metadata?.documentName as string) ?? (doc.metadata?.documentId as string) ?? '',
      chunkId: (doc.metadata?.chunkId as string) ?? '',
      content: doc.pageContent,
      relevance: (doc.metadata?.relevanceScore as number) ?? 0,
    }));
  }
}
