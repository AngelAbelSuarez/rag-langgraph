const mockUpsert = jest.fn().mockResolvedValue(undefined);
const mockSearch = jest.fn().mockResolvedValue([
  { id: 'chunk-1', score: 0.95, payload: { content: 'test' } },
  { id: 'chunk-2', payload: { content: 'no score' } },
]);
const mockDelete = jest.fn().mockResolvedValue(undefined);
const mockGetCollections = jest.fn().mockResolvedValue({
  collections: [{ name: 'documents' }, { name: 'archive' }],
});

jest.mock('@qdrant/js-client-rest', () => ({
  QdrantClient: jest.fn().mockImplementation(() => ({
    upsert: mockUpsert,
    search: mockSearch,
    delete: mockDelete,
    getCollections: mockGetCollections,
  })),
}));

import { ConfigService } from '@nestjs/config';
import { VectorStoreProviderService } from './vector-store.service';

describe('VectorStoreProviderService', () => {
  let service: VectorStoreProviderService;

  beforeEach(() => {
    jest.clearAllMocks();
    const configService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        const values: Record<string, string> = {
          QDRANT_URL: 'http://localhost:6333',
          QDRANT_COLLECTION: 'documents',
        };
        return values[key] ?? (defaultValue as string);
      }),
    } as unknown as ConfigService;

    service = new VectorStoreProviderService(configService);
  });

  describe('upsert', () => {
    it('should map points correctly', async () => {
      await service.upsert([
        { id: 'p1', vector: [0.1, 0.2], payload: { key: 'val' } },
        { id: 'p2', vector: [0.3, 0.4] },
      ]);

      expect(mockUpsert).toHaveBeenCalledWith('documents', {
        wait: true,
        points: [
          { id: 'p1', vector: [0.1, 0.2], payload: { key: 'val' } },
          { id: 'p2', vector: [0.3, 0.4], payload: undefined },
        ],
      });
    });
  });

  describe('search', () => {
    it('should map ScoredPoint with score default 0', async () => {
      const result = await service.search([0.1, 0.2, 0.3], { status: 'ready' }, 5);

      expect(mockSearch).toHaveBeenCalledWith('documents', {
        vector: [0.1, 0.2, 0.3],
        filter: { status: 'ready' },
        limit: 5,
        with_payload: true,
      });

      expect(result).toEqual([
        { id: 'chunk-1', score: 0.95, payload: { content: 'test' } },
        { id: 'chunk-2', score: 0, payload: { content: 'no score' } },
      ]);
    });
  });

  describe('delete', () => {
    it('should pass ids to client.delete', async () => {
      await service.delete(['id-1', 'id-2']);

      expect(mockDelete).toHaveBeenCalledWith('documents', {
        wait: true,
        points: ['id-1', 'id-2'],
      });
    });
  });

  describe('listCollections', () => {
    it('should map to collection names', async () => {
      const names = await service.listCollections();
      expect(names).toEqual(['documents', 'archive']);
    });
  });
});
