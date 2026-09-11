import { useAppStore } from '../../lib/store';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Play } from 'lucide-react';
import ActiveWorkoutHeader from './workout/ActiveWorkoutHeader';
import ExerciseCard from './workout/ExerciseCard';
import WorkoutSummary from './workout/WorkoutSummary';
import ProgramEditor from './workout/ProgramEditor';
import ExerciseLibrary from './workout/ExerciseLibrary';
import { ROUTES } from '../../lib/navigation';
import { useState } from 'react';

export default function Workout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  let subTab = 'active';
  if (pathname === ROUTES.workoutProgram) subTab = 'program';
  else if (pathname === ROUTES.workoutLibrary) subTab = 'library';

  const showSummary = searchParams.get('summary') === '1';

  const workoutDays = useAppStore((s) => s.workoutDays);
  const activeSession = useAppStore((s) => s.activeSession);
  const startWorkout = useAppStore((s) => s.startWorkout);
  const endWorkout = useAppStore((s) => s.endWorkout);
  const activeSets = useAppStore((s) => s.activeSets);
  const workoutExercises = useAppStore((s) => s.workoutExercises);
  const exercises = useAppStore((s) => s.exercises);

  const [showConfirmEnd, setShowConfirmEnd] = useState(false);

  const handleFinishRequest = () => {
    const plannedCount = activeSets.filter(s => s.status === 'PLANNED').length;
    if (plannedCount > 0) {
      setShowConfirmEnd(true);
    } else {
      doEndWorkout();
    }
  };

  const doEndWorkout = () => {
    endWorkout();
    setShowConfirmEnd(false);
    setSearchParams({ summary: '1' });
  };

  if (showSummary) {
    return <WorkoutSummary onClose={() => setSearchParams({}, { replace: true })} />;
  }

  if (!activeSession) {
    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-500">
         {/* Sub-Navigation Hub */}
         <div className="flex bg-[var(--color-panel-bg)] p-1 rounded-xl border border-[var(--color-border)] w-fit mx-auto mb-8">
            <button onClick={() => navigate(ROUTES.workout)} className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${subTab === 'active' ? 'bg-[var(--color-primary)] text-black shadow-md' : 'text-[var(--color-text-muted)] hover:text-white'}`}>Bắt Đầu</button>
            <button onClick={() => navigate(ROUTES.workoutProgram)} className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${subTab === 'program' ? 'bg-[var(--color-primary)] text-black shadow-md' : 'text-[var(--color-text-muted)] hover:text-white'}`}>Lịch Trình</button>
            <button onClick={() => navigate(ROUTES.workoutLibrary)} className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${subTab === 'library' ? 'bg-[var(--color-primary)] text-black shadow-md' : 'text-[var(--color-text-muted)] hover:text-white'}`}>Thư Viện</button>
         </div>

         {subTab === 'active' && (
           <div className="bg-[var(--color-panel-bg)] rounded-3xl p-8 border border-[var(--color-border)] shadow-xl text-center">
              <h2 className="text-3xl font-bold mb-2">Chương Trình Bắt Đầu</h2>
              <p className="text-[var(--color-text-muted)] text-sm max-w-lg mx-auto mb-8">
                Chọn một ngày tập để bắt đầu ghi nhận.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                 {workoutDays.filter(d => d.is_active !== false).map(day => {
                   const activeExCount = workoutExercises.filter(we => we.workout_day_id === day.id && we.is_active !== false).length;
                   const canStart = activeExCount > 0;

                   return (
                     <button
                       key={day.id}
                       onClick={() => {
                         if (canStart) startWorkout(day.id);
                         else navigate(ROUTES.workoutProgram);
                       }}
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
           </div>
         )}

         {subTab === 'program' && <ProgramEditor />}
         {subTab === 'library' && <ExerciseLibrary />}
      </div>
    );
  }

  // Find the active day config
  const activeDay = workoutDays.find(d => d.id === activeSession.workout_day_id);
  // Find all workout exercises for this day, sorted by order_index
  const sessionExercises = workoutExercises
    .filter(we => we.workout_day_id === activeDay?.id && we.is_active !== false)
    .sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <ActiveWorkoutHeader workoutDay={activeDay} onFinish={handleFinishRequest} />

      {showConfirmEnd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-panel-bg)] border border-[var(--color-border)] rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Kết Thúc Buổi Tập?</h3>
            <p className="text-[var(--color-text-muted)] mb-6">
              Còn {activeSets.filter(s => s.status === 'PLANNED').length} hiệp chưa hoàn thành. Kết thúc buổi tập?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmEnd(false)}
                className="flex-1 py-3 bg-[var(--color-app-bg)] text-white rounded-xl font-semibold border border-[var(--color-border)] transition-colors hover:bg-gray-800"
              >
                Tiếp tục tập
              </button>
              <button
                onClick={doEndWorkout}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors"
              >
                Kết thúc
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-8">
        {sessionExercises.map((we, index) => {
          const ex = exercises.find(e => e.id === we.exercise_id);
          if (!ex) return null;
          return (
             <div key={we.id} className="relative">
                <div className="absolute -left-6 top-6 bottom-0 w-px bg-[var(--color-border)] hidden lg:block"></div>
                <div className="absolute -left-8 top-6 w-5 h-5 rounded-full bg-[var(--color-panel-bg)] border-2 border-[var(--color-border)] z-10 hidden lg:flex items-center justify-center text-[8px] font-bold text-[var(--color-text-muted)]">
                  {index + 1}
                </div>
                <ExerciseCard workoutExercise={we} exercise={ex} />
             </div>
          );
        })}
      </div>
    </div>
  );
}
