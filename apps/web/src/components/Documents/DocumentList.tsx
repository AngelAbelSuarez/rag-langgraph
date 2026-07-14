import { useEffect, useState, useCallback } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { listDocuments, deleteDocument } from '../../api/client';
import type { Document } from '@rag/shared';

const PAGE_SIZE = 10;

const STATUS_CONFIG: Record<Document['status'], { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
  pending: { variant: 'secondary', label: 'Pendiente' },
  processing: { variant: 'default', label: 'Procesando' },
  ready: { variant: 'outline', label: 'Listo' },
  failed: { variant: 'destructive', label: 'Error' },
};

export function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listDocuments({ status: statusFilter || undefined, page, limit: PAGE_SIZE });
      setDocuments(res.data);
      setTotal(res.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleDelete = useCallback(async (id: string) => {
    setDeleting(true);
    try {
      await deleteDocument(id);
      setDeleteId(null);
      fetchDocs();
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  }, [fetchDocs]);

  return (
    <Card>
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-sm font-semibold">Documentos</h3>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-sm border border-input rounded-lg px-3 py-1.5 bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="processing">Procesando</option>
          <option value="ready">Listo</option>
          <option value="failed">Error</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Cargando...
          </div>
        ) : documents.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            No hay documentos. Subí uno para empezar.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {documents.map((doc) => {
                const cfg = STATUS_CONFIG[doc.status];
                return (
                  <tr key={doc.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium truncate max-w-[200px]">{doc.filename}</td>
                    <td className="px-4 py-3 text-muted-foreground uppercase text-xs">{doc.sourceType}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(doc.createdAt).toLocaleDateString('es-AR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {deleteId === doc.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-muted-foreground">¿Eliminar?</span>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(doc.id)}
                            disabled={deleting}
                            className="h-7 text-xs px-2"
                          >
                            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Sí'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(null)}
                            className="h-7 text-xs px-2"
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(doc.id)}
                          className="text-muted-foreground hover:text-destructive h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <span className="text-xs text-muted-foreground">
            Página {page} de {totalPages} ({total} documentos)
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}