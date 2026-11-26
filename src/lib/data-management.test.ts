import { beforeEach, describe, expect, it } from 'vitest';
import { createBackupPayload, validateImportPayload } from './data-management';
import { useAppStore } from './store';
import { SEED_FOODS } from './seed';

function fixture() {
  return JSON.parse(JSON.stringify(createBackupPayload(useAppStore.getState()))) as {
    app: string; schema_version: number; exported_at: string;
    data: Record<string, unknown>;
  };
}
function parse(payload: unknown) { return validateImportPayload(JSON.stringify(payload)); }
function first(data: Record<string, unknown>, key: string): Record<string, unknown> {
  return (data[key] as Record<string, unknown>[])[0]!;
}
function workoutFixture() {
  const payload = fixture();
  const session = {
    id: 'session-backup', user_id: useAppStore.getState().user.id,
    workout_day_id: 'day-push', start_time: '2026-11-20T10:00:00.000Z',
    end_time: '2026-11-20T11:00:00.000Z', status: 'COMPLETED', total_volume: 400,
    loaded_planned_exercises: ['we-push-1'],
  };
  const set = { id: 'set-backup', session_id: session.id, workout_exercise_id: 'we-push-1',
    set_number: 1, weight: 40, reps: 10, status: 'COMPLETED' };
  payload.data.workoutHistory = [session];
  payload.data.setHistory = [set];
  return payload;
}

describe('backup validation', () => {
  beforeEach(() => { useAppStore.getState().resetApp(); });

  it('round-trips current persisted data including foods and history without actions', () => {
    const payload = workoutFixture();
    const result = parse(payload);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(payload.data);
    expect(result.warnings).toEqual([]);
    expect(result.data.foods).toEqual(SEED_FOODS);
    expect(result.data).not.toHaveProperty('resetApp');
  });

  it('keeps a valid active workout, sets, and running timer', () => {
    const payload = workoutFixture();
    const session = first(payload.data, 'workoutHistory');
    session.status = 'IN_PROGRESS';
    delete session.end_time;
    payload.data.activeSession = session;
    payload.data.activeSets = payload.data.setHistory;
    payload.data.workoutHistory = [];
    payload.data.setHistory = [];
    payload.data.restTimerActive = true;
    payload.data.restTimerEndsAt = 1795172460000;
    const result = parse(payload);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(payload.data);
  });

  it('recovers legacy missing foods, preserves custom meal snapshots without inventing catalog rows', () => {
    const payload = fixture();
    delete payload.data.foods;
    const item = first(payload.data, 'mealItems');
    item.food_id = 'lost-custom-food';
    const result = parse(payload);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.warnings.join(' ')).toContain('không thể phục hồi');
    expect(result.data.foods).toEqual(SEED_FOODS);
    expect(result.data.mealItems[0]).toEqual(Object.fromEntries(Object.entries(item).filter(([key]) => key !== 'food_id')));
  });

  it('removes action/prototype/unknown fields at every parsed object boundary', () => {
    const payload = fixture();
    payload.data.resetApp = 'malicious';
    payload.data.saveWorkout = {};
    payload.data.extra = 1;
    Object.defineProperty(payload.data, '__proto__', { value: { polluted: true }, enumerable: true });
    first(payload.data, 'exercises').extra = true;
    const result = parse(payload);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).not.toHaveProperty('resetApp');
    expect(Object.hasOwn(result.data, '__proto__')).toBe(false);
    expect(result.data.exercises[0]).not.toHaveProperty('extra');
    const originalAction = useAppStore.getState().resetApp;
    useAppStore.getState().importState(result.data);
    expect(useAppStore.getState().resetApp).toBe(originalAction);
  });

  it('normalizes legacy missing flags conservatively with missing foods and custom IDs', () => {
    const payload = fixture();
    delete payload.data.foods;
    const custom = { ...first(payload.data, 'exercises'), id: 'custom-old-exercise', name: 'My preserved exercise' };
    (payload.data.exercises as unknown[]).push(custom);
    for (const key of ['exercises', 'programs', 'workoutDays', 'workoutExercises', 'mealTemplates']) {
      for (const row of payload.data[key] as Record<string, unknown>[]) {
        delete row.is_system;
        delete row.is_modified;
      }
    }
    const result = parse(payload);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.exercises[0]).toMatchObject({ is_system: true, is_modified: true });
    expect(result.data.exercises.at(-1)).toMatchObject({ id: custom.id, name: custom.name, is_system: false, is_modified: true });
    expect(result.data.foods).toEqual(SEED_FOODS);
    expect(result.warnings.filter(warning => warning.includes('thông tin danh mục'))).toHaveLength(1);
    expect(result.warnings).toHaveLength(2);
  });

  it('preserves present metadata and rejects invalid flags even when another flag is missing', () => {
    const payload = fixture();
    const row = first(payload.data, 'exercises');
    row.is_system = false;
    delete row.is_modified;
    let result = parse(payload);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.exercises[0]).toMatchObject({ is_system: false, is_modified: true });
    row.is_modified = false;
    delete row.is_system;
    result = parse(payload);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.exercises[0]).toMatchObject({ is_system: true, is_modified: false });
    row.is_modified = 'false';
    expect(parse(payload).success).toBe(false);
  });

  it.each(['00:00', '23:59', '12:34:56', '07:45 Sáng • Đánh thức trao đổi chất', '04:15 Chiều'])('accepts scheduled time %s', time => {
    const payload = fixture();
    first(payload.data, 'meals').scheduled_time = time;
    first(payload.data, 'mealTemplates').scheduled_time = time;
    expect(parse(payload).success).toBe(true);
  });

  it.each(['25:00', '12:60', '12:34:60', 'noon', '', '13:00 Chiều', '09:99 Sáng • Invalid'])('rejects invalid scheduled time %s', time => {
    const payload = fixture();
    first(payload.data, 'meals').scheduled_time = time;
    expect(parse(payload).success).toBe(false);
    const other = fixture();
    first(other.data, 'mealTemplates').scheduled_time = time;
    expect(parse(other).success).toBe(false);
  });

  const invalidCases: [string, (data: Record<string, unknown>) => void][] = [
    ['array instead of user', d => { d.user = []; }],
    ['missing templates', d => { delete d.mealTemplates; }],
    ['wrong collection type', d => { d.exercises = {}; }],
    ['null element', d => { (d.exercises as unknown[]).push(null); }],
    ['duplicate IDs', d => { (d.exercises as unknown[]).push(first(d, 'exercises')); }],
    ['invalid enum', d => { first(d, 'meals').status = 'EATEN'; }],
    ['invalid nested boolean', d => { first(d, 'exercises').is_system = 'true'; }],
    ['negative macros', d => { first(d, 'mealItems').protein = -1; }],
    ['null numeric', d => { first(d, 'mealItems').fat = null; }],
    ['non-finite number', d => { first(d, 'mealItems').carbs = Infinity; }],
    ['invalid date', d => { first(d, 'meals').date = '2026-02-30'; }],
    ['invalid timestamp', d => { first(d, 'mealItems').logged_at = '2026-02-30T10:00:00Z'; }],
    ['invalid water date', d => { d.waterLogs = { '2026-13-01': 500 }; }],
    ['foreign owner', d => { first(d, 'weightLogs').user_id = 'another-user'; }],
    ['foreign template owner', d => { first(d, 'mealTemplates').user_id = 'another-user'; }],
    ['missing program', d => { first(d, 'workoutDays').program_id = 'missing'; }],
    ['missing exercise', d => { first(d, 'workoutExercises').exercise_id = 'missing'; }],
    ['invalid rep range', d => { first(d, 'workoutExercises').rep_range_min = 999; }],
    ['missing meal', d => { first(d, 'mealItems').meal_id = 'missing'; }],
    ['missing template', d => { first(d, 'meals').template_id = 'missing'; }],
    ['missing food in complete backup', d => { first(d, 'mealItems').food_id = 'missing'; }],
    ['orphan set', d => { first(d, 'setHistory').session_id = 'missing'; }],
    ['set from another day', d => { first(d, 'setHistory').workout_exercise_id = 'we-pull-1'; }],
    ['foreign session owner', d => { first(d, 'workoutHistory').user_id = 'another-user'; }],
    ['session reversed time', d => { first(d, 'workoutHistory').end_time = '2026-11-19T10:00:00Z'; }],
    ['unfinished history', d => { first(d, 'workoutHistory').status = 'IN_PROGRESS'; }],
    ['orphan active sets', d => { d.activeSets = d.setHistory; }],
    ['timer without session', d => { d.restTimerActive = true; d.restTimerEndsAt = 1795172460000; }],
    ['inactive timer with deadline', d => { d.restTimerEndsAt = 1795172460000; }],
  ];
  it.each(invalidCases)('rejects %s without changing existing data', (_name, mutate) => {
    const payload = workoutFixture();
    mutate(payload.data);
    const before = useAppStore.getState();
    expect(parse(payload).success).toBe(false);
    expect(useAppStore.getState()).toBe(before);
  });

  it.each(['null', '[]', '{', '{"app":"OTHER","schema_version":1}', '{"app":"PULSE","schema_version":2}'])('rejects malformed envelope %s', input => {
    expect(validateImportPayload(input).success).toBe(false);
  });
});
