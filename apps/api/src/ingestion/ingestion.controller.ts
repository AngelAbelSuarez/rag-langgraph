import {
  Controller,
  Post,
  UploadedFile,
  Body,
  UseInterceptors,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IngestionService } from './ingestion.service.js';

@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 })],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body('metadata') metadata?: string,
  ) {
    const parsedMetadata = metadata ? (JSON.parse(metadata) as Record<string, unknown>) : undefined;
    return this.ingestionService.upload(file, parsedMetadata);
  }
}
