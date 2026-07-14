import { ChatModelProvider } from '../../../common/providers/chat-model.interface.js';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
import { RagState } from '../state.js';

export function createCheckNode(
  chatModelProvider: ChatModelProvider,
) {
  return async (state: typeof RagState.State) => {
    if (!state.generation) {
      return { isGrounded: false };
    }

    const messages: ChatMessage[] = [{
      role: 'user',
      content: `Pregunta: ${state.question}\n\nRespuesta a evaluar: ${state.generation}`,
    }];

    const result = await chatModelProvider.generate(
      '¿La siguiente respuesta está completamente respaldada por las fuentes proporcionadas? Responde SOLO YES o NO.',
      messages,
      state.relevantDocuments,
    );

    const answer = result.content.trim().toUpperCase();
    const isGrounded = answer.startsWith('YES');

    return { isGrounded };
  };
}
