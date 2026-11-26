import type { ReactNode } from 'react';
import { Play } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { WORKOUT_TABS } from '../../lib/navigation';
import type { WorkoutDay } from '../../lib/types';
import { WorkoutPage } from './workout/WorkoutPage';

export default function Workout({ basePath = '', children }: { basePath?: string; children: ReactNode }) {
  return <WorkoutPage>
    <nav aria-label="Menu tập luyện" className="mx-auto mb-8 flex w-fit max-w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-bg)] p-1">
      {WORKOUT_TABS.map(({ id, path, label }) => <NavLink key={id} to={basePath + path} end
        className={({ isActive }) => `rounded-lg px-4 py-2.5 text-sm font-semibold transition-all sm:px-6 ${isActive
          ? 'bg-[var(--color-primary)] text-black shadow-md' : 'text-[var(--color-text-muted)] hover:text-white'}`}>
        {label}
      </NavLink>)}
    </nav>
    {children}
  </WorkoutPage>;
}

export function WorkoutStart({ workoutDays, exerciseCount, onStart, onOpenProgram, empty, children }: {
  workoutDays: Pick<WorkoutDay, 'id' | 'name' | 'day_of_week' | 'is_active'>[];
  exerciseCount: (dayId: string) => number;
  onStart: (dayId: string) => void;
  onOpenProgram: () => void;
  empty?: ReactNode;
  children?: ReactNode;
}) {
  return (
      <div className="bg-[var(--color-panel-bg)] rounded-3xl p-8 border border-[var(--color-border)] shadow-xl text-center">
         <h2 className="text-3xl font-bold mb-2">Chương Trình Bắt Đầu</h2>
         <p className="text-[var(--color-text-muted)] text-sm max-w-lg mx-auto mb-8">
           Chọn một ngày tập để bắt đầu ghi nhận.
         </p>

         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {workoutDays.filter(d => d.is_active !== false).map(day => {
              const activeExCount = exerciseCount(day.id);
              const canStart = activeExCount > 0;

              return (
                <button
                  key={day.id}
                  onClick={() => canStart ? onStart(day.id) : onOpenProgram()}
                  className={`border p-6 rounded-2xl flex flex-col items-center justify-center transition-all group ${
                    canStart
                      ? 'bg-[var(--color-app-bg)] hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/50 border-[var(--color-border)]'
                      : 'bg-[var(--color-card-bg)]/50 border-red-500/20 hover:border-red-500/50 hover:bg-red-500/5'
                  }`}
                >
                   <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors border ${
                     canStart
                       ? 'bg-[var(--color-card-bg)] group-hover:bg-[var(--color-primary)]/20 border-[var(--color-border)] group-hover:border-[var(--color-primary)]/50'
                       : 'bg-red-500/10 border-red-500/20 group-hover:bg-red-500/20'
                   }`}>
                     <Play className={`w-5 h-5 ml-1 transition-colors ${canStart ? 'text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)]' : 'text-red-400'}`} />
                   </div>
                   <h3 className="font-bold text-lg">{day.name}</h3>
                   {!canStart ? (
                      <p className="text-[10px] text-red-400 uppercase tracking-widest mt-1 font-bold">Chưa Có Bài Tập</p>
                   ) : (
                      <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mt-1">Ngày {day.day_of_week} • {activeExCount} Bài</p>
                   )}
                </button>
              );
            })}
         </div>
        {workoutDays.length === 0 && empty}
      {children}
    </div>
  );
}
