import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import { EmbeddingProvider } from './embedding-provider.interface.js';

@Injectable()
export class EmbeddingProviderService implements EmbeddingProvider {
  private embeddings: OpenAIEmbeddings;

  constructor(configService: ConfigService) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: configService.get<string>('OPENAI_API_KEY'),
      modelName: configService.get<string>('EMBEDDING_MODEL', 'text-embedding-3-small'),
    });
  }

  async embed(text: string): Promise<number[]> {
    return this.embeddings.embedQuery(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return this.embeddings.embedDocuments(texts);
  }
}
