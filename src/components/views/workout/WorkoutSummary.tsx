import { CheckCircle2, TrendingUp, Dumbbell, History, ArrowRight, Save, Trash2, List } from 'lucide-react';
import { useAppStore } from '../../../lib/store';
import { derivePRsInSession, e1RM } from '../../../lib/analytics';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ROUTES } from '../../../lib/navigation';
import { WorkoutSet } from '../../../lib/types';

interface WorkoutSummaryProps {
  onClose: () => void;
}

export default function WorkoutSummary({ onClose }: WorkoutSummaryProps) {
  const activeSession = useAppStore((s) => s.activeSession);
  const activeSets = useAppStore((s) => s.activeSets);
  const workoutHistory = useAppStore((s) => s.workoutHistory);
  const setHistory = useAppStore((s) => s.setHistory);
  const workoutExercises = useAppStore((s) => s.workoutExercises);
  const exercises = useAppStore((s) => s.exercises);
  const saveWorkout = useAppStore((s) => s.saveWorkout);
  const discardWorkout = useAppStore((s) => s.discardWorkout);
  const navigate = useNavigate();

  const [isSaved, setIsSaved] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Auto close if there's no active session and we haven't just saved
  useEffect(() => {
    if (!activeSession && !isSaved) {
       onClose();
    }
  }, [activeSession, isSaved, onClose]);

  const displaySession = isSaved ? workoutHistory[workoutHistory.length - 1] : activeSession;

  if (!displaySession) return null;
  if (!isSaved && displaySession.status !== 'REVIEWING') {
      return null;
  }

  const displaySets = isSaved
    ? setHistory.filter(s => s.session_id === displaySession.id)
    : activeSets;

  const handleSave = () => {
     saveWorkout();
     setIsSaved(true);
  };

  const handleDiscard = () => {
     discardWorkout();
     onClose();
  };

  const handleOverview = () => {
     if (!isSaved) {
        setShowDiscardConfirm(true);
     } else {
        onClose();
        navigate(ROUTES.overview);
     }
  };

  const handleHistory = () => {
     if (isSaved) {
        onClose();
        navigate(ROUTES.history);
     }
  };

  // Calculate stats
  const startTime = new Date(displaySession.start_time).getTime();
  const endTime = new Date(displaySession.end_time || displaySession.start_time).getTime();
  const durationMs = endTime - startTime;
  const durationMinutes = Math.floor(durationMs / 60000);

  const completedSets = displaySets.filter(s => s.status === 'COMPLETED');
  const prSetIds = derivePRsInSession(completedSets, setHistory, workoutExercises);
  const prCount = prSetIds.size;
  const adherencePct = displaySets.length > 0
    ? Math.round((completedSets.length / displaySets.length) * 100)
    : 100;

  // Exercise Breakdown
  const weGroup = new Map<string, WorkoutSet[]>();
  for (const s of displaySets) {
      if (!weGroup.has(s.workout_exercise_id)) weGroup.set(s.workout_exercise_id, []);
      weGroup.get(s.workout_exercise_id)!.push(s);
  }

  const breakdowns = [];
  for (const [weId, sets] of weGroup.entries()) {
      const we = workoutExercises.find(w => w.id === weId);
      if (!we) continue;
      const ex = exercises.find(e => e.id === we.exercise_id);
      const compSets = sets.filter(s => s.status === 'COMPLETED');
      let vol = 0;
      let bestSet: WorkoutSet | null = null;
      let maxE1rm = 0;
      let isPR = false;

      for (const s of compSets) {
         vol += s.weight * s.reps;
         const e1 = e1RM(s.weight, s.reps);
         if (e1 >= maxE1rm) {
             maxE1rm = e1;
             bestSet = s;
         }
         if (prSetIds.has(s.id)) {
             isPR = true;
         }
      }

      breakdowns.push({
         exerciseName: ex ? ex.name : 'Unknown Exercise',
         completedSets: compSets.length,
         plannedSets: we.planned_sets,
         totalVolume: Math.round(vol),
         bestSet,
         isPR
      });
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in zoom-in duration-500 relative">
       {showDiscardConfirm && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-[var(--color-panel-bg)] border border-[var(--color-border)] rounded-2xl w-full max-w-sm p-6 shadow-2xl">
             <h3 className="text-xl font-bold mb-4">Hủy Buổi Tập?</h3>
             <p className="text-[var(--color-text-muted)] mb-6">
               Buổi tập chưa được lưu và sẽ bị xóa vĩnh viễn. Bạn có chắc chắn?
             </p>
             <div className="flex gap-3">
               <button onClick={() => setShowDiscardConfirm(false)} className="flex-1 py-3 bg-[var(--color-app-bg)] text-white rounded-xl font-semibold border border-[var(--color-border)] transition-colors hover:bg-gray-800">Tiếp Tục Đánh Giá</button>
               <button onClick={handleDiscard} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors">Hủy Buổi Tập</button>
             </div>
           </div>
         </div>
       )}

       <div className="bg-[var(--color-panel-bg)] rounded-3xl p-8 border border-[var(--color-border)] shadow-2xl flex flex-col items-center justify-center text-center mt-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 border-4 ${isSaved ? 'bg-[var(--color-primary)]/20 border-[var(--color-primary)]/30' : 'bg-yellow-500/20 border-yellow-500/30'}`}>
             {isSaved ? <CheckCircle2 className="w-10 h-10 text-[var(--color-primary)]" /> : <List className="w-10 h-10 text-yellow-500" />}
          </div>
          <h2 className="text-4xl font-bold mb-2">{isSaved ? 'Đã Lưu Buổi Tập' : 'Đánh Giá Buổi Tập'}</h2>
          <p className="text-[var(--color-text-muted)] text-lg">
             {isSaved ? 'Tuyệt vời, bạn đã xuất sắc ghi nhận khối lượng tập hôm nay.' : 'Kiểm tra lại kết quả trước khi lưu vào lịch sử.'}
          </p>
       </div>

       <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-[var(--color-app-bg)] rounded-2xl p-6 border border-[var(--color-border)] flex flex-col items-center justify-center text-center">
             <TrendingUp className="w-6 h-6 text-[var(--color-primary)] mb-4" />
             <div className="text-3xl font-bold">{displaySession.total_volume.toLocaleString()}</div>
             <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-widest font-semibold mt-1">Tổng Khối Lượng (KG)</div>
          </div>
          <div className="bg-[var(--color-app-bg)] rounded-2xl p-6 border border-[var(--color-border)] flex flex-col items-center justify-center text-center">
             <History className="w-6 h-6 text-blue-400 mb-4" />
             <div className="text-3xl font-bold">{durationMinutes}</div>
             <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-widest font-semibold mt-1">Thời Gian (Phút)</div>
          </div>
          <div className="bg-[var(--color-app-bg)] rounded-2xl p-6 border border-[var(--color-border)] flex flex-col items-center justify-center text-center">
             <Dumbbell className="w-6 h-6 text-orange-400 mb-4" />
             <div className="text-3xl font-bold">{prCount > 0 ? `+${prCount}` : '—'}</div>
             <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-widest font-semibold mt-1">Kỷ Lục Cá Nhân</div>
          </div>
          <div className="bg-[var(--color-app-bg)] rounded-2xl p-6 border border-[var(--color-border)] flex flex-col items-center justify-center text-center">
             <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-4" />
             <div className="text-3xl font-bold">{adherencePct}%</div>
             <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-widest font-semibold mt-1">Tuân Thủ</div>
          </div>
       </div>

       <div className="bg-[var(--color-panel-bg)] rounded-3xl p-6 border border-[var(--color-border)] max-w-4xl mx-auto">
          <h3 className="text-xl font-bold mb-4 px-2">Chi Tiết Bài Tập</h3>
          <div className="space-y-3">
             {breakdowns.length === 0 && (
                <p className="text-[var(--color-text-muted)] text-sm px-2">Không có bài tập nào.</p>
             )}
             {breakdowns.map((b, i) => (
                <div key={i} className="bg-[var(--color-app-bg)] p-4 rounded-2xl border border-[var(--color-border)] flex items-center justify-between">
                   <div>
                      <div className="font-semibold text-lg flex items-center gap-2">
                         {b.exerciseName}
                         {b.isPR && (
                            <span className="bg-orange-500/20 text-orange-400 text-xs uppercase font-bold px-2 py-0.5 rounded-full border border-orange-500/30">PR</span>
                         )}
                      </div>
                      <div className="text-sm text-[var(--color-text-muted)] mt-1">
                         {b.completedSets} / {b.plannedSets} Hiệp • {b.totalVolume.toLocaleString()} kg
                      </div>
                   </div>
                   <div className="text-right flex flex-col items-end">
                      <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-widest font-semibold mb-1">Hiệp Tốt Nhất</div>
                      <div className="font-mono bg-[var(--color-panel-bg)] px-3 py-1 rounded-lg border border-[var(--color-border)]">
                         {b.bestSet ? `${b.bestSet.weight}kg × ${b.bestSet.reps}` : '—'}
                      </div>
                   </div>
                </div>
             ))}
          </div>
       </div>

       <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 max-w-md mx-auto">
          {!isSaved ? (
             <>
                <button onClick={() => setShowDiscardConfirm(true)} className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-6 py-4 rounded-xl font-bold transition-all border border-red-500/20">
                   <Trash2 className="w-5 h-5" /> Hủy
                </button>
                <button onClick={handleSave} className="flex-[2] flex items-center justify-center gap-2 bg-[var(--color-primary)] text-black hover:brightness-110 px-8 py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.3)]">
                   <Save className="w-5 h-5" /> Lưu Workout
                </button>
             </>
          ) : (
             <>
                <button onClick={handleOverview} className="flex-1 flex items-center justify-center gap-2 bg-[var(--color-app-bg)] text-white hover:bg-gray-800 px-6 py-4 rounded-xl font-bold transition-all border border-[var(--color-border)]">
                   Tổng Quan
                </button>
                <button onClick={handleHistory} className="flex-[2] flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-xl font-bold transition-colors shadow-lg">
                   Xem Lịch Sử <ArrowRight className="w-5 h-5" />
                </button>
             </>
          )}
       </div>

       {!isSaved && (
          <div className="flex justify-center mt-4">
             <button onClick={handleOverview} className="text-sm text-[var(--color-text-muted)] hover:text-white transition-colors underline underline-offset-4">
                Trở Về Tổng Quan
             </button>
          </div>
       )}
    </div>
  );
}
