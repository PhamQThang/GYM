import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, WorkoutSession, WorkoutSet, Exercise, WorkoutProgram, WorkoutDay, WorkoutExercise, Food, Meal, MealItem, WeightLog } from './types';
import { SEED_EXERCISES, SEED_PROGRAM, SEED_WORKOUT_DAYS, SEED_WORKOUT_EXERCISES, SEED_FOODS, SEED_MEALS, SEED_MEAL_ITEMS, SEED_WEIGHT_LOGS } from './seed';

const MOCK_USER: User = {
  id: 'u-1',
  name: 'Quang Nguyen',
  height: 175,
  current_weight: 65.0,
  target_weight: 70.0,
  goal_type: 'Maintenance',
  target_calories: 3000,
  target_protein: 200,
  target_carbs: 350,
  target_fat: 85,
  weight_unit: 'kg',
  energy_unit: 'kcal'
};

export interface AppState {
  // Config & Domain Data
  user: User;
  exercises: Exercise[];
  programs: WorkoutProgram[];
  workoutDays: WorkoutDay[];
  workoutExercises: WorkoutExercise[];
  
  // Phase 3 Data
  foods: Food[];
  meals: Meal[];
  mealItems: MealItem[];
  weightLogs: WeightLog[];
  dailyWater: number;
  
  // Historical Data
  workoutHistory: WorkoutSession[];
  setHistory: WorkoutSet[];
  
  // Timer State
  restTimerActive: boolean;
  restTimerSeconds: number;
  restTimerEndsAt: number | null;
  
  // Active Session State
  activeSession: WorkoutSession | null;
  activeSets: WorkoutSet[];
  
  // Timer Actions
  startRestTimer: (seconds: number) => void;
  stopRestTimer: () => void;
  resetRestTimer: () => void;
  
  // Workout Actions
  startWorkout: (workoutDayId: string) => void;
  finishWorkout: () => void;
  loadPlannedSets: (we: WorkoutExercise) => void;
  
  // Set Actions
  addSet: (workoutExerciseId: string) => void;
  removeSet: (setId: string) => void;
  duplicateSet: (setId: string) => void;
  updateSet: (setId: string, weight: number, reps: number) => void;
  completeSet: (setId: string) => void;
  
  // Phase 3 Actions
  logMealItem: (mealId: string, food: Food) => void;
  removeMealItem: (itemId: string) => void;
  completeMeal: (mealId: string) => void;
  addWater: (ml: number) => void;
  logWeight: (weight: number) => void;
  
  // Utilities
  getPreviousPerformance: (exerciseId: string) => WorkoutSet | null;
  
  // Customization Actions (Phase 7)
  addCustomExercise: (exercise: Omit<Exercise, 'id'>) => void;
  updateExercise: (id: string, updates: Partial<Exercise>) => void;
  hideExercise: (id: string) => void;
  
  addWorkoutDay: (name: string, focus: string) => void;
  updateWorkoutDay: (dayId: string, updates: Partial<WorkoutDay>) => void;
  
  addExerciseToDay: (dayId: string, details: Partial<WorkoutExercise> & { exercise_id: string }) => void;
  removeExerciseFromDay: (workoutExerciseId: string) => void;
  updateWorkoutExercise: (workoutExerciseId: string, updates: Partial<WorkoutExercise>) => void;
  reorderExercises: (dayId: string, orderedWorkoutExerciseIds: string[]) => void;
  
  // Phase 9 Settings & Data Management
  updateUser: (updates: Partial<User>) => void;
  importState: (candidateState: Partial<AppState>) => void;
  resetApp: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: MOCK_USER,
      exercises: SEED_EXERCISES,
      programs: [SEED_PROGRAM],
      workoutDays: SEED_WORKOUT_DAYS,
      workoutExercises: SEED_WORKOUT_EXERCISES,
      
      foods: SEED_FOODS,
      meals: SEED_MEALS,
      mealItems: SEED_MEAL_ITEMS,
      weightLogs: SEED_WEIGHT_LOGS,
      dailyWater: 3200,
      
      workoutHistory: [],
      setHistory: [],
      
      restTimerActive: false,
      restTimerSeconds: 90,
      restTimerEndsAt: null,
      
      activeSession: null,
      activeSets: [],
      
      // Timer
      startRestTimer: (seconds) => set({
        restTimerActive: true,
        restTimerSeconds: seconds,
        restTimerEndsAt: Date.now() + seconds * 1000,
      }),
      
      stopRestTimer: () => set({ restTimerActive: false, restTimerEndsAt: null }),
      resetRestTimer: () => set((state) => {
        if (!state.restTimerActive) return state;
        return { restTimerEndsAt: Date.now() + state.restTimerSeconds * 1000 };
      }),
      
      // Workout
      startWorkout: (workoutDayId) => {
        const sessionId = 'session-' + Date.now();
        set({
          activeSession: {
            id: sessionId,
            user_id: MOCK_USER.id,
            workout_day_id: workoutDayId,
            start_time: new Date().toISOString(),
            status: 'IN_PROGRESS',
            total_volume: 0,
          },
          activeSets: [],
        });
      },
      
      finishWorkout: () => {
        const { activeSession, activeSets, workoutHistory, setHistory } = get();
        if (!activeSession) return;
        
        const completedSets = activeSets.filter(s => s.status === 'COMPLETED');
        const sessionVolume = completedSets.reduce((acc, curr) => {
          const w = Number(curr.weight);
          const r = Number(curr.reps);
          if (isFinite(w) && isFinite(r) && w >= 0 && r >= 0) {
            return acc + (w * r);
          }
          return acc;
        }, 0);
        
        const completedSession: WorkoutSession = {
          ...activeSession,
          end_time: new Date().toISOString(),
          status: 'COMPLETED',
          total_volume: Math.round(sessionVolume),
        };
        
        set({
          workoutHistory: [...workoutHistory, completedSession],
          setHistory: [...setHistory, ...completedSets],
          activeSession: null,
          activeSets: [],
          restTimerActive: false
        });
      },
      
      loadPlannedSets: (we) => {
        const { activeSession, activeSets } = get();
        if (!activeSession) return;
        
        if (activeSets.some(s => s.workout_exercise_id === we.id)) return;
        
        const newSets: WorkoutSet[] = Array.from({ length: we.planned_sets }).map((_, idx) => ({
          id: 'set-' + Date.now() + '-' + idx,
          session_id: activeSession.id,
          workout_exercise_id: we.id,
          set_number: idx + 1,
          weight: 0,
          reps: we.rep_range_max,
          is_pr: false,
          status: 'PLANNED'
        }));
        
        set({ activeSets: [...activeSets, ...newSets] });
      },
      
      // Set Mutations
      addSet: (workoutExerciseId) => {
        const { activeSession, activeSets } = get();
        if (!activeSession) return;
        
        const existingSets = activeSets.filter(s => s.workout_exercise_id === workoutExerciseId);
        const lastSet = existingSets[existingSets.length - 1];
        
        const newSet: WorkoutSet = {
          id: 'set-' + Date.now(),
          session_id: activeSession.id,
          workout_exercise_id: workoutExerciseId,
          set_number: existingSets.length + 1,
          weight: lastSet ? lastSet.weight : 0,
          reps: lastSet ? lastSet.reps : 0,
          is_pr: false,
          status: 'PLANNED'
        };
        
        set({ activeSets: [...activeSets, newSet] });
      },
      
      removeSet: (setId) => set((state) => ({
        activeSets: state.activeSets.filter(s => s.id !== setId)
      })),
      
      duplicateSet: (setId) => {
        const { activeSession, activeSets } = get();
        if (!activeSession) return;
        
        const setToDup = activeSets.find(s => s.id === setId);
        if (!setToDup) return;
        
        const existingSets = activeSets.filter(s => s.workout_exercise_id === setToDup.workout_exercise_id);
        
        const newSet: WorkoutSet = {
          ...setToDup,
          id: 'set-' + Date.now(),
          set_number: existingSets.length + 1,
          status: 'PLANNED'
        };
        
        set({ activeSets: [...activeSets, newSet] });
      },
      
      updateSet: (setId, weight, reps) => set((state) => ({
        activeSets: state.activeSets.map(s => 
          s.id === setId ? { ...s, weight, reps } : s
        )
      })),
      
      completeSet: (setId) => {
        const { workoutExercises, exercises, getPreviousPerformance, activeSets: currentSets } = get();
        const setToComplete = currentSets.find(s => s.id === setId);
        if (!setToComplete) return;

        // Resolve the real exercise_id via workout_exercise mapping
        const weConfig = workoutExercises.find(we => we.id === setToComplete.workout_exercise_id);
        const exerciseId = weConfig?.exercise_id;

        // Check PR: compare against best historical set for this exercise
        const prev = exerciseId ? getPreviousPerformance(exerciseId) : null;
        const isPr = prev ? setToComplete.weight > prev.weight : false;

        set((state) => ({
          activeSets: state.activeSets.map(s =>
            s.id === setId ? { ...s, status: 'COMPLETED', is_pr: isPr } : s
          )
        }));
        
        // Start rest timer after state is committed
        if (weConfig) {
          get().startRestTimer(weConfig.rest_seconds);
        }
      },
      
      // Nutrition & Progress Mutations
      logMealItem: (mealId, food) => {
        set((state) => ({
          mealItems: [
            ...state.mealItems,
            {
              id: 'mi-' + Date.now(),
              meal_id: mealId,
              food_id: food.id,
              name: food.name,
              calories: food.calories_per_serving,
              protein: food.protein_per_serving,
              carbs: food.carbs_per_serving,
              fat: food.fat_per_serving,
              logged_at: new Date().toISOString()
            }
          ]
        }));
      },
      
      completeMeal: (mealId) => set((state) => ({
        meals: state.meals.map(m => m.id === mealId ? { ...m, status: 'CONSUMED' } : m)
      })),

      removeMealItem: (itemId) => set((state) => ({
        mealItems: state.mealItems.filter(mealItem => mealItem.id !== itemId)
      })),
      
      addWater: (ml) => set((state) => ({
        dailyWater: state.dailyWater + ml
      })),
      
      logWeight: (weight) => set((state) => {
        const today = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(new Date());
        const newLog: WeightLog = {
          id: 'wl-' + Date.now(),
          user_id: state.user.id,
          date: today,
          weight: weight
        };
        return {
          weightLogs: [...state.weightLogs, newLog],
          user: { ...state.user, current_weight: weight }
        };
      }),
      
      // Utilities
      getPreviousPerformance: (exerciseId) => {
        const { setHistory, workoutExercises } = get();
        const weIds = workoutExercises.filter(we => we.exercise_id === exerciseId).map(we => we.id);
        const mappedSets = setHistory.filter(s => weIds.includes(s.workout_exercise_id) && s.status === 'COMPLETED');
        if (mappedSets.length === 0) return null;
        return mappedSets.reduce((prev, current) => (prev.weight > current.weight) ? prev : current);
      },
      
      // Phase 7: Exercise Library & Program Actions
      addCustomExercise: (exercise) => set((state) => ({
        exercises: [...state.exercises, { ...exercise, id: 'ex-custom-' + Date.now(), is_custom: true, is_active: true }]
      })),
      
      updateExercise: (id, updates) => set((state) => ({
        exercises: state.exercises.map(e => e.id === id ? { ...e, ...updates } : e)
      })),
      
      hideExercise: (id) => set((state) => ({
        exercises: state.exercises.map(e => e.id === id ? { ...e, is_active: false } : e)
      })),
      
      addWorkoutDay: (name, focus) => set((state) => {
        const programId = state.programs[0]?.id || 'p-1';
        return {
          workoutDays: [...state.workoutDays, {
            id: 'wd-' + Date.now(),
            program_id: programId,
            name,
            day_of_week: state.workoutDays.length % 7,
            is_active: true,
            focus,
            notes: ''
          }]
        };
      }),
      
      updateWorkoutDay: (dayId, updates) => set((state) => ({
        workoutDays: state.workoutDays.map(d => d.id === dayId ? { ...d, ...updates } : d)
      })),
      
      addExerciseToDay: (dayId, details) => set((state) => {
        const existingForDay = state.workoutExercises.filter(we => we.workout_day_id === dayId);
        return {
          workoutExercises: [...state.workoutExercises, {
            id: 'we-' + Date.now(),
            workout_day_id: dayId,
            exercise_id: details.exercise_id,
            order_index: existingForDay.length,
            planned_sets: details.planned_sets || 3,
            rep_range_min: details.rep_range_min || 8,
            rep_range_max: details.rep_range_max || 12,
            rest_seconds: details.rest_seconds || 90,
            notes: details.notes || '',
            is_active: true,
          }]
        };
      }),
      
      removeExerciseFromDay: (weId) => set((state) => ({
        workoutExercises: state.workoutExercises.map(we => we.id === weId ? { ...we, is_active: false } : we)
      })),
      
      updateWorkoutExercise: (weId, updates) => set((state) => ({
        workoutExercises: state.workoutExercises.map(we => we.id === weId ? { ...we, ...updates } : we)
      })),
      
      reorderExercises: (dayId, orderedIds) => set((state) => {
        const updated = state.workoutExercises.map(we => {
          if (we.workout_day_id !== dayId) return we;
          const newIndex = orderedIds.indexOf(we.id);
          return newIndex !== -1 ? { ...we, order_index: newIndex } : we;
        });
        return { workoutExercises: updated };
      }),
      
      // Phase 9 Actions
      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
      importState: (candidateState) => set((state) => {
        // Assume candidateState has been fully validated before this is called
        return { ...state, ...candidateState };
      }),
      resetApp: () => set(() => ({
        user: MOCK_USER,
        exercises: SEED_EXERCISES,
        programs: [SEED_PROGRAM],
        workoutDays: SEED_WORKOUT_DAYS,
        workoutExercises: SEED_WORKOUT_EXERCISES,
        foods: SEED_FOODS,
        meals: SEED_MEALS,
        mealItems: SEED_MEAL_ITEMS,
        weightLogs: SEED_WEIGHT_LOGS,
        dailyWater: 3200,
        workoutHistory: [],
        setHistory: [],
        restTimerActive: false,
        restTimerEndsAt: null,
        restTimerSeconds: 90
      }))
    }),
    {
      name: 'pulse-kinetic-storage',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          if (persistedState.user) {
            persistedState.user.height = persistedState.user.height || 175;
            persistedState.user.goal_type = persistedState.user.goal_type || 'Maintenance';
            persistedState.user.weight_unit = persistedState.user.weight_unit || 'kg';
            persistedState.user.energy_unit = persistedState.user.energy_unit || 'kcal';
          }
        }
        return persistedState;
      },
      partialize: (state) => ({
        user: state.user,
        exercises: state.exercises,
        programs: state.programs,
        workoutDays: state.workoutDays,
        workoutExercises: state.workoutExercises,
        workoutHistory: state.workoutHistory,
        setHistory: state.setHistory,
        activeSession: state.activeSession,
        activeSets: state.activeSets,
        meals: state.meals,
        mealItems: state.mealItems,
        weightLogs: state.weightLogs,
        dailyWater: state.dailyWater,
        restTimerActive: state.restTimerActive,
        restTimerSeconds: state.restTimerSeconds,
        restTimerEndsAt: state.restTimerEndsAt
      })
    }
  )
);
