import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { AuthNotice } from '../auth/pages/AuthFrame';
import { buttonClass } from '../auth/pages/form-styles';

async function readClientCounts(ownerId: string, signal: AbortSignal) {
  const { supabase } = await import('../../lib/supabase');
  const activeClients = () => supabase.from('clients').select('id', { count: 'exact', head: true })
    .eq('pt_id', ownerId).eq('status', 'active').is('archived_at', null).abortSignal(signal);
  const [active, unlinked] = await Promise.all([
    activeClients(),
    activeClients().is('user_id', null),
  ]);
  if (active.error || unlinked.error || active.count === null || unlinked.count === null) {
    throw new Error('Client counts unavailable');
  }
  return { active: active.count, unlinked: unlinked.count };
}

export function TrainerOverview({ ownerId }: { ownerId: string }) {
  const [counts, setCounts] = useState<Awaited<ReturnType<typeof readClientCounts>> | 'error' | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void readClientCounts(ownerId, controller.signal)
      .then(value => { if (!controller.signal.aborted) setCounts(value); })
      .catch(() => { if (!controller.signal.aborted) setCounts('error'); });
    return () => controller.abort();
  }, [attempt, ownerId]);

  return <section className="space-y-5" aria-labelledby="trainer-overview">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 id="trainer-overview" className="text-2xl font-bold">Tổng quan PT</h1>
      <Link to="/pt/clients" className={buttonClass + ' inline-flex items-center justify-center sm:w-auto'}>Quản lý lời mời</Link>
    </div>
    {counts === 'error' ? <>
      <AuthNotice error>Chưa tải được số liệu học viên.</AuthNotice>
      <button type="button" className="underline" onClick={() => { setCounts(null); setAttempt(value => value + 1); }}>Thử lại</button>
    </> : counts === null ? <p role="status">Đang tải số liệu học viên…</p> : <dl className="grid gap-3 sm:grid-cols-2">
      <Card>
        <dt className="text-sm text-[var(--color-text-muted)]">Học viên đang hoạt động</dt>
        <dd className="mt-2 text-3xl font-bold">{counts.active}</dd>
      </Card>
      <Card>
        <dt className="text-sm text-[var(--color-text-muted)]">Chưa liên kết tài khoản</dt>
        <dd className="mt-2 text-3xl font-bold">{counts.unlinked}</dd>
      </Card>
    </dl>}
  </section>;
}
