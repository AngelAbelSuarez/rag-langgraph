import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ChatController } from '../src/chat/chat.controller';
import { ChatService } from '../src/chat/chat.service';
import { ConversationService } from '../src/chat/conversation.service';
import { RagService } from '../src/rag/rag.service';
import { Observable } from 'rxjs';

describe('Chat (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mockRagService = {
      answerStream: jest.fn().mockImplementation(async function* () {
        yield { answer: 'Hello', sources: [], conversationId: 'conv-1' };
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        ChatService,
        ConversationService,
        { provide: RagService, useValue: mockRagService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /chat/stream should return 200 with text/event-stream', async () => {
    const response = await request(app.getHttpServer())
      .post('/chat/stream')
      .send({ question: 'Hello' })
      .expect(200);

    expect(response.headers['content-type']).toContain('text/event-stream');
  });

  it('POST /chat/stream without question should return 400', async () => {
    await request(app.getHttpServer())
      .post('/chat/stream')
      .send({})
      .expect(400);
  });
});
