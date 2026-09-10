import { validateImportPayload } from './src/lib/data-management';
import { useAppStore } from './src/lib/store';
import { SEED_EXERCISES, SEED_WORKOUT_EXERCISES } from './src/lib/seed';

// Mocks the state fetch
const state = useAppStore.getState();
const validPayload = {
  user: state.user,
  exercises: state.exercises,
  programs: state.programs,
  workoutDays: state.workoutDays,
  workoutExercises: state.workoutExercises,
  workoutHistory: state.workoutHistory,
  setHistory: state.setHistory,
  activeSession: state.activeSession,
  activeSets: state.activeSets,
  foods: state.foods,
  meals: state.meals,
  mealItems: state.mealItems,
  weightLogs: state.weightLogs,
  dailyWater: state.dailyWater
};

const validBackup = JSON.stringify({
  app: "PULSE",
  schema_version: 1,
  exported_at: new Date().toISOString(),
  data: validPayload
});

function assertFailure(name: string, corruptor: (raw: any) => void) {
  const obj = JSON.parse(validBackup);
  corruptor(obj);
  const result = validateImportPayload(JSON.stringify(obj));
  if (result.success) throw new Error(`Test FAILED: ${name} should have been rejected!`);
  console.log(`[PASS] ${name} -> Rejected (${result.error})`);
}

function assertSuccess() {
  const result = validateImportPayload(validBackup);
  if (!result.success) throw new Error(`Test FAILED: Base payload rejected! (${result.error})`);
  console.log(`[PASS] Valid Baseline -> Accepted`);
}

console.log("--- PHASE 9 VALIDATION SUITE ---");

// 1. Success Baseline
assertSuccess();

// 2. Malformed JSON
const badJSON = validateImportPayload("{ badjson: true ");
if (badJSON.success) throw new Error("Failed to reject malformed JSON");
console.log("[PASS] Malformed JSON -> Rejected");

// 3. Wrong APP identifier
assertFailure("Wrong App ID", (o) => o.app = "NOT_PULSE");

// 4. Unsupported Schema
assertFailure("Invalid Schema Version", (o) => o.schema_version = 99);

// 5. Missing Required Array
assertFailure("Missing Required Array", (o) => delete o.data.workoutHistory);

// 6. Wrong Field Type
assertFailure("Wrong Field Type (Array as object)", (o) => o.data.exercises = {});

// 7. NaN / Infinity representation
assertFailure("NaN Representation", (o) => {
  o.data.user.current_weight = NaN;
});
assertFailure("Infinity Representation", (o) => {
  o.data.user.target_calories = Infinity;
});

// 8. Broken WorkoutSet -> WorkoutExercise reference
assertFailure("Broken WorkoutSet Reference", (o) => {
  if (!o.data.setHistory) o.data.setHistory = [];
  o.data.setHistory.push({
    id: "random",
    session_id: "none",
    workout_exercise_id: "DOESNT_EXIST",
    set_number: 1, weight: 50, reps: 10, status: "COMPLETED"
  });
});

// 9. Broken WorkoutExercise -> Exercise reference
assertFailure("Broken WorkoutExercise Reference", (o) => {
  o.data.workoutExercises.push({
    id: "bad-bridge",
    workout_day_id: "wd",
    exercise_id: "GHOST_EXERCISE",
    order_index: 0,
    planned_sets: 3, rep_range_min: 5, rep_range_max: 10, rest_seconds: 60, is_active: true
  });
});

// 10. Broken MealItem -> Meal reference
assertFailure("Broken MealItem Reference", (o) => {
  o.data.mealItems.push({
    id: "mi-broken", meal_id: "NO_MEAL", food_id: "f", quantity: 100, calories: 100, macros: { p: 0, c: 0, f: 0 }
  });
});

// 11. Broken WeightLog -> User reference
assertFailure("WeightLog -> User mismatch", (o) => {
  o.data.weightLogs.push({ id: "wl-1", user_id: "some_other_guy", date: "Jan 01", weight: 70 });
});

// 12. Broken WorkoutExercise -> WorkoutDay reference
assertFailure("Broken WorkoutExercise->WorkoutDay Reference", (o) => {
  o.data.workoutExercises.push({
    id: "we-broken",
    workout_day_id: "GHOST_DAY",
    exercise_id: "ex-1",
    order_index: 0,
    planned_sets: 3, rep_range_min: 5, rep_range_max: 10, rest_seconds: 60, is_active: true
  });
});

// 13. Broken WorkoutDay -> WorkoutProgram reference
assertFailure("Broken WorkoutDay->WorkoutProgram Reference", (o) => {
  o.data.workoutDays.push({
    id: "wd-broken",
    program_id: "GHOST_PROGRAM",
    name: "Bad Day",
    day_of_week: 1,
    is_active: true,
    focus: "None",
    notes: ""
  });
});

console.log("--------------------------------");
console.log("All invariant validation tests passed flawlessly!\n");
