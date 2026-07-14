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
    const embedding = await embeddingProvider.embed(state.rewrittenQuestion || state.question);

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

    const reranked = await rerankerProvider.rerank(
      state.rewrittenQuestion || state.question,
      documents,
    );

    const topK = reranked.slice(0, 5);
    const relevantDocuments: Document[] = topK.map(r => new Document({
      pageContent: r.document.pageContent,
      metadata: {
        ...r.document.metadata,
        relevanceScore: r.relevanceScore,
      },
    }));

    return {
      documents,
      relevantDocuments,
      retrievalAttempts: 1,
    };
  };
}
