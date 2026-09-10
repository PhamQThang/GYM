import { useAppStore } from './store';
import { AppState } from './store';
import { WorkoutSet, Exercise, WorkoutDay, WorkoutExercise, Meal, MealItem, WeightLog } from './types';

// Constants
const SCHEMA_VERSION = 1;
const APP_IDENTIFIER = "PULSE";

export function exportData() {
  const state = useAppStore.getState();
  // Partialize extracts exactly what persist saves
  const options = useAppStore.persist.getOptions();
  const partialize = options?.partialize;
  const serializedState = partialize ? partialize(state) : state;
  
  const payload = {
    app: APP_IDENTIFIER,
    schema_version: SCHEMA_VERSION,
    exported_at: new Date().toISOString(),
    data: serializedState
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const dateStr = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })();
  const a = document.createElement('a');
  a.href = url;
  a.download = `PULSE_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Ensure the number is finite, not NaN, not Infinity, and non-negative
const isValidNonNegative = (val: any) => typeof val === 'number' && Number.isFinite(val) && val >= 0;

export function validateImportPayload(jsonText: string): { success: boolean; data?: Partial<AppState>; error?: string } {
  try {
    const raw = JSON.parse(jsonText);
    
    // Envelope validation
    if (raw.app !== APP_IDENTIFIER) return { success: false, error: 'Tệp sao lưu không hợp lệ hoặc không thuộc hệ thống PULSE.' };
    if (raw.schema_version !== SCHEMA_VERSION) return { success: false, error: 'Phiên bản sao lưu không được hỗ trợ. Vui lòng cập nhật ứng dụng.' };
    if (!raw.data || typeof raw.data !== 'object') return { success: false, error: 'Tệp sao lưu bị hỏng (thiếu trường dữ liệu).' };

    const d = raw.data;
    
    // Structure Validation
    const requiredArrays = [
      'exercises', 'programs', 'workoutDays', 'workoutExercises', 
      'workoutHistory', 'setHistory', 'foods', 'meals', 'mealItems', 'weightLogs'
    ];
    
    for (const arrName of requiredArrays) {
      if (!Array.isArray(d[arrName])) return { success: false, error: `Tệp sao lưu bị hỏng (thiếu danh sách ${arrName}).` };
    }

    if (!d.user || typeof d.user !== 'object' || !d.user.id) return { success: false, error: 'Dữ liệu hồ sơ người dùng bị hỏng.' };

    // Strict Numeric Validation (User)
    if (!isValidNonNegative(d.user.current_weight) || !isValidNonNegative(d.user.target_weight)) return { success: false, error: 'Cân nặng phải là một số hợp lệ.' };
    if (!isValidNonNegative(d.user.target_calories)) return { success: false, error: 'Mục tiêu Calories không hợp lệ.' };

    const programsMap = new Set(d.programs.map((p: any) => p.id));
    
    const workoutDaysMap = new Map<string, WorkoutDay>();
    d.workoutDays.forEach((wd: WorkoutDay) => {
      if (!programsMap.has(wd.program_id)) throw new Error(`WorkoutDay reference broken. Missing Program: ${wd.program_id}`);
      workoutDaysMap.set(wd.id, wd);
    });

    const exercisesMap = new Map<string, Exercise>();
    d.exercises.forEach((e: Exercise) => exercisesMap.set(e.id, e));

    const workoutExercisesMap = new Map<string, WorkoutExercise>();
    d.workoutExercises.forEach((we: WorkoutExercise) => {
      if (!workoutDaysMap.has(we.workout_day_id)) throw new Error(`WorkoutExercise reference broken. Missing Day: ${we.workout_day_id}`);
      if (!exercisesMap.has(we.exercise_id)) throw new Error(`Exercise reference broken. Missing: ${we.exercise_id}`);
      workoutExercisesMap.set(we.id, we);
    });

    // Validating Sets
    for (const set of d.setHistory as WorkoutSet[]) {
      if (!isValidNonNegative(set.weight) || !isValidNonNegative(set.reps)) throw new Error(`Invalid numeric values found in Set Logs. (NaN or negative)`);
      if (!workoutExercisesMap.has(set.workout_exercise_id)) throw new Error(`WorkoutExercise reference broken in SetHistory.`);
    }

    // Validating Nutrition relationships
    const mealsMap = new Map<string, Meal>();
    d.meals.forEach((m: Meal) => {
       if (m.user_id !== d.user.id) throw new Error(`Meal reference broken. Mismatching User ID.`);
       mealsMap.set(m.id, m);
    });

    for (const item of d.mealItems as MealItem[]) {
       if (!mealsMap.has(item.meal_id)) throw new Error(`Meal reference broken in MealItems.`);
       if (!isValidNonNegative(item.calories)) throw new Error(`Invalid numeric calories found in MealItems.`);
    }
    
    // Validate weight logs
    for (const wl of d.weightLogs as WeightLog[]) {
       if (wl.user_id !== d.user.id) throw new Error(`WeightLog reference broken. Mismatching User ID.`);
       if (!isValidNonNegative(wl.weight)) throw new Error(`Invalid weight measurement in WeightLogs.`);
    }

    // If all tests pass, construction is successful
    return { success: true, data: d };
    
  } catch (error: any) {
    return { success: false, error: error.message || 'Xảy ra lỗi không xác định khi xác thực tệp JSON.' };
  }
}
