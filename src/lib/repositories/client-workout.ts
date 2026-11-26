import type { Database } from '../database.types';
import { readClientData, readClientLatestWorkout, readLinkedClient, type ClientScope } from './client-overview';
import type { SupabaseClient } from '@supabase/supabase-js';

type SaveWorkout = Database['public']['Functions']['save_client_workout']['Args'];

export async function loadClientWorkout(api: SupabaseClient<Database>, scope: ClientScope, signal: AbortSignal) {
  await readLinkedClient(api, scope, signal);
  const [assigned, catalog, lastWorkout] = await Promise.all([
    api.from('programs')
      .select('id,name,description,program_days(id,name,day_index,focus,program_exercises(id,exercise_id,order_index,planned_sets,rep_min,rep_max,rest_seconds))')
      .eq('client_id', scope.clientId).eq('is_active', true)
      .order('updated_at', { ascending: false }).order('id').limit(1).abortSignal(signal).maybeSingle(),
    api.from('exercises').select('id,name,primary_muscle,equipment,pt_id,is_active').order('name').order('id').abortSignal(signal),
    readClientLatestWorkout(api, scope.clientId, signal),
  ]);
  const plan = readClientData(assigned);
  const exercises = (readClientData(catalog) ?? []).map(row => ({
    id: row.id, name: row.name, primary_muscle: row.primary_muscle, equipment: row.equipment ?? undefined,
    is_custom: row.pt_id !== null, is_active: row.is_active,
  }));
  const activeIds = new Set(exercises.filter(exercise => exercise.is_active).map(exercise => exercise.id));
  const days = [...(plan?.program_days ?? [])].sort((a, b) => a.day_index - b.day_index || a.id.localeCompare(b.id));
  return {
    program: plan ? { id: plan.id, name: plan.name, phase: plan.description ?? '' } : undefined,
    exercises, lastWorkout,
    workoutDays: plan ? days.map((day, index) => ({
      id: day.id, program_id: plan.id, name: day.name, focus: day.focus ?? '', day_of_week: index + 1, is_active: true,
    })) : [],
    workoutExercises: days.flatMap(day => day.program_exercises.map(entry => ({
      id: entry.id, workout_day_id: day.id, exercise_id: entry.exercise_id, order_index: entry.order_index,
      planned_sets: entry.planned_sets, rep_range_min: entry.rep_min, rep_range_max: entry.rep_max,
      rest_seconds: entry.rest_seconds, is_active: activeIds.has(entry.exercise_id),
    }))),
  };
}

export async function saveClientWorkout(workout: SaveWorkout) {
  const { supabase } = await import('../supabase');
  const { data, error } = await supabase.rpc('save_client_workout', workout);
  if (error || data !== workout.p_workout_id) throw new Error('Workout save failed');
}
