import { useEffect, useState } from 'react';
import { readClientOverview, type ClientOverview, type ClientScope } from '../../lib/repositories/client-overview';

const vietnamDate = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh',
});
function dateTime(value: string | null) {
  return value ? vietnamDate.format(new Date(value)) : 'Chưa có dữ liệu';
}

export function ClientOverviewPanel({ userId, clientId }: ClientScope) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<ClientOverview | 'error' | null>(null);
  useEffect(() => {
    const request = new AbortController();
    void import('../../lib/supabase')
      .then(({ supabase }) => {
        if (!request.signal.aborted) return readClientOverview(supabase, { userId, clientId }, request.signal);
      })
      .then(data => { if (data && !request.signal.aborted) setResult(data); })
      .catch(() => { if (!request.signal.aborted) setResult('error'); });
    return () => request.abort();
  }, [attempt, userId, clientId]);

  if (!result) return <p role="status">Đang tải hồ sơ tập luyện…</p>;
  if (result === 'error') return <div>
    <p role="alert">Chưa tải được hồ sơ tập luyện.</p>
    <button type="button" className="underline" onClick={() => { setResult(null); setAttempt(a => a + 1); }}>Thử lại</button>
  </div>;
  const target = result.nutrition;
  const values = [
    ['Giáo án', result.program ?? 'Chưa được giao'],
    ['Lần tập gần nhất', dateTime(result.lastWorkoutAt)],
    ['Buổi PT sắp tới', dateTime(result.nextSessionAt)],
    ['Gói tập đang dùng', result.packageName ?? 'Chưa có gói đang hoạt động'],
    ['Cân nặng gần nhất', result.weight ? result.weight.kg + ' kg' : 'Chưa ghi cân nặng'],
    ['Mục tiêu dinh dưỡng', target && Object.values(target).some(value => value !== null)
      ? [target.calories !== null && target.calories + ' kcal', target.protein !== null && target.protein + ' g protein',
        target.carbs !== null && target.carbs + ' g carbs', target.fat !== null && target.fat + ' g chất béo'].filter(Boolean).join(' · ')
      : 'Chưa thiết lập'],
  ];
  return <section aria-label="Tổng quan tập luyện" className="space-y-3">
    <h2 className="font-semibold">Tổng quan tập luyện</h2>
    <dl className="grid gap-2 sm:grid-cols-2">
      {values.map(([label, value]) => <div key={label} className="rounded-lg border border-[var(--color-border)] p-3">
        <dt className="text-sm text-[var(--color-text-muted)]">{label}</dt><dd>{value}</dd>
      </div>)}
    </dl>
  </section>;
}
