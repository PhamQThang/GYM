import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

export type ClientScope = { userId: string; clientId: string };
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

function read<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error('Không thể tải dữ liệu học viên.');
  return result.data;
}

export async function readClientOverview(api: SupabaseClient<Database>, scope: ClientScope, signal: AbortSignal) {
  if (!uuid.test(scope.userId) || !uuid.test(scope.clientId)) throw new Error('Hồ sơ học viên không hợp lệ.');
  const { clientId, userId } = scope;
  const client = read(await api.from('clients').select('id,full_name')
    .eq('id', clientId).eq('user_id', userId).eq('status', 'active').is('archived_at', null)
    .abortSignal(signal).maybeSingle());
  if (!client) throw new Error('Hồ sơ học viên không còn khả dụng.');

  const [program, workout, nutrition, measurement, packages, calendar] = await Promise.all([
    api.from('programs').select('name').eq('client_id', clientId).eq('is_active', true)
      .order('updated_at', { ascending: false }).order('id').limit(1).abortSignal(signal).maybeSingle(),
    api.from('workout_logs').select('started_at').eq('client_id', clientId)
      .order('started_at', { ascending: false }).order('id').limit(1).abortSignal(signal).maybeSingle(),
    api.from('nutrition_profiles').select('target_kcal,protein_g,carbs_g,fat_g').eq('client_id', clientId)
      .abortSignal(signal).maybeSingle(),
    api.from('body_metrics').select('measured_on,weight_kg').eq('client_id', clientId).not('weight_kg', 'is', null)
      .order('measured_on', { ascending: false }).order('id').limit(1).abortSignal(signal).maybeSingle(),
    api.from('client_packages').select('name,end_date').eq('client_id', clientId).eq('status', 'active')
      .order('end_date').order('id').limit(1).abortSignal(signal).maybeSingle(),
    api.from('training_sessions').select('starts_at').eq('client_id', clientId).eq('status', 'scheduled')
      .gte('starts_at', new Date().toISOString()).order('starts_at').order('id').limit(1).abortSignal(signal).maybeSingle(),
  ]);

  const target = read(nutrition);
  const weight = read(measurement);
  return {
    name: client.full_name,
    program: read(program)?.name ?? null,
    lastWorkoutAt: read(workout)?.started_at ?? null,
    nutrition: target ? { calories: target.target_kcal, protein: target.protein_g, carbs: target.carbs_g, fat: target.fat_g } : null,
    weight: weight?.weight_kg == null ? null : { kg: weight.weight_kg, date: weight.measured_on },
    packageName: read(packages)?.name ?? null,
    nextSessionAt: read(calendar)?.starts_at ?? null,
  };
}

export type ClientOverview = Awaited<ReturnType<typeof readClientOverview>>;
