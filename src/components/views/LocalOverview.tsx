import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../lib/store';
import { calculateCalorieAdherence, calculateNutritionHistory, calculatePersonalRecords } from '../../lib/analytics';
import { initGlobalAudio } from '../../lib/notifications';
import Overview from './Overview';

export default function LocalOverview() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const mealItems = useAppStore((s) => s.mealItems);
  const meals = useAppStore((s) => s.meals);
  const weightLogs = useAppStore((s) => s.weightLogs);
  const workoutDays = useAppStore((s) => s.workoutDays);
  const workoutExercises = useAppStore((s) => s.workoutExercises);
  const exercises = useAppStore((s) => s.exercises);
  const workoutHistory = useAppStore((s) => s.workoutHistory);
  const setHistory = useAppStore((s) => s.setHistory);
  const programs = useAppStore((s) => s.programs);
  const startWorkout = useAppStore((s) => s.startWorkout);
  const logWeight = useAppStore((s) => s.logWeight);

  const nutritionHistory = calculateNutritionHistory(mealItems);
  const todayMacros = nutritionHistory[nutritionHistory.length - 1] ?? { pro: 0, carb: 0, fat: 0, calories: 0, day: '', dateKey: '', active: false };
  const adherence = calculateCalorieAdherence(mealItems, user);

  // ── Today's Workout ──────────────────────────────
  const todayDow = new Date().getDay(); // 0=Sun, 1=Mon, ...
  const todayDay = workoutDays.find(d => d.day_of_week === todayDow && d.is_active) ?? null;
  const todayExercises = todayDay
    ? workoutExercises
        .filter(we => we.workout_day_id === todayDay.id && we.is_active !== false)
        .sort((a, b) => a.order_index - b.order_index)
    : [];
  const todayExerciseDefs = todayExercises.map(we => ({
    we,
    exercise: exercises.find(e => e.id === we.exercise_id),
  })).filter(x => x.exercise !== undefined);

  const hasExercisesToday = todayExerciseDefs.length > 0;

  // ── PRs ──────────────────────────────────────────
  const prs = calculatePersonalRecords(setHistory, workoutHistory, workoutExercises, exercises);
  const prMap = new Map(prs.map(pr => [pr.exerciseId, pr]));

  // ── Meal distribution (consumed only) ────────────
  const mealCalories = meals.map(meal => {
    const loggedCals = mealItems
      .filter(mi => mi.meal_id === meal.id && Boolean(mi.logged_at))
      .reduce((a, i) => a + i.calories, 0);
    return { meal, loggedCals };
  });
  const consumedMealCount = meals.filter(
    m => mealItems.some(mi => mi.meal_id === m.id && Boolean(mi.logged_at))
  ).length;

  // ── Hero: Start Workout ──────────────────────────
  const handleStartWorkout = () => {
    if (!todayDay || !hasExercisesToday) return;
    initGlobalAudio();
    startWorkout(todayDay.id);
    navigate('/workout');
  };

  return <Overview
    user={user}
    programPhase={programs[0]?.phase ?? null}
    weightLogs={weightLogs}
    startWeight={weightLogs[0]?.weight ?? null}
    todayDay={todayDay}
    todayExerciseDefs={todayExerciseDefs}
    prMap={prMap}
    todayMacros={todayMacros}
    adherence={adherence}
    mealCalories={mealCalories}
    consumedMealCount={consumedMealCount}
    onLogWeight={logWeight}
    onOpenNutrition={() => navigate('/nutrition')}
    onOpenWorkout={handleStartWorkout}
  />;
}
