import { NotFoundException } from '@nestjs/common';
import { ManagementService } from './management.service';
import type { VectorStoreProvider } from '../common/providers/vector-store.interface';
import type { IngestionService } from '../ingestion/ingestion.service';
import type { Document } from '@rag/shared';

describe('ManagementService', () => {
  let service: ManagementService;
  let mockVectorStoreProvider: jest.Mocked<VectorStoreProvider>;
  let mockIngestionService: jest.Mocked<Pick<IngestionService, 'listDocuments' | 'getDocument' | 'deleteDocument'>>;

  const createDoc = (overrides: Partial<Document> = {}): Document => ({
    id: 'doc-1',
    filename: 'test.md',
    sourceType: 'markdown',
    status: 'ready',
    metadata: {},
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  });

  beforeEach(() => {
    mockVectorStoreProvider = {
      upsert: jest.fn(),
      search: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
      listCollections: jest.fn(),
    };

    mockIngestionService = {
      listDocuments: jest.fn(),
      getDocument: jest.fn(),
      deleteDocument: jest.fn().mockReturnValue(true),
    };

    service = new ManagementService(mockVectorStoreProvider, mockIngestionService as unknown as IngestionService);
  });

  describe('list', () => {
    it('should return all documents without filters', () => {
      const docs = [createDoc({ id: '1' }), createDoc({ id: '2' })];
      mockIngestionService.listDocuments.mockReturnValue(docs);

      const result = service.list();
      expect(result.data).toEqual(docs);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should filter by status', () => {
      const docs = [
        createDoc({ id: '1', status: 'ready' }),
        createDoc({ id: '2', status: 'pending' }),
        createDoc({ id: '3', status: 'ready' }),
      ];
      mockIngestionService.listDocuments.mockReturnValue(docs);

      const result = service.list({ status: 'ready' });
      expect(result.data).toHaveLength(2);
      expect(result.data.every(d => d.status === 'ready')).toBe(true);
    });

    it('should filter by sourceType', () => {
      const docs = [
        createDoc({ id: '1', sourceType: 'markdown' }),
        createDoc({ id: '2', sourceType: 'pdf' }),
      ];
      mockIngestionService.listDocuments.mockReturnValue(docs);

      const result = service.list({ sourceType: 'pdf' });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('2');
    });

    it('should paginate results', () => {
      const docs = Array.from({ length: 5 }, (_, i) => createDoc({ id: String(i + 1) }));
      mockIngestionService.listDocuments.mockReturnValue(docs);

      const result = service.list(undefined, { page: 2, limit: 2 });
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('3');
      expect(result.data[1].id).toBe('4');
      expect(result.total).toBe(5);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(2);
    });
  });

  describe('getById', () => {
    it('should throw NotFoundException when document is missing', () => {
      mockIngestionService.getDocument.mockReturnValue(undefined);
      expect(() => service.getById('nonexistent')).toThrow(NotFoundException);
    });

    it('should return the document when found', () => {
      const doc = createDoc();
      mockIngestionService.getDocument.mockReturnValue(doc);
      expect(service.getById('doc-1')).toEqual(doc);
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException when document is missing', async () => {
      mockIngestionService.getDocument.mockReturnValue(undefined);
      await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should call ingestionService.deleteDocument and vectorStore.delete', async () => {
      const doc = createDoc();
      mockIngestionService.getDocument.mockReturnValue(doc);

      await service.delete('doc-1');

      expect(mockIngestionService.deleteDocument).toHaveBeenCalledWith('doc-1');
      expect(mockVectorStoreProvider.delete).toHaveBeenCalledWith(['doc-1']);
    });
  });
});
