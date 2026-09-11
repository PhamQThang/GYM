import { CheckCircle2, TrendingUp, Dumbbell, History, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

interface WorkoutSummaryProps {
  onClose: () => void;
}

export default function WorkoutSummary({ onClose }: WorkoutSummaryProps) {
  const workoutHistory = useAppStore((s) => s.workoutHistory);
  const setHistory = useAppStore((s) => s.setHistory);
  
  // The most recent workout in history is the one we just finished
  const lastWorkout = workoutHistory[workoutHistory.length - 1];
  
  if (!lastWorkout) return null;

  // Calculate Duration
  const startTime = new Date(lastWorkout.start_time).getTime();
  const endTime = new Date(lastWorkout.end_time || lastWorkout.start_time).getTime();
  const durationMs = endTime - startTime;
  const durationMinutes = Math.floor(durationMs / 60000);

  // Real stats from setHistory
  const sessionSets = setHistory.filter(s => s.session_id === lastWorkout.id);
  const completedSets = sessionSets.filter(s => s.status === 'COMPLETED');
  const prCount = completedSets.filter(s => s.is_pr).length;
  const adherencePct = sessionSets.length > 0
    ? Math.round((completedSets.length / sessionSets.length) * 100)
    : 100;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in zoom-in duration-500">
       <div className="bg-[var(--color-panel-bg)] rounded-3xl p-8 border border-[var(--color-border)] shadow-2xl flex flex-col items-center justify-center text-center mt-6">
          <div className="w-20 h-20 bg-[var(--color-primary)]/20 rounded-full flex items-center justify-center mb-6 border-4 border-[var(--color-primary)]/30">
             <CheckCircle2 className="w-10 h-10 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-4xl font-bold mb-2">Hoàn Thành Buổi Tập</h2>
          <p className="text-[var(--color-text-muted)] text-lg">Tuyệt vời, bạn đã xuất sắc ghi nhận khối lượng tập hôm nay.</p>
       </div>

       <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-[var(--color-app-bg)] rounded-2xl p-6 border border-[var(--color-border)] flex flex-col items-center justify-center text-center">
             <TrendingUp className="w-6 h-6 text-[var(--color-primary)] mb-4" />
             <div className="text-3xl font-bold">{lastWorkout.total_volume.toLocaleString()}</div>
             <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest font-semibold mt-1">Tổng Khối Lượng (KG)</div>
          </div>
          <div className="bg-[var(--color-app-bg)] rounded-2xl p-6 border border-[var(--color-border)] flex flex-col items-center justify-center text-center">
             <History className="w-6 h-6 text-blue-400 mb-4" />
             <div className="text-3xl font-bold">{durationMinutes}</div>
             <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest font-semibold mt-1">Thời Gian (Phút)</div>
          </div>
          <div className="bg-[var(--color-app-bg)] rounded-2xl p-6 border border-[var(--color-border)] flex flex-col items-center justify-center text-center">
             <Dumbbell className="w-6 h-6 text-orange-400 mb-4" />
             <div className="text-3xl font-bold">{prCount > 0 ? `+${prCount}` : '—'}</div>
             <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest font-semibold mt-1">Kỷ Lục Cá Nhân</div>
          </div>
          <div className="bg-[var(--color-app-bg)] rounded-2xl p-6 border border-[var(--color-border)] flex flex-col items-center justify-center text-center">
             <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-4" />
             <div className="text-3xl font-bold">{adherencePct}%</div>
             <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest font-semibold mt-1">Tuân Thủ</div>
          </div>
       </div>

       <div className="flex justify-center mt-8">
          <button onClick={onClose} className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-xl font-bold transition-colors shadow-lg">
             Trở Về Tổng Quan <ArrowRight className="w-5 h-5" />
          </button>
       </div>
    </div>
  );
}
