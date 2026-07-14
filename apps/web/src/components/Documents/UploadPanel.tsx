import { useState, useRef, useCallback, DragEvent } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadDocument } from '../../api/client';
import { cn } from '@/lib/utils';

const MAX_SIZE = 20 * 1024 * 1024;
const ACCEPTED_TYPES = ['.pdf', '.md', '.mdx'];

export function UploadPanel() {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext)) {
      setErrorMsg(`Tipo no soportado. Aceptados: ${ACCEPTED_TYPES.join(', ')}`);
      setStatus('error');
      return;
    }

    if (file.size > MAX_SIZE) {
      setErrorMsg('Archivo demasiado grande (máx 20MB)');
      setStatus('error');
      return;
    }

    setFileName(file.name);
    setUploading(true);
    setProgress(0);
    setStatus('uploading');
    setErrorMsg('');

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 90));
    }, 300);

    try {
      await uploadDocument(file);
      clearInterval(progressInterval);
      setProgress(100);
      setStatus('success');
    } catch (err) {
      clearInterval(progressInterval);
      setErrorMsg(err instanceof Error ? err.message : 'Error al subir');
      setStatus('error');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold mb-3">Subir documento</h3>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
          dragOver ? 'border-primary bg-accent' : 'border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/50',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
        />

        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Arrastrá un archivo acá o <span className="text-primary font-medium">seleccioná uno</span>
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">PDF, MD, MDX — máx 20MB</p>
      </div>

      {status !== 'idle' && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-medium truncate">{fileName}</span>
            <span className="text-muted-foreground shrink-0 ml-2">
              {status === 'uploading' && `${progress}%`}
              {status === 'success' && 'Completado'}
              {status === 'error' && 'Error'}
            </span>
          </div>

          {status === 'uploading' && (
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              Documento subido correctamente
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              {errorMsg}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}