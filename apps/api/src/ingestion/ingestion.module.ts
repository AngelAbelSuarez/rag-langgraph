import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { IngestionController } from './ingestion.controller.js';
import { IngestionService } from './ingestion.service.js';
import { ChunkingService } from './chunking.service.js';
import { IngestionConsumer } from './ingestion.consumer.js';
import { LangSmithTracer } from './langsmith.tracer.js';

@Module({
  imports: [BullModule.registerQueue({ name: 'ingestion' })],
  controllers: [IngestionController],
  providers: [IngestionService, ChunkingService, IngestionConsumer, LangSmithTracer],
  exports: [IngestionService],
})
export class IngestionModule {}
