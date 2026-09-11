import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Scale, Target, Activity, Flame, Dumbbell, Check, TrendingUp, TrendingDown, Timer, Minus } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useAppStore } from '../../lib/store';
import {
  calculateCalorieAdherence,
  calculateNutritionHistory,
  calculatePersonalRecords,
  calculateWeeklyWeightDelta,
  formatTodayVietnamese,
  getVietnameseGreeting,
} from '../../lib/analytics';

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────
interface OverviewProps {}

// ─────────────────────────────────────────────────
// WEIGHT MODAL (minimal inline form)
// ─────────────────────────────────────────────────
function WeightModal({ onClose, onSave }: { onClose: () => void; onSave: (w: number) => void }) {
  const [val, setVal] = useState('');
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      onSave(parsed);
      onClose();
    }
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[var(--color-panel-bg)] border border-[var(--color-border)] rounded-2xl p-8 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-1">Ghi Nhận Cân Nặng</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-6">Nhập cân nặng hiện tại của bạn (kg)</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="number"
            step="0.1"
            min="1"
            placeholder="65.0"
            value={val}
            onChange={e => setVal(e.target.value)}
            autoFocus
            className="w-full bg-[var(--color-app-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-xl font-bold text-center focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-[var(--color-card-bg)] border border-[var(--color-border)] font-semibold text-sm hover:bg-[var(--color-card-hover)] transition-colors">
              Hủy
            </button>
            <button type="submit" className="flex-1 py-3 rounded-xl bg-[var(--color-primary)] text-black font-bold text-sm hover:bg-[var(--color-primary-dark)] transition-colors">
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────
export default function Overview(_props: OverviewProps) {
  const [showWeightModal, setShowWeightModal] = useState(false);
  const navigate = useNavigate();

  const user = useAppStore((s) => s.user);
  const mealItems = useAppStore((s) => s.mealItems);
  const meals = useAppStore((s) => s.meals);
  const weightLogs = useAppStore((s) => s.weightLogs);
  const workoutDays = useAppStore((s) => s.workoutDays);
  const workoutExercises = useAppStore((s) => s.workoutExercises);
  const exercises = useAppStore((s) => s.exercises);
  const workoutHistory = useAppStore((s) => s.workoutHistory);
  const setHistory = useAppStore((s) => s.setHistory);
  const programs = useAppStore((s) => s.programs);
  const startWorkout = useAppStore((s) => s.startWorkout);
  const logWeight = useAppStore((s) => s.logWeight);

  // ── Date & Greeting ──────────────────────────────
  const todayDateLabel = formatTodayVietnamese();
  const greeting = getVietnameseGreeting();
  const activeProgram = programs[0] ?? null;
  const programPhase = activeProgram?.phase ?? null;

  // ── Nutrition ────────────────────────────────────
  const nutritionHistory = calculateNutritionHistory(mealItems);
  const todayMacros = nutritionHistory[nutritionHistory.length - 1] ?? { pro: 0, carb: 0, fat: 0, calories: 0, day: '', dateKey: '', active: false };
  const adherence = calculateCalorieAdherence(mealItems, user);

  // ── Weight ───────────────────────────────────────
  const currentWeight = user.current_weight;
  const targetWeight = user.target_weight;
  const startingWeight = weightLogs[0]?.weight ?? null;
  const weeklyDelta = calculateWeeklyWeightDelta(weightLogs);

  // Dual-directional weight progress (Bulk vs Cut)
  let weightProgressPct = 0;
  if (startingWeight !== null) {
    if (targetWeight > startingWeight) {
      weightProgressPct = ((currentWeight - startingWeight) / (targetWeight - startingWeight)) * 100;
    } else if (targetWeight < startingWeight) {
      weightProgressPct = ((startingWeight - currentWeight) / (startingWeight - targetWeight)) * 100;
    }
  }
  if (!isFinite(weightProgressPct) || isNaN(weightProgressPct)) weightProgressPct = 0;
  weightProgressPct = Math.max(0, Math.min(100, Math.round(weightProgressPct)));

  // ── Today's Workout ──────────────────────────────
  const todayDow = new Date().getDay(); // 0=Sun, 1=Mon, ...
  const todayDay = workoutDays.find(d => d.day_of_week === todayDow && d.is_active) ?? null;
  const todayExercises = todayDay
    ? workoutExercises
        .filter(we => we.workout_day_id === todayDay.id && we.is_active !== false)
        .sort((a, b) => a.order_index - b.order_index)
    : [];
  const todayExerciseDefs = todayExercises.map(we => ({
    we,
    exercise: exercises.find(e => e.id === we.exercise_id),
  })).filter(x => x.exercise !== undefined);

  const totalPlannedSets = todayExercises.reduce((acc, we) => acc + we.planned_sets, 0);
  const estimatedMinutes = Math.round(
    todayExercises.reduce((acc, we) => acc + we.planned_sets * (we.rest_seconds + 40), 0) / 60
  );
  const hasExercisesToday = todayExerciseDefs.length > 0;

  // ── PRs ──────────────────────────────────────────
  const prs = calculatePersonalRecords(setHistory, workoutHistory, workoutExercises, exercises);
  const prMap = new Map(prs.map(pr => [pr.exerciseId, pr]));

  // ── Meal distribution (consumed only) ────────────
  const mealCalories = meals.map(meal => {
    const loggedCals = mealItems
      .filter(mi => mi.meal_id === meal.id && Boolean(mi.logged_at))
      .reduce((a, i) => a + i.calories, 0);
    return { meal, loggedCals };
  });
  const consumedMealCount = meals.filter(
    m => mealItems.some(mi => mi.meal_id === m.id && Boolean(mi.logged_at))
  ).length;

  // ── Hero: Start Workout ──────────────────────────
  const handleStartWorkout = () => {
    if (!todayDay || !hasExercisesToday) return;
    startWorkout(todayDay.id);
    navigate('/workout');
  };

  // ── Weight goal label ─────────────────────────────
  const weightGoalDiff = targetWeight - currentWeight;
  const weightGoalLabel = weightGoalDiff > 0
    ? `+${weightGoalDiff.toFixed(1)} kg`
    : `${weightGoalDiff.toFixed(1)} kg`;

  return (
    <div className="space-y-6">
      {/* Weight Modal */}
      {showWeightModal && (
        <WeightModal
          onClose={() => setShowWeightModal(false)}
          onSave={(w) => logWeight(w)}
        />
      )}

      {/* Hero Section */}
      <div className="bg-[var(--color-panel-bg)] rounded-2xl p-8 border border-[var(--color-border)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-2">
            <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full"></span>
            Hệ Thống Trực Tuyến • {todayDateLabel}{programPhase ? ` • ${programPhase}` : ''}
          </div>
          <h2 className="text-4xl font-bold mb-4">{greeting}, {user.name.split(' ')[0]}</h2>
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Target className="w-4 h-4 text-[var(--color-primary)]" />
            <p>
              Mục Tiêu {user.goal_type ?? 'Cân Nặng'}:{' '}
              <span className="font-semibold text-white">{currentWeight.toFixed(1)} kg</span>
              {' → '}
              <span className="font-semibold text-[var(--color-primary)]">{targetWeight.toFixed(1)} kg</span>
              {' '}({weightGoalLabel})
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="flex w-full gap-3">
            <button
              onClick={() => setShowWeightModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[var(--color-card-bg)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)] px-5 py-3 rounded-xl font-medium transition-colors"
            >
              <Scale className="w-4 h-4 text-blue-400" />
              Ghi Nhận Cân Nặng
            </button>
            <button
              onClick={() => navigate('/nutrition')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[var(--color-card-bg)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)] px-5 py-3 rounded-xl font-medium transition-colors"
            >
              <Flame className="w-4 h-4 text-orange-400" />
              Ghi Nhanh Đồ Ăn
            </button>
          </div>
          <button
            onClick={handleStartWorkout}
            disabled={!hasExercisesToday}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-colors ${
              hasExercisesToday
                ? 'bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary-dark)]'
                : 'bg-[var(--color-card-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)] cursor-not-allowed'
            }`}
          >
            <Play className={`w-4 h-4 ${hasExercisesToday ? 'fill-black' : ''}`} />
            {todayDay ? `Bắt Đầu ${todayDay.name}` : 'Ngày Nghỉ'}
          </button>
        </div>
      </div>

      {/* Grid 1: Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Card 1: Weight */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>CHỈ SỐ SINH TRẮC</CardTitle>
              <h4 className="text-xl font-semibold mt-1">Cân Nặng Cơ Thể</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[var(--color-card-bg)] border border-[var(--color-border)] flex items-center justify-center">
              <Scale className="w-5 h-5 text-blue-400" />
            </div>
          </CardHeader>
          <div className="mt-4 flex items-end justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{currentWeight.toFixed(1)}</span>
              <span className="text-xl text-[var(--color-text-muted)] font-medium">kg</span>
            </div>
            {weeklyDelta !== null ? (
              <div className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 ${
                weeklyDelta > 0
                  ? 'bg-[rgba(74,222,128,0.1)] text-[var(--color-primary)]'
                  : weeklyDelta < 0
                  ? 'bg-[rgba(248,113,113,0.1)] text-red-400'
                  : 'bg-[var(--color-card-bg)] text-[var(--color-text-muted)]'
              }`}>
                {weeklyDelta > 0 ? <TrendingUp className="w-3 h-3" /> : weeklyDelta < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                {weeklyDelta > 0 ? '+' : ''}{weeklyDelta} kg tuần này
              </div>
            ) : (
              <div className="bg-[var(--color-card-bg)] px-2 py-1 rounded-md text-xs text-[var(--color-text-muted)]">
                Chưa đủ dữ liệu
              </div>
            )}
          </div>
          {/* Weight progress toward target */}
          {weightLogs.length > 0 ? (
            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span>Tiến độ mục tiêu</span>
                <span className="text-[var(--color-primary)]">{currentWeight.toFixed(1)} / {targetWeight.toFixed(1)} kg</span>
              </div>
              <div className="h-1.5 w-full bg-[var(--color-app-bg)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-700" style={{ width: `${weightProgressPct}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] font-semibold">
                {startingWeight !== null && <span>Bắt Đầu: {startingWeight.toFixed(1)} kg</span>}
                <span>Mục Tiêu: {targetWeight.toFixed(1)} kg</span>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <div className="bg-[var(--color-app-bg)] border border-[var(--color-border)] rounded-lg p-3 text-center text-xs text-[var(--color-text-muted)]">
                Chưa đủ dữ liệu lịch sử để hiển thị tiến độ
              </div>
            </div>
          )}
        </Card>

        {/* Card 2: Calorie Balance (unchanged — already data-driven) */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>CÂN BẰNG NĂNG LƯỢNG</CardTitle>
              <h4 className="text-xl font-semibold mt-1">Calo Hàng Ngày</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[var(--color-card-bg)] border border-[var(--color-border)] flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
          </CardHeader>
          <div className="mt-4 flex items-center gap-6">
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="transparent" stroke="var(--color-card-bg)" strokeWidth="10" />
                <circle cx="50" cy="50" r="45" fill="transparent" stroke="var(--color-primary)" strokeWidth="10" strokeDasharray="282.7" strokeDashoffset={282.7 * (1 - adherence.percentage / 100)} className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold">{adherence.percentage}%</span>
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase">đã đạt</span>
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{adherence.actual.toLocaleString()}</span>
                <span className="text-sm text-[var(--color-text-muted)] font-medium">/ {user.target_calories.toLocaleString()}</span>
              </div>
              <div className="text-xs font-semibold text-[var(--color-primary)] mt-1">
                {adherence.remaining.toLocaleString()} KCAL CÒN LẠI
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-snug">Thặng dư năng lượng</p>
            </div>
          </div>
          <div className="mt-6 flex justify-between text-xs">
            <div>
              <div className="text-[var(--color-text-muted)] uppercase tracking-wider mb-1">PRO</div>
              <div><span className="font-semibold text-white">{todayMacros.pro}g</span> <span className="text-[var(--color-text-muted)]">/{user.target_protein}</span></div>
            </div>
            <div>
              <div className="text-[var(--color-text-muted)] uppercase tracking-wider mb-1">CARB</div>
              <div><span className="font-semibold text-blue-400">{todayMacros.carb}g</span> <span className="text-[var(--color-text-muted)]">/{user.target_carbs}</span></div>
            </div>
            <div>
              <div className="text-[var(--color-text-muted)] uppercase tracking-wider mb-1">FAT</div>
              <div><span className="font-semibold text-orange-400">{todayMacros.fat}g</span> <span className="text-[var(--color-text-muted)]">/{user.target_fat}</span></div>
            </div>
          </div>
        </Card>

        {/* Card 3: Today's Workout */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>NGÀY HIỆN TẠI</CardTitle>
              <h4 className="text-xl font-semibold mt-1">Buổi Tập Hôm Nay</h4>
            </div>
            <div className={`bg-[var(--color-card-bg)] border border-[var(--color-border)] px-2 py-1 rounded text-[10px] font-semibold tracking-widest uppercase ${hasExercisesToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
              {hasExercisesToday ? 'SẴN SÀNG' : 'NGHỈ'}
            </div>
          </CardHeader>
          <div className="mt-2">
            {todayDay ? (
              <>
                <h3 className="text-2xl font-bold leading-tight">{todayDay.name}</h3>
                {todayDay.focus && <p className="text-sm text-[var(--color-text-muted)] mt-1">{todayDay.focus}</p>}
                {hasExercisesToday ? (
                  <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] mt-3">
                    <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> {estimatedMinutes} phút</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" /> {todayExerciseDefs.length} bài tập</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {totalPlannedSets} hiệp</span>
                  </div>
                ) : (
                  <p className="text-xs text-[var(--color-text-muted)] mt-3">Chưa có bài tập nào trong lịch hôm nay</p>
                )}
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold leading-tight text-[var(--color-text-muted)]">Ngày Nghỉ</h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-3">Không có lịch tập cho hôm nay</p>
              </>
            )}
          </div>
          <div className="mt-8">
            <button
              onClick={handleStartWorkout}
              disabled={!hasExercisesToday}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold transition-colors ${
                hasExercisesToday
                  ? 'bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary-dark)]'
                  : 'bg-[var(--color-card-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)] cursor-not-allowed'
              }`}
            >
              <Play className={`w-4 h-4 ${hasExercisesToday ? 'fill-black' : ''}`} />
              {hasExercisesToday ? 'Bắt Đầu' : 'Không Có Lịch'}
            </button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Today's Exercise List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[rgba(74,222,128,0.1)] border border-[var(--color-primary)]/20 flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-[var(--color-primary)]" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Danh Sách Bài Đang Chờ</h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {todayDay ? `${todayDay.name} • ${todayExerciseDefs.length} bài tập` : 'Không có lịch tập hôm nay'}
                </p>
              </div>
            </div>
            <div className="bg-[var(--color-panel-bg)] border border-[var(--color-border)] px-3 py-1.5 rounded-md text-[10px] font-semibold text-[var(--color-text-muted)] tracking-widest uppercase">
              {hasExercisesToday ? 'CHỜ DO THỰC HIỆN' : 'NGÀY NGHỈ'}
            </div>
          </div>

          <div className="space-y-3">
            {todayExerciseDefs.length === 0 ? (
              <div className="bg-[var(--color-panel-bg)] border border-[var(--color-border)] rounded-xl p-8 text-center">
                <Dumbbell className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3 opacity-40" />
                <p className="text-sm font-semibold text-[var(--color-text-muted)]">
                  {todayDay ? 'Chưa có bài tập nào trong lịch hôm nay' : 'Chưa có lịch tập hôm nay'}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 opacity-60">
                  Thêm bài tập trong <span className="text-[var(--color-primary)]">Tập Luyện → Lịch Trình</span>
                </p>
              </div>
            ) : (
              todayExerciseDefs.map(({ we, exercise }, idx) => {
                const pr = exercise ? prMap.get(exercise.id) : undefined;
                const idxLabel = String(idx + 1).padStart(2, '0');
                return (
                  <div key={we.id} className="bg-[var(--color-panel-bg)] border border-[var(--color-border)] rounded-xl p-4 flex items-center gap-4 hover:border-[var(--color-card-hover)] transition-colors group">
                    <div className="w-12 h-12 rounded-lg bg-[var(--color-app-bg)] border border-[var(--color-border)] flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] text-[var(--color-text-muted)] font-bold"></span>
                      <span className="text-sm font-bold text-[var(--color-primary)]">{idxLabel}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-[15px] truncate">{exercise?.name ?? 'Bài Tập'}</h4>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {exercise?.primary_muscle && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-app-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                            {exercise.primary_muscle}
                          </span>
                        )}
                        {exercise?.type && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-app-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                            {exercise.type}
                          </span>
                        )}
                        <span className="text-[10px] text-[var(--color-text-muted)] ml-2">
                          {we.planned_sets} Hiệp • {we.rep_range_min}-{we.rep_range_max} Reps
                        </span>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block shrink-0">
                      <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-0.5">KỶ LỤC TRƯỚC</div>
                      <div className="text-sm font-bold">
                        {pr ? `${pr.bestSet.weight} kg × ${pr.bestSet.reps}` : 'Chưa có PR'}
                      </div>
                    </div>
                    <button className="w-10 h-10 shrink-0 rounded-lg bg-[var(--color-app-bg)] border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-card-hover)] text-[var(--color-text-muted)] hover:text-white transition-colors ml-2">
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {hasExercisesToday && (
            <div className="bg-[var(--color-panel-bg)] border border-[var(--color-border)] rounded-xl p-4 mt-2 flex items-start gap-3">
              <div className="mt-0.5"><Activity className="w-4 h-4 text-[var(--color-primary)]" /></div>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                Giữ RPE từ 8.5 đến 9 trên những hiệp sau cùng. Thời gian giãn cách yêu cầu phải đúng {todayExercises[0]?.rest_seconds ?? 90} giây.
              </p>
            </div>
          )}
        </div>

        {/* Right Col */}
        <div className="space-y-6">
          {/* Macro Overview Card */}
          <Card>
            <CardHeader className="mb-8">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[var(--color-primary)]" />
                <CardTitle className="text-sm text-white">Mục Tiêu<br/>Vĩ Mô</CardTitle>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{adherence.actual.toLocaleString()} <span className="text-[var(--color-text-muted)]">/ {user.target_calories.toLocaleString()}</span></div>
                <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mt-0.5">KCAL</div>
              </div>
            </CardHeader>

            <div className="flex justify-between items-center mb-10 px-2">
              {[
                { label: 'ĐẠM', current: todayMacros.pro, target: user.target_protein, color: 'var(--color-primary)' },
                { label: 'TINH BỘT', current: todayMacros.carb, target: user.target_carbs, color: '#60a5fa' },
                { label: 'CHẤT BÉO', current: todayMacros.fat, target: user.target_fat, color: '#fb923c' },
              ].map((macro) => {
                const percent = macro.target > 0 ? Math.min(100, Math.round((macro.current / macro.target) * 100)) : 0;
                return (
                  <div key={macro.label} className="flex flex-col items-center">
                    <div className="relative w-16 h-16 flex items-center justify-center mb-3">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="transparent" stroke="var(--color-app-bg)" strokeWidth="8" />
                        <circle cx="50" cy="50" r="42" fill="transparent" stroke={macro.color} strokeWidth="8" strokeDasharray="263.89" strokeDashoffset={263.89 * (1 - percent / 100)} className="transition-all duration-1000 ease-out" />
                      </svg>
                      <span className="absolute text-xs font-bold">{percent}%</span>
                    </div>
                    <div className="text-[10px] font-semibold tracking-widest text-[var(--color-text-muted)] mb-1">{macro.label}</div>
                    <div className="text-[10px] font-bold"><span style={{ color: macro.color }}>{macro.current}</span> / <span className="text-[var(--color-text-muted)]">{macro.target}g</span></div>
                  </div>
                );
              })}
            </div>

            {/* Meal distribution — real data */}
            <div className="border-t border-[var(--color-border)] pt-6">
              <div className="flex justify-between items-center mb-3 text-xs">
                <span className="text-[var(--color-text-muted)] uppercase tracking-widest font-semibold">PHÂN BỔ BỮA ĂN</span>
                <span className="text-[var(--color-primary)] font-semibold">
                  {consumedMealCount} / {meals.length} Cữ Điểm
                </span>
              </div>
              {/* Dynamic meal bars proportional to logged calories */}
              {mealCalories.length > 0 && (
                <>
                  <div className="flex gap-1 h-2 mb-4">
                    {mealCalories.map(({ meal, loggedCals }, i) => {
                      const mealColors = ['var(--color-primary)', '#60a5fa', '#fb923c', 'var(--color-primary)', '#a78bfa'];
                      const isConsumed = meal.status === 'CONSUMED';
                      return (
                        <div
                          key={meal.id}
                          className="h-full rounded-full flex-1 transition-all duration-700"
                          style={{
                            backgroundColor: isConsumed && loggedCals > 0 ? mealColors[i % mealColors.length] : 'var(--color-app-bg)',
                            border: (!isConsumed || loggedCals === 0) ? '1px solid var(--color-border)' : 'none',
                          }}
                        />
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-[var(--color-text-muted)]">
                    {mealCalories.map(({ meal, loggedCals }, i) => {
                      const mealColors = ['var(--color-primary)', '#60a5fa', '#fb923c', 'var(--color-primary)', '#a78bfa'];
                      return (
                        <div key={meal.id} className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: mealColors[i % mealColors.length] }}></span>
                          {meal.name} ({loggedCals})
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              {mealCalories.length === 0 && (
                <p className="text-xs text-[var(--color-text-muted)] text-center py-2">Chưa có bữa ăn nào</p>
              )}
            </div>
          </Card>

          {/* Weight Chart Card */}
          <Card className="flex flex-col h-72">
            <CardHeader className="mb-0">
              <div>
                <CardTitle>QŨY ĐẠO SINH TRẮC</CardTitle>
                <h4 className="text-lg font-semibold mt-1">Sơ Đồ Vector<br/>Nhịp Phát Triển</h4>
              </div>
            </CardHeader>

            <div className="flex-1 mt-4 relative min-h-0">
              {weightLogs.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightLogs} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} dy={10} />
                    <YAxis domain={[(dataMin: number) => Math.min(dataMin, targetWeight) - 1, (dataMax: number) => Math.max(dataMax, targetWeight) + 1]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: 'var(--color-primary)' }}
                    />
                    <ReferenceLine y={targetWeight} stroke="var(--color-primary)" strokeDasharray="3 3" strokeWidth={1.5} strokeOpacity={0.8} />
                    <Line type="monotone" dataKey="weight" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 2, stroke: 'var(--color-panel-bg)' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                  <Scale className="w-8 h-8 text-[var(--color-text-muted)] opacity-30" />
                  <p className="text-sm text-[var(--color-text-muted)]">Chưa có dữ liệu cân nặng</p>
                  <p className="text-xs text-[var(--color-text-muted)] opacity-60">Ghi nhận cân nặng để xem xu hướng</p>
                </div>
              )}
              {weightLogs.length > 1 && (
                <>
                  <div className="absolute top-2 left-4 text-[8px] text-[var(--color-primary)] uppercase font-bold tracking-wider">MỤC TIÊU: {targetWeight.toFixed(1)} KG</div>
                  <div className="absolute bottom-10 right-4 bg-[var(--color-card-bg)] border border-[var(--color-border)] px-2 py-1 rounded text-center">
                    <div className="text-[10px] font-bold text-[var(--color-primary)]">{currentWeight.toFixed(1)} kg</div>
                    <div className="text-[8px] text-[var(--color-text-muted)]">Hôm Nay</div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
