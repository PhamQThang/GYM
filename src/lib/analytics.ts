/**
 * analytics.ts
 * Pure utility functions for deriving workout analytics from Zustand state.
 * No UI, no side-effects — all functions are deterministic given the same inputs.
 */

import { WorkoutSession, WorkoutSet, WorkoutExercise, Exercise, WeightLog, MealItem, User } from './types';

// ─────────────────────────────────────────────────
// LOCAL DATE HELPERS
// ─────────────────────────────────────────────────

/**
 * Returns a calendar date key using LOCAL time, formatted as YYYY-MM-DD.
 * Do NOT use toISOString() for calendar-day grouping because it converts to UTC.
 * In Vietnam (UTC+7), toISOString() can return the previous calendar day for
 * anything logged before 07:00 local time.
 */
export function toLocalDateKey(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────

export interface WeeklyVolume {
  weekLabel: string;  // e.g. "T1 (01 Th10 – 07 Th10)"
  weekKey: string;    // ISO week key "2026-W41"
  volume: number;     // total kg lifted (weight × reps)
  sessions: number;   // number of sessions that week
  pctOfMax: number;   // 0–100, relative to max week
  change: string | null; // "+8.2%" vs previous week, null for first
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  bestSet: WorkoutSet;
  achievedAt: string;  // ISO date string of the session
  sessionId: string;
}

// ─────────────────────────────────────────────────
// STREAK CALCULATION
// ─────────────────────────────────────────────────

/**
 * Calculates the current consecutive training day streak.
 * Rules:
 * - Only COMPLETED sessions are counted.
 * - Multiple sessions on the same calendar day count as one training day.
 * - The streak starts from today and counts backwards.
 * - A gap of one or more days with no training breaks the streak.
 * - If there was no training today, the streak still includes yesterday if it was active.
 */
export function calculateWorkoutStreak(history: WorkoutSession[]): number {
  const completed = history.filter(s => s.status === 'COMPLETED' && s.start_time);
  if (completed.length === 0) return 0;

  // Get unique training dates as YYYY-MM-DD strings in LOCAL time
  const trainingDates = new Set(
    completed.map(s => toLocalDateKey(s.start_time))
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let cursor = new Date(today);

  // Allow yesterday as starting point if no session today
  const todayKey = toLocalDateKey(cursor);
  if (!trainingDates.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const key = toLocalDateKey(cursor);
    if (!trainingDates.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

// ─────────────────────────────────────────────────
// WEEKLY VOLUME CALCULATION
// ─────────────────────────────────────────────────

/** Returns "2026-W41" style ISO week key for a given date */
function isoWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/** Returns monday–sunday date range label in Vietnamese short format */
function weekRangeLabel(weekKey: string, sessions: WorkoutSession[]): string {
  const sessionsInWeek = sessions.filter(s => {
    const d = new Date(s.start_time);
    return isoWeekKey(d) === weekKey;
  });
  const sampleSession = sessionsInWeek[0];
  if (!sampleSession) return weekKey;

  const sampleDate = new Date(sampleSession.start_time);
  const day = sampleDate.getDay();
  const diffToMonday = sampleDate.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(sampleDate);
  monday.setDate(diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }).replace('/', ' Th');
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

/**
 * Groups completed workout volumes by ISO calendar week.
 * Volume = sum of (weight × reps) across all COMPLETED sets for sessions in that week.
 * Returns the last N weeks (default 8), sorted oldest → newest for charting.
 */
export function calculateWeeklyVolume(
  history: WorkoutSession[],
  setHistory: WorkoutSet[],
  maxWeeks = 8
): WeeklyVolume[] {
  const completed = history.filter(s => s.status === 'COMPLETED' && s.start_time);
  if (completed.length === 0) return [];

  // Build a map: sessionId → session
  const sessionMap = new Map(completed.map(s => [s.id, s]));

  // Group volume by week key
  const weekMap = new Map<string, { volume: number; sessions: Set<string> }>();

  for (const set of setHistory) {
    if (set.status !== 'COMPLETED') continue;
    const session = sessionMap.get(set.session_id);
    if (!session) continue;

    const weekKey = isoWeekKey(new Date(session.start_time));
    const existing = weekMap.get(weekKey) ?? { volume: 0, sessions: new Set() };
    existing.volume += set.weight * set.reps;
    existing.sessions.add(session.id);
    weekMap.set(weekKey, existing);
  }

  if (weekMap.size === 0) return [];

  // Sort weeks
  const sortedKeys = Array.from(weekMap.keys()).sort();
  const recentKeys = sortedKeys.slice(-maxWeeks);

  const volumes = recentKeys.map(k => weekMap.get(k)!.volume);
  const maxVol = Math.max(...volumes, 1);

  return recentKeys.map((weekKey) => {
    const data = weekMap.get(weekKey)!;
    // Find adjacent previous calendar week
    const anySessionId = Array.from(data.sessions)[0];
    const session = sessionMap.get(anySessionId as string);
    let prevVol: number | null = null;
    if (session) {
      const d = new Date(session.start_time);
      d.setDate(d.getDate() - 7);
      const prevWeekKeyNum = isoWeekKey(d);
      const prevData = weekMap.get(prevWeekKeyNum);
      if (prevData !== undefined) {
        prevVol = prevData.volume;
      }
    }

    let changeNum: number | null = null;
    if (prevVol !== null) {
      if (prevVol > 0) {
        changeNum = ((data.volume - prevVol) / prevVol) * 100;
      } else if (prevVol === 0 && data.volume > 0) {
        changeNum = 100;
      } else if (prevVol === 0 && data.volume === 0) {
        changeNum = 0;
      }
    }

    return {
      weekLabel: weekRangeLabel(weekKey, completed),
      weekKey,
      volume: Math.round(data.volume),
      sessions: data.sessions.size,
      pctOfMax: Math.round((data.volume / maxVol) * 100),
      change: changeNum !== null ? `${changeNum >= 0 ? '+' : ''}${changeNum.toFixed(1)}%` : null,
    };
  });
}

// ─────────────────────────────────────────────────
// PERSONAL RECORDS CALCULATION
// ─────────────────────────────────────────────────

/**
 * Estimated 1-Rep Max using the Epley formula.
 */
export function e1RM(weight: number, reps: number): number {
  if (!Number.isFinite(weight) || !Number.isFinite(reps)) return 0;
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/**
 * Derives which active sets in a session are Personal Records.
 * Max 1 PR per exercise. Evaluates based on highest e1RM against historical best.
 */
export function derivePRsInSession(
  activeSets: WorkoutSet[],
  setHistory: WorkoutSet[],
  workoutExercises: WorkoutExercise[]
): Set<string> {
  const prIds = new Set<string>();
  const weMap = new Map(workoutExercises.map(we => [we.id, we]));

  // Group active sets by exerciseId
  const sessionExerciseSets = new Map<string, WorkoutSet[]>();
  for (const s of activeSets) {
    if (s.status !== 'COMPLETED') continue;
    if (!Number.isFinite(s.weight) || s.weight <= 0) continue;
    if (!Number.isFinite(s.reps) || s.reps <= 0) continue;
    const we = weMap.get(s.workout_exercise_id);
    if (!we) continue;
    const exId = we.exercise_id;
    const arr = sessionExerciseSets.get(exId) || [];
    arr.push(s);
    sessionExerciseSets.set(exId, arr);
  }

  const currentSessionId = activeSets[0]?.session_id;

  // Find historical best e1RM for each exercise
  const historicalBest = new Map<string, number>();
  for (const s of setHistory) {
    if (s.status !== 'COMPLETED') continue;
    if (currentSessionId && s.session_id === currentSessionId) continue;
    const we = weMap.get(s.workout_exercise_id);
    if (!we) continue;
    const exId = we.exercise_id;
    const e1 = e1RM(s.weight, s.reps);
    if (e1 > (historicalBest.get(exId) || 0)) {
       historicalBest.set(exId, e1);
    }
  }

  // Determine session PRs
  for (const [exId, sets] of sessionExerciseSets.entries()) {
    let sessionBestSet: WorkoutSet | null = null;
    let maxSessionE1rm = 0;

    for (let i = 0; i < sets.length; i++) {
       const set = sets[i];
       if (!set) continue;
       const e1 = e1RM(set.weight, set.reps);
       if (e1 >= maxSessionE1rm) {
         maxSessionE1rm = e1;
         sessionBestSet = set; // Takes the latest tie-breaker
       }
    }

    if (sessionBestSet && maxSessionE1rm > 0) {
       const hBest = historicalBest.get(exId) || 0;
       if (maxSessionE1rm > hBest) {
          prIds.add(sessionBestSet.id);
       }
    }
  }

  return prIds;
}

/**
 * Derives the best-ever completed set per exercise from setHistory using e1RM.
 * Returns sorted by achieved date (most recent first).
 */
export function calculatePersonalRecords(
  setHistory: WorkoutSet[],
  workoutSessions: WorkoutSession[],
  workoutExercises: WorkoutExercise[],
  exercises: Exercise[]
): PersonalRecord[] {
  const prMap = new Map<string, { bestSet: WorkoutSet; sessionId: string; e1rm: number }>();

  const sessionMap = new Map(workoutSessions.map(s => [s.id, s]));
  const weMap = new Map(workoutExercises.map(we => [we.id, we]));

  for (const set of setHistory) {
    if (set.status !== 'COMPLETED') continue;
    const we = weMap.get(set.workout_exercise_id);
    if (!we) continue;
    const exId = we.exercise_id;
    const currentE1RM = e1RM(set.weight, set.reps);
    if (currentE1RM <= 0) continue;

    const existing = prMap.get(exId);
    if (!existing || currentE1RM > existing.e1rm ||
       (currentE1RM === existing.e1rm && set.session_id !== existing.sessionId)) {
      prMap.set(exId, { bestSet: set, sessionId: set.session_id, e1rm: currentE1RM });
    }
  }

  const results: PersonalRecord[] = [];
  for (const [exerciseId, { bestSet, sessionId }] of prMap.entries()) {
    const exercise = exercises.find(e => e.id === exerciseId);
    const session = sessionMap.get(sessionId);
    if (!exercise || !session) continue;

    results.push({
      exerciseId,
      exerciseName: exercise.name,
      muscleGroup: exercise.primary_muscle,
      bestSet,
      achievedAt: session.start_time,
      sessionId,
    });
  }

  return results.sort((a, b) => b.achievedAt.localeCompare(a.achievedAt));
}

// ─────────────────────────────────────────────────
// DATE FORMATTING UTILITIES
// ─────────────────────────────────────────────────

/** Formats an ISO date string into Vietnamese short date: "28 Th10 2026" */
export function formatVietnamDate(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** Formats an ISO date string into short Vietnamese: "28 Th10" */
export function formatVietnamShortDate(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.getMonth() + 1;
  return `${day} Th${month}`;
}

/** Formats today's date in Vietnamese weekday + date format */
export function formatTodayVietnamese(): string {
  const now = new Date();
  const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const weekday = weekdays[now.getDay()];
  const day = now.getDate().toString().padStart(2, '0');
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return `${weekday}, ${day} Th${month} ${year}`;
}

/**
 * Returns the time-of-day greeting in Vietnamese.
 */
export function getVietnameseGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Chào buổi sáng';
  if (h >= 12 && h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}


/**
 * Returns the weight delta over the last 7 days from WeightLog data.
 * Determines the latest log by date, then finds a comparison log ~7 days prior.
 * Returns null if insufficient data.
 */
export function calculateWeeklyWeightDelta(logs: WeightLog[]): number | null {
  if (logs.length < 2) return null;

  // 1. Parse dates using real data model formats
  const parsedLogs = logs.map(log => {
      let d: Date;
      const dateStr = log.date;
      if (!dateStr) return { log, time: NaN, dateKey: '' };
      const viMatch = dateStr.match(/^(\d{1,2})\s+Th(\d{1,2})$/i);
      if (viMatch && viMatch[1] && viMatch[2]) {
        d = new Date(new Date().getFullYear(), parseInt(viMatch[2], 10) - 1, parseInt(viMatch[1], 10));
      } else {
        d = new Date(`${log.date} ${new Date().getFullYear()}`);
      }
      return { log, time: d.getTime(), dateKey: isNaN(d.getTime()) ? '' : toLocalDateKey(d) };
  }).filter(item => item.dateKey !== '');

  if (parsedLogs.length < 2) return null;

  // 2. Determine latest by actual time
  parsedLogs.sort((a, b) => a.time - b.time);
  const latestItem = parsedLogs[parsedLogs.length - 1];
  if (!latestItem) return null;

  // 3. Target local calendar date ~7 days before the latest log
  const latestDateObj = new Date(latestItem.time);
  latestDateObj.setDate(latestDateObj.getDate() - 7);
  const targetTime = latestDateObj.getTime();

  // 4. Find the most appropriate comparison log
  let bestItem = null;
  let minDiff = Infinity;

  for (let i = 0; i < parsedLogs.length - 1; i++) {
     const item = parsedLogs[i];
     if (!item) continue;
     const diffDays = Math.abs(item.time - targetTime) / (1000 * 60 * 60 * 24);
     if (diffDays < minDiff) {
       minDiff = diffDays;
       bestItem = item;
     }
  }

  // If closest is further than 4 days, it's not meaningful as a "weekly" delta
  if (!bestItem || minDiff > 4) return null;

  return Math.round((latestItem.log.weight - bestItem.log.weight) * 10) / 10;
}

/**
 * Calculates a 7-day arithmetic moving average for weight logs.
 * Includes available observations from D-6 to D using local calendar boundaries.
 * Does not mutate source arrays.
 */
export function calculateWeightMovingAverage(logs: WeightLog[]): (WeightLog & { ma7: number | null })[] {
  // Sort logs by date to ensure proper processing
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  return sorted.map((log) => {
    // Parse YYYY-MM-DD directly as local date
    const dMatch = log.date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    let currentMs = 0;
    if (dMatch) {
      currentMs = new Date(parseInt(dMatch[1] || '0', 10), parseInt(dMatch[2] || '0', 10) - 1, parseInt(dMatch[3] || '0', 10)).getTime();
    } else {
      const d = new Date(log.date);
      d.setHours(0, 0, 0, 0);
      currentMs = d.getTime();
    }

    const windowLogs = sorted.filter((wLog) => {
      const match = wLog.date.match(/^(\d{4})-(\d{2})-(\d{2})/);
      let wMs = 0;
      if (match) {
        wMs = new Date(parseInt(match[1] || '0', 10), parseInt(match[2] || '0', 10) - 1, parseInt(match[3] || '0', 10)).getTime();
      } else {
        const wd = new Date(wLog.date);
        wd.setHours(0, 0, 0, 0);
        wMs = wd.getTime();
      }
      const diffDays = Math.round((currentMs - wMs) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 6;
    });

    if (windowLogs.length === 0) {
      return { ...log, ma7: null };
    }

    const sum = windowLogs.reduce((acc, curr) => acc + curr.weight, 0);
    const ma7 = sum / windowLogs.length;

    return { ...log, ma7: Math.round(ma7 * 10) / 10 };
  });
}

/** Duration in minutes between two ISO strings */
export function durationMinutes(startIso: string, endIso?: string): number {
  if (!endIso) return 0;
  return Math.floor((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
}

// ─────────────────────────────────────────────────
// NUTRITION AND MACRO AGGREGATION
// ─────────────────────────────────────────────────


export interface DailyNutrition {
  day: string; // "Hôm Nay" or "28 Th10"
  dateKey: string; // "2026-10-28"
  pro: number;
  carb: number;
  fat: number;
  calories: number;
  active: boolean; // True for today
}

/**
 * Aggregates MealItems into a 7-day trailing historical array (including today).
 * Legacy items without a `logged_at` field are discarded to prevent artificially inflating
 * today's data and preserving strict day-to-day data accuracy.
 */
export function calculateNutritionHistory(mealItems: MealItem[]): DailyNutrition[] {
  const history: DailyNutrition[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Initialize the past 7 days (index 6 is today, 0 is 6 days ago)
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = toLocalDateKey(d);
    history.push({
      day: i === 0 ? 'Hôm Nay' : d.getDate().toString().padStart(2, '0'), // Simple day label for chart
      dateKey,
      pro: 0,
      carb: 0,
      fat: 0,
      calories: 0,
      active: i === 0 // Mark today as active
    });
  }


  // Aggregate items
  for (const item of mealItems) {
    // Legacy fallback: exclude items from before tracking
    if (!item.logged_at) continue;

    const itemDate = new Date(item.logged_at);
    const itemDateKey = toLocalDateKey(itemDate);

    // Find the matching day bin
    const targetBin = history.find(h => h.dateKey === itemDateKey);

    if (targetBin) {
      targetBin.pro += item.protein;
      targetBin.carb += item.carbs;
      targetBin.fat += item.fat;
      targetBin.calories += item.calories;
    }
  }

  // Ensure exact rounding for chart display
  return history.map(h => ({
    ...h,
    pro: Math.round(h.pro),
    carb: Math.round(h.carb),
    fat: Math.round(h.fat),
    calories: Math.round(h.calories)
  }));
}

/**
 * Calculates adherence of today's calories vs user's target.
 */
export interface CalorieAdherence {
  actual: number;
  target: number;
  percentage: number;
  remaining: number;
}

export function calculateCalorieAdherence(mealItems: MealItem[], user: User): CalorieAdherence {
  const history = calculateNutritionHistory(mealItems);
  const today = history[history.length - 1] ?? { calories: 0, pro: 0, carb: 0, fat: 0, day: '', dateKey: '', active: false };
  const target = Number(user.target_calories);
  if (isNaN(target) || !isFinite(target) || target <= 0) {
    return {
      actual: today.calories,
      target: 0,
      percentage: 0,
      remaining: 0
    };
  }

  const pct = Math.round((today.calories / target) * 100);

  return {
    actual: today.calories,
    target: target,
    percentage: Math.min(100, pct),
    remaining: Math.max(0, target - today.calories)
  };
}

