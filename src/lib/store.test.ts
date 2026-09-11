import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toLocalDateKey } from './analytics';
import { useAppStore } from './store';


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
