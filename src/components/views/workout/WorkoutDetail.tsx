import { ArrowLeft, Dumbbell, Timer, TrendingUp, Trophy, Check, History } from 'lucide-react';
import { WorkoutSession, WorkoutSet, WorkoutDay, WorkoutExercise, Exercise } from '../../../lib/types';
import { durationMinutes, formatVietnamDate, derivePRsInSession } from '../../../lib/analytics';
import { Card } from '../../ui/Card';

interface WorkoutDetailProps {
  session: WorkoutSession;
  setHistory: WorkoutSet[];
  workoutDays: WorkoutDay[];
  workoutExercises: WorkoutExercise[];
  exercises: Exercise[];
  onBack: () => void;
}

export default function WorkoutDetail({
  session,
  setHistory,
  workoutDays,
  workoutExercises,
  exercises,
  onBack,
}: WorkoutDetailProps) {
  const day = workoutDays.find(d => d.id === session.workout_day_id);
  const sessionSets = setHistory.filter(s => s.session_id === session.id && s.status === 'COMPLETED');
  const minutes = durationMinutes(session.start_time, session.end_time);
  const prIds = derivePRsInSession(sessionSets, setHistory, workoutExercises);
  const prCount = prIds.size;

  // Group sets by workout_exercise_id
  const exerciseGroups = new Map<string, WorkoutSet[]>();
  for (const set of sessionSets) {
    const existing = exerciseGroups.get(set.workout_exercise_id) ?? [];
    existing.push(set);
    exerciseGroups.set(set.workout_exercise_id, existing);
  }

  // Sort groups by set_number of first set
  const sortedGroups = Array.from(exerciseGroups.entries())
    .sort((a, b) => (a[1][0]?.set_number ?? 0) - (b[1][0]?.set_number ?? 0));

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Back button + header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Quay Lại Lịch Sử
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-2">
          <History className="w-4 h-4" />
          <span>CHI TIẾT BUỔI TẬP • Chỉ Xem</span>
        </div>
        <h2 className="text-3xl font-bold mb-1">{day?.name ?? 'Buổi Tập'}</h2>
        <p className="text-sm text-[var(--color-text-muted)]">{formatVietnamDate(session.start_time)}</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: 'Tổng Khối Lượng', value: `${session.total_volume.toLocaleString()}`, unit: 'kg', color: 'text-[var(--color-primary)]' },
          { icon: Timer, label: 'Thời Gian', value: `${minutes}`, unit: 'phút', color: 'text-blue-400' },
          { icon: Dumbbell, label: 'Số Hiệp', value: `${sessionSets.length}`, unit: 'hiệp', color: 'text-orange-400' },
          { icon: Trophy, label: 'Kỷ Lục', value: prCount > 0 ? `+${prCount}` : '—', unit: prCount > 0 ? 'PR' : '', color: 'text-[var(--color-primary)]' },
        ].map(({ icon: Icon, label, value, unit, color }) => (
          <Card key={label} className="flex flex-col items-center justify-center text-center py-6">
            <Icon className={`w-6 h-6 mb-3 ${color}`} />
            <div className={`text-2xl font-bold ${color}`}>{value} <span className="text-xs text-[var(--color-text-muted)] font-normal">{unit}</span></div>
            <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest font-semibold mt-1">{label}</div>
          </Card>
        ))}
      </div>

      {/* Exercise breakdown */}
      {sortedGroups.length === 0 && (
        <Card className="text-center py-12 text-[var(--color-text-muted)]">
          Không có hiệp tập nào được hoàn thành trong buổi này.
        </Card>
      )}

      <div className="space-y-4">
        {sortedGroups.map(([weId, sets], index) => {
          const we = workoutExercises.find(w => w.id === weId);
          const ex = exercises.find(e => e.id === we?.exercise_id);
          const exerciseName = ex?.name ?? 'Bài Tập';
          const muscleGroup = ex?.primary_muscle ?? '';
          const groupVolume = sets.reduce((acc, s) => acc + s.weight * s.reps, 0);

          return (
            <div key={weId} className="bg-[var(--color-panel-bg)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
              {/* Exercise header */}
              <div className="flex items-center justify-between p-5 bg-[var(--color-card-bg)] border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-base">{exerciseName}</h4>
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mt-0.5">{muscleGroup}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-[var(--color-primary)]">{groupVolume.toLocaleString()} kg</div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">{sets.length} hiệp</div>
                </div>
              </div>

              {/* Sets table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[400px]">
                  <thead>
                    <tr className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest border-b border-[var(--color-border)]">
                      <th className="py-3 px-5 font-semibold">HIỆP</th>
                      <th className="py-3 px-5 font-semibold text-center">TẢI (KG)</th>
                      <th className="py-3 px-5 font-semibold text-center">SỐ LẦN</th>
                      <th className="py-3 px-5 font-semibold text-center">KHỐI LƯỢNG</th>
                      <th className="py-3 px-5 font-semibold text-center">TRẠNG THÁI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sets.sort((a, b) => a.set_number - b.set_number).map((set) => (
                      <tr key={set.id} className="border-b border-[var(--color-border)]/40 last:border-0 hover:bg-[var(--color-card-bg)]/50 transition-colors">
                        <td className="py-3 px-5 text-sm font-semibold">Hiệp {set.set_number}</td>
                        <td className="py-3 px-5 text-center text-sm font-bold">{set.weight}</td>
                        <td className="py-3 px-5 text-center text-sm font-bold text-blue-400">{set.reps}</td>
                        <td className="py-3 px-5 text-center text-sm text-[var(--color-text-muted)]">{(set.weight * set.reps).toLocaleString()} kg</td>
                        <td className="py-3 px-5 text-center">
                          {prIds.has(set.id) ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 px-2 py-0.5 rounded">
                              <Trophy className="w-3 h-3" /> PR
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-2 py-0.5 rounded">
                              <Check className="w-3 h-3" /> Xong
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
