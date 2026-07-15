import { Document } from '@langchain/core/documents';
import { EmbeddingProvider } from '../../../common/providers/embedding-provider.interface.js';
import { VectorStoreProvider } from '../../../common/providers/vector-store.interface.js';
import { RerankerProvider } from '../../../common/providers/reranker.interface.js';
import { RagState } from '../state.js';

export function createRetrieveNode(
  embeddingProvider: EmbeddingProvider,
  vectorStoreProvider: VectorStoreProvider,
  rerankerProvider: RerankerProvider,
) {
  return async (state: typeof RagState.State) => {
    const query = state.rewrittenQuestion || state.question;
    const embedding = await embeddingProvider.embed(query);

    const scored = await vectorStoreProvider.search(embedding, undefined, 10);

    const documents: Document[] = scored.map(s => new Document({
      pageContent: (s.payload?.content as string) ?? '',
      metadata: {
        chunkId: s.id,
        documentId: s.payload?.documentId as string,
        sourceType: s.payload?.sourceType as string,
        chunkIndex: s.payload?.chunkIndex as number,
        score: s.score,
      },
    }));

    const reranked = await rerankerProvider.rerank(query, documents);
    const top5 = reranked.slice(0, 5);

    return {
      documents,
      relevantDocuments: top5.map(r => r.document),
      retrievalAttempts: 1,
    };
  };
}