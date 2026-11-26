import { useState, lazy, Suspense } from 'react';
import { Play, Scale, Target, Activity, Flame, Dumbbell, TrendingUp, TrendingDown, Timer, Minus } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { WeightModal } from '../ui/WeightModal';
import { calculateWeeklyWeightDelta, formatTodayVietnamese, getVietnameseGreeting } from '../../lib/analytics';
import type { Exercise, Meal, WeightLog, WorkoutDay, WorkoutExercise } from '../../lib/types';

const OverviewWeightChart = lazy(() => import('./OverviewWeightChart'));

type OverviewProps = {
  user: {
    name: string;
    goal_type?: string | null;
    current_weight: number | null;
    target_weight: number | null;
    target_calories: number | null;
    target_protein: number | null;
    target_carbs: number | null;
    target_fat: number | null;
  };
  programPhase: string | null;
  weightLogs: WeightLog[];
  startWeight: number | null;
  todayDay: Pick<WorkoutDay, 'name' | 'focus'> | null;
  todayExerciseDefs: { we: Pick<WorkoutExercise, 'id' | 'planned_sets' | 'rest_seconds' | 'rep_range_min' | 'rep_range_max'>;
    exercise: Pick<Exercise, 'id' | 'name' | 'primary_muscle' | 'type'> | undefined }[];
  prMap?: Map<string, { bestSet: { weight: number; reps: number } }>;
  todayMacros: { pro: number | null; carb: number | null; fat: number | null };
  adherence: { actual: number | null; percentage: number | null; remaining: number | null };
  mealCalories?: { meal: Pick<Meal, 'id' | 'name' | 'status'>; loggedCals: number }[];
  consumedMealCount?: number;
  onLogWeight?: (weight: number, submissionId: string) => void | Promise<void>;
  cloudWeightRange?: boolean;
  onOpenNutrition?: () => void;
  nutritionActionLabel?: string;
  onOpenWorkout: () => void;
  workoutActionLabel?: string;
  workoutDetails?: { label: string; value: string }[];
};

export default function Overview({
  user, programPhase, weightLogs, startWeight: startingWeight, todayDay, todayExerciseDefs, prMap,
  todayMacros, adherence, mealCalories = [], consumedMealCount = 0, onLogWeight, onOpenNutrition,
  onOpenWorkout, workoutActionLabel, workoutDetails, nutritionActionLabel, cloudWeightRange,
}: OverviewProps) {
  const [showWeightModal, setShowWeightModal] = useState(false);
  const todayDateLabel = formatTodayVietnamese();
  const greeting = getVietnameseGreeting();
  const todayExercises = todayExerciseDefs.map(({ we }) => we);
  const totalPlannedSets = todayExercises.reduce((acc, we) => acc + we.planned_sets, 0);
  const estimatedMinutes = Math.round(
    todayExercises.reduce((acc, we) => acc + we.planned_sets * (we.rest_seconds + 40), 0) / 60
  );
  const hasExercisesToday = todayExerciseDefs.length > 0;
  const canOpenWorkout = hasExercisesToday || Boolean(workoutActionLabel);
  const hasNutritionTarget = user.target_calories !== null && user.target_calories > 0;
  const caloriePercent = Math.min(100, Math.max(0, adherence.percentage ?? 0));
  // ── Weight ───────────────────────────────────────
  const currentWeight = user.current_weight;
  const targetWeight = user.target_weight;
  const weeklyDelta = calculateWeeklyWeightDelta(weightLogs);

  // Dual-directional weight progress (Bulk vs Cut)
  let weightProgressPct = 0;
  if (startingWeight !== null && currentWeight !== null && targetWeight !== null) {
    if (targetWeight > startingWeight) {
      weightProgressPct = ((currentWeight - startingWeight) / (targetWeight - startingWeight)) * 100;
    } else if (targetWeight < startingWeight) {
      weightProgressPct = ((startingWeight - currentWeight) / (startingWeight - targetWeight)) * 100;
    }
  }
  if (!isFinite(weightProgressPct) || isNaN(weightProgressPct)) weightProgressPct = 0;
  weightProgressPct = Math.max(0, Math.min(100, Math.round(weightProgressPct)));

  // ── Weight goal label ─────────────────────────────
  const weightGoalDiff = currentWeight !== null && targetWeight !== null ? targetWeight - currentWeight : null;
  const weightGoalLabel = weightGoalDiff === null ? null : weightGoalDiff > 0
    ? `+${weightGoalDiff.toFixed(1)} kg`
    : `${weightGoalDiff.toFixed(1)} kg`;

  return (
    <div className="space-y-6">
      {/* Weight Modal */}
      {showWeightModal && onLogWeight && (
        <WeightModal
          onClose={() => setShowWeightModal(false)}
          onSave={onLogWeight}
          min={cloudWeightRange ? 20 : undefined}
          max={cloudWeightRange ? 300 : undefined}
        />
      )}

      {/* Hero Section */}
      <div className="bg-[var(--color-panel-bg)] rounded-2xl p-8 border border-[var(--color-border)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-2">
            <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full"></span>
            Hệ Thống Trực Tuyến • {todayDateLabel}{programPhase ? ` • ${programPhase}` : ''}
          </div>
          <h1 className="text-4xl font-bold mb-4">{greeting}{user.name && `, ${user.name.split(' ')[0]}`}</h1>
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Target className="w-4 h-4 text-[var(--color-primary)]" />
            {currentWeight !== null && targetWeight !== null ? <p>
              Mục Tiêu {user.goal_type ?? 'Cân Nặng'}:{' '}
              <span className="font-semibold text-white">{currentWeight.toFixed(1)} kg</span>
              {' → '}
              <span className="font-semibold text-[var(--color-primary)]">{targetWeight.toFixed(1)} kg</span>
              {' '}({weightGoalLabel})
            </p> : <p>{user.goal_type || (targetWeight !== null ? `Mục tiêu cân nặng ${targetWeight.toFixed(1)} kg` : 'Chưa đặt mục tiêu cân nặng')}</p>}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {(onLogWeight || onOpenNutrition) && <div className="flex w-full gap-3">
            {onLogWeight && <button
              onClick={() => setShowWeightModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[var(--color-card-bg)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)] px-5 py-3 rounded-xl font-medium transition-colors"
            >
              <Scale className="w-4 h-4 text-blue-400" />
              Ghi Nhận Cân Nặng
            </button>}
            {onOpenNutrition && <button
              onClick={onOpenNutrition}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[var(--color-card-bg)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)] px-5 py-3 rounded-xl font-medium transition-colors"
            >
              <Flame className="w-4 h-4 text-orange-400" />
              {nutritionActionLabel ?? 'Ghi Nhanh Đồ Ăn'}
            </button>}
          </div>}
          <button
            onClick={onOpenWorkout}
            disabled={!canOpenWorkout}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-colors ${
              canOpenWorkout
                ? 'bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary-dark)]'
                : 'bg-[var(--color-card-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)] cursor-not-allowed'
            }`}
          >
            <Play className={`w-4 h-4 ${canOpenWorkout ? 'fill-black' : ''}`} />
            {workoutActionLabel ?? (todayDay ? `Bắt Đầu ${todayDay.name}` : 'Ngày Nghỉ')}
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
              <span className="text-4xl font-bold">{currentWeight?.toFixed(1) ?? '—'}</span>
              {currentWeight !== null && <span className="text-xl text-[var(--color-text-muted)] font-medium">kg</span>}
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
          {weightLogs.length > 0 && currentWeight !== null && targetWeight !== null ? (
            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span>Tiến độ mục tiêu</span>
                <span className="text-[var(--color-primary)]">{currentWeight.toFixed(1)} / {targetWeight.toFixed(1)} kg</span>
              </div>
              <div 
                role="progressbar" 
                aria-label="Tiến độ cân nặng mục tiêu" 
                aria-valuemin={0} 
                aria-valuemax={100} 
                aria-valuenow={weightProgressPct}
                className="h-1.5 w-full bg-[var(--color-app-bg)] rounded-full overflow-hidden"
              >
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
                {currentWeight === null ? 'Chưa ghi nhận cân nặng' : targetWeight === null ? 'Chưa đặt mục tiêu cân nặng' : 'Chưa đủ dữ liệu lịch sử để hiển thị tiến độ'}
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
            <div 
              role={adherence.percentage === null ? undefined : 'progressbar'}
              aria-label="Cân bằng năng lượng hàng ngày" 
              aria-valuemin={0} 
              aria-valuemax={100} 
              aria-valuenow={adherence.percentage === null ? undefined : caloriePercent}
              className="relative w-24 h-24 flex items-center justify-center shrink-0"
            >
              <svg aria-hidden="true" className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="transparent" stroke="var(--color-card-bg)" strokeWidth="10" />
                <circle cx="50" cy="50" r="45" fill="transparent" stroke="var(--color-primary)" strokeWidth="10" strokeDasharray="282.7" strokeDashoffset={282.7 * (1 - caloriePercent / 100)} className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold">{adherence.percentage === null ? '—' : `${adherence.percentage}%`}</span>
                {adherence.percentage !== null && <span className="text-xs text-[var(--color-text-muted)] uppercase">đã đạt</span>}
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{adherence.actual?.toLocaleString() ?? '—'}</span>
                {user.target_calories !== null && <span className="text-sm text-[var(--color-text-muted)] font-medium">/ {user.target_calories.toLocaleString()}</span>}
              </div>
              <div className="text-xs font-semibold text-[var(--color-primary)] mt-1">
                {adherence.remaining !== null ? `${adherence.remaining.toLocaleString()} KCAL CÒN LẠI` : hasNutritionTarget ? 'Chưa ghi bữa ăn hôm nay' : 'Chưa đặt mục tiêu calo'}
              </div>
              {onOpenNutrition && !nutritionActionLabel && <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-snug">Thặng dư năng lượng</p>}
            </div>
          </div>
          <div className="mt-6 flex justify-between text-xs">
            <div>
              <div className="text-[var(--color-text-muted)] uppercase tracking-wider mb-1">PRO</div>
              <div><span className="font-semibold text-white">{todayMacros.pro ?? '—'}g</span> <span className="text-[var(--color-text-muted)]">/{user.target_protein ?? '—'}</span></div>
            </div>
            <div>
              <div className="text-[var(--color-text-muted)] uppercase tracking-wider mb-1">CARB</div>
              <div><span className="font-semibold text-blue-400">{todayMacros.carb ?? '—'}g</span> <span className="text-[var(--color-text-muted)]">/{user.target_carbs ?? '—'}</span></div>
            </div>
            <div>
              <div className="text-[var(--color-text-muted)] uppercase tracking-wider mb-1">FAT</div>
              <div><span className="font-semibold text-orange-400">{todayMacros.fat ?? '—'}g</span> <span className="text-[var(--color-text-muted)]">/{user.target_fat ?? '—'}</span></div>
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
            <div className={`bg-[var(--color-card-bg)] border border-[var(--color-border)] px-2 py-1 rounded text-xs font-semibold tracking-widest uppercase ${hasExercisesToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
              {hasExercisesToday ? 'SẴN SÀNG' : workoutActionLabel ? (todayDay ? 'ĐÃ LÊN LỊCH' : 'CHƯA CÓ LỊCH') : 'NGHỈ'}
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
                <h3 className="text-2xl font-bold leading-tight text-[var(--color-text-muted)]">{workoutActionLabel ? 'Chưa có lịch PT' : 'Ngày Nghỉ'}</h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-3">Không có lịch tập cho hôm nay</p>
              </>
            )}
          </div>
          <div className="mt-8">
            <button
              onClick={onOpenWorkout}
              disabled={!canOpenWorkout}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold transition-colors ${
                canOpenWorkout
                  ? 'bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary-dark)]'
                  : 'bg-[var(--color-card-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)] cursor-not-allowed'
              }`}
            >
              <Play className={`w-4 h-4 ${canOpenWorkout ? 'fill-black' : ''}`} />
              {workoutActionLabel ? 'Ghi buổi tập hôm nay' : hasExercisesToday ? 'Bắt Đầu' : 'Không Có Lịch'}
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
            <div className="bg-[var(--color-panel-bg)] border border-[var(--color-border)] px-3 py-1.5 rounded-md text-xs font-semibold text-[var(--color-text-muted)] tracking-widest uppercase">
              {hasExercisesToday ? 'CHỜ DO THỰC HIỆN' : workoutActionLabel ? 'CHƯA CÓ BÀI' : 'NGÀY NGHỈ'}
            </div>
          </div>

          <div className="space-y-3">
            {todayExerciseDefs.length === 0 ? (
              <div className="bg-[var(--color-panel-bg)] border border-[var(--color-border)] rounded-xl p-8 text-center">
                <Dumbbell className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3 opacity-40" />
                <p className="text-sm font-semibold text-[var(--color-text-muted)]">
                  {todayDay ? 'Chưa có bài tập nào trong lịch hôm nay' : 'Chưa có lịch tập hôm nay'}
                </p>
                {!workoutActionLabel && <p className="text-xs text-[var(--color-text-muted)] mt-1 opacity-60">
                  Thêm bài tập trong <span className="text-[var(--color-primary)]">Tập Luyện → Lịch Trình</span>
                </p>}
              </div>
            ) : (
              todayExerciseDefs.map(({ we, exercise }, idx) => {
                const pr = exercise ? prMap?.get(exercise.id) : undefined;
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
                      <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-0.5">KỶ LỤC TRƯỚC</div>
                      <div className="text-sm font-bold">
                        {pr ? `${pr.bestSet.weight} kg × ${pr.bestSet.reps}` : 'Chưa có PR'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {workoutDetails && <Card>
            <dl className="grid gap-4 sm:grid-cols-2">
              {workoutDetails.map(({ label, value }) => <div key={label}>
                <dt className="text-sm text-[var(--color-text-muted)]">{label}</dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>)}
            </dl>
          </Card>}
          {hasExercisesToday && !workoutActionLabel && (
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
                <div className="text-sm font-semibold">{adherence.actual?.toLocaleString() ?? '—'} <span className="text-[var(--color-text-muted)]">/ {user.target_calories?.toLocaleString() ?? '—'}</span></div>
                <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-widest mt-0.5">KCAL</div>
              </div>
            </CardHeader>

            <div className="flex justify-between items-center mb-10 px-2">
              {[
                { label: 'ĐẠM', current: todayMacros.pro, target: user.target_protein, color: 'var(--color-primary)' },
                { label: 'TINH BỘT', current: todayMacros.carb, target: user.target_carbs, color: '#60a5fa' },
                { label: 'CHẤT BÉO', current: todayMacros.fat, target: user.target_fat, color: '#fb923c' },
              ].map((macro) => {
                const percent = macro.target !== null && macro.target > 0 && macro.current !== null
                  ? Math.min(100, Math.round((macro.current / macro.target) * 100)) : null;
                return (
                  <div key={macro.label} className="flex flex-col items-center">
                    <div 
                      role={percent === null ? undefined : 'progressbar'}
                      aria-label={`Tiến độ ${macro.label}`} 
                      aria-valuemin={0} 
                      aria-valuemax={100} 
                      aria-valuenow={percent ?? undefined}
                      className="relative w-16 h-16 flex items-center justify-center mb-3"
                    >
                      <svg aria-hidden="true" className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="transparent" stroke="var(--color-app-bg)" strokeWidth="8" />
                        <circle cx="50" cy="50" r="42" fill="transparent" stroke={macro.color} strokeWidth="8" strokeDasharray="263.89" strokeDashoffset={263.89 * (1 - (percent ?? 0) / 100)} className="transition-all duration-1000 ease-out" />
                      </svg>
                      <span className="absolute text-xs font-bold">{percent === null ? '—' : `${percent}%`}</span>
                    </div>
                    <div className="text-[10px] font-semibold tracking-widest text-[var(--color-text-muted)] mb-1">{macro.label}</div>
                    <div className="text-[10px] font-bold"><span style={{ color: macro.color }}>{macro.current ?? '—'}</span> / <span className="text-[var(--color-text-muted)]">{macro.target ?? '—'}g</span></div>
                  </div>
                );
              })}
            </div>

            {/* Meal distribution — real data */}
            <div className="border-t border-[var(--color-border)] pt-6">
              <div className="flex justify-between items-center mb-3 text-xs">
                <span className="text-[var(--color-text-muted)] uppercase tracking-widest font-semibold">PHÂN BỔ BỮA ĂN</span>
                <span className="text-[var(--color-primary)] font-semibold">
                  {mealCalories.length > 0 && `${consumedMealCount} / ${mealCalories.length} Cữ Điểm`}
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
                <p className="text-xs text-[var(--color-text-muted)] text-center py-2">
                  {workoutActionLabel && adherence.actual !== null ? 'Chưa có dữ liệu phân bổ theo bữa' : 'Chưa có bữa ăn nào'}
                </p>
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
              <Suspense fallback={
                <div className="h-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin opacity-50"></div>
                </div>
              }>
                <OverviewWeightChart
                  weightLogs={weightLogs}
                  targetWeight={targetWeight}
                  currentWeight={currentWeight}
                />
              </Suspense>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
