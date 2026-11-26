import type { ReactNode } from 'react';
import { Dumbbell, LoaderCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AuthFrame({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-[var(--color-app-bg)] text-[var(--color-text-main)] flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-panel-bg)] p-6 sm:p-8 shadow-2xl" aria-labelledby="auth-title">
        <div className="mb-8 flex items-center gap-3 text-[var(--color-primary)]">
          <Dumbbell aria-hidden="true" className="size-7" /><span className="text-sm font-bold tracking-[0.2em]">PULSE / KINETIC</span>
        </div>
        <h1 id="auth-title" className="text-2xl font-bold">{title}</h1>
        {description && <p className="mt-3 mb-6 text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>}
        <div className="mt-6 space-y-5">{children}</div>
      </section>
    </main>
  );
}

export function AuthNotice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <p role={error ? 'alert' : 'status'} className={`rounded-xl border p-4 text-sm leading-6 ${error ? 'border-red-400/30 bg-red-400/10 text-red-300' : 'border-[var(--color-border)] bg-[var(--color-card-bg)] text-[var(--color-text-muted)]'}`}>{children}</p>;
}

export function AuthLoading() {
  return <div role="status" className="flex items-center gap-3 py-4 text-sm text-[var(--color-text-muted)]"><LoaderCircle aria-hidden="true" className="size-5 animate-spin" />Đang kiểm tra tài khoản…</div>;
}

export function LoginLink() {
  return <Link to="/login" className="inline-flex min-h-11 items-center font-semibold text-sm text-[var(--color-primary)] hover:underline">Về trang đăng nhập</Link>;
}
