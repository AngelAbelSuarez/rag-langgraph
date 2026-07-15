import { BadRequestException } from '@nestjs/common';
import type { Queue } from 'bull';

jest.mock('node:fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

const mockRandomUUID = jest.fn();
jest.mock('node:crypto', () => ({
  randomUUID: mockRandomUUID,
}));

import { IngestionService } from './ingestion.service';

describe('IngestionService', () => {
  let service: IngestionService;
  let mockQueue: jest.Mocked<Pick<Queue, 'add'>>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRandomUUID.mockReturnValue('mock-uuid');
    mockQueue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
    service = new IngestionService(mockQueue as unknown as Queue);
  });

  describe('upload', () => {
    it('should accept .pdf files', async () => {
      const file = { originalname: 'doc.pdf', buffer: Buffer.from('pdf content') } as Express.Multer.File;
      const result = await service.upload(file);
      expect(result.documentId).toBe('mock-uuid');
      expect(result.status).toBe('pending');
    });

    it('should accept .md files', async () => {
      const file = { originalname: 'doc.md', buffer: Buffer.from('md content') } as Express.Multer.File;
      const result = await service.upload(file);
      expect(result.documentId).toBe('mock-uuid');
    });

    it('should accept .mdx files', async () => {
      const file = { originalname: 'doc.mdx', buffer: Buffer.from('mdx content') } as Express.Multer.File;
      const result = await service.upload(file);
      expect(result.documentId).toBe('mock-uuid');
    });

    it('should reject .txt files with BadRequestException', async () => {
      const file = { originalname: 'doc.txt', buffer: Buffer.from('text') } as Express.Multer.File;
      await expect(service.upload(file)).rejects.toThrow(BadRequestException);
    });

    it('should call queue.add with correct payload', async () => {
      const file = { originalname: 'doc.pdf', buffer: Buffer.from('data') } as Express.Multer.File;
      await service.upload(file);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'process',
        { documentId: 'mock-uuid', filePath: expect.stringContaining('mock-uuid.pdf'), sourceType: 'pdf' },
        { removeOnComplete: true, removeOnFail: false },
      );
    });
  });

  describe('getDocument', () => {
    it('should return undefined for unknown id', () => {
      expect(service.getDocument('unknown')).toBeUndefined();
    });

    it('should return a stored document', async () => {
      const file = { originalname: 'doc.md', buffer: Buffer.from('content') } as Express.Multer.File;
      const { documentId } = await service.upload(file);
      const doc = service.getDocument(documentId);
      expect(doc).toBeDefined();
      expect(doc!.filename).toBe('doc.md');
    });
  });

  describe('listDocuments', () => {
    it('should return an empty array initially', () => {
      expect(service.listDocuments()).toEqual([]);
    });

    it('should return all stored documents', async () => {
      mockRandomUUID.mockReturnValueOnce('uuid-1').mockReturnValueOnce('uuid-2');
      const file1 = { originalname: 'a.md', buffer: Buffer.from('a') } as Express.Multer.File;
      const file2 = { originalname: 'b.pdf', buffer: Buffer.from('b') } as Express.Multer.File;
      await service.upload(file1);
      await service.upload(file2);
      expect(service.listDocuments()).toHaveLength(2);
    });
  });

  describe('deleteDocument', () => {
    it('should return false for unknown id', () => {
      expect(service.deleteDocument('unknown')).toBe(false);
    });

    it('should return true and remove a stored document', async () => {
      mockRandomUUID.mockReturnValue('delete-me');
      const file = { originalname: 'doc.md', buffer: Buffer.from('c') } as Express.Multer.File;
      const { documentId } = await service.upload(file);
      expect(service.deleteDocument(documentId)).toBe(true);
      expect(service.getDocument(documentId)).toBeUndefined();
    });
  });

  describe('updateDocumentStatus', () => {
    it('should do nothing for unknown id', () => {
      expect(() => service.updateDocumentStatus('unknown', 'ready')).not.toThrow();
    });

    it('should update status and updatedAt', async () => {
      const file = { originalname: 'doc.md', buffer: Buffer.from('d') } as Express.Multer.File;
      const { documentId } = await service.upload(file);
      const before = service.getDocument(documentId)!;
      const beforeUpdatedAt = before.updatedAt;

      await new Promise(r => setTimeout(r, 10));

      service.updateDocumentStatus(documentId, 'ready');
      const after = service.getDocument(documentId)!;
      expect(after.status).toBe('ready');
      expect(after.updatedAt).not.toBe(beforeUpdatedAt);
    });
  });
});
