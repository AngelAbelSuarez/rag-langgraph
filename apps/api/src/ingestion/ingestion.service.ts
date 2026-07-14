import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { randomUUID } from 'node:crypto';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { Document } from '@rag/shared';

const ALLOWED_EXTENSIONS = ['.pdf', '.md', '.mdx'];
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

@Injectable()
export class IngestionService {
  private documents = new Map<string, Document>();

  constructor(@InjectQueue('ingestion') private readonly ingestionQueue: Queue) {}

  async upload(file: Express.Multer.File, metadata?: Record<string, unknown>) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(`Invalid file type: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    const sourceType = ext === '.pdf' ? 'pdf' : 'markdown';
    const documentId = randomUUID();
    const now = new Date().toISOString();

    const document: Document = {
      id: documentId,
      filename: file.originalname,
      sourceType,
      status: 'pending',
      metadata: metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };
    this.documents.set(documentId, document);

    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    const filePath = path.join(UPLOADS_DIR, `${documentId}${ext}`);
    await fs.writeFile(filePath, file.buffer);

    const job = await this.ingestionQueue.add(
      'process',
      { documentId, filePath, sourceType },
      { removeOnComplete: true, removeOnFail: false },
    );

    return { jobId: job.id, documentId, status: 'pending' };
  }

  getDocument(id: string): Document | undefined {
    return this.documents.get(id);
  }

  updateDocumentStatus(id: string, status: Document['status'], extra?: Partial<Document>) {
    const doc = this.documents.get(id);
    if (!doc) return;
    Object.assign(doc, { status, updatedAt: new Date().toISOString(), ...extra });
  }
}
