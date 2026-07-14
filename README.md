# rag-langgraph

Sistema RAG (Retrieval Augmented Generation) para Q&A sobre documentación técnica. Backend NestJS, frontend React, orquestación con LangGraph, tracing con LangSmith.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | NestJS (modular, domain-driven) |
| Frontend | React 19 + Vite + TanStack Query + Zustand + Tailwind |
| Pipeline RAG | LangChain + LangGraph (CRAG pattern) |
| Vector store | Qdrant |
| Embeddings | OpenAI text-embedding-3-small |
| Reranking | Cohere Rerank |
| LLM | GPT-4o-mini (grading) / GPT-4o (generation) |
| Cola de ingesta | Bull + Redis |
| Tracing | LangSmith |
| Infra | Docker Compose |

## Arquitectura

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend React + Vite                 │
│  Chat UI  │  Document Manager  │  Source Citations       │
│  TanStack Query + Zustand + EventSource (SSE)            │
└──────────────────────┬───────────────────────────────────┘
                       │  SSE streaming (tokens en vivo)
                       │  WebSocket (eventos de ingesta)
┌──────────────────────▼───────────────────────────────────┐
│                    NestJS Backend                        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Ingestion   │  │     RAG      │  │     Chat       │  │
│  │  Module      │  │   Module     │  │    Module      │  │
│  │              │  │              │  │                │  │
│  │ • Upload     │  │  • Retrieve  │  │  • SSE stream  │  │
│  │ • Chunking   │  │  • Grade     │  │  • History     │  │
│  │ • Embedding  │  │  • Generate  │  │  • Sources     │  │
│  │ • Bull queue │  │  • Rerank    │  │                │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────┘  │
│         │                 │                    │         │
│         └─────────────────┼────────────────────┘         │
│                           │                              │
│              ┌────────────▼────────────┐                 │
│              │   LangGraph Pipeline    │                 │
│              │     (CRAG Pattern)      │                 │
│              │                         │                 │
│              │  retrieve ──► grade ──┐ │                 │
│              │                       │ │                 │
│              │         ┌─────────────┘ │                 │
│              │         │ ALL relevant  │                 │
│              │         ▼               │                 │
│              │  ┌─ rewrite ◄─ SOME bad │                 │
│              │  │  (reconsulta)        │                 │
│              │  └─────► retrieve ──┐   │                 │
│              │                     │   │                  │
│              │         ┌──────────┘    │                  │
│              │         ▼ ALL good      │                  │
│              │     generate ──► check ──► grounded ✅   │
│              │                         │                  │
│              │               └──► regenerate (max 3)     │
│              └─────────────────────────┘                  │
│                                                           │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│                    Servicios                              │
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐  │
│  │  Qdrant  │  │  Redis   │  │  LangSmith (tracing)   │  │
│  │  (vec-   │  │  (queue  │  │                        │  │
│  │  store)  │  │   +cache)│  │  • Trace every step    │  │
│  │          │  │          │  │  • Evaluate retrieval   │  │
│  │          │  │          │  │  • Debug pipeline       │  │
│  └──────────┘  └──────────┘  └────────────────────────┘  │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Providers (abstracción con interfaces)              │ │
│  │  EmbeddingProvider │ VectorStoreProvider             │ │
│  │  ChatModelProvider │ RerankerProvider                │ │
│  └──────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

## Pipeline RAG (CRAG)

El flujo de Q&A usa el patrón **Corrective RAG** implementado con LangGraph:

1. **retrieve** — búsqueda semántica en Qdrant + reranking con Cohere
2. **grade** — GPT-4o-mini evalúa si los chunks recuperados son relevantes
3. **rewrite** — si hay chunks irrelevantes, reformula la consulta y reintenta
4. **generate** — GPT-4o genera respuesta con contexto relevante
5. **hallucination check** — verifica que la respuesta esté grounded en los sources
6. **regenerate** — si alucinó, reintenta (máximo 3 intentos)

## Capacidades

- `document-ingestion`: Ingesta, chunking y embedding de PDF y markdown
- `rag-chat`: Chat con streaming SSE, citas de fuentes visibles
- `document-management`: CRUD de documentos y metadata
- `pipeline-monitoring`: Tracing con LangSmith y logging estructurado

## Cómo empezar

```bash
# Clonar e instalar
git clone <repo-url>
cd rag-langgraph
pnpm install

# Configurar entorno (solo example — el .env es personal)
cp .env.example .env
# Editar .env con tus API keys

# Levantar servicios
docker compose up -d

# Iniciar desarrollo
pnpm dev
```

## Licencia

MIT
