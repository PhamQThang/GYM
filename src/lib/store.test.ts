import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { toLocalDateKey } from './analytics';
import { useAppStore } from './store';
import { SEED_EXERCISES, SEED_FOODS } from './seed';

vi.hoisted(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  });
  vi.stubGlobal('window', { localStorage: globalThis.localStorage });
});


// Mock crypto.randomUUID for Vitest/jsdom environment if it doesn't exist
if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substring(2),
    },
    writable: true,
  });
}

describe('useAppStore mutations', () => {
  vi.stubGlobal('crypto', {
    randomUUID: () => 'uuid-' + Math.random().toString(36).substring(2),
  });

  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState(), true);
    // Reset store before each test
    useAppStore.setState({
      activeSession: null,
      activeSets: [],
      workoutExercises: [
        {
          id: 'we-1',
          workout_day_id: 'wd-1',
          exercise_id: 'ex-1',
          order_index: 0,
          planned_sets: 3,
          rep_range_min: 8,
          rep_range_max: 12,
          rest_seconds: 60,
          notes: '',
          is_active: true,
          is_system: false,
          is_modified: false
        }
      ],
      exercises: [],
    });
  });

  describe('ID generation & Session creation', () => {
    it('sets up a new session with empty loaded_planned_exercises', () => {
      useAppStore.getState().startWorkout('wd-1');
      const session = useAppStore.getState().activeSession;
      expect(session).not.toBeNull();
      expect(session?.loaded_planned_exercises).toEqual([]);
      expect(typeof session?.id).toBe('string');
      expect(session?.id.length).toBeGreaterThan(10);
    });
  });

  describe('loadPlannedSets duplicate protection', () => {
    it('loads planned sets once and prevents respawning upon consecutive calls', () => {
      useAppStore.getState().startWorkout('wd-1');
      const we = useAppStore.getState().workoutExercises[0];
      if (!we) return;
      
      // Load first time
      useAppStore.getState().loadPlannedSets(we);
      const session = useAppStore.getState().activeSession;
      let activeSets = useAppStore.getState().activeSets;
      
      expect(activeSets.length).toBe(3);
      expect(session?.loaded_planned_exercises).toContain('we-1');
      
      // Delete all active sets manually (simulating user intention)
      useAppStore.setState({ activeSets: [] });
      
      // Try to load again
      useAppStore.getState().loadPlannedSets(we);
      activeSets = useAppStore.getState().activeSets;
      
      // MUST remain 0, because it was already loaded
      expect(activeSets.length).toBe(0);
    });
  });

  describe('set_number contiguous renumbering', () => {
    it('renumbers sets properly after delete and duplicate', () => {
      useAppStore.getState().startWorkout('wd-1');
      const weId = 'we-1';
      
      // Manually add 3 sets
      useAppStore.getState().addSet(weId);
      useAppStore.getState().addSet(weId);
      useAppStore.getState().addSet(weId);
      
      let sets = useAppStore.getState().activeSets;
      expect(sets.length).toBe(3);
      expect(sets.map(s => s.set_number)).toEqual([1, 2, 3]);
      
      // Delete set 2
      const set2Id = sets[1]?.id;
      if (!set2Id) return;
      useAppStore.getState().removeSet(set2Id);
      
      sets = useAppStore.getState().activeSets;
      expect(sets.length).toBe(2);
      // It should renumber "1, 3" to "1, 2"
      expect(sets.map(s => s.set_number)).toEqual([1, 2]);
      
      // Duplicate set 1
      const set1Id = sets[0]?.id;
      if (!set1Id) return;
      useAppStore.getState().duplicateSet(set1Id);
      
      sets = useAppStore.getState().activeSets;
      expect(sets.length).toBe(3);
      // New set is appended, so numbering is 1, 2, 3
      expect(sets.map(s => s.set_number)).toEqual([1, 2, 3]);
    });
  });

  describe('Nutrition R-01: historical dates', () => {
    it('historical water logs properly', () => {
      // Use local date key for today just to be sure we are not conflicting
      useAppStore.setState({ waterLogs: {} });
      
      const historicalDate = '2026-09-10';
      useAppStore.getState().addWater(500, historicalDate);
      expect(useAppStore.getState().waterLogs[historicalDate]).toBe(500);
      
      useAppStore.getState().addWater(250, historicalDate);
      expect(useAppStore.getState().waterLogs[historicalDate]).toBe(750);
      
      // Ensure it doesn't affect today or another date
      expect(useAppStore.getState().waterLogs['2026-09-11']).toBeUndefined();
    });

    it('historical meal and today behaviour logs properly', () => {
      useAppStore.setState({ mealItems: [] });
      const historicalDate = '2026-09-10';
      
      useAppStore.getState().logMealItem('meal-1', {
        id: 'food-1',
        name: 'Apple',
        calories_per_serving: 95,
        protein_per_serving: 0.5,
        carbs_per_serving: 25,
        fat_per_serving: 0.3,
        serving_size: '1 quả',
        is_quick_add: false,
        is_system: true,
        is_modified: false
      }, historicalDate);
      
      const items = useAppStore.getState().mealItems;
      expect(items.length).toBe(1);
      expect(items[0]?.meal_id).toBe('meal-1');
      expect(items[0]?.logged_at).toBe('2026-09-10T05:00:00.000Z');
      
      // Test today behavior
      // Note: testing today requires us to match the todayKey generated by toLocalDateKey(new Date())
      const todayKey = toLocalDateKey(new Date());
      
      useAppStore.getState().logMealItem('meal-2', {
        id: 'food-2',
        name: 'Banana',
        calories_per_serving: 105,
        protein_per_serving: 1.3,
        carbs_per_serving: 27,
        fat_per_serving: 0.4,
        serving_size: '1 quả',
        is_quick_add: false,
        is_system: true,
        is_modified: false
      }, todayKey);
      
      const items2 = useAppStore.getState().mealItems;
      expect(items2.length).toBe(2);
      expect(items2[1]?.meal_id).toBe('meal-2');
      // The timestamp should be the exact current ISO time, which won't end tightly in 00.000Z 
      // but should just NOT be 05:00:00.000Z for sure (unless the system test runs exactly at noon VN time, which we can ignore for this simple assertion)
      expect(items2[1]?.logged_at).not.toBe(`${todayKey}T05:00:00.000Z`);
      expect(items2[1]?.logged_at).toContain('Z'); // is iso string
    });
  });

  describe('Sound Settings', () => {
    it('allows toggling soundEnabled and persists it', () => {
      // By default it might be undefined in old mocks or true in new ones, but not false
      expect(useAppStore.getState().user.soundEnabled).not.toBe(false);
      
      useAppStore.getState().updateUser({ soundEnabled: false });
      expect(useAppStore.getState().user.soundEnabled).toBe(false);

      useAppStore.getState().updateUser({ soundEnabled: true });
      expect(useAppStore.getState().user.soundEnabled).toBe(true);
    });
  });
});

describe('persistence and migration regressions', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState(useAppStore.getInitialState(), true);
  });

  afterEach(() => vi.useRealTimers());

  it('starts a workout for the current user and resets an active workout completely', () => {
    useAppStore.getState().updateUser({ id: 'different-user' });
    useAppStore.getState().startWorkout('day-push');
    expect(useAppStore.getState().activeSession?.user_id).toBe('different-user');
    useAppStore.getState().addSet('we-push-1');
    useAppStore.getState().startRestTimer(120);
    useAppStore.getState().resetApp();
    expect(useAppStore.getState()).toMatchObject({
      activeSession: null, activeSets: [], restTimerActive: false,
      restTimerEndsAt: null, restTimerSeconds: 90,
    });
  });

  it('ignores imported action names and inherited data properties', () => {
    const reset = useAppStore.getState().resetApp;
    const candidate = JSON.parse('{"resetApp":null,"saveWorkout":"injected","waterLogs":{"2026-11-25":500}}');
    useAppStore.getState().importState(candidate);
    expect(useAppStore.getState().resetApp).toBe(reset);
    expect(typeof useAppStore.getState().saveWorkout).toBe('function');
    expect(useAppStore.getState().waterLogs).toEqual({ '2026-11-25': 500 });
    useAppStore.getState().importState(Object.create({ waterLogs: {} }));
    expect(useAppStore.getState().waterLogs).toEqual({ '2026-11-25': 500 });
  });

  it('persists food customizations, active draft and saved history through hydration', async () => {
    const food = { ...SEED_FOODS[0]!, name: 'My recipe', is_modified: true };
    useAppStore.setState({ foods: [food] });
    useAppStore.getState().startWorkout('day-push');
    useAppStore.getState().addSet('we-push-1');
    const set = useAppStore.getState().activeSets[0]!;
    useAppStore.getState().updateSet(set.id, 40, 10);
    useAppStore.getState().completeSet(set.id);
    useAppStore.getState().endWorkout();
    useAppStore.getState().saveWorkout();
    const history = structuredClone(useAppStore.getState().workoutHistory);
    useAppStore.getState().startWorkout('day-pull');
    useAppStore.getState().addSet('we-pull-1');
    const draft = structuredClone(useAppStore.getState().activeSession);
    const sets = structuredClone(useAppStore.getState().activeSets);
    const saved = localStorage.getItem('pulse-kinetic-storage')!;
    useAppStore.getState().resetApp();
    localStorage.setItem('pulse-kinetic-storage', saved);
    await useAppStore.persist.rehydrate();
    expect(useAppStore.getState().foods.find(item => item.id === food.id)).toEqual(food);
    expect(useAppStore.getState().workoutHistory).toEqual(history);
    expect(useAppStore.getState().setHistory[0]).toMatchObject({ weight: 40, reps: 10 });
    expect(useAppStore.getState().activeSession).toEqual(draft);
    expect(useAppStore.getState().activeSets).toEqual(sets);
  });

  it.each([0, 1, 2, 3])('upgrades v%s without losing custom metadata or historical data', async version => {
    const seed = SEED_EXERCISES[0]!;
    const custom = { ...seed, id: 'custom-exercise', name: 'Custom', is_system: false, is_modified: true };
    const legacy = { ...seed, name: 'Edited before metadata existed' } as Partial<typeof seed>;
    delete legacy.is_system;
    delete legacy.is_modified;
    const raw = {
      user: { id: 'u-1', current_weight: 65 },
      exercises: [custom, legacy, { ...SEED_EXERCISES[1]!, is_system: true, is_modified: false }],
      meals: [{ id: 'old-meal', user_id: 'u-1', name: 'Lunch', scheduled_time: '12:00', description: '', status: 'CONSUMED' }],
      workoutHistory: [{ id: 'historical-session' }], dailyWater: 250,
    };
    const original = structuredClone(raw);
    const migrated = await useAppStore.persist.getOptions().migrate!(raw, version);
    expect(migrated.exercises?.[0]).toEqual(custom);
    expect(migrated.exercises?.[1]).toMatchObject({ name: legacy.name, is_system: true, is_modified: true });
    expect(migrated.exercises?.[2]).toMatchObject({ is_system: true, is_modified: false });
    expect(migrated.foods).toEqual(SEED_FOODS);
    expect(migrated.workoutHistory).toEqual(raw.workoutHistory);
    if (version < 2) expect(migrated.meals?.[0]).toMatchObject({ template_id: 'mt-old-meal', date: toLocalDateKey(new Date()) });
    if (version < 3) expect(migrated.waterLogs?.[toLocalDateKey(new Date())]).toBe(250);
    expect(raw).toEqual(original);
  });

  it.each([0, 1, 2, 3])('hydrates a v%s snapshot, writes v4 and preserves custom collections', async version => {
    const partialize = useAppStore.persist.getOptions().partialize!;
    const data = partialize(useAppStore.getState());
    const customExercise = { ...SEED_EXERCISES[0]!, id: 'custom-one', name: 'Personal exercise', is_system: false, is_modified: true };
    const customFood = { ...SEED_FOODS[0]!, id: 'custom-food', name: 'Personal meal', is_system: false, is_modified: true };
    data.exercises = [customExercise];
    data.foods = [customFood];
    const reset = useAppStore.getState().resetApp;
    localStorage.setItem('pulse-kinetic-storage', JSON.stringify({
      version, state: { ...data, resetApp: 'malicious action override' },
    }));
    await useAppStore.persist.rehydrate();
    expect(useAppStore.getState().exercises).toContainEqual(customExercise);
    expect(useAppStore.getState().foods).toContainEqual(customFood);
    expect(useAppStore.getState().resetApp).toBe(reset);
    expect(JSON.parse(localStorage.getItem('pulse-kinetic-storage')!).version).toBe(4);
  });

  it('does not overwrite existing daily water when migrating the legacy aggregate', async () => {
    const today = toLocalDateKey(new Date());
    const migrated = await useAppStore.persist.getOptions().migrate!({
      dailyWater: 500, waterLogs: { [today]: 750, '2026-01-01': 100 },
    }, 2);
    expect(migrated.waterLogs).toEqual({ [today]: 750, '2026-01-01': 100 });
  });

  it('reconciles Vietnam day boundaries on reload and while ensuring new meals, preserving edits', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-25T16:59:00Z'));
    const meal = { ...useAppStore.getState().meals[0]!, date: '2026-11-25', status: 'PLANNED' as const };
    const customized = { ...SEED_EXERCISES[0]!, name: 'My bench', is_modified: true };
    useAppStore.setState({ meals: [meal], mealItems: [], exercises: [customized], waterLogs: {} });
    vi.setSystemTime(new Date('2026-11-25T17:01:00Z'));
    await useAppStore.persist.rehydrate();
    expect(useAppStore.getState().meals[0]?.status).toBe('MISSED');
    expect(useAppStore.getState().exercises.find(item => item.id === customized.id)?.name).toBe('My bench');
    useAppStore.getState().ensureMealsForDate('2026-11-26');
    const count = useAppStore.getState().meals.length;
    useAppStore.getState().ensureMealsForDate('2026-11-26');
    expect(useAppStore.getState().meals).toHaveLength(count);
    expect(useAppStore.getState().mealItems).toEqual([]);
    expect(useAppStore.getState().waterLogs).toEqual({});
    vi.setSystemTime(new Date('2026-11-26T17:01:00Z'));
    useAppStore.getState().ensureMealsForDate('2026-11-27');
    expect(useAppStore.getState().meals.filter(item => item.date === '2026-11-26').every(item => item.status === 'MISSED')).toBe(true);
  });
});

describe('workout input consistency', () => {
  beforeEach(() => useAppStore.setState(useAppStore.getInitialState(), true));

  it.each([[40, 8.5], [40, -1], [Infinity, 8], [-1, 8], [40, NaN]])(
    'does not persist invalid weight %s / reps %s', (weight, reps) => {
      useAppStore.getState().startWorkout('day-push');
      useAppStore.getState().addSet('we-push-1');
      const original = useAppStore.getState().activeSets[0]!;
      useAppStore.getState().updateSet(original.id, weight, reps);
      expect(useAppStore.getState().activeSets[0]).toEqual(original);
      const saved = JSON.parse(localStorage.getItem('pulse-kinetic-storage')!);
      expect(saved.state.activeSets[0]).toEqual(original);
    },
  );

  it('accepts zero reps and fractional nonnegative weight without rounding', () => {
    useAppStore.getState().startWorkout('day-push');
    useAppStore.getState().addSet('we-push-1');
    const id = useAppStore.getState().activeSets[0]!.id;
    useAppStore.getState().updateSet(id, 1.25, 0);
    expect(useAppStore.getState().activeSets[0]).toMatchObject({ weight: 1.25, reps: 0 });
  });

  it.each([
    { planned_sets: 0 }, { planned_sets: 2.5 }, { rep_range_min: -1 },
    { rep_range_max: 8.5 }, { rep_range_min: 11, rep_range_max: 10 },
    { rest_seconds: -1 }, { rest_seconds: Infinity },
  ])('rejects invalid program settings %j without changing saved configuration', update => {
    const original = useAppStore.getState().workoutExercises.find(item => item.id === 'we-push-1');
    useAppStore.getState().updateWorkoutExercise('we-push-1', update);
    expect(useAppStore.getState().workoutExercises.find(item => item.id === 'we-push-1')).toEqual(original);
  });

  it('adds a zero-rest plan without replacing valid zero values with defaults', () => {
    useAppStore.getState().addExerciseToDay('day-push', {
      exercise_id: 'ex-bench', planned_sets: 1, rep_range_min: 0, rep_range_max: 0, rest_seconds: 0,
    });
    expect(useAppStore.getState().workoutExercises.at(-1)).toMatchObject({
      planned_sets: 1, rep_range_min: 0, rep_range_max: 0, rest_seconds: 0,
    });
    const count = useAppStore.getState().workoutExercises.length;
    useAppStore.getState().addExerciseToDay('day-push', { exercise_id: 'ex-bench', planned_sets: 0 });
    expect(useAppStore.getState().workoutExercises).toHaveLength(count);
  });

  it('cannot start a timer or complete a set while reviewing a workout', () => {
    useAppStore.getState().startWorkout('day-push');
    useAppStore.getState().addSet('we-push-1');
    const id = useAppStore.getState().activeSets[0]!.id;
    useAppStore.getState().endWorkout();
    useAppStore.getState().completeSet(id);
    useAppStore.getState().startRestTimer(90);
    expect(useAppStore.getState().activeSets[0]?.status).toBe('PLANNED');
    expect(useAppStore.getState().restTimerActive).toBe(false);
    expect(useAppStore.getState().restTimerEndsAt).toBeNull();
  });

  it('rejects invalid timer durations and treats zero rest as no timer', () => {
    useAppStore.getState().startRestTimer(90);
    expect(useAppStore.getState().restTimerActive).toBe(false);
    useAppStore.getState().startWorkout('day-push');
    for (const seconds of [-1, Infinity, NaN, Number.MAX_VALUE]) {
      useAppStore.getState().startRestTimer(seconds);
      expect(useAppStore.getState().restTimerActive).toBe(false);
    }
    useAppStore.getState().startRestTimer(30);
    expect(useAppStore.getState().restTimerActive).toBe(true);
    useAppStore.getState().startRestTimer(0);
    expect(useAppStore.getState()).toMatchObject({ restTimerActive: false, restTimerEndsAt: null, restTimerSeconds: 0 });
  });
});
