import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '../../config/index.js';
import { EmbeddingProviderService } from './embedding-provider.service.js';
import { VectorStoreProviderService } from './vector-store.service.js';
import { ChatModelProviderService } from './chat-model.service.js';
import { RerankerProviderService } from './reranker.service.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    EmbeddingProviderService,
    { provide: 'EMBEDDING_PROVIDER', useExisting: EmbeddingProviderService },
    VectorStoreProviderService,
    { provide: 'VECTOR_STORE_PROVIDER', useExisting: VectorStoreProviderService },
    ChatModelProviderService,
    { provide: 'CHAT_MODEL_PROVIDER', useExisting: ChatModelProviderService },
    RerankerProviderService,
    { provide: 'RERANKER_PROVIDER', useExisting: RerankerProviderService },
  ],
  exports: [
    'EMBEDDING_PROVIDER',
    'VECTOR_STORE_PROVIDER',
    'CHAT_MODEL_PROVIDER',
    'RERANKER_PROVIDER',
  ],
})
export class ProvidersModule {}
