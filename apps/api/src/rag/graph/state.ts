import { Annotation } from '@langchain/langgraph';
import { Document } from '@langchain/core/documents';

export const RagState = Annotation.Root({
  question: Annotation<string>,
  documents: Annotation<Document[]>({
    reducer: (a, b) => [...a, ...b],
  }),
  relevantDocuments: Annotation<Document[]>,
  rewrittenQuestion: Annotation<string>,
  generation: Annotation<string>,
  isGrounded: Annotation<boolean>,
  retrievalAttempts: Annotation<number>({
    reducer: (a, b) => a + b,
  }),
  generationAttempts: Annotation<number>({
    reducer: (a, b) => a + b,
  }),
  conversationId: Annotation<string>,
});

export type RagStateType = typeof RagState;
