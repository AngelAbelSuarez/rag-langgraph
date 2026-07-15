import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NVIDIARerank } from '@langchain/nvidia-ai-endpoints';
import { Document } from '@langchain/core/documents';
import { RerankerProvider, RankedDocument } from './reranker.interface.js';

@Injectable()
export class RerankerProviderService implements RerankerProvider {
  private ranker: NVIDIARerank;

  constructor(configService: ConfigService) {
    this.ranker = new NVIDIARerank({
      model: configService.get<string>('RERANKING_MODEL', 'nvidia/nv-rerank-qa-mistral-4b:1'),
      apiKey: configService.get<string>('NVIDIA_API_KEY'),
    });
  }

  async rerank(query: string, documents: Document[]): Promise<RankedDocument[]> {
    const ranked = await this.ranker.compressDocuments(query, documents);
    return ranked.map((doc, index) => ({
      index,
      relevanceScore: doc.metadata?.relevanceScore ?? 0,
      document: doc,
    }));
  }
}