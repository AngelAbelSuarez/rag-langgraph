import { Document } from '@langchain/core/documents';
import { ConfigService } from '@nestjs/config';
import { RerankerProviderService } from './reranker.service';

describe('RerankerProviderService', () => {
  let service: RerankerProviderService;
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        const values: Record<string, string> = {
          NVIDIA_API_KEY: 'test-api-key',
          NVIDIA_BASE_URL: 'https://integrate.api.nvidia.com/v1',
          RERANKING_MODEL: 'nvidia/nv-rerank-qa-mistral-4b:1',
        };
        return values[key] ?? (defaultValue as string);
      }),
    } as unknown as ConfigService;

    service = new RerankerProviderService(configService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('rerank', () => {
    it('should map rankings to RankedDocument with document reference', async () => {
      const documents = [
        new Document({ pageContent: 'Paris is in France.' }),
        new Document({ pageContent: 'London is in the UK.' }),
        new Document({ pageContent: 'Madrid is in Spain.' }),
      ];

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          rankings: [
            { index: 0, logit: 2.5 },
            { index: 2, logit: 1.8 },
          ],
        }),
        text: jest.fn(),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await service.rerank('capital of Spain', documents);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ index: 0, relevanceScore: 2.5, document: documents[0] });
      expect(result[1]).toEqual({ index: 2, relevanceScore: 1.8, document: documents[2] });
    });

    it('should throw on non-ok response', async () => {
      const documents = [new Document({ pageContent: 'test' })];
      const mockResponse = {
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue('Bad Request'),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      await expect(service.rerank('test', documents)).rejects.toThrow('NVIDIA rerank failed: 400 Bad Request');
    });

    it('should send Authorization header as Bearer apiKey', async () => {
      const documents = [new Document({ pageContent: 'test' })];
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ rankings: [] }),
        text: jest.fn(),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      await service.rerank('test', documents);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
        }),
      );
    });
  });
});
