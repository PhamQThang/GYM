import { useAppStore } from '../../lib/store';
import WorkoutHistory from './WorkoutHistory';

export default function LocalWorkoutHistory() {
  const workoutHistory = useAppStore((state) => state.workoutHistory);
  const setHistory = useAppStore((state) => state.setHistory);
  const workoutDays = useAppStore((state) => state.workoutDays);
  const workoutExercises = useAppStore((state) => state.workoutExercises);
  const exercises = useAppStore((state) => state.exercises);
  return <WorkoutHistory {...{ workoutHistory, setHistory, workoutDays, workoutExercises, exercises }} />;
}
