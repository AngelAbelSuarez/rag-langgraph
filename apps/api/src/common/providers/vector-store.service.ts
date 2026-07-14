import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { VectorStoreProvider, Point, ScoredPoint } from './vector-store.interface.js';

@Injectable()
export class VectorStoreProviderService implements VectorStoreProvider {
  private client: QdrantClient;
  private collectionName: string;

  constructor(configService: ConfigService) {
    this.client = new QdrantClient({
      url: configService.get<string>('QDRANT_URL'),
    });
    this.collectionName = configService.get<string>('QDRANT_COLLECTION', 'documents');
  }

  async upsert(points: Point[]): Promise<void> {
    await this.client.upsert(this.collectionName, {
      wait: true,
      points: points.map(p => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload,
      })),
    });
  }

  async search(query: number[], filter?: Record<string, unknown>, topK = 10): Promise<ScoredPoint[]> {
    const result = await this.client.search(this.collectionName, {
      vector: query,
      filter: filter as Record<string, unknown> | undefined,
      limit: topK,
      with_payload: true,
    });
    return result.map(r => ({
      id: String(r.id),
      score: r.score ?? 0,
      payload: r.payload as Record<string, unknown> | undefined,
    }));
  }

  async delete(ids: string[]): Promise<void> {
    await this.client.delete(this.collectionName, {
      wait: true,
      points: ids,
    });
  }

  async listCollections(): Promise<string[]> {
    const collections = await this.client.getCollections();
    return collections.collections.map(c => c.name);
  }
}
