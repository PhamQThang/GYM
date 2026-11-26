import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../ui/Card';

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

export function WorkoutLog({ workout, saved, title, children }: {
  workout: SavedWorkout | null;
  saved: boolean;
  title?: string;
  children?: ReactNode;
}) {
  return <section className="space-y-4">
    {title && <h1 className="text-3xl font-bold">{title}</h1>}
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
      {(saved || children) && <Card className="space-y-3">
        {saved && <p role="status">Đã lưu buổi tập.</p>}
        {children}
      </Card>}
    </div>
  </section>;
}
