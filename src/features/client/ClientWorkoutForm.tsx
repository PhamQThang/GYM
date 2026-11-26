import { useEffect, useState, type FormEvent } from 'react';
import { AuthNotice } from '../auth/pages/AuthFrame';
import { buttonClass, inputClass, secondaryButtonClass } from '../auth/pages/form-styles';
import { loadWorkoutExercises, saveClientWorkout } from '../../lib/repositories/client-workout';

type Exercise = Awaited<ReturnType<typeof loadWorkoutExercises>>[number];
type WorkoutRequest = Parameters<typeof saveClientWorkout>[0];
type SetDraft = { id: string; exercise_id: string; weight_kg: string; reps: string };

function newSet(exerciseId = ''): SetDraft {
  return { id: crypto.randomUUID(), exercise_id: exerciseId, weight_kg: '', reps: '' };
}

export function ClientWorkoutForm({ clientId, onClose, onSave }: {
  clientId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [catalog, setCatalog] = useState<Exercise[] | 'error' | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [sets, setSets] = useState<SetDraft[]>(() => [newSet()]);
  const [note, setNote] = useState('');
  const [request, setRequest] = useState<WorkoutRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void loadWorkoutExercises(controller.signal)
      .then(rows => { if (!controller.signal.aborted) setCatalog(rows); })
      .catch(() => { if (!controller.signal.aborted) setCatalog('error'); });
    return () => controller.abort();
  }, [attempt]);

  function updateSet(index: number, change: Partial<SetDraft>) {
    setSets(rows => rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...change } : row));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const workout = request ?? {
      p_workout_id: crypto.randomUUID(),
      p_client_id: clientId,
      p_recorded_at: new Date().toISOString(),
      p_note: note.trim(),
      p_sets: sets.map(({ exercise_id, weight_kg, reps }) => ({
        exercise_id, weight_kg: Number(weight_kg), reps: Number(reps),
      })),
    };
    setRequest(workout);
    setBusy(true);
    setFailed(false);
    try { await saveClientWorkout(workout); onSave(); }
    catch { setFailed(true); }
    finally { setBusy(false); }
  }

  return <form className="space-y-3" onSubmit={event => void submit(event)} aria-busy={busy}>
    {catalog === null && <p role="status">Đang tải bài tập…</p>}
    {catalog === 'error' && <>
      <AuthNotice error>Chưa tải được danh sách bài tập.</AuthNotice>
      <button type="button" className={secondaryButtonClass} onClick={() => { setCatalog(null); setAttempt(value => value + 1); }}>Thử tải lại</button>
    </>}
    {catalog?.length === 0 && <AuthNotice>Chưa có bài tập khả dụng.</AuthNotice>}
    {Array.isArray(catalog) && catalog.length > 0 && <>
      <fieldset className="space-y-3" disabled={request !== null}>
        {sets.map((set, index) => <fieldset key={set.id} className="space-y-3 rounded-lg border border-[var(--color-border)] px-3 pb-3">
          <legend className="px-1 text-sm">Hiệp {index + 1}</legend>
          <label className="block space-y-1 text-sm">Bài tập
            <select className={inputClass} required value={set.exercise_id} onChange={event => updateSet(index, { exercise_id: event.target.value })}>
              <option value="">Chọn bài tập</option>
              {catalog.map(exercise => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="min-w-0 space-y-1 text-sm">Tạ (kg)
              <input className={inputClass} required type="number" min="0" max="9999.99" step="0.01" inputMode="decimal" value={set.weight_kg}
                onChange={event => updateSet(index, { weight_kg: event.target.value })} />
            </label>
            <label className="min-w-0 space-y-1 text-sm">Số lần
              <input className={inputClass} required type="number" min="1" max="9999" step="1" inputMode="numeric" value={set.reps}
                onChange={event => updateSet(index, { reps: event.target.value })} />
            </label>
          </div>
          {sets.length > 1 && <button type="button" className={secondaryButtonClass}
            onClick={() => setSets(rows => rows.filter(row => row.id !== set.id))}>Bỏ hiệp {index + 1}</button>}
        </fieldset>)}
        <button type="button" className={secondaryButtonClass} disabled={sets.length >= 100}
          onClick={() => setSets(rows => [...rows, newSet(rows.at(-1)?.exercise_id)])}>Thêm hiệp</button>
        <label className="block space-y-1 text-sm">Ghi chú buổi tập
          <textarea className={inputClass} rows={2} maxLength={1000} value={note} onChange={event => setNote(event.target.value)} />
        </label>
      </fieldset>
      {failed && <AuthNotice error>Chưa xác nhận được buổi tập đã lưu. Hãy thử lưu lại.</AuthNotice>}
      <button type="submit" className={buttonClass} disabled={busy}>{busy ? 'Đang lưu…' : failed ? 'Thử lưu lại' : 'Lưu buổi tập'}</button>
    </>}
    <button type="button" className={secondaryButtonClass} disabled={busy} onClick={onClose}>Đóng biểu mẫu</button>
  </form>;
}
