import { UploadPanel } from './UploadPanel';
import { DocumentList } from './DocumentList';

export function DocumentsPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-xl font-semibold">Documentos</h2>
        <UploadPanel />
        <DocumentList />
      </div>
    </div>
  );
}