import type { SupabaseClient } from '@supabase/supabase-js';
import { localDateKeyToVietnamNoonIso, toLocalDateKey } from '../analytics';
import type { Database } from '../database.types';
import type { Meal, MealItem, WorkoutHistoryData } from '../types';
import { readClientData, readClientWeights, readLinkedClient, type ClientScope } from './client-overview';

type Api = SupabaseClient<Database>;
const read = readClientData;

export async function saveClientWeight(scope: ClientScope, weight: number, submissionId: string) {
  if (!Number.isFinite(weight) || weight < 20 || weight > 300) throw new Error('Weight out of range');
  const { supabase } = await import('../supabase');
  await readLinkedClient(supabase, scope, new AbortController().signal);
  read(await supabase.from('body_metrics').upsert({
    id: submissionId, client_id: scope.clientId, measured_on: toLocalDateKey(new Date()), weight_kg: weight,
  }, { onConflict: 'id', ignoreDuplicates: true }));
}

function nutritionTargets(api: Api, clientId: string, signal: AbortSignal) {
  return api.from('nutrition_profiles').select('target_kcal,protein_g,carbs_g,fat_g')
    .eq('client_id', clientId).abortSignal(signal).maybeSingle();
}

async function readWorkoutHistory(api: Api, scope: ClientScope, signal: AbortSignal) {
  const data: WorkoutHistoryData = { workoutHistory: [], setHistory: [], workoutDays: [], workoutExercises: [], exercises: [] };
  const days = new Map<string, WorkoutHistoryData['workoutDays'][number]>();
  const exercises = new Map<string, WorkoutHistoryData['exercises'][number]>();
  const exerciseIds = new Set<string>();
  const statuses = { planned: 'PLANNED', completed: 'COMPLETED', skipped: 'SKIPPED' } as const;
  const pageSize = 100;
  for (let offset = 0; !signal.aborted; offset += pageSize) {
    const logs = read(await api.from('workout_logs')
      .select('id,started_at,ended_at,note,program_day_id,program_days(name),workout_sets(id,exercise_id,set_number,weight_kg,reps,status,exercises(name,primary_muscle))')
      .eq('client_id', scope.clientId).not('ended_at', 'is', null)
      .order('started_at', { ascending: false }).order('id').order('set_number', { referencedTable: 'workout_sets' })
      .range(offset, offset + pageSize - 1).abortSignal(signal)) ?? [];
    for (const log of logs) {
      if (log.program_day_id && log.program_days) {
        days.set(log.program_day_id, { id: log.program_day_id, name: log.program_days.name });
      }
      let totalVolume = 0;
      for (const set of log.workout_sets) {
        exerciseIds.add(set.exercise_id);
        if (set.exercises) exercises.set(set.exercise_id, { id: set.exercise_id, ...set.exercises });
        if (set.status === 'completed') totalVolume += set.weight_kg * set.reps;
        data.setHistory.push({
          id: set.id, session_id: log.id, workout_exercise_id: set.exercise_id, set_number: set.set_number,
          weight: set.weight_kg, reps: set.reps, status: statuses[set.status],
        });
      }
      data.workoutHistory.push({
        id: log.id, user_id: scope.userId, workout_day_id: log.program_day_id ?? '',
        start_time: log.started_at, end_time: log.ended_at ?? undefined, note: log.note ?? undefined,
        total_volume: totalVolume, status: 'COMPLETED',
      });
    }
    if (logs.length < pageSize) break;
  }
  data.workoutDays = [...days.values()];
  data.exercises = [...exercises.values()];
  data.workoutExercises = [...exerciseIds].map(id => ({ id, exercise_id: id }));
  return data;
}

export async function loadClientHistory(api: Api, scope: ClientScope, signal: AbortSignal) {
  await readLinkedClient(api, scope, signal);
  return readWorkoutHistory(api, scope, signal);
}

export async function loadClientProgress(api: Api, scope: ClientScope, signal: AbortSignal) {
  const profile = await readLinkedClient(api, scope, signal);
  const today = toLocalDateKey(new Date());
  const weekStart = new Date(`${today}T00:00:00Z`);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  const [workouts, body, targets, totals] = await Promise.all([
    readWorkoutHistory(api, scope, signal),
    readClientWeights(api, scope, signal),
    nutritionTargets(api, scope.clientId, signal),
    api.from('daily_nutrition').select('log_date,kcal,protein_g,carbs_g,fat_g')
      .eq('client_id', scope.clientId).gte('log_date', weekStart.toISOString().slice(0, 10))
      .lte('log_date', today).abortSignal(signal),
  ]);
  const goal = read(targets);
  const mealItems: MealItem[] = (read(totals) ?? []).flatMap(row => !row.log_date ? [] : [{
    id: row.log_date, meal_id: row.log_date, name: row.log_date, logged_at: localDateKeyToVietnamNoonIso(row.log_date),
    calories: row.kcal ?? 0, protein: row.protein_g ?? 0, carbs: row.carbs_g ?? 0, fat: row.fat_g ?? 0,
  }]);
  return {
    ...workouts, ...body, mealItems,
    user: {
      current_weight: body.weights.at(-1)?.weight ?? null, target_weight: profile.target_weight_kg,
      target_protein: goal?.protein_g ?? null, target_carbs: goal?.carbs_g ?? null, target_fat: goal?.fat_g ?? null,
    },
  };
}

export async function loadClientNutrition(api: Api, scope: ClientScope, day: string, signal: AbortSignal) {
  await readLinkedClient(api, scope, signal);
  const { clientId } = scope;
  const [targets, logs, hydration] = await Promise.all([
    nutritionTargets(api, clientId, signal),
    api.from('meal_logs').select('id,meal_name,status,description,kcal,protein_g,carbs_g,fat_g,foods(name),dishes(name)')
      .eq('client_id', clientId).eq('log_date', day).order('created_at').order('id').abortSignal(signal),
    api.from('daily_water').select('ml').eq('client_id', clientId).eq('log_date', day).abortSignal(signal).maybeSingle(),
  ]);
  const goal = read(targets);
  const meals = new Map<string, Meal>();
  const mealItems: MealItem[] = [];
  for (const row of read(logs) ?? []) {
    const meal = meals.get(row.meal_name) ?? {
      id: row.id, user_id: scope.userId, date: day, template_id: '', name: row.meal_name,
      scheduled_time: '', description: '', status: 'MISSED',
    };
    meals.set(row.meal_name, meal);
    if (row.status === 'skipped') continue;
    meal.status = 'CONSUMED';
    mealItems.push({
      id: row.id, meal_id: meal.id, name: row.description || row.foods?.name || row.dishes?.name || row.meal_name,
      calories: row.kcal, protein: row.protein_g, carbs: row.carbs_g, fat: row.fat_g, logged_at: localDateKeyToVietnamNoonIso(day),
    });
  }
  return {
    meals: [...meals.values()], mealItems, dailyWater: read(hydration)?.ml ?? null,
    user: {
      target_calories: goal?.target_kcal ?? null, target_protein: goal?.protein_g ?? null,
      target_carbs: goal?.carbs_g ?? null, target_fat: goal?.fat_g ?? null,
    },
  };
}
