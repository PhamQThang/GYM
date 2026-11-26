import type { WorkoutExercise } from './types';

export function isValidSetInput(weight: number, reps: number): boolean {
  return Number.isFinite(weight) && weight >= 0 && Number.isSafeInteger(reps) && reps >= 0;
}

export function isValidWorkoutPlan(plan: Pick<WorkoutExercise, 'planned_sets' | 'rep_range_min' | 'rep_range_max' | 'rest_seconds'>): boolean {
  return Number.isSafeInteger(plan.planned_sets) && plan.planned_sets > 0
    && Number.isSafeInteger(plan.rep_range_min) && plan.rep_range_min >= 0
    && Number.isSafeInteger(plan.rep_range_max) && plan.rep_range_max >= plan.rep_range_min
    && Number.isFinite(plan.rest_seconds) && plan.rest_seconds >= 0;
}
