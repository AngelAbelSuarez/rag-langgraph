import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Document } from '@rag/shared';
import { VectorStoreProvider } from '../common/providers/vector-store.interface.js';
import { IngestionService } from '../ingestion/ingestion.service.js';

export interface DocumentFilter {
  status?: Document['status'];
  sourceType?: Document['sourceType'];
}

export interface Pagination {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class ManagementService {
  constructor(
    @Inject('VECTOR_STORE_PROVIDER') private readonly vectorStoreProvider: VectorStoreProvider,
    private readonly ingestionService: IngestionService,
  ) {}

  list(filter?: DocumentFilter, pagination?: Pagination): PaginatedResult<Document> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;

    let documents = this.ingestionService.listDocuments();

    if (filter?.status) {
      documents = documents.filter((d) => d.status === filter.status);
    }
    if (filter?.sourceType) {
      documents = documents.filter((d) => d.sourceType === filter.sourceType);
    }

    const total = documents.length;
    const start = (page - 1) * limit;
    const data = documents.slice(start, start + limit);

    return { data, total, page, limit };
  }

  getById(id: string): Document {
    const doc = this.ingestionService.getDocument(id);
    if (!doc) {
      throw new NotFoundException(`Document ${id} not found`);
    }
    return doc;
  }

  async delete(id: string): Promise<void> {
    const doc = this.ingestionService.getDocument(id);
    if (!doc) {
      throw new NotFoundException(`Document ${id} not found`);
    }

    this.ingestionService.deleteDocument(id);

    await this.vectorStoreProvider.delete([id]);
  }
}
