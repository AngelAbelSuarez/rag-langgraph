import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import { EmbeddingProvider } from './embedding-provider.interface.js';

@Injectable()
export class EmbeddingProviderService implements EmbeddingProvider {
  private embeddings: OpenAIEmbeddings;

  constructor(configService: ConfigService) {
    const baseUrl = configService.get<string>('NVIDIA_BASE_URL', 'https://integrate.api.nvidia.com/v1');
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: configService.get<string>('NVIDIA_API_KEY'),
      modelName: configService.get<string>('EMBEDDING_MODEL', 'nvidia/nv-embedcode-7b-v1'),
      configuration: { baseURL: baseUrl },
    });
  }

  async embed(text: string): Promise<number[]> {
    return this.embeddings.embedQuery(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return this.embeddings.embedDocuments(texts);
  }
}
