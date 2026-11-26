import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';
import { toLocalDateKey } from '../analytics';

export type ClientScope = { userId: string; clientId: string };
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

export function readClientData<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error('Không thể tải dữ liệu học viên.');
  return result.data;
}

export async function readLinkedClient(api: SupabaseClient<Database>, scope: ClientScope, signal: AbortSignal) {
  if (!uuid.test(scope.userId) || !uuid.test(scope.clientId)) throw new Error('Hồ sơ học viên không hợp lệ.');
  const { clientId, userId } = scope;
  const client = readClientData(await api.from('clients').select('id,full_name,goal,target_weight_kg')
    .eq('id', clientId).eq('user_id', userId).eq('status', 'active').is('archived_at', null)
    .abortSignal(signal).maybeSingle());
  if (!client) throw new Error('Hồ sơ học viên không còn khả dụng.');
  return client;
}

export async function readClientOverview(api: SupabaseClient<Database>, scope: ClientScope, signal: AbortSignal) {
  const client = await readLinkedClient(api, scope, signal);
  const { clientId } = scope;
  const read = readClientData;

  const [program, workout, nutrition, measurement, packages, calendar] = await Promise.all([
    api.from('programs').select('name').eq('client_id', clientId).eq('is_active', true)
      .order('updated_at', { ascending: false }).order('id').limit(1).abortSignal(signal).maybeSingle(),
    readClientLatestWorkout(api, clientId, signal),
    api.from('nutrition_profiles').select('target_kcal,protein_g,carbs_g,fat_g').eq('client_id', clientId)
      .abortSignal(signal).maybeSingle(),
    api.from('body_metrics').select('measured_on,weight_kg').eq('client_id', clientId).not('weight_kg', 'is', null)
      .order('measured_on', { ascending: false }).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(1)
      .abortSignal(signal).maybeSingle(),
    api.from('client_packages').select('name,end_date').eq('client_id', clientId).eq('status', 'active')
      .order('end_date').order('id').limit(1).abortSignal(signal).maybeSingle(),
    api.from('training_sessions').select('starts_at').eq('client_id', clientId).eq('status', 'scheduled')
      .gte('starts_at', new Date().toISOString()).order('starts_at').order('id').limit(1).abortSignal(signal).maybeSingle(),
  ]);

  const target = read(nutrition);
  const weight = read(measurement);
  return {
    name: client.full_name,
    goal: client.goal ?? null,
    targetWeight: client.target_weight_kg ?? null,
    program: read(program)?.name ?? null,
    lastWorkout: workout,
    nutrition: target ? { calories: target.target_kcal, protein: target.protein_g, carbs: target.carbs_g, fat: target.fat_g } : null,
    weight: weight?.weight_kg == null ? null : { kg: weight.weight_kg, date: weight.measured_on },
    packageName: read(packages)?.name ?? null,
    nextSessionAt: read(calendar)?.starts_at ?? null,
  };
}

export async function readClientLatestWorkout(api: SupabaseClient<Database>, clientId: string, signal: AbortSignal) {
  return readClientData(await api.from('workout_logs')
    .select('started_at,note,workout_sets(id,set_number,weight_kg,reps,status,exercises(name))').eq('client_id', clientId)
    .order('started_at', { ascending: false }).order('id').limit(1)
    .order('set_number', { referencedTable: 'workout_sets' }).order('id', { referencedTable: 'workout_sets' })
    .abortSignal(signal).maybeSingle());
}

export type ClientOverview = Awaited<ReturnType<typeof readClientOverview>>;

export async function readClientDashboard(api: SupabaseClient<Database>, scope: ClientScope, signal: AbortSignal) {
  const overview = await readClientOverview(api, scope, signal);
  const [body, today] = await Promise.all([
    readClientWeights(api, scope, signal),
    api.from('daily_nutrition').select('kcal,protein_g,carbs_g,fat_g')
      .eq('client_id', scope.clientId).eq('log_date', toLocalDateKey(new Date())).abortSignal(signal).maybeSingle(),
  ]);
  return { ...overview, ...body, todayNutrition: readClientData(today) };
}

export async function readClientWeights(api: SupabaseClient<Database>, scope: ClientScope, signal: AbortSignal) {
  const measurements = () => api.from('body_metrics').select('id, measured_on, weight_kg')
    .eq('client_id', scope.clientId).not('weight_kg', 'is', null);
  const [recent, first] = await Promise.all([
    measurements().order('measured_on', { ascending: false }).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(90).abortSignal(signal),
    measurements().order('measured_on').order('created_at').order('id').limit(1).abortSignal(signal).maybeSingle(),
  ]);
  const weights = (readClientData(recent) ?? []).flatMap(row => row.weight_kg === null ? [] : [{
    id: row.id, user_id: scope.userId, date: row.measured_on, weight: row.weight_kg,
  }]).reverse();
  return { weights, startWeight: readClientData(first)?.weight_kg ?? null };
}

export type ClientDashboard = Awaited<ReturnType<typeof readClientDashboard>>;
