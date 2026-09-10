export type GoalType = 'Lean Bulk' | 'Cut' | 'Maintenance';
export type WorkoutStatus = 'IN_PROGRESS' | 'COMPLETED';
export type SetStatus = 'PLANNED' | 'COMPLETED' | 'SKIPPED';
export type MealStatus = 'PLANNED' | 'CONSUMED' | 'MISSED';

export interface User {
  id: string;
  name: string;
  height?: number; // In cm
  current_weight: number;
  target_weight: number;
  goal_type?: GoalType;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  weight_unit?: 'kg' | 'lbs';
  energy_unit?: 'kcal' | 'kJ';
}

export interface Goal {
  id: string;
  user_id: string;
  type: GoalType;
  start_date: string;
  target_date?: string;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  phase: string;
  description: string;
}

export interface WorkoutDay {
  id: string;
  program_id: string;
  name: string;
  day_of_week: number;
  is_active: boolean;
  focus: string;
  notes: string;
}

export interface Exercise {
  id: string;
  name: string;
  primary_muscle: string;
  secondary_muscles: string[];
  type: string;
  equipment?: string;
  instructions?: string;
  is_custom?: boolean;
  is_active?: boolean;
}

export interface WorkoutExercise {
  id: string;
  workout_day_id: string;
  exercise_id: string;
  order_index: number;
  planned_sets: number;
  rep_range_min: number;
  rep_range_max: number;
  rest_seconds: number;
  notes: string;
  is_active?: boolean;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  workout_day_id: string;
  start_time: string;
  end_time?: string;
  status: WorkoutStatus;
  total_volume: number;
}

export interface WorkoutSet {
  id: string;
  session_id: string;
  workout_exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  is_pr: boolean;
  status: SetStatus;
}

export interface Food {
  id: string;
  name: string;
  serving_size: string;
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
  is_quick_add: boolean;
}

export interface Meal {
  id: string;
  user_id: string;
  name: string;
  scheduled_time: string;
  description: string;
  status: MealStatus;
}

export interface MealItem {
  id: string;
  meal_id: string;
  food_id?: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_at?: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  date: string;
  weight: number;
}
