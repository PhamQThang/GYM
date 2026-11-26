import { useEffect, useState } from 'react';
import { readClientDashboard, type ClientDashboard, type ClientScope } from '../../lib/repositories/client-overview';
import { useNavigate } from 'react-router-dom';
import Overview from '../../components/views/Overview';
import { toLocalDateKey } from '../../lib/analytics';
import { saveClientWeight } from '../../lib/repositories/client-tracker';

const vietnamDate = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh',
});
function dateTime(value: string | null) {
  return value ? vietnamDate.format(new Date(value)) : 'Chưa có dữ liệu';
}

export function ClientOverviewPanel({ userId, clientId }: ClientScope) {
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<ClientDashboard | 'error' | null>(null);
  useEffect(() => {
    const request = new AbortController();
    void import('../../lib/supabase')
      .then(({ supabase }) => {
        if (!request.signal.aborted) return readClientDashboard(supabase, { userId, clientId }, request.signal);
      })
      .then(data => { if (data && !request.signal.aborted) setResult(data); })
      .catch(() => { if (!request.signal.aborted) setResult('error'); });
    return () => request.abort();
  }, [attempt, userId, clientId]);

  if (!result) return <p role="status">Đang tải hồ sơ tập luyện…</p>;
  if (result === 'error') return <div>
    <p role="alert">Chưa tải được hồ sơ tập luyện.</p>
    <button type="button" className="underline" onClick={() => { setResult(null); setAttempt(a => a + 1); }}>Thử lại</button>
  </div>;
  const workout = result.lastWorkout;
  const target = result.nutrition;
  const today = result.todayNutrition;
  const calories = today?.kcal ?? null;
  const targetCalories = target?.calories ?? null;
  const canCompareCalories = calories !== null && targetCalories !== null && targetCalories > 0;
  const sessionToday = result.nextSessionAt && toLocalDateKey(result.nextSessionAt) === toLocalDateKey(new Date());
  return <Overview
    user={{
      name: result.name, goal_type: result.goal, current_weight: result.weight?.kg ?? null,
      target_weight: result.targetWeight, target_calories: targetCalories,
      target_protein: target?.protein ?? null, target_carbs: target?.carbs ?? null, target_fat: target?.fat ?? null,
    }}
    programPhase={result.program}
    weightLogs={result.weights}
    startWeight={result.startWeight}
    todayDay={sessionToday ? { name: 'Buổi tập với PT', focus: dateTime(result.nextSessionAt) } : null}
    todayExerciseDefs={[]}
    todayMacros={{ pro: today?.protein_g ?? null, carb: today?.carbs_g ?? null, fat: today?.fat_g ?? null }}
    adherence={{
      actual: calories,
      percentage: canCompareCalories ? Math.round(calories / targetCalories * 100) : null,
      remaining: canCompareCalories ? Math.max(0, targetCalories - calories) : null,
    }}
    onOpenWorkout={() => navigate('/client/workout')}
    onOpenNutrition={() => navigate('/client/nutrition')}
    nutritionActionLabel="Xem dinh dưỡng"
    cloudWeightRange
    onLogWeight={async (weight, submissionId) => {
      await saveClientWeight({ userId, clientId }, weight, submissionId);
      setAttempt(value => value + 1);
    }}
    workoutActionLabel="Ghi buổi tập"
    workoutDetails={[
      { label: 'Giáo án', value: result.program ?? 'Chưa được giao' },
      { label: 'Lần tập gần nhất', value: dateTime(workout?.started_at ?? null) },
      { label: 'Buổi PT sắp tới', value: dateTime(result.nextSessionAt) },
      { label: 'Gói tập đang dùng', value: result.packageName ?? 'Chưa có gói đang hoạt động' },
    ]}
  />;
}
