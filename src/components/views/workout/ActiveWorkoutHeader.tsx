import { Timer, Volume2, Check } from 'lucide-react';
import { useAppStore } from '../../../lib/store';
import { useRestTimer } from '../../../lib/useRestTimer';
import { WorkoutDay } from '../../../lib/types';

export default function ActiveWorkoutHeader({ workoutDay, onFinish }: { workoutDay: WorkoutDay | undefined, onFinish: () => void }) {
  const { remaining, active: restTimerActive } = useRestTimer();
  
  const m = Math.floor(remaining / 60).toString().padStart(2, '0');
  const s = (remaining % 60).toString().padStart(2, '0');

  return (
    <div className="bg-[var(--color-panel-bg)] rounded-2xl p-6 lg:p-8 border border-[var(--color-border)]">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-2">
            <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-pulse"></span>
            ĐANG GHI NHẬN <span className="text-[var(--color-text-muted)]">• GIAI ĐOẠN: PHÌ ĐẠI CƠ 2</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">{workoutDay?.name ?? 'Buổi Tập'}</h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-xl">
            Trọng Tâm: {workoutDay?.focus ?? '—'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
           <div className="flex items-center gap-3 bg-[var(--color-app-bg)] px-4 py-3 rounded-xl border border-[var(--color-border)] w-full sm:w-auto">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <Timer className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">TỰ ĐỘNG NGHỈ</div>
                <div className="text-lg font-bold leading-none mt-0.5">{restTimerActive ? `${m}:${s}` : 'TẮT'}</div>
              </div>
              <button className="ml-2 w-8 h-8 rounded-lg bg-[var(--color-card-bg)] flex items-center justify-center hover:bg-[var(--color-card-hover)] transition-colors">
                <Volume2 className="w-4 h-4 text-[var(--color-text-muted)]" />
              </button>
           </div>
           
           <button onClick={onFinish} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary-dark)] px-8 py-3.5 rounded-xl font-bold transition-colors">
             <Check className="w-5 h-5" />
             Kết Thúc Tập
           </button>
        </div>
      </div>
    </div>
  );
}
