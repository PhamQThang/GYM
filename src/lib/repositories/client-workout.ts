import type { Database } from '../database.types';

type SaveWorkout = Database['public']['Functions']['save_client_workout']['Args'];

export async function loadWorkoutExercises(signal: AbortSignal) {
  const { supabase } = await import('../supabase');
  if (signal.aborted) return [];
  const { data, error } = await supabase.from('exercises').select('id,name')
    .eq('is_active', true).order('name').order('id').abortSignal(signal);
  if (error) throw new Error('Exercise list unavailable');
  return data;
}

export async function saveClientWorkout(workout: SaveWorkout) {
  const { supabase } = await import('../supabase');
  const { data, error } = await supabase.rpc('save_client_workout', workout);
  if (error || data !== workout.p_workout_id) throw new Error('Workout save failed');
}
