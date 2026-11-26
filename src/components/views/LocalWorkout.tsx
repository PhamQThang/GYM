import { useAppStore } from '../../lib/store';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Workout, { WorkoutStart } from './Workout';
import ActiveWorkoutHeader from './workout/ActiveWorkoutHeader';
import ExerciseCard from './workout/ExerciseCard';
import WorkoutSummary from './workout/WorkoutSummary';
import LocalProgramEditor from './workout/LocalProgramEditor';
import ExerciseLibrary from './workout/ExerciseLibrary';
import { WorkoutPage } from './workout/WorkoutPage';
import { ROUTES } from '../../lib/navigation';
import { useState } from 'react';

export default function LocalWorkout() {
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
  const addCustomExercise = useAppStore((s) => s.addCustomExercise);
  const hideExercise = useAppStore((s) => s.hideExercise);

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
    return <Workout>
      {subTab === 'active' && <WorkoutStart workoutDays={workoutDays}
        exerciseCount={dayId => workoutExercises.filter(we => we.workout_day_id === dayId && we.is_active !== false).length}
        onStart={startWorkout} onOpenProgram={() => navigate(ROUTES.workoutProgram)} />}
      {subTab === 'program' && <LocalProgramEditor />}
      {subTab === 'library' && <ExerciseLibrary exercises={exercises} onAdd={addCustomExercise} onHide={hideExercise} />}
    </Workout>;
  }

  // Find the active day config
  const activeDay = workoutDays.find(d => d.id === activeSession.workout_day_id);
  // Find all workout exercises for this day, sorted by order_index
  const sessionExercises = workoutExercises
    .filter(we => we.workout_day_id === activeDay?.id && we.is_active !== false)
    .sort((a, b) => a.order_index - b.order_index);

  return (
    <WorkoutPage>
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
    </WorkoutPage>
  );
}
