import { StateGraph, START, END } from '@langchain/langgraph';
import { EmbeddingProvider } from '../../common/providers/embedding-provider.interface.js';
import { VectorStoreProvider } from '../../common/providers/vector-store.interface.js';
import { ChatModelProvider } from '../../common/providers/chat-model.interface.js';
import { RerankerProvider } from '../../common/providers/reranker.interface.js';
import { RagState } from './state.js';
import { createRetrieveNode } from './nodes/retrieve.node.js';
import { createGradeNode } from './nodes/grade.node.js';
import { createRewriteNode } from './nodes/rewrite.node.js';
import { createGenerateNode } from './nodes/generate.node.js';
import { createCheckNode } from './nodes/check.node.js';

export interface RagGraphDeps {
  embeddingProvider: EmbeddingProvider;
  vectorStoreProvider: VectorStoreProvider;
  chatModelProvider: ChatModelProvider;
  rerankerProvider: RerankerProvider;
}

export function createGraph(deps: RagGraphDeps) {
  const graph = new StateGraph(RagState)
    .addNode('retrieve', createRetrieveNode(
      deps.embeddingProvider,
      deps.vectorStoreProvider,
      deps.rerankerProvider,
    ))
    .addNode('grade', createGradeNode(deps.chatModelProvider))
    .addNode('rewrite', createRewriteNode(deps.chatModelProvider))
    .addNode('generate', createGenerateNode(deps.chatModelProvider))
    .addNode('check', createCheckNode(deps.chatModelProvider))

    .addEdge(START, 'retrieve')
    .addEdge('retrieve', 'grade')

    .addConditionalEdges('grade', (state: typeof RagState.State) => {
      if (state.relevantDocuments.length === 0 && state.retrievalAttempts < 3) {
        return 'rewrite';
      }
      return 'generate';
    })

    .addEdge('rewrite', 'retrieve')
    .addEdge('generate', 'check')

    .addConditionalEdges('check', (state: typeof RagState.State) => {
      if (state.isGrounded || state.generationAttempts >= 3) {
        return END;
      }
      return 'generate';
    });

  return graph.compile();
}
