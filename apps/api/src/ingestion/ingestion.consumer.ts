import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { Inject } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import pdfParse from 'pdf-parse';
import { EmbeddingProvider } from '../common/providers/embedding-provider.interface.js';
import { VectorStoreProvider, Point } from '../common/providers/vector-store.interface.js';
import { ChunkingService } from './chunking.service.js';
import { IngestionService } from './ingestion.service.js';
import { LangSmithTracer } from './langsmith.tracer.js';

@Processor('ingestion')
export class IngestionConsumer {
  constructor(
    @Inject('EMBEDDING_PROVIDER') private readonly embeddingProvider: EmbeddingProvider,
    @Inject('VECTOR_STORE_PROVIDER') private readonly vectorStore: VectorStoreProvider,
    private readonly chunkingService: ChunkingService,
    private readonly ingestionService: IngestionService,
    private readonly tracer: LangSmithTracer,
  ) {}

  @Process()
  async process(job: Job<{ documentId: string; filePath: string; sourceType: string }>) {
    const { documentId, filePath, sourceType } = job.data;

    await this.tracer.trace(documentId, async (runTree) => {
      this.ingestionService.updateDocumentStatus(documentId, 'processing');

      const text = await this.extractText(filePath, sourceType);

      const chunks = await this.chunkingService.chunk(text, documentId, sourceType);

      const texts = chunks.map(c => c.content);
      const embeddings = await this.embeddingProvider.embedBatch(texts);

      const points: Point[] = chunks.map((chunk, i) => ({
        id: chunk.id,
        vector: embeddings[i],
        payload: { ...chunk.metadata, content: chunk.content },
      }));

      await this.vectorStore.upsert(points);

      this.ingestionService.updateDocumentStatus(documentId, 'ready');
    });
  }

  @OnQueueFailed()
  async onError(job: Job<{ documentId: string }>, error: Error) {
    if (job.data.documentId) {
      this.ingestionService.updateDocumentStatus(job.data.documentId, 'failed');
    }
  }

  private async extractText(filePath: string, sourceType: string): Promise<string> {
    if (sourceType === 'pdf') {
      const buffer = await fs.readFile(filePath);
      const data = await pdfParse(buffer);
      return data.text;
    }
    return fs.readFile(filePath, 'utf-8');
  }
}
