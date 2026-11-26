import { useEffect, useState } from 'react';
import { readClientOverview, type ClientOverview, type ClientScope } from '../../lib/repositories/client-overview';
import { buttonClass } from '../auth/pages/form-styles';
import { ClientWorkoutForm } from './ClientWorkoutForm';

const vietnamDate = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh',
});
function dateTime(value: string | null) {
  return value ? vietnamDate.format(new Date(value)) : 'Chưa có dữ liệu';
}

export function ClientOverviewPanel({ userId, clientId }: ClientScope) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<ClientOverview | 'error' | null>(null);
  const [recording, setRecording] = useState(false);
  const [saved, setSaved] = useState(false);
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

  const confirmation = saved && <p role="status">Đã lưu buổi tập.</p>;
  if (!result) return <>{confirmation}<p role="status">Đang tải hồ sơ tập luyện…</p></>;
  if (result === 'error') return <div>
    {confirmation}
    <p role="alert">Chưa tải được hồ sơ tập luyện.</p>
    <button type="button" className="underline" onClick={() => { setResult(null); setAttempt(a => a + 1); }}>Thử lại</button>
  </div>;
  const target = result.nutrition;
  const workout = result.lastWorkout;
  const values = [
    ['Giáo án', result.program ?? 'Chưa được giao'],
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
    <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
      <h3 className="font-semibold">Buổi tập gần nhất</h3>
      {workout ? <>
        <p>{dateTime(workout.started_at)}</p>
        {workout.note && <p className="whitespace-pre-wrap break-words">{workout.note}</p>}
        <ul className="space-y-1 text-sm">
          {workout.workout_sets.map(set => <li key={set.id}>
            {set.exercises?.name ?? 'Bài tập'} · {set.weight_kg} kg × {set.reps} lần
            {set.status === 'skipped' ? ' (đã bỏ qua)' : set.status === 'planned' ? ' (dự kiến)' : ''}
          </li>)}
        </ul>
      </> : <p>Chưa có buổi tập đã lưu.</p>}
      {confirmation}
      {recording ? <ClientWorkoutForm clientId={clientId} onClose={() => setRecording(false)} onSave={() => {
        setRecording(false); setSaved(true); setResult(null); setAttempt(value => value + 1);
      }} /> : <button type="button" className={buttonClass} onClick={() => { setSaved(false); setRecording(true); }}>Ghi buổi tập</button>}
    </div>
  </section>;
}
