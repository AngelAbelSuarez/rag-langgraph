import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Document } from '@langchain/core/documents';
import { RerankerProvider, RankedDocument } from './reranker.interface.js';

interface NvidiaRankingResponse {
  rankings: Array<{ index: number; logit: number }>;
}

@Injectable()
export class RerankerProviderService implements RerankerProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(configService: ConfigService) {
    this.apiKey = configService.get<string>('NVIDIA_API_KEY', '');
    this.baseUrl = configService.get<string>('NVIDIA_BASE_URL', 'https://integrate.api.nvidia.com/v1');
    this.model = configService.get<string>('RERANKING_MODEL', 'nvidia/nv-rerank-qa-mistral-4b:1');
  }

  async rerank(query: string, documents: Document[]): Promise<RankedDocument[]> {
    const response = await fetch(`${this.baseUrl}/ranking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        query: { text: query },
        passages: documents.map(d => ({ text: d.pageContent })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`NVIDIA rerank failed: ${response.status} ${error}`);
    }

    const data = (await response.json()) as NvidiaRankingResponse;
    return data.rankings.map(r => ({
      index: r.index,
      relevanceScore: r.logit,
      document: documents[r.index],
    }));
  }
}