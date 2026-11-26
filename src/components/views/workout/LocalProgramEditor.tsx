import { useAppStore } from '../../../lib/store';
import ProgramEditor from './ProgramEditor';

export default function LocalProgramEditor() {
  const program = useAppStore(state => state.programs[0]);
  const workoutDays = useAppStore(state => state.workoutDays);
  const workoutExercises = useAppStore(state => state.workoutExercises);
  const exercises = useAppStore(state => state.exercises);
  const addWorkoutDay = useAppStore(state => state.addWorkoutDay);
  const addExerciseToDay = useAppStore(state => state.addExerciseToDay);
  const removeExercise = useAppStore(state => state.removeExerciseFromDay);
  const updateExercise = useAppStore(state => state.updateWorkoutExercise);
  const reorder = useAppStore(state => state.reorderExercises);
  return <ProgramEditor {...{ program, workoutDays, workoutExercises, exercises }} actions={{
    addDay: () => addWorkoutDay('Ngày Tập Mới', 'Tổng Hợp'),
    addExercise: (dayId, exerciseId) => addExerciseToDay(dayId, { exercise_id: exerciseId }),
    removeExercise, updateExercise, reorder,
  }} />;
}
