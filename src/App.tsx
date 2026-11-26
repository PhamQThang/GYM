import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';

const LocalTracker = lazy(() => import('./LocalTracker'));
const CloudApp = lazy(() => import('./CloudApp'));
const cloudEnabled = import.meta.env.VITE_ENABLE_CLOUD_AUTH === 'true';

export default function App() {
  return <ErrorBoundary><BrowserRouter><Suspense fallback={<p role="status">Đang tải…</p>}>
    {cloudEnabled ? <CloudApp /> : <Routes>
      {['/login', '/auth/*', '/invite', '/pt/*', '/client/*', '/forgot-password', '/reset-password', '/account'].map(path =>
        <Route key={path} path={path} element={<main className="p-8"><h1>Đăng nhập chưa được bật</h1><a href="/">Mở nhật ký trên thiết bị</a></main>} />)}
      <Route path="*" element={<LocalTracker />} />
    </Routes>}
  </Suspense></BrowserRouter></ErrorBoundary>;
}
