import { Controller, Get, Delete, Param, Query } from '@nestjs/common';
import { ManagementService, DocumentFilter, Pagination } from './management.service.js';

@Controller('documents')
export class ManagementController {
  constructor(private readonly managementService: ManagementService) {}

  @Get()
  list(
    @Query('status') status?: string,
    @Query('sourceType') sourceType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filter: DocumentFilter = {};
    if (status) filter.status = status as DocumentFilter['status'];
    if (sourceType) filter.sourceType = sourceType as DocumentFilter['sourceType'];

    const pagination: Pagination = {};
    if (page) pagination.page = Number(page);
    if (limit) pagination.limit = Number(limit);

    return this.managementService.list(filter, pagination);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.managementService.getById(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.managementService.delete(id);
    return { deleted: true, id };
  }
}
