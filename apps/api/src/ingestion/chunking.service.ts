import { Injectable } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { randomUUID } from 'node:crypto';
import { Chunk } from '@rag/shared';

@Injectable()
export class ChunkingService {
  private splitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
  }

  async chunk(text: string, documentId: string, sourceType: string): Promise<Chunk[]> {
    const texts = await this.splitter.splitText(text);
    return texts.map((content, index) => ({
      id: randomUUID(),
      documentId,
      content,
      metadata: {
        documentId,
        sourceType,
        chunkIndex: index,
      },
    }));
  }
}
