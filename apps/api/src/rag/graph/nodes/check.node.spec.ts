import { Document } from '@langchain/core/documents';
import { createCheckNode } from './check.node';
import type { ChatModelProvider } from '../../../common/providers/chat-model.interface';
import type { RagStateType } from '../state';

describe('CheckNode', () => {
  const mockGenerate = jest.fn();
  const mockProvider: ChatModelProvider = {
    generate: mockGenerate,
    generateStream: jest.fn(),
  };

  const checkNode = createCheckNode(mockProvider);

  const baseState: Partial<RagStateType['State']> = {
    question: 'What is the capital of France?',
    documents: [],
    relevantDocuments: [
      new Document({ pageContent: 'Paris is the capital.', metadata: {} }),
    ],
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

  it('should return isGrounded=true when generation is grounded in sources', async () => {
    mockGenerate.mockResolvedValue({ content: 'YES' });

    const result = await checkNode({
      ...baseState,
      generation: 'Paris is the capital of France according to the sources.',
    } as RagStateType['State']);

    expect(result.isGrounded).toBe(true);
  });

  it('should return isGrounded=false when generation is hallucinated', async () => {
    mockGenerate.mockResolvedValue({ content: 'NO' });

    const result = await checkNode({
      ...baseState,
      generation: 'The capital of France is Berlin.',
    } as RagStateType['State']);

    expect(result.isGrounded).toBe(false);
  });

  it('should not retry when generationAttempts exceeds 3 (check returns false but state counter handles limit)', async () => {
    mockGenerate.mockResolvedValue({ content: 'NO' });

    const result = await checkNode({
      ...baseState,
      generation: 'Some made-up answer.',
      generationAttempts: 3,
    } as RagStateType['State']);

    expect(result.isGrounded).toBe(false);
  });
});
