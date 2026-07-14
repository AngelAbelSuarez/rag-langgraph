import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Document } from '@langchain/core/documents';
import { RerankerProvider, RankedDocument } from './reranker.interface.js';

@Injectable()
export class RerankerProviderService implements RerankerProvider {
  private apiKey: string;

  constructor(configService: ConfigService) {
    this.apiKey = configService.get<string>('COHERE_API_KEY');
  }

  async rerank(query: string, documents: Document[]): Promise<RankedDocument[]> {
    const response = await fetch('https://api.cohere.ai/v1/rerank', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'rerank-english-v3.0',
        query,
        documents: documents.map(d => d.pageContent),
        top_n: documents.length,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cohere rerank failed: ${response.status} ${error}`);
    }

    const data = await response.json() as { results: Array<{ index: number; relevance_score: number }> };
    return data.results.map(r => ({
      index: r.index,
      relevanceScore: r.relevance_score,
      document: documents[r.index],
    }));
  }
}
