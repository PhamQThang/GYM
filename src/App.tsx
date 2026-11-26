import { lazy, Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';

const CloudApp = lazy(() => import('./CloudApp'));
const configured = Boolean(import.meta.env.VITE_SUPABASE_URL &&
  (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY));

export default function App() {
  return <ErrorBoundary><BrowserRouter><Suspense fallback={<p role="status">Đang tải…</p>}>
    {configured ? <CloudApp /> : <main className="mx-auto max-w-xl space-y-3 p-8">
      <h1 className="text-2xl font-bold">Ứng dụng chưa kết nối Supabase</h1>
      <p role="status">Thiếu cấu hình Supabase cho bản triển khai này.</p>
    </main>}
  </Suspense></BrowserRouter></ErrorBoundary>;
}
