import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ManagementController } from '../src/management/management.controller';
import { ManagementService } from '../src/management/management.service';
import { IngestionService } from '../src/ingestion/ingestion.service';

describe('Management (e2e)', () => {
  let app: INestApplication;

  const mockDoc = {
    id: 'doc-1',
    filename: 'test.md',
    sourceType: 'markdown' as const,
    status: 'ready' as const,
    metadata: {},
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockVectorStoreProvider = {
    delete: jest.fn().mockResolvedValue(undefined),
    search: jest.fn(),
    upsert: jest.fn(),
    listCollections: jest.fn(),
  };

  const mockIngestionService = {
    listDocuments: jest.fn().mockReturnValue([mockDoc]),
    getDocument: jest.fn().mockImplementation((id: string) =>
      id === 'doc-1' ? mockDoc : undefined,
    ),
    deleteDocument: jest.fn().mockReturnValue(true),
    upload: jest.fn(),
    updateDocumentStatus: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ManagementController],
      providers: [
        ManagementService,
        { provide: IngestionService, useValue: mockIngestionService },
        { provide: 'VECTOR_STORE_PROVIDER', useValue: mockVectorStoreProvider },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /documents should return 200 + array', async () => {
    const res = await request(app.getHttpServer())
      .get('/documents')
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe('doc-1');
  });

  it('DELETE /documents/:id with invalid id should return 404', async () => {
    await request(app.getHttpServer())
      .delete('/documents/non-existent')
      .expect(404);
  });

  it('GET /documents/:id should return 200 + document object', async () => {
    const res = await request(app.getHttpServer())
      .get('/documents/doc-1')
      .expect(200);

    expect(res.body.id).toBe('doc-1');
    expect(res.body.filename).toBe('test.md');
    expect(res.body.sourceType).toBe('markdown');
  });
});
