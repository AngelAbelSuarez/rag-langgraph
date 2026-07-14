import { ChatModelProvider } from '../../../common/providers/chat-model.interface.js';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
import { RagState } from '../state.js';

export function createRewriteNode(
  chatModelProvider: ChatModelProvider,
) {
  return async (state: typeof RagState.State) => {
    if (state.retrievalAttempts >= 3) {
      return { rewrittenQuestion: state.question };
    }

    const messages: ChatMessage[] = [{ role: 'user', content: state.question }];
    const result = await chatModelProvider.generate(
      'Reformula la siguiente pregunta para mejorar la búsqueda documental. Devuelve SOLO la pregunta reformulada, sin explicaciones.',
      messages,
      [],
    );

    return { rewrittenQuestion: result.content.trim() };
  };
}
