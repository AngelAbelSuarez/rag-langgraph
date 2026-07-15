import { ChatMessage } from '@rag/shared';
import { ChatModelProvider } from '../../../common/providers/chat-model.interface.js';
import { RagState } from '../state.js';

export function createGenerateNode(
  chatModelProvider: ChatModelProvider,
) {
  return async (state: typeof RagState.State) => {
    const messages: ChatMessage[] = [{ role: 'user', content: state.question, timestamp: new Date().toISOString() }];
    const result = await chatModelProvider.generate(
      'Responde usando SOLO el contexto proporcionado. Cita las fuentes usando [1], [2], etc.',
      messages,
      state.relevantDocuments,
    );

    return {
      generation: result.content,
      generationAttempts: 1,
    };
  };
}
