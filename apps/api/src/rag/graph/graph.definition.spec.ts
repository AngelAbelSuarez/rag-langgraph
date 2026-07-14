import { createGraph } from './graph.definition';
import { Document } from '@langchain/core/documents';
import type { EmbeddingProvider } from '../../common/providers/embedding-provider.interface';
import type { VectorStoreProvider } from '../../common/providers/vector-store.interface';
import type { ChatModelProvider } from '../../common/providers/chat-model.interface';
import type { RerankerProvider } from '../../common/providers/reranker.interface';
import type { RagStateType } from './state';

describe('RAG Graph', () => {
  let mockEmbedding: jest.Mocked<EmbeddingProvider>;
  let mockVectorStore: jest.Mocked<VectorStoreProvider>;
  let mockChatModel: jest.Mocked<ChatModelProvider>;
  let mockReranker: jest.Mocked<RerankerProvider>;

  beforeEach(() => {
    mockEmbedding = {
      embed: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
      embedBatch: jest.fn(),
    };

    mockVectorStore = {
      search: jest.fn().mockResolvedValue([
        { id: 'chunk-1', score: 0.92, payload: { content: 'Paris is the capital of France.', documentId: 'doc-1', sourceType: 'markdown', chunkIndex: 0 } },
      ]),
      upsert: jest.fn(),
      delete: jest.fn(),
      listCollections: jest.fn(),
    };

    mockReranker = {
      rerank: jest.fn().mockImplementation(async (_query: string, docs: Document[]) =>
        docs.map((doc: Document, i: number) => ({ index: i, relevanceScore: 0.85 - i * 0.05, document: doc })),
      ),
    };

    mockChatModel = {
      generate: jest.fn(),
      generateStream: jest.fn(),
    };
  });

  it('should compile without errors', () => {
    const app = createGraph({
      embeddingProvider: mockEmbedding,
      vectorStoreProvider: mockVectorStore,
      chatModelProvider: mockChatModel,
      rerankerProvider: mockReranker,
    });

    expect(app).toBeDefined();
  });

  it('should run full flow: retrieve → grade → generate → check → END', async () => {
    mockChatModel.generate
      .mockResolvedValueOnce({ content: 'YES' })
      .mockResolvedValueOnce({ content: 'Paris is the capital of France, a city located in Europe.' })
      .mockResolvedValueOnce({ content: 'YES' });

    const app = createGraph({
      embeddingProvider: mockEmbedding,
      vectorStoreProvider: mockVectorStore,
      chatModelProvider: mockChatModel,
      rerankerProvider: mockReranker,
    });

    const initialState: Partial<RagStateType['State']> = {
      question: 'What is the capital of France?',
      documents: [],
      relevantDocuments: [],
      rewrittenQuestion: '',
      generation: '',
      isGrounded: false,
      retrievalAttempts: 0,
      generationAttempts: 0,
      conversationId: 'test-conv',
    };

    const events: RagStateType['State'][] = [];
    const stream = await app.stream(initialState, { streamMode: 'values' });
    for await (const event of stream) {
      events.push(event);
    }

    expect(events.length).toBeGreaterThan(0);
    const finalState = events[events.length - 1];
    expect(finalState.generation).toBeTruthy();
    expect(finalState.isGrounded).toBe(true);

    const nodeNames = events.map(e => e.generation ? 'generate' : e.relevantDocuments?.length > 0 ? 'grade' : 'retrieve');
    expect(nodeNames).toContain('retrieve');
  });
});
