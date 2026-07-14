import { Module } from '@nestjs/common';
import { ProvidersModule } from '../common/providers/providers.module.js';
import { IngestionModule } from '../ingestion/ingestion.module.js';
import { ManagementController } from './management.controller.js';
import { ManagementService } from './management.service.js';

@Module({
  imports: [ProvidersModule, IngestionModule],
  controllers: [ManagementController],
  providers: [ManagementService],
  exports: [ManagementService],
})
export class ManagementModule {}
