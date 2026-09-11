import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, WorkoutSession, WorkoutSet, Exercise, WorkoutProgram, WorkoutDay, WorkoutExercise, Food, MealTemplate, Meal, MealItem, WeightLog } from './types';
import { SEED_EXERCISES, SEED_PROGRAM, SEED_WORKOUT_DAYS, SEED_WORKOUT_EXERCISES, SEED_FOODS, SEED_MEAL_TEMPLATES, SEED_MEALS, SEED_MEAL_ITEMS, SEED_WEIGHT_LOGS } from './seed';
import { toLocalDateKey, localDateKeyToVietnamNoonIso } from './analytics';

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
  mealTemplates: MealTemplate[];
  meals: Meal[];
  mealItems: MealItem[];
  weightLogs: WeightLog[];
  waterLogs: Record<string, number>;

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
  endWorkout: () => void;
  saveWorkout: () => void;
  discardWorkout: () => void;
  loadPlannedSets: (we: WorkoutExercise) => void;

  // Set Actions
  addSet: (workoutExerciseId: string) => void;
  removeSet: (setId: string) => void;
  duplicateSet: (setId: string) => void;
  updateSet: (setId: string, weight: number, reps: number) => void;
  completeSet: (setId: string) => void;
  uncompleteSet: (setId: string) => void;

  // Phase 3 Actions
  logMealItem: (mealId: string, food: Food, dateKey: string) => void;
  removeMealItem: (itemId: string) => void;
  completeMeal: (mealId: string) => void;
  addWater: (ml: number, dateKey: string) => void;
  logWeight: (weight: number) => void;

  // Utilities
  getWaterForDate: (dateKey: string) => number;
  getMealsForDate: (dateKey: string) => Meal[];
  ensureMealsForDate: (dateKey: string) => void;
  getLastSessionSets: (exerciseId: string) => WorkoutSet[];

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
      mealTemplates: SEED_MEAL_TEMPLATES,
      meals: SEED_MEALS,
      mealItems: SEED_MEAL_ITEMS,
      weightLogs: SEED_WEIGHT_LOGS,
      waterLogs: { [toLocalDateKey(new Date())]: 3200 },

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
        const sessionId = 'session-' + crypto.randomUUID();
        set({
          activeSession: {
            id: sessionId,
            user_id: MOCK_USER.id,
            workout_day_id: workoutDayId,
            start_time: new Date().toISOString(),
            status: 'IN_PROGRESS',
            total_volume: 0,
              loaded_planned_exercises: [],
            },
          activeSets: [],
        });
      },

      endWorkout: () => {
        const { activeSession, activeSets } = get();
        if (!activeSession || activeSession.status !== 'IN_PROGRESS') return;

        const completedSets = activeSets.filter(s => s.status === 'COMPLETED');
        const sessionVolume = completedSets.reduce((acc, curr) => {
          const w = Number(curr.weight);
          const r = Number(curr.reps);
          if (isFinite(w) && isFinite(r) && w >= 0 && r >= 0) {
            return acc + (w * r);
          }
          return acc;
        }, 0);

        set({
          activeSession: {
            ...activeSession,
            end_time: new Date().toISOString(),
            status: 'REVIEWING',
            total_volume: Math.round(sessionVolume),
          },
          restTimerActive: false,
          restTimerEndsAt: null
        });
      },

      saveWorkout: () => {
        const { activeSession, activeSets, workoutHistory, setHistory } = get();
        if (!activeSession || activeSession.status !== 'REVIEWING') return;

        const completedSets = activeSets.filter(s => s.status === 'COMPLETED');

        const completedSession: WorkoutSession = {
          ...activeSession,
          status: 'COMPLETED'
        };

        set({
          workoutHistory: [...workoutHistory, completedSession],
          setHistory: [...setHistory, ...completedSets],
          activeSession: null,
          activeSets: [],
        });
      },

      discardWorkout: () => set({
        activeSession: null,
        activeSets: [],
        restTimerActive: false,
        restTimerEndsAt: null
      }),

      loadPlannedSets: (we) => {
          const { activeSession, activeSets } = get();
          if (!activeSession) return;

          if (activeSession.loaded_planned_exercises?.includes(we.id)) return;
          set({ activeSession: { ...activeSession, loaded_planned_exercises: [...(activeSession.loaded_planned_exercises || []), we.id] } });

        const historicalSets = get().getLastSessionSets(we.exercise_id);

        const newSets: WorkoutSet[] = Array.from({ length: we.planned_sets }).map((_, idx) => {
          let weight = 0;
          let reps = we.rep_range_max;

          if (historicalSets.length > idx && historicalSets[idx]) {
             weight = historicalSets[idx].weight;
             reps = historicalSets[idx].reps;
          }

          return {
            id: 'set-' + crypto.randomUUID(),
            session_id: activeSession.id,
            workout_exercise_id: we.id,
            set_number: idx + 1,
            weight,
            reps,
            status: 'PLANNED'
          };
        });

        set({ activeSets: [...activeSets, ...newSets] });
      },

      // Set Mutations
      addSet: (workoutExerciseId) => {
          const { activeSession, activeSets, workoutExercises } = get();
          if (!activeSession) return;

          const existingSets = activeSets.filter(s => s.workout_exercise_id === workoutExerciseId);
          let weight = 0;
          let reps = 0;

          const lastSet = existingSets[existingSets.length - 1];

          if (lastSet) {
             weight = lastSet.weight;
             reps = lastSet.reps;
          } else {
             const we = workoutExercises.find(w => w.id === workoutExerciseId);
             if (we) {
                 reps = we.rep_range_max;
                 const historicalSets = get().getLastSessionSets(we.exercise_id);
                 if (historicalSets.length > 0) {
                     const prevFirstSet = historicalSets.find(s => s.set_number === 1) || historicalSets[0];
                     if (prevFirstSet) {
                         weight = prevFirstSet.weight;
                         reps = prevFirstSet.reps;
                     }
                 }
             }
          }

          const newSet = {
            id: 'set-' + crypto.randomUUID(),
            session_id: activeSession.id,
            workout_exercise_id: workoutExerciseId,
            set_number: existingSets.length + 1,
            weight: weight,
            reps: reps,
            status: 'PLANNED' as const
          };

          const newSetsList = [...activeSets, newSet];
          let counter = 1;
          const renumbered = newSetsList.map(s => {
            if (s.workout_exercise_id === workoutExerciseId) {
              return { ...s, set_number: counter++ };
            }
            return s;
          });
          set({ activeSets: renumbered });
        },

        removeSet: (setId) => {
          const state = get();
          const targetSet = state.activeSets.find(s => s.id === setId);
          if (!targetSet) return;
          const filtered = state.activeSets.filter(s => s.id !== setId);
          let counter = 1;
          const renumbered = filtered.map(s => {
            if (s.workout_exercise_id === targetSet.workout_exercise_id) {
              return { ...s, set_number: counter++ };
            }
            return s;
          });
          set({ activeSets: renumbered });
        },

      duplicateSet: (setId) => {
        const { activeSession, activeSets } = get();
        if (!activeSession) return;

        const setToDup = activeSets.find(s => s.id === setId);
        if (!setToDup) return;

        const existingSets = activeSets.filter(s => s.workout_exercise_id === setToDup.workout_exercise_id);

        const newSet: WorkoutSet = {
          ...setToDup,
          id: 'set-' + crypto.randomUUID(),
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
        const { workoutExercises, activeSets: currentSets } = get();
        const setToComplete = currentSets.find(s => s.id === setId);
        if (!setToComplete) return;

        // Resolve the real exercise_id via workout_exercise mapping
        const weConfig = workoutExercises.find(we => we.id === setToComplete.workout_exercise_id);

        set((state) => ({
          activeSets: state.activeSets.map(s =>
            s.id === setId ? { ...s, status: 'COMPLETED' } : s
          )
        }));

        // Start rest timer after state is committed
        if (weConfig) {
          get().startRestTimer(weConfig.rest_seconds);
        }
      },

      uncompleteSet: (setId) => {
        set((state) => ({
          activeSets: state.activeSets.map(s =>
            s.id === setId ? { ...s, status: 'PLANNED' } : s
          )
        }));
      },

      // Nutrition & Progress Mutations
      logMealItem: (mealId, food, dateKey) => {
        const todayKey = toLocalDateKey(new Date());
        const loggedAt = dateKey === todayKey
          ? new Date().toISOString()
          : localDateKeyToVietnamNoonIso(dateKey);

        set((state) => ({
          mealItems: [
            ...state.mealItems,
            {
              id: 'mi-' + crypto.randomUUID(),
              meal_id: mealId,
              food_id: food.id,
              name: food.name,
              calories: food.calories_per_serving,
              protein: food.protein_per_serving,
              carbs: food.carbs_per_serving,
              fat: food.fat_per_serving,
              logged_at: loggedAt
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

      addWater: (ml, dateKey) => set((state) => ({
        waterLogs: {
          ...state.waterLogs,
          [dateKey]: (state.waterLogs[dateKey] || 0) + ml
        }
      })),

      logWeight: (weight) => set((state) => {
        const dateKey = toLocalDateKey(new Date());
        const newLogs = [...state.weightLogs];
        const existingIdx = newLogs.findIndex(wl => wl.date === dateKey);

        if (existingIdx !== -1) {
          // Same-day deduplication: update existing
          const existingLog = newLogs[existingIdx];
          if (existingLog) {
            newLogs[existingIdx] = { ...existingLog, weight };
          }
        } else {
          const newLog: WeightLog = {
            id: crypto.randomUUID(),
            user_id: state.user.id,
            date: dateKey,
            weight: weight
          };
          newLogs.push(newLog);
        }

        // Always sort ascending by date
        newLogs.sort((a, b) => a.date.localeCompare(b.date));

        return {
          weightLogs: newLogs,
          user: { ...state.user, current_weight: weight }
        };
      }),

      // Utilities
      getWaterForDate: (dateKey) => {
        const { waterLogs } = get();
        return waterLogs[dateKey] || 0;
      },

      getMealsForDate: (dateKey) => {
        const { meals, mealTemplates } = get();
        return meals.filter(m => m.date === dateKey).sort((a, b) => {
           const tA = mealTemplates.findIndex(t => t.id === a.template_id);
           const tB = mealTemplates.findIndex(t => t.id === b.template_id);
           return tA - tB;
        });
      },

      ensureMealsForDate: (dateKey) => {
        const { meals, mealTemplates } = get();

        const newMeals: Meal[] = [];

        for (const template of mealTemplates) {
          const exists = meals.some(
            m => m.template_id === template.id && m.date === dateKey
          );

          if (!exists) {
            newMeals.push({
              id: template.id + '-' + dateKey,
              user_id: template.user_id,
              date: dateKey,
              template_id: template.id,
              name: template.name,
              scheduled_time: template.scheduled_time,
              description: template.description,
              status: 'PLANNED'
            });
          }
        }

        if (newMeals.length > 0) {
          set({ meals: [...meals, ...newMeals] });
        }
      },

      getLastSessionSets: (exerciseId) => {
        const { setHistory, workoutHistory, workoutExercises } = get();
        const weIds = workoutExercises.filter(we => we.exercise_id === exerciseId).map(we => we.id);
        const mappedSets = setHistory.filter(s => weIds.includes(s.workout_exercise_id) && s.status === 'COMPLETED');
        if (mappedSets.length === 0) return [];
        const sortedSessions = workoutHistory.slice().sort((a,b) => b.start_time.localeCompare(a.start_time));
        for (const session of sortedSessions) {
           const sessionSets = mappedSets.filter(s => s.session_id === session.id);
           if (sessionSets.length > 0) return sessionSets;
        }
        return [];
      },

      // Phase 7: Exercise Library & Program Actions
      addCustomExercise: (exercise) => set((state) => ({
        exercises: [...state.exercises, { ...exercise, id: 'ex-custom-' + crypto.randomUUID(), is_custom: true, is_active: true, is_system: false, is_modified: true }]
      })),

      updateExercise: (id, updates) => set((state) => ({
        exercises: state.exercises.map(e => e.id === id ? { ...e, ...updates, is_modified: true } : e)
      })),

      hideExercise: (id) => set((state) => ({
        exercises: state.exercises.map(e => e.id === id ? { ...e, is_active: false, is_modified: true } : e)
      })),

      addWorkoutDay: (name, focus) => set((state) => {
        const programId = state.programs[0]?.id || 'p-1';
        return {
          workoutDays: [...state.workoutDays, {
            id: 'wd-' + crypto.randomUUID(),
            program_id: programId,
            name,
            day_of_week: state.workoutDays.length % 7,
            is_active: true,
            focus,
            notes: '',
            is_system: false,
            is_modified: true
          }]
        };
      }),

      updateWorkoutDay: (dayId, updates) => set((state) => ({
        workoutDays: state.workoutDays.map(d => d.id === dayId ? { ...d, ...updates, is_modified: true } : d)
      })),

      addExerciseToDay: (dayId, details) => set((state) => {
        const activeForDay = state.workoutExercises
          .filter(we => we.workout_day_id === dayId && we.is_active !== false)
          .sort((a, b) => a.order_index - b.order_index);
        const activeIdsToNewIndex = new Map(activeForDay.map((we, idx) => [we.id, idx]));

        const newExercise = {
          id: 'we-' + crypto.randomUUID(),
          workout_day_id: dayId,
          exercise_id: details.exercise_id,
          order_index: activeForDay.length,
          planned_sets: details.planned_sets || 3,
          rep_range_min: details.rep_range_min || 8,
          rep_range_max: details.rep_range_max || 12,
          rest_seconds: details.rest_seconds || 90,
          notes: details.notes || '',
          is_active: true,
          is_system: false,
          is_modified: true,
        };

        const updatedExercises = state.workoutExercises.map(we => {
          if (we.workout_day_id === dayId && we.is_active !== false) {
            return { ...we, order_index: activeIdsToNewIndex.get(we.id)! };
          }
          return we;
        });

        return {
          workoutExercises: [...updatedExercises, newExercise]
        };
      }),

      removeExerciseFromDay: (weId) => set((state) => ({
        workoutExercises: state.workoutExercises.map(we => we.id === weId ? { ...we, is_active: false, is_modified: true } : we)
      })),

      updateWorkoutExercise: (weId, updates) => set((state) => ({
        workoutExercises: state.workoutExercises.map(we => we.id === weId ? { ...we, ...updates, is_modified: true } : we)
      })),

      reorderExercises: (dayId, orderedIds) => set((state) => {
        const updated = state.workoutExercises.map(we => {
          if (we.workout_day_id !== dayId) return we;
          const newIndex = orderedIds.indexOf(we.id);
          return newIndex !== -1 ? { ...we, order_index: newIndex, is_modified: true } : we;
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
        mealTemplates: SEED_MEAL_TEMPLATES,
        meals: SEED_MEALS,
        mealItems: SEED_MEAL_ITEMS,
        weightLogs: SEED_WEIGHT_LOGS,
        waterLogs: { [toLocalDateKey(new Date())]: 3200 },
        workoutHistory: [],
        setHistory: [],
        restTimerActive: false,
        restTimerEndsAt: null,
        restTimerSeconds: 90
      }))
    }),
    {
      name: 'pulse-kinetic-storage',
      version: 3,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          if (persistedState.user) {
            persistedState.user.height = persistedState.user.height || 175;
            persistedState.user.goal_type = persistedState.user.goal_type || 'Maintenance';
            persistedState.user.weight_unit = persistedState.user.weight_unit || 'kg';
            persistedState.user.energy_unit = persistedState.user.energy_unit || 'kcal';
          }
        }
        if (version < 2) {
          if (persistedState.meals && Array.isArray(persistedState.meals)) {
            const legacyDate = toLocalDateKey(new Date());
            const newTemplates: MealTemplate[] = [];
            const newMeals: Meal[] = [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            persistedState.meals.forEach((ml: any) => {
              if (ml.date !== undefined && ml.template_id !== undefined) {
                newMeals.push(ml);
                return;
              }
              const tId = 'mt-' + ml.id;
              newTemplates.push({
                id: tId,
                user_id: ml.user_id,
                name: ml.name,
                scheduled_time: ml.scheduled_time,
                description: ml.description,
                is_system: false,
                is_modified: true
              });
              newMeals.push({
                ...ml,
                date: legacyDate,
                template_id: tId
              });
            });

            persistedState.mealTemplates = [...(persistedState.mealTemplates || []), ...newTemplates];
            const uniqueTmpl = new Map();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            persistedState.mealTemplates.forEach((t: any) => uniqueTmpl.set(t.id, t));
            persistedState.mealTemplates = Array.from(uniqueTmpl.values());

            persistedState.meals = newMeals;
          }
        }
        if (version < 3) {
          if (persistedState.dailyWater !== undefined) {
            const legacyDate = toLocalDateKey(new Date());
            persistedState.waterLogs = {
              ...(persistedState.waterLogs || {}),
              [legacyDate]: persistedState.dailyWater
            };
            delete persistedState.dailyWater;
          }
        }
        if (version < 4) {
          const seedables = ['exercises', 'programs', 'workoutDays', 'workoutExercises', 'foods', 'mealTemplates'];
          seedables.forEach((key) => {
            if (persistedState[key] && Array.isArray(persistedState[key])) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              persistedState[key] = persistedState[key].map((item: any) => ({
                ...item,
                is_system: true,
                is_modified: true
              }));
            }
          });
        }
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const todayKey = toLocalDateKey(new Date());
        let updated = false;

        const nextMeals = state.meals.map(m => {
          if (m.date < todayKey && m.status === 'PLANNED') {
            updated = true;
            return { ...m, status: 'MISSED' as const };
          }
          return m;
        });

        let finalMeals = state.meals;
        if (updated) {
          finalMeals = nextMeals;
        }

        const synced = syncSeedData(state);

        if (updated || Object.keys(synced).length > 0) {
          setTimeout(() => {
            useAppStore.setState({ meals: finalMeals, ...synced });
          }, 0);
        }
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
        mealTemplates: state.mealTemplates,
        meals: state.meals,
        mealItems: state.mealItems,
        weightLogs: state.weightLogs,
        waterLogs: state.waterLogs,
        restTimerActive: state.restTimerActive,
        restTimerSeconds: state.restTimerSeconds,
        restTimerEndsAt: state.restTimerEndsAt
      })
    }
  )
);

function syncSeedData(state: AppState): Partial<AppState> {
  const processCollection = <T extends { id: string, is_system?: boolean, is_modified?: boolean }>(
    persistedList: T[],
    seedList: T[]
  ): { updated: boolean, data: T[] } => {
    const listMap = new Map<string, T>();
    persistedList.forEach(i => listMap.set(i.id, i));
    let collectionUpdated = false;
    const finalCollection: T[] = [];

    for (const seedItem of seedList) {
      const existing = listMap.get(seedItem.id);
      if (!existing) {
        finalCollection.push({ ...seedItem });
        collectionUpdated = true;
      } else {
        if (existing.is_system === true && existing.is_modified === false) {
          finalCollection.push({ ...seedItem });
          if (JSON.stringify(existing) !== JSON.stringify(seedItem)) {
             collectionUpdated = true;
          }
        } else {
          finalCollection.push(existing);
        }
      }
    }

    for (const existing of persistedList) {
      const seedMatch = seedList.find(s => s.id === existing.id);
      if (!seedMatch) {
        finalCollection.push(existing);
      }
    }

    if (collectionUpdated || finalCollection.length !== persistedList.length) {
      return { updated: true, data: finalCollection };
    }
    return { updated: false, data: persistedList };
  };

  const ex = processCollection(state.exercises, SEED_EXERCISES);
  const prog = processCollection(state.programs, [SEED_PROGRAM]);
  const days = processCollection(state.workoutDays, SEED_WORKOUT_DAYS);
  const we = processCollection(state.workoutExercises, SEED_WORKOUT_EXERCISES);
  const foods = processCollection(state.foods, SEED_FOODS);
  const mt = processCollection(state.mealTemplates, SEED_MEAL_TEMPLATES);

  const hasUpdate = ex.updated || prog.updated || days.updated || we.updated || foods.updated || mt.updated;

  if (!hasUpdate) return {};

  return {
    ...(ex.updated && { exercises: ex.data }),
    ...(prog.updated && { programs: prog.data }),
    ...(days.updated && { workoutDays: days.data }),
    ...(we.updated && { workoutExercises: we.data }),
    ...(foods.updated && { foods: foods.data }),
    ...(mt.updated && { mealTemplates: mt.data })
  };
}
