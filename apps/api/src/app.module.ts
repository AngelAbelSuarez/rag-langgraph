import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ProvidersModule } from './common/providers/providers.module.js';
import { IngestionModule } from './ingestion/ingestion.module.js';
import { RagModule } from './rag/rag.module.js';
import { ChatModule } from './chat/chat.module.js';
import { ManagementModule } from './management/management.module.js';

@Module({
  imports: [
    BullModule.forRoot({ redis: { host: 'localhost', port: 6379 } }),
    ProvidersModule,
    IngestionModule,
    RagModule,
    ChatModule,
    ManagementModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
