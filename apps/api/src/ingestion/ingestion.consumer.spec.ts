jest.mock('pdf-parse', () => jest.fn().mockResolvedValue({ text: 'parsed pdf text' }));

jest.mock('node:fs/promises', () => ({
  readFile: jest.fn().mockImplementation((_path: string, encoding?: string | null) => {
    if (encoding === 'utf-8') return Promise.resolve('markdown content');
    return Promise.resolve(Buffer.from('pdf binary'));
  }),
}));

import { IngestionConsumer } from './ingestion.consumer';
import type { EmbeddingProvider } from '../common/providers/embedding-provider.interface';
import type { VectorStoreProvider } from '../common/providers/vector-store.interface';
import { ChunkingService } from './chunking.service';
import { IngestionService } from './ingestion.service';
import { LangSmithTracer } from './langsmith.tracer';
import type { Job } from 'bull';

describe('IngestionConsumer', () => {
  let consumer: IngestionConsumer;
  let mockEmbeddingProvider: jest.Mocked<EmbeddingProvider>;
  let mockVectorStore: jest.Mocked<VectorStoreProvider>;
  let mockChunkingService: jest.Mocked<ChunkingService>;
  let mockIngestionService: jest.Mocked<IngestionService>;
  let mockTracer: jest.Mocked<LangSmithTracer>;

  const fakeRunTree = { end: jest.fn(), postRun: jest.fn() };

  beforeEach(() => {
    mockEmbeddingProvider = {
      embed: jest.fn(),
      embedBatch: jest.fn().mockResolvedValue([[0.1, 0.2], [0.3, 0.4]]),
    };

    mockVectorStore = {
      upsert: jest.fn().mockResolvedValue(undefined),
      search: jest.fn(),
      delete: jest.fn(),
      listCollections: jest.fn(),
    };

    mockChunkingService = {
      chunk: jest.fn().mockResolvedValue([
        { id: 'chunk-1', documentId: 'doc-1', content: 'first chunk', metadata: { sourceType: 'markdown' } },
        { id: 'chunk-2', documentId: 'doc-1', content: 'second chunk', metadata: { sourceType: 'markdown' } },
      ]),
    } as unknown as jest.Mocked<ChunkingService>;

    mockIngestionService = {
      updateDocumentStatus: jest.fn(),
      upload: jest.fn(),
      getDocument: jest.fn(),
      listDocuments: jest.fn(),
      deleteDocument: jest.fn(),
    } as unknown as jest.Mocked<IngestionService>;

    mockTracer = {
      trace: jest.fn().mockImplementation(async (_docId: string, fn: (runTree: typeof fakeRunTree) => Promise<void>) => {
        await fn(fakeRunTree);
      }),
    } as unknown as jest.Mocked<LangSmithTracer>;

    consumer = new IngestionConsumer(
      mockEmbeddingProvider,
      mockVectorStore,
      mockChunkingService,
      mockIngestionService,
      mockTracer,
    );
  });

  describe('process', () => {
    it('should call tracer.trace and update statuses', async () => {
      const job = {
        data: { documentId: 'doc-1', filePath: '/tmp/test.md', sourceType: 'markdown' },
      } as Job<{ documentId: string; filePath: string; sourceType: string }>;

      await consumer.process(job);

      expect(mockTracer.trace).toHaveBeenCalledWith('doc-1', expect.any(Function));
      expect(mockIngestionService.updateDocumentStatus).toHaveBeenCalledWith('doc-1', 'processing');
      expect(mockIngestionService.updateDocumentStatus).toHaveBeenCalledWith('doc-1', 'ready');
    });

    it('should call embedBatch with chunk contents', async () => {
      const job = {
        data: { documentId: 'doc-1', filePath: '/tmp/test.md', sourceType: 'markdown' },
      } as Job<{ documentId: string; filePath: string; sourceType: string }>;

      await consumer.process(job);

      expect(mockEmbeddingProvider.embedBatch).toHaveBeenCalledWith(['first chunk', 'second chunk']);
    });

    it('should call vectorStore.upsert with mapped points', async () => {
      const job = {
        data: { documentId: 'doc-1', filePath: '/tmp/test.md', sourceType: 'markdown' },
      } as Job<{ documentId: string; filePath: string; sourceType: string }>;

      await consumer.process(job);

      expect(mockVectorStore.upsert).toHaveBeenCalledWith([
        { id: 'chunk-1', vector: [0.1, 0.2], payload: { sourceType: 'markdown', content: 'first chunk' } },
        { id: 'chunk-2', vector: [0.3, 0.4], payload: { sourceType: 'markdown', content: 'second chunk' } },
      ]);
    });

    it('should process pdf files through extractText', async () => {
      const job = {
        data: { documentId: 'doc-2', filePath: '/tmp/test.pdf', sourceType: 'pdf' },
      } as Job<{ documentId: string; filePath: string; sourceType: string }>;

      await consumer.process(job);

      expect(mockChunkingService.chunk).toHaveBeenCalledWith('parsed pdf text', 'doc-2', 'pdf');
    });
  });

  describe('onError', () => {
    it('should set status to failed when documentId is present', async () => {
      const job = { data: { documentId: 'doc-1' } } as Job<{ documentId: string }>;
      const error = new Error('something went wrong');

      await consumer.onError(job, error);

      expect(mockIngestionService.updateDocumentStatus).toHaveBeenCalledWith('doc-1', 'failed');
    });

    it('should not set status when documentId is missing', async () => {
      const job = { data: {} } as Job<{ documentId: string }>;
      const error = new Error('missing id');

      await consumer.onError(job, error);

      expect(mockIngestionService.updateDocumentStatus).not.toHaveBeenCalled();
    });
  });
});
