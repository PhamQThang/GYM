import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  toLocalDateKey,
  calculateWorkoutStreak,
  calculateNutritionHistory,
  calculateWeeklyVolume,
  calculatePersonalRecords,
  e1RM
} from './analytics';
import type { WorkoutSession, WorkoutSet, MealItem, WorkoutExercise, Exercise } from './types';

describe('analytics.ts', () => {

  describe('toLocalDateKey', () => {
    it('returns the same local date key for 00:30 and 23:30 in Vietnam', () => {
      // In Vietnam time (Asia/Ho_Chi_Minh has UTC offset +07:00), 
      // 00:30 on Sept 10 is Sept 9 17:30 UTC.
      // 23:30 on Sept 10 is Sept 10 16:30 UTC.
      // A common mistake with toISOString() is that 2026-09-09T17:30Z becomes Sept 9 instead of Sept 10.
      
      // We will parse ISO timestamps with fixed UTC offsets.
      // 2026-09-10T00:30:00+07:00 explicitly means 00:30 local time in Vietnam.
      const dateEarly = '2026-09-10T00:30:00+07:00';
      const dateLate = '2026-09-10T23:30:00+07:00';

      const keyEarly = toLocalDateKey(dateEarly);
      const keyLate = toLocalDateKey(dateLate);

      expect(keyEarly).toBe('2026-09-10');
      expect(keyLate).toBe('2026-09-10');
      expect(keyEarly).toBe(keyLate);
    });
  });

  describe('calculateWorkoutStreak', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const createSession = (dateKey: string, time: string = '12:00:00', status: 'COMPLETED' | 'IN_PROGRESS' = 'COMPLETED'): WorkoutSession => ({
      id: `s-${dateKey}-${time}`,
      user_id: 'u-1',
      workout_day_id: 'w-1',
      start_time: `${dateKey}T${time}`,
      status,
      total_volume: 0
    });

    it('calculates a 1-day streak if user trained today', () => {
      vi.setSystemTime(new Date('2026-09-10T12:00:00Z'));
      // Using UTC here for system time is fine, since toLocalDateKey will parse 2026-09-10.
      const history = [createSession('2026-09-10')];
      
      expect(calculateWorkoutStreak(history)).toBe(1);
    });

    it('calculates a 1-day streak if user trained yesterday but not today', () => {
      // Simulate today is 2026-09-11 12:00
      vi.setSystemTime(new Date('2026-09-11T12:00:00Z'));
      
      const history = [createSession('2026-09-10')];
      
      expect(calculateWorkoutStreak(history)).toBe(1);
    });

    it('calculates consecutive days correctly across dates', () => {
      vi.setSystemTime(new Date('2026-09-10T12:00:00Z'));
      
      const history = [
        createSession('2026-09-08'),
        createSession('2026-09-09'),
        createSession('2026-09-10')
      ];
      
      expect(calculateWorkoutStreak(history)).toBe(3);
    });

    it('breaks streak on missing training day', () => {
      // Missing 2026-09-09
      vi.setSystemTime(new Date('2026-09-10T12:00:00Z'));
      
      const history = [
        createSession('2026-09-08'),
        createSession('2026-09-10') // yesterday (9th) missing
      ];
      
      expect(calculateWorkoutStreak(history)).toBe(1); // Should only count today
    });

    it('treats multiple workouts on the same calendar day as 1 training day', () => {
      vi.setSystemTime(new Date('2026-09-10T12:00:00Z'));
      
      const history = [
        createSession('2026-09-10', '09:00:00'),
        createSession('2026-09-10', '18:00:00')
      ];
      
      expect(calculateWorkoutStreak(history)).toBe(1); // Still 1 day, not 2
    });

    it('ignores non-COMPLETED sessions', () => {
      vi.setSystemTime(new Date('2026-09-10T12:00:00Z'));
      
      const history = [
        createSession('2026-09-10', '09:00:00', 'IN_PROGRESS')
      ];
      
      expect(calculateWorkoutStreak(history)).toBe(0);
    });
  });

  describe('calculateNutritionHistory', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const createMeal = (dateKey: string, time: string = '12:00:00', macros = { p: 10, c: 20, f: 5, cal: 150 }, useLoggedAt = true) => ({
      id: `m-${Date.now()}-${Math.random()}`,
      meal_id: 'ml-1',
      name: 'Test Food',
      protein: macros.p,
      carbs: macros.c,
      fat: macros.f,
      calories: macros.cal,
      logged_at: useLoggedAt ? `${dateKey}T${time}` : undefined,
    } as MealItem);

    it('places an item on local date into the correct bucket', () => {
      vi.setSystemTime(new Date('2026-09-10T15:00:00Z')); // Today is Sept 10
      
      const meals = [createMeal('2026-09-09', '12:00:00')]; // Yesterday

      const history = calculateNutritionHistory(meals);
      expect(history).toHaveLength(7);
      
      // Yesterday bucket should be `history[5]` because today is `history[6]`
      const yesterdayBucket = history.find(h => h.dateKey === '2026-09-09');
      expect(yesterdayBucket).toBeDefined();
      expect(yesterdayBucket!.pro).toBe(10);
      expect(yesterdayBucket!.carb).toBe(20);
      expect(yesterdayBucket!.fat).toBe(5);
      expect(yesterdayBucket!.calories).toBe(150);
      
      // Today should be active
      const todayBucket = history.find(h => h.dateKey === '2026-09-10');
      expect(todayBucket!.active).toBe(true);
      expect(todayBucket!.pro).toBe(0); // Empty
    });

    it('aggregates multiple valid items on the same date correctly', () => {
      vi.setSystemTime(new Date('2026-09-10T15:00:00Z'));
      
      const meals = [
        createMeal('2026-09-10', '09:00:00', { p: 10, c: 10, f: 10, cal: 100 }),
        createMeal('2026-09-10', '19:00:00', { p: 20, c: 20, f: 20, cal: 200 })
      ];

      const history = calculateNutritionHistory(meals);
      const todayBucket = history.find(h => h.dateKey === '2026-09-10');
      
      expect(todayBucket!.pro).toBe(30);
      expect(todayBucket!.carb).toBe(30);
      expect(todayBucket!.fat).toBe(30);
      expect(todayBucket!.calories).toBe(300);
    });

    it('excludes an item outside the 7-day history window', () => {
      vi.setSystemTime(new Date('2026-09-10T15:00:00Z'));
      
      // 10 days ago
      const meals = [createMeal('2026-08-31', '12:00:00')];
      
      const history = calculateNutritionHistory(meals);
      const match = history.find(h => h.dateKey === '2026-08-31');
      expect(match).toBeUndefined(); // Should not exist in 7-day window
      
      // Ensure all 7 buckets are empty
      history.forEach(h => expect(h.calories).toBe(0));
    });

    it('excludes items missing logged_at', () => {
      vi.setSystemTime(new Date('2026-09-10T15:00:00Z'));
      
      const meals = [
        createMeal('2026-09-10', '12:00:00', { p: 10, c: 10, f: 10, cal: 100 }, false) // Missing logged_at
      ];
      
      const history = calculateNutritionHistory(meals);
      const todayBucket = history.find(h => h.dateKey === '2026-09-10');
      
      // Should remain 0
      expect(todayBucket!.calories).toBe(0);
    });
  });

  describe('calculateWeeklyVolume', () => {
    // 2026-01-01 is a Thursday. Week 1 is Dec 29 to Jan 4.
    // 2025-12-28 is a Sunday (Week 52 of 2025).
    const s1 = { id: 's1', user_id: 'u', workout_day_id: '1', start_time: '2025-12-28T12:00:00Z', status: 'COMPLETED', total_volume: 0 } as WorkoutSession;
    const s2 = { id: 's2', user_id: 'u', workout_day_id: '1', start_time: '2026-01-01T12:00:00Z', status: 'COMPLETED', total_volume: 0 } as WorkoutSession;
    const s3 = { id: 's3', user_id: 'u', workout_day_id: '1', start_time: '2026-01-05T12:00:00Z', status: 'COMPLETED', total_volume: 0 } as WorkoutSession; // Monday, Week 2
    const s4 = { id: 's4', user_id: 'u', workout_day_id: '1', start_time: '2026-01-08T12:00:00Z', status: 'COMPLETED', total_volume: 0 } as WorkoutSession; // Thursday, Week 2

    const mkSet = (session_id: string, weight: number, reps: number): WorkoutSet => ({
      id: `set-${Math.random()}`,
      session_id,
      workout_exercise_id: 'we-1',
      set_number: 1,
      weight,
      reps,
      status: 'COMPLETED'
    });

    it('groups entries according to ISO week boundaries', () => {
      const history = [s1, s2, s3, s4];
      const sets = [
        mkSet('s1', 10, 10), // 100 on 2025-12-28 (W52)
        mkSet('s2', 20, 10), // 200 on 2026-01-01 (W01)
        mkSet('s3', 30, 10), // 300 on 2026-01-05 (W02)
        mkSet('s4', 40, 10), // 400 on 2026-01-08 (W02)
      ];

      const volumes = calculateWeeklyVolume(history, sets);

      // We should have 3 weeks
      expect(volumes).toHaveLength(3);

      expect(volumes[0]!.weekKey).toMatch(/2025-W[0-9]+/); // W52 usually
      expect(volumes[0]!.volume).toBe(100);
      expect(volumes[0]!.change).toBeNull(); // First week has no previous
      
      expect(volumes[1]!.weekKey).toBe('2026-W01');
      expect(volumes[1]!.volume).toBe(200);
      
      expect(volumes[2]!.weekKey).toBe('2026-W02');
      expect(volumes[2]!.volume).toBe(700); // 300 + 400
    });

    it('handles empty / no volume according to implementation', () => {
      const history = [s1];
      const sets = [
        { ...mkSet('s1', 10, 10), status: 'PLANNED' } as WorkoutSet // Uncompleted set
      ];

      const volumes = calculateWeeklyVolume(history, sets);
      expect(volumes.length).toBe(0); // Expecting empty due to no completed valid sets
    });

    it('calculates change correctly between weeks', () => {
      // Create contiguous weeks to ensure difference calculation works
      const sPrevStr = '2026-10-01T12:00:00Z'; // Week 40
      const sCurrStr = '2026-10-08T12:00:00Z'; // Week 41

      const sPrev = { id: 'sPrev', user_id: 'u', workout_day_id: '1', start_time: sPrevStr, status: 'COMPLETED', total_volume: 0 } as WorkoutSession;
      const sCurr = { id: 'sCurr', user_id: 'u', workout_day_id: '1', start_time: sCurrStr, status: 'COMPLETED', total_volume: 0 } as WorkoutSession;

      const history = [sPrev, sCurr];
      const sets = [
        mkSet('sPrev', 10, 10), // 100
        mkSet('sCurr', 12, 10), // 120 (a +20% change)
      ];

      const volumes = calculateWeeklyVolume(history, sets);
      expect(volumes).toHaveLength(2);
      expect(volumes[1]!.change).toBe('+20.0%');
    });

    it('calculates negative change correctly between weeks', () => {
       const sPrevStr = '2026-10-01T12:00:00Z'; // Week 40
       const sCurrStr = '2026-10-08T12:00:00Z'; // Week 41
 
       const sPrev = { id: 'sPrev', user_id: 'u', workout_day_id: '1', start_time: sPrevStr, status: 'COMPLETED', total_volume: 0 } as WorkoutSession;
       const sCurr = { id: 'sCurr', user_id: 'u', workout_day_id: '1', start_time: sCurrStr, status: 'COMPLETED', total_volume: 0 } as WorkoutSession;
 
       const history = [sPrev, sCurr];
       const sets = [
         mkSet('sPrev', 20, 10), // 200
         mkSet('sCurr', 10, 10), // 100 (-50%)
       ];
 
       const volumes = calculateWeeklyVolume(history, sets);
       expect(volumes).toHaveLength(2);
       expect(volumes[1]!.change).toBe('-50.0%');
    });

    it('handles zero previous week division gracefully', () => {
       const sPrevStr = '2026-10-01T12:00:00Z'; 
       const sCurrStr = '2026-10-08T12:00:00Z'; 
 
       const sPrev = { id: 'sPrev', user_id: 'u', workout_day_id: '1', start_time: sPrevStr, status: 'COMPLETED', total_volume: 0 } as WorkoutSession;
       const sCurr = { id: 'sCurr', user_id: 'u', workout_day_id: '1', start_time: sCurrStr, status: 'COMPLETED', total_volume: 0 } as WorkoutSession;
 
       const history = [sPrev, sCurr];
       const sets = [
         mkSet('sPrev', 0, 0), // 0 volume
         mkSet('sCurr', 10, 10), // 100
       ];
 
       const volumes = calculateWeeklyVolume(history, sets);
       expect(volumes).toHaveLength(2);
       expect(volumes[1]!.change).toBe('+100.0%'); // If previous is 0 and current > 0 -> 100% change
    });
  });

  describe('calculatePersonalRecords and e1RM', () => {
    const mkSet = (session_id: string, weight: number, reps: number): WorkoutSet => ({
      id: `set-${Math.random()}`,
      session_id,
      workout_exercise_id: 'we-bench',
      set_number: 1,
      weight,
      reps,
      status: 'COMPLETED'
    });

    const benchEx = { id: 'ex-bench', name: 'Bench Press', primary_muscle: 'Chest' } as Exercise;
    const weBench = { id: 'we-bench', exercise_id: 'ex-bench' } as WorkoutExercise;

    it('returns exact e1RM calculation (Epley)', () => {
      // 100kg x 3 reps -> 100 * (1 + 3/30) = 100 * 1.1 = 110
      expect(e1RM(100, 3)).toBeCloseTo(110);
      
      // 1 rep returns the raw weight
      expect(e1RM(120, 1)).toBe(120);
      
      // 0 or negative returns 0
      expect(e1RM(0, 10)).toBe(0);
      expect(e1RM(100, 0)).toBe(0);
    });

    it('identifies best set as the one with highest e1RM', () => {
      // session 1 (earlier): 100kg x 3 reps -> e1RM 110
      const s1 = { id: 's1', start_time: '2026-09-01T12:00:00Z', status: 'COMPLETED' } as WorkoutSession;
      const set1 = mkSet('s1', 100, 3);
      
      // session 2: (later): 70kg x 12 reps -> e1RM 70 * 1.4 = 98 (Lower e1RM, higher reps)
      const s2 = { id: 's2', start_time: '2026-09-10T12:00:00Z', status: 'COMPLETED' } as WorkoutSession;
      const set2 = mkSet('s2', 70, 12);
      
      // session 3: 130kg x 1 rep -> e1RM 130
      const s3 = { id: 's3', start_time: '2026-09-12T12:00:00Z', status: 'COMPLETED' } as WorkoutSession;
      const set3 = mkSet('s3', 130, 1);

      const prs = calculatePersonalRecords(
        [set1, set2, set3],
        [s1, s2, s3],
        [weBench],
        [benchEx]
      );

      expect(prs).toHaveLength(1);
      expect(prs[0]!.exerciseId).toBe('ex-bench');
      expect(prs[0]!.bestSet.id).toBe(set3.id); // set3 is the highest e1RM
      expect(prs[0]!.achievedAt).toBe('2026-09-12T12:00:00Z');
    });

    it('handles non-completed sets properly', () => {
      const s1 = { id: 's1', start_time: '2026-09-01T12:00:00Z', status: 'COMPLETED' } as WorkoutSession;
      const set1 = { ...mkSet('s1', 200, 10), status: 'PLANNED' } as WorkoutSet; // e1RM would be huge, but unplanned

      const prs = calculatePersonalRecords(
        [set1],
        [s1],
        [weBench],
        [benchEx]
      );

      expect(prs).toHaveLength(0); // Shouldn't include PLANNED sets
    });

    it('gracefully handles missing exercise/we mappings', () => {
       const s1 = { id: 's1', start_time: '2026-09-01T12:00:00Z', status: 'COMPLETED' } as WorkoutSession;
       const set1 = mkSet('s1', 100, 5); // we-bench

       // Don't provide 'we-bench' in workoutExercises
       const prs = calculatePersonalRecords(
         [set1],
         [s1],
         [],
         [benchEx]
       );
 
       expect(prs).toHaveLength(0); 
    });
  });

});
