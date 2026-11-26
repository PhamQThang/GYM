import { useAppStore } from '../../lib/store';
import { exportWeightCSV } from '../../lib/data-management';
import Progress from './Progress';

export default function LocalProgress() {
  const user = useAppStore((s) => s.user);
  const weightLogs = useAppStore((s) => s.weightLogs);
  const mealItems = useAppStore((s) => s.mealItems);
  const logWeight = useAppStore((s) => s.logWeight);
  const workoutHistory = useAppStore((s) => s.workoutHistory);
  const setHistory = useAppStore((s) => s.setHistory);
  const workoutExercises = useAppStore((s) => s.workoutExercises);
  const exercises = useAppStore((s) => s.exercises);

  return <Progress {...{ user, weightLogs, mealItems, workoutHistory, setHistory, workoutExercises, exercises }}
    onLogWeight={logWeight} onExport={() => exportWeightCSV(weightLogs)} />;
}
