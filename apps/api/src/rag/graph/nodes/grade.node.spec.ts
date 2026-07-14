import { Document } from '@langchain/core/documents';
import { createGradeNode } from './grade.node';
import type { ChatModelProvider } from '../../../common/providers/chat-model.interface';
import type { RagStateType } from '../state';

describe('GradeNode', () => {
  const mockGenerate = jest.fn();
  const mockProvider: ChatModelProvider = {
    generate: mockGenerate,
    generateStream: jest.fn(),
  };

  const gradeNode = createGradeNode(mockProvider);

  const baseState: Partial<RagStateType['State']> = {
    question: 'What is the capital of France?',
    documents: [],
    relevantDocuments: [],
    rewrittenQuestion: '',
    generation: '',
    isGrounded: false,
    retrievalAttempts: 0,
    generationAttempts: 0,
    conversationId: 'test-conv',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should mark relevant document when provider returns YES', async () => {
    mockGenerate.mockResolvedValue({ content: 'YES' });

    const relevantDoc = new Document({
      pageContent: 'Paris is the capital of France.',
      metadata: { documentId: 'doc-1' },
    });

    const result = await gradeNode({
      ...baseState,
      relevantDocuments: [relevantDoc],
    } as RagStateType['State']);

    expect(result.relevantDocuments).toHaveLength(1);
    expect(result.relevantDocuments![0]).toBe(relevantDoc);
    expect(result.documents).toHaveLength(0);
  });

  it('should mark irrelevant document when provider returns NO', async () => {
    mockGenerate.mockResolvedValue({ content: 'NO' });

    const irrelevantDoc = new Document({
      pageContent: 'London is the capital of the UK.',
      metadata: { documentId: 'doc-2' },
    });

    const result = await gradeNode({
      ...baseState,
      relevantDocuments: [irrelevantDoc],
    } as RagStateType['State']);

    expect(result.relevantDocuments).toHaveLength(0);
    expect(result.documents).toHaveLength(1);
    expect(result.documents![0]).toBe(irrelevantDoc);
  });

  it('should separate relevant from irrelevant documents', async () => {
    mockGenerate
      .mockResolvedValueOnce({ content: 'YES' })
      .mockResolvedValueOnce({ content: 'NO' })
      .mockResolvedValueOnce({ content: 'YES' });

    const docs = [
      new Document({ pageContent: 'Paris is in France.', metadata: { documentId: 'doc-1' } }),
      new Document({ pageContent: 'London is in the UK.', metadata: { documentId: 'doc-2' } }),
      new Document({ pageContent: 'Madrid is in Spain.', metadata: { documentId: 'doc-3' } }),
    ];

    const result = await gradeNode({
      ...baseState,
      relevantDocuments: docs,
    } as RagStateType['State']);

    expect(result.relevantDocuments).toHaveLength(2);
    expect(result.documents).toHaveLength(1);
    expect(mockGenerate).toHaveBeenCalledTimes(3);
  });
});
