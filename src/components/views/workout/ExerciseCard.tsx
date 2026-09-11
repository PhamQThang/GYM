import { Dumbbell, Plus } from 'lucide-react';
import { useAppStore } from '../../../lib/store';
import { WorkoutExercise, Exercise } from '../../../lib/types';
import SetRow from './SetRow';
import { useEffect, useMemo } from 'react';
import { derivePRsInSession } from '../../../lib/analytics';

interface ExerciseCardProps {
  workoutExercise: WorkoutExercise;
  exercise: Exercise;
}

export default function ExerciseCard({ workoutExercise, exercise }: ExerciseCardProps) {
  const activeSets = useAppStore((s) => s.activeSets);
  const addSet = useAppStore((s) => s.addSet);
  const loadPlannedSets = useAppStore((s) => s.loadPlannedSets);
  const getLastSessionSets = useAppStore((s) => s.getLastSessionSets);
  const setHistory = useAppStore((s) => s.setHistory);
  const workoutExercises = useAppStore((s) => s.workoutExercises);

  const lastSessionSets = useMemo(
    () => getLastSessionSets(exercise.id),
    [exercise.id, getLastSessionSets]
  );

  const prIds = useMemo(
    () => derivePRsInSession(activeSets, setHistory, workoutExercises),
    [activeSets, setHistory, workoutExercises]
  );

  useEffect(() => {
    // Automatically load planned sets when this exercise card is mounted
    loadPlannedSets(workoutExercise);
  }, [workoutExercise, loadPlannedSets]);

  const exerciseSets = activeSets.filter(s => s.workout_exercise_id === workoutExercise.id);

  return (
    <div className="bg-[var(--color-panel-bg)] rounded-2xl p-4 sm:p-6 border border-[var(--color-border)] shadow-xl mt-6">
      {/* Exercise Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{exercise.name}</h3>
              <p className="text-xs text-[var(--color-text-muted)] font-medium mt-1 uppercase tracking-wider">
                {exercise.type} • {exercise.primary_muscle}
              </p>
            </div>
         </div>
         
         <div className="flex gap-2">
            <div className="bg-[var(--color-app-bg)] border border-[var(--color-border)] px-3 py-1.5 rounded-lg text-xs font-semibold">
              Mục Tiêu: {workoutExercise.rep_range_min}-{workoutExercise.rep_range_max} Reps
            </div>
            <div className="bg-[var(--color-app-bg)] border border-[var(--color-border)] px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-400">
              Nghỉ {workoutExercise.rest_seconds}s
            </div>
         </div>
      </div>

      {/* Set Grid Header */}
      <div className="grid grid-cols-[1fr_2fr_1fr] md:grid-cols-[1fr_2fr_1fr_0.5fr] gap-4 items-center px-4 mb-2">
         <div className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-widest pl-1">Hiệp / Lịch Sử</div>
         <div className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-widest text-center">Tải & Số Lần</div>
         <div className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-widest text-right md:text-center pr-2 md:pr-0 cursor-default" title="Status">Đã Xong</div>
         <div className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-widest hidden md:block pl-5">Thao Tác</div>
      </div>

      {/* Sets */}
      <div className="flex flex-col gap-2">
         {exerciseSets.map(set => {
            const prevForThisSet = lastSessionSets.find(s => s.set_number === set.set_number) || null;
            const isPrTarget = prIds.has(set.id);
            return <SetRow key={set.id} workoutSet={set} prevPerf={prevForThisSet} isPr={isPrTarget} />;
         })}
      </div>

      {/* Add Set Button */}
      <button 
        onClick={() => addSet(workoutExercise.id)}
        className="w-full mt-4 py-3 rounded-xl border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
      >
        <Plus className="w-4 h-4" /> Thêm Hiệp
      </button>
    </div>
  );
}
