import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { IngestionController } from '../src/ingestion/ingestion.controller';
import { IngestionService } from '../src/ingestion/ingestion.service';

describe('Ingestion (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 42 }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [IngestionController],
      providers: [
        IngestionService,
        { provide: 'BullQueue_ingestion', useValue: mockQueue },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /ingestion/upload with markdown file should return 201 + jobId', async () => {
    const res = await request(app.getHttpServer())
      .post('/ingestion/upload')
      .attach('file', Buffer.from('# Test\nContent'), 'test.md')
      .expect(201);

    expect(res.body).toHaveProperty('jobId');
    expect(res.body).toHaveProperty('documentId');
    expect(res.body.status).toBe('pending');
  });

  it('POST /ingestion/upload without file should return 400', async () => {
    await request(app.getHttpServer())
      .post('/ingestion/upload')
      .expect(400);
  });

  it('POST /ingestion/upload with file over 20MB should return 400', async () => {
    const bigBuffer = Buffer.alloc(25 * 1024 * 1024, 'x');
    await request(app.getHttpServer())
      .post('/ingestion/upload')
      .attach('file', bigBuffer, 'large.md')
      .expect(400);
  });
});
