import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { IngestionController } from './ingestion.controller.js';
import { IngestionService } from './ingestion.service.js';
import { ChunkingService } from './chunking.service.js';
import { IngestionConsumer } from './ingestion.consumer.js';

@Module({
  imports: [BullModule.registerQueue({ name: 'ingestion' })],
  controllers: [IngestionController],
  providers: [IngestionService, ChunkingService, IngestionConsumer],
  exports: [IngestionService],
})
export class IngestionModule {}
