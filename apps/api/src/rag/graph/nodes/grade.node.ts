import { Document } from '@langchain/core/documents';
import { ChatMessage } from '@rag/shared';
import { ChatModelProvider } from '../../../common/providers/chat-model.interface.js';
import { RagState } from '../state.js';

export function createGradeNode(
  chatModelProvider: ChatModelProvider,
) {
  return async (state: typeof RagState.State) => {
    const relevant: Document[] = [];
    const irrelevant: Document[] = [];

    for (const doc of state.relevantDocuments) {
      const messages: ChatMessage[] = [{ role: 'user', content: state.question, timestamp: new Date().toISOString() }];
      const result = await chatModelProvider.generate(
        'Evalúa si el siguiente documento responde la pregunta. Responde SOLO YES o NO.',
        messages,
        [doc],
      );
      const answer = result.content.trim().toUpperCase();
      if (answer.startsWith('YES')) {
        relevant.push(doc);
      } else {
        irrelevant.push(doc);
      }
    }

    return {
      documents: irrelevant,
      relevantDocuments: relevant,
    };
  };
}
