import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Workout, { WorkoutStart } from '../../components/views/Workout';
import ExerciseLibrary from '../../components/views/workout/ExerciseLibrary';
import ProgramEditor from '../../components/views/workout/ProgramEditor';
import { WorkoutLog } from '../../components/views/workout/WorkoutLog';
import { WorkoutLogForm } from '../../components/views/workout/WorkoutLogForm';
import { ROUTES } from '../../lib/navigation';
import type { ClientScope } from '../../lib/repositories/client-overview';
import { loadClientWorkout, saveClientWorkout } from '../../lib/repositories/client-workout';
import type { WorkoutTabId } from '../../lib/types';

type WorkoutData = Awaited<ReturnType<typeof loadClientWorkout>>;

export function ClientWorkoutPage({ userId, clientId, tab }: ClientScope & { tab: WorkoutTabId }) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [workspace, setWorkspace] = useState<WorkoutData | 'error' | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void import('../../lib/supabase')
      .then(({ supabase }) => {
        if (!controller.signal.aborted) return loadClientWorkout(supabase, { userId, clientId }, controller.signal);
      })
      .then(data => { if (data && !controller.signal.aborted) setWorkspace(data); })
      .catch(() => { if (!controller.signal.aborted) setWorkspace('error'); });
    return () => controller.abort();
  }, [attempt, userId, clientId]);

  const frame = (content: ReactNode) => <Workout basePath="/client">{content}</Workout>;
  if (!workspace) return frame(<p role="status">Đang tải lịch tập…</p>);
  if (workspace === 'error') return frame(<div className="space-y-2">
    <p role="alert">Chưa tải được lịch và thư viện bài tập.</p>
    <button type="button" className="min-h-11 underline" onClick={() => { setWorkspace(null); setAttempt(a => a + 1); }}>Thử lại</button>
  </div>);
  const { program, workoutDays, workoutExercises, exercises, lastWorkout } = workspace;
  if (tab === 'program') return frame(<ProgramEditor {...{ program, workoutDays, workoutExercises, exercises }} />);
  if (tab === 'library') return frame(<ExerciseLibrary exercises={exercises} />);

  const dayId = params.get('ngay');
  const day = workoutDays.find(row => row.id === dayId);
  const entriesFor = (id: string) => workoutExercises
    .filter(entry => entry.workout_day_id === id && entry.is_active)
    .sort((a, b) => a.order_index - b.order_index || a.id.localeCompare(b.id));
  const plannedExerciseIds = day ? entriesFor(day.id).map(entry => entry.exercise_id) : [];
  const recording = params.get('ghi') === '1' && (!dayId || plannedExerciseIds.length > 0);
  const start = (id?: string) => {
    setSaved(false);
    setParams(id ? { ghi: '1', ngay: id } : { ghi: '1' });
  };
  const close = () => setParams({}, { replace: true });

  if (recording) return frame(
    <WorkoutLog workout={lastWorkout} saved={false} title={day?.name ?? 'Tập tự do'}>
      <WorkoutLogForm key={day?.id ?? 'free'} catalog={exercises.filter(exercise => exercise.is_active)}
        plannedExerciseIds={plannedExerciseIds} onClose={close} onSave={async workout => {
          await saveClientWorkout({
            p_workout_id: workout.id, p_client_id: clientId, p_recorded_at: workout.recordedAt,
            p_note: workout.note, p_sets: workout.sets,
          });
          close();
          setSaved(true);
          setAttempt(a => a + 1);
        }} />
    </WorkoutLog>,
  );

  return frame(<>
    {dayId && params.get('ghi') === '1' && <p role="alert">Ngày tập này không còn khả dụng trong giáo án của bạn.</p>}
    <WorkoutStart workoutDays={workoutDays} exerciseCount={id => entriesFor(id).length}
      onStart={start} onOpenProgram={() => navigate('/client' + ROUTES.workoutProgram)}
      empty={<p className="text-sm text-[var(--color-text-muted)]">Chưa có ngày tập trong giáo án. Bạn có thể bắt đầu một buổi tự do.</p>}>
      <button type="button" onClick={() => start()}
        className="mt-5 min-h-11 rounded-xl bg-[var(--color-primary)] px-5 py-2 font-semibold text-black hover:brightness-110">
        Tập tự do
      </button>
    </WorkoutStart>
    <WorkoutLog workout={lastWorkout} saved={saved} />
  </>);
}
