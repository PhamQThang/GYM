import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../ui/Card';
import { WorkoutPage } from './WorkoutPage';

type SavedWorkout = {
  started_at: string;
  note: string | null;
  workout_sets: {
    id: string;
    weight_kg: number;
    reps: number;
    status: string;
    exercises: { name: string } | null;
  }[];
};

const workoutDate = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh',
});

export function WorkoutLog({ workout, saved, onRecord, children }: {
  workout: SavedWorkout | null;
  saved: boolean;
  onRecord: () => void;
  children?: ReactNode;
}) {
  return <WorkoutPage>
    <h1 className="text-3xl font-bold">Tập Luyện</h1>
    <div className="grid items-start gap-4 xl:grid-cols-2">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Buổi tập gần nhất</h2>
          <Link to="/client/history" className="text-sm text-[var(--color-primary)] hover:underline">Xem lịch sử</Link>
        </div>
        {workout ? <>
          <p>{workoutDate.format(new Date(workout.started_at))}</p>
          {workout.note && <p className="whitespace-pre-wrap break-words">{workout.note}</p>}
          <ul className="space-y-1 text-sm">
            {workout.workout_sets.map(set => <li key={set.id}>
              {set.exercises?.name ?? 'Bài tập'} · {set.weight_kg} kg × {set.reps} lần
              {set.status === 'skipped' ? ' (đã bỏ qua)' : set.status === 'planned' ? ' (dự kiến)' : ''}
            </li>)}
          </ul>
        </> : <p>Chưa có buổi tập đã lưu.</p>}
      </Card>
      <Card className="space-y-3">
        {saved && <p role="status">Đã lưu buổi tập.</p>}
        {children ?? <button type="button" onClick={onRecord} className="min-h-12 w-full rounded-xl bg-[var(--color-primary)] px-4 py-3 font-bold text-black hover:brightness-110">Ghi buổi tập</button>}
      </Card>
    </div>
  </WorkoutPage>;
}
