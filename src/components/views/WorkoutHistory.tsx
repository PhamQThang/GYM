import { useState } from 'react';
import { History, ChevronRight, Dumbbell, Timer, TrendingUp, BarChart3, Trophy } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { durationMinutes, formatVietnamDate } from '../../lib/analytics';
import { Card } from '../ui/Card';
import WorkoutDetail from './workout/WorkoutDetail';

export default function WorkoutHistory() {
  const { workoutHistory, setHistory, workoutDays, workoutExercises, exercises } = useAppStore();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const completed = workoutHistory
    .filter(s => s.status === 'COMPLETED')
    .sort((a, b) => b.start_time.localeCompare(a.start_time));

  if (selectedSessionId) {
    const session = completed.find(s => s.id === selectedSessionId);
    if (session) {
      return (
        <WorkoutDetail
          session={session}
          setHistory={setHistory}
          workoutDays={workoutDays}
          workoutExercises={workoutExercises}
          exercises={exercises}
          onBack={() => setSelectedSessionId(null)}
        />
      );
    }
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-2">
            <History className="w-4 h-4" />
            <span>KHO DỮ LIỆU CHUYÊN SÂU • Tất Cả Buổi Tập Đã Ghi</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">Lịch Sử Tập Luyện</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {completed.length} buổi tập hoàn thành được lưu trong hệ thống
          </p>
        </div>
      </div>

      {/* Empty state */}
      {completed.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-card-bg)] border border-[var(--color-border)] flex items-center justify-center mb-6">
            <Dumbbell className="w-7 h-7 text-[var(--color-text-muted)]" />
          </div>
          <h3 className="text-xl font-bold mb-2">Chưa Có Lịch Sử</h3>
          <p className="text-sm text-[var(--color-text-muted)] max-w-xs">
            Hoàn thành buổi tập đầu tiên của bạn để bắt đầu xây dựng kho dữ liệu cá nhân.
          </p>
        </Card>
      )}

      {/* Session list */}
      {completed.length > 0 && (
        <div className="space-y-4">
          {completed.map((session) => {
            const day = workoutDays.find(d => d.id === session.workout_day_id);
            const sessionSets = setHistory.filter(s => s.session_id === session.id && s.status === 'COMPLETED');
            const exerciseIds = new Set(
              sessionSets.map(s => {
                const we = workoutExercises.find(we => we.id === s.workout_exercise_id);
                return we?.exercise_id;
              }).filter(Boolean)
            );
            const minutes = durationMinutes(session.start_time, session.end_time);
            const prCount = sessionSets.filter(s => s.is_pr).length;

            return (
              <button
                key={session.id}
                onClick={() => setSelectedSessionId(session.id)}
                className="w-full text-left bg-[var(--color-panel-bg)] border border-[var(--color-border)] rounded-2xl overflow-hidden hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-card-bg)] transition-all group"
              >
                {/* Session top bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center shrink-0">
                      <Dumbbell className="w-5 h-5 text-[var(--color-primary)]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base leading-tight">{day?.name ?? 'Buổi Tập'}</h3>
                      <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mt-0.5">
                        {formatVietnamDate(session.start_time)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors">
                    <span className="text-xs font-semibold">Xem Chi Tiết</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Session stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 p-5 gap-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest font-semibold">
                      <TrendingUp className="w-3 h-3" /> Khối Lượng
                    </div>
                    <div className="text-lg font-bold">{session.total_volume.toLocaleString()} <span className="text-xs text-[var(--color-text-muted)] font-normal">kg</span></div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest font-semibold">
                      <Timer className="w-3 h-3" /> Thời Gian
                    </div>
                    <div className="text-lg font-bold">{minutes} <span className="text-xs text-[var(--color-text-muted)] font-normal">phút</span></div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest font-semibold">
                      <BarChart3 className="w-3 h-3" /> Bài Tập
                    </div>
                    <div className="text-lg font-bold">{exerciseIds.size} <span className="text-xs text-[var(--color-text-muted)] font-normal">bài</span></div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest font-semibold">
                      <Trophy className="w-3 h-3 text-[var(--color-primary)]" /> Kỷ Lục
                    </div>
                    <div className="text-lg font-bold">
                      {prCount > 0
                        ? <span className="text-[var(--color-primary)]">+{prCount} PR</span>
                        : <span className="text-[var(--color-text-muted)]">—</span>}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
