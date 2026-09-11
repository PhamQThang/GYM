import { describe, it, expect, beforeEach, vi } from 'vitest';
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
});
