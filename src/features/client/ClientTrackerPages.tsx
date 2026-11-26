import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import Nutrition from '../../components/views/Nutrition';
import Progress from '../../components/views/Progress';
import WorkoutHistory from '../../components/views/WorkoutHistory';
import { toLocalDateKey } from '../../lib/analytics';
import type { Database } from '../../lib/database.types';
import type { ClientScope } from '../../lib/repositories/client-overview';
import { loadClientHistory, loadClientNutrition, loadClientProgress, saveClientWeight } from '../../lib/repositories/client-tracker';
import { AuthNotice } from '../auth/pages/AuthFrame';

function useClientPage<T>(
  { userId, clientId }: ClientScope,
  load: (api: SupabaseClient<Database>, scope: ClientScope, signal: AbortSignal, day: string) => Promise<T>,
  day = '',
) {
  const [attempt, setAttempt] = useState(0);
  const [response, setResponse] = useState<{ key: string; result: T | 'error' }>();
  const key = [userId, clientId, day, attempt].join(':');
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    void import('../../lib/supabase')
      .then(({ supabase }) => {
        if (!signal.aborted) return load(supabase, { userId, clientId }, signal, day);
      })
      .then(result => { if (result !== undefined && !signal.aborted) setResponse({ key, result }); })
      .catch(() => { if (!signal.aborted) setResponse({ key, result: 'error' }); });
    return () => controller.abort();
  }, [key, day, userId, clientId, load]);
  const result = response?.key === key ? response.result : undefined;
  const reload = () => setAttempt(value => value + 1);
  const status = result === 'error' ? <div className="space-y-2">
    <AuthNotice error>Chưa tải được dữ liệu. Vui lòng thử lại.</AuthNotice>
    <button type="button" className="min-h-11 underline" onClick={reload}>Thử lại</button>
  </div> : result === undefined ? <p role="status">Đang tải dữ liệu…</p> : null;
  return { data: result === 'error' ? undefined : result, status, reload };
}

export function ClientHistoryPage(scope: ClientScope) {
  const { data, status } = useClientPage(scope, loadClientHistory);
  return data ? <WorkoutHistory {...data} /> : status;
}

export function ClientProgressPage(scope: ClientScope) {
  const { data, status, reload } = useClientPage(scope, loadClientProgress);
  return data ? <Progress {...data} weightLogs={data.weights} cloudWeightRange onLogWeight={async (weight, submissionId) => {
    await saveClientWeight(scope, weight, submissionId);
    reload();
  }} /> : status;
}

function readNutritionDay(api: SupabaseClient<Database>, scope: ClientScope, signal: AbortSignal, day: string) {
  return loadClientNutrition(api, scope, day, signal);
}

const emptyNutrition = {
  meals: [], mealItems: [], dailyWater: null,
  user: { target_calories: null, target_protein: null, target_carbs: null, target_fat: null },
};

export function ClientNutritionPage(scope: ClientScope) {
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateKey(new Date()));
  const { data, status } = useClientPage(scope, readNutritionDay, selectedDate);
  return <Nutrition {...(data ?? emptyNutrition)} {...{ selectedDate, setSelectedDate, status }} />;
}
