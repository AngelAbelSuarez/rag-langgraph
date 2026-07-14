import type { Document } from '@rag/shared';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API error ${res.status}: ${errorBody}`);
  }
  return res.json() as Promise<T>;
}

export async function uploadDocument(
  file: File,
  metadata?: Record<string, unknown>,
): Promise<{ id: string; filename: string }> {
  const form = new FormData();
  form.append('file', file);
  if (metadata) form.append('metadata', JSON.stringify(metadata));

  const res = await fetch(`${API_BASE}/ingestion/upload`, { method: 'POST', body: form });
  return handleResponse<{ id: string; filename: string }>(res);
}

export type StreamEventCallback = {
  onToken?: (token: string) => void;
  onSources?: (sources: import('@rag/shared').SourceCitation[]) => void;
  onDone?: (conversationId: string) => void;
  onError?: (message: string) => void;
};

export async function streamChat(
  question: string,
  conversationId?: string,
  callbacks?: StreamEventCallback,
): Promise<void> {
  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, conversationId }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    callbacks?.onError?.(`Server error ${res.status}: ${errorBody}`);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    callbacks?.onError?.('No response body');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    let currentEvent = '';
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        const raw = line.slice(6);
        try {
          const data = JSON.parse(raw);
          switch (currentEvent) {
            case 'token':
              callbacks?.onToken?.(data.token);
              break;
            case 'sources':
              callbacks?.onSources?.(data.sources);
              break;
            case 'done':
              callbacks?.onDone?.(data.conversationId);
              break;
            case 'error':
              callbacks?.onError?.(data.message ?? 'Unknown error');
              break;
          }
        } catch {
          // skip malformed JSON
        }
        currentEvent = '';
      }
    }
  }
}

export async function listDocuments(
  filter?: { status?: string; sourceType?: string; page?: number; limit?: number },
): Promise<{ data: Document[]; total: number }> {
  const params = new URLSearchParams();
  if (filter?.status) params.set('status', filter.status);
  if (filter?.sourceType) params.set('sourceType', filter.sourceType);
  if (filter?.page) params.set('page', String(filter.page));
  if (filter?.limit) params.set('limit', String(filter.limit));

  const qs = params.toString();
  const url = `${API_BASE}/documents${qs ? `?${qs}` : ''}`;
  const res = await fetch(url);
  return handleResponse<{ data: Document[]; total: number }>(res);
}

export async function getDocument(id: string): Promise<Document> {
  const res = await fetch(`${API_BASE}/documents/${id}`);
  return handleResponse<Document>(res);
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API error ${res.status}: ${errorBody}`);
  }
}
