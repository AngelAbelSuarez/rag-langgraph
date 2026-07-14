import { Module } from '@nestjs/common';
import { RagService } from './rag.service.js';
import { LangSmithTracer } from './langsmith.tracer.js';

@Module({
  imports: [],
  providers: [RagService, LangSmithTracer],
  exports: [RagService],
})
export class RagModule {}
