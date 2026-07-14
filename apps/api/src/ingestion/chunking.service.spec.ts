import { ChunkingService } from './chunking.service';

describe('ChunkingService', () => {
  let service: ChunkingService;

  beforeEach(() => {
    service = new ChunkingService();
  });

  it('should respect chunkSize: 3000 chars produce at least 3 chunks', async () => {
    const text = Array.from({ length: 3000 }, (_, i) => `token${i}`).join(' ');
    const chunks = await service.chunk(text, 'doc-1', 'markdown');
    expect(chunks.length).toBeGreaterThanOrEqual(3);
  });

  it('should include overlap between consecutive chunks', async () => {
    const tokens = Array.from({ length: 300 }, (_, i) => `token${i}`);
    const text = tokens.join(' ');
    const chunks = await service.chunk(text, 'doc-1', 'markdown');
    expect(chunks.length).toBeGreaterThan(1);

    const tail = chunks[0].content.split(' ').slice(-15).join(' ');
    expect(chunks[1].content).toContain(tail);
  });

  it('should set correct sourceType in metadata', async () => {
    const text = '# Heading\n\nSome content\n\nMore content.';
    const [mdChunks, pdfChunks] = await Promise.all([
      service.chunk(text, 'doc-md', 'markdown'),
      service.chunk(text, 'doc-pdf', 'pdf'),
    ]);

    for (const c of mdChunks) {
      expect(c.metadata['sourceType']).toBe('markdown');
    }
    for (const c of pdfChunks) {
      expect(c.metadata['sourceType']).toBe('pdf');
    }
  });
});
