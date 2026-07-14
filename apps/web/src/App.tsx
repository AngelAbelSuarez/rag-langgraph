import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ChatContainer } from './components/Chat/ChatContainer';
import { DocumentsPage } from './components/Documents/DocumentsPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route element={<Layout />}>
        <Route path="/chat" element={<ChatContainer />} />
        <Route path="/documents" element={<DocumentsPage />} />
      </Route>
    </Routes>
  );
}
