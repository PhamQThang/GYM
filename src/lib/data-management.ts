import { useAppStore, PERSISTED_DATA_KEYS, type PersistedAppData } from './store';
import { SEED_EXERCISES, SEED_FOODS, SEED_MEAL_TEMPLATES, SEED_PROGRAM, SEED_WORKOUT_DAYS, SEED_WORKOUT_EXERCISES } from './seed';

// Constants
const SCHEMA_VERSION = 1;
const APP_IDENTIFIER = "PULSE";

/** Deliberately select data fields even when the caller passes the whole store. */
export function createBackupPayload(state: PersistedAppData) {
  const data = Object.fromEntries(PERSISTED_DATA_KEYS.map(key => [key, state[key]]));
  return { app: APP_IDENTIFIER, schema_version: SCHEMA_VERSION, exported_at: new Date().toISOString(), data };
}

export function exportData() {
  const payload = createBackupPayload(useAppStore.getState());

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })();
  const a = document.createElement('a');
  a.href = url;
  a.download = `PULSE_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportWeightCSV(logs: { date: string, weight: number }[]) {
  if (!logs.length) return;
  const header = "Date,Weight (kg)\n";
  const rows = logs.map(l => {
    const dateE = `"${l.date.replace(/"/g, '""')}"`;
    const weightE = `"${String(l.weight).replace(/"/g, '""')}"`;
    return `${dateE},${weightE}`;
  }).join("\n");
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const d = new Date();
  const yList = String(d.getFullYear());
  const mList = String(d.getMonth() + 1).padStart(2, '0');
  const dList = String(d.getDate()).padStart(2, '0');
  const dateStr = `${yList}-${mList}-${dList}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = `PULSE_Weight_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Validation builds fresh objects: untrusted JSON never becomes store state directly.
type JsonObject = Record<string, unknown>;
type Rule = (value: unknown, path: string) => unknown;
const fail = (path: string): never => { throw new Error(`Dữ liệu sao lưu không hợp lệ: ${path}.`); };
function object(value: unknown, path: string): JsonObject {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail(path);
  return value as JsonObject;
}
const text: Rule = (v, p) => typeof v === 'string' ? v : fail(p);
const id: Rule = (v, p) => typeof v === 'string' && v.trim().length > 0 ? v : fail(p);
const number: Rule = (v, p) => typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fail(p);
const integer: Rule = (v, p) => { number(v, p); return Number.isSafeInteger(v) ? v : fail(p); };
const positiveInteger: Rule = (v, p) => { integer(v, p); return (v as number) > 0 ? v : fail(p); };
const boolean: Rule = (v, p) => typeof v === 'boolean' ? v : fail(p);
const optional = (rule: Rule): Rule => (v, p) => v === undefined ? undefined : rule(v, p);
const oneOf = (...values: string[]): Rule => (v, p) => typeof v === 'string' && values.includes(v) ? v : fail(p);
// Existing seed backups include a Vietnamese period label and a display description.
// Keep those labels while validating their clock portion; new plain times use 24h.
const scheduledTime: Rule = (v, p) => {
  if (typeof v !== 'string') return fail(p);
  const clock = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
  const legacy = /^(?:0[1-9]|1[0-2]):[0-5]\d (?:Sáng|Trưa|Chiều|Tối)(?: • .+)?$/;
  return clock.test(v) || legacy.test(v) ? v : fail(p);
};
const date: Rule = (v, p) => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) fail(p);
  const parsed = new Date(`${v as string}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === v ? v : fail(p);
};
const timestamp: Rule = (v, p) => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(v)) fail(p);
  date((v as string).slice(0, 10), p);
  return Number.isFinite(Date.parse(v as string)) ? v : fail(p);
};
const strings: Rule = (v, p) => {
  if (!Array.isArray(v)) fail(p);
  return (v as unknown[]).map((entry, i) => text(entry, `${p}[${i}]`));
};
const flags = { is_system: boolean, is_modified: boolean };
const schema = (fields: Record<string, Rule>): Rule => (v, p) => {
  const input = object(v, p);
  return Object.fromEntries(Object.entries(fields).flatMap(([key, rule]) => {
    const value = rule(input[key], `${p}.${key}`);
    return value === undefined ? [] : [[key, value]];
  }));
};
const userSchema = schema({
  id, name: id, height: optional(number), current_weight: number, target_weight: number,
  goal_type: optional(oneOf('Lean Bulk', 'Cut', 'Maintenance')),
  target_calories: number, target_protein: number, target_carbs: number, target_fat: number,
  weight_unit: optional(oneOf('kg', 'lbs')), energy_unit: optional(oneOf('kcal', 'kJ')), soundEnabled: optional(boolean),
});
const sessionSchema = schema({
  id, user_id: id, workout_day_id: id, start_time: timestamp, end_time: optional(timestamp),
  status: oneOf('IN_PROGRESS', 'REVIEWING', 'COMPLETED'), total_volume: number,
  loaded_planned_exercises: optional(strings),
});
const setSchema = schema({
  id, session_id: id, workout_exercise_id: id, set_number: positiveInteger, weight: number,
  reps: integer, is_pr: optional(boolean), status: oneOf('PLANNED', 'COMPLETED', 'SKIPPED'),
});
const collectionSchemas = {
  exercises: schema({ id, name: id, primary_muscle: text, secondary_muscles: strings, type: text,
    equipment: optional(text), instructions: optional(text), is_custom: optional(boolean), is_active: optional(boolean), ...flags }),
  programs: schema({ id, name: id, phase: text, description: text, ...flags }),
  workoutDays: schema({ id, program_id: id, name: id, day_of_week: integer, is_active: boolean, focus: text, notes: text, ...flags }),
  workoutExercises: schema({ id, workout_day_id: id, exercise_id: id, order_index: integer,
    planned_sets: positiveInteger, rep_range_min: integer, rep_range_max: integer, rest_seconds: number, notes: text, is_active: optional(boolean), ...flags }),
  workoutHistory: sessionSchema,
  setHistory: setSchema,
  foods: schema({ id, name: id, serving_size: text, calories_per_serving: number, protein_per_serving: number,
    carbs_per_serving: number, fat_per_serving: number, is_quick_add: boolean, ...flags }),
  mealTemplates: schema({ id, user_id: id, name: id, scheduled_time: scheduledTime, description: text, ...flags }),
  meals: schema({ id, user_id: id, date, template_id: id, name: id, scheduled_time: scheduledTime, description: text,
    status: oneOf('PLANNED', 'CONSUMED', 'MISSED') }),
  mealItems: schema({ id, meal_id: id, food_id: optional(id), name: id, calories: number, protein: number,
    carbs: number, fat: number, logged_at: optional(timestamp) }),
  weightLogs: schema({ id, user_id: id, date, weight: number }),
  activeSets: setSchema,
};
const seedCatalogs: Record<string, { id: string }[]> = {
  exercises: SEED_EXERCISES, programs: [SEED_PROGRAM], workoutDays: SEED_WORKOUT_DAYS,
  workoutExercises: SEED_WORKOUT_EXERCISES, foods: SEED_FOODS, mealTemplates: SEED_MEAL_TEMPLATES,
};
function collection(value: unknown, rule: Rule, path: string): JsonObject[] {
  if (!Array.isArray(value)) fail(path);
  const ids = new Set<unknown>();
  return (value as unknown[]).map((entry, i) => {
    const result = rule(entry, `${path}[${i}]`) as JsonObject;
    if (ids.has(result.id)) fail(`${path}: ID trùng`);
    ids.add(result.id);
    return result;
  });
}

export type ImportResult =
  | { success: true; data: PersistedAppData; warnings: string[] }
  | { success: false; error: string };

export function validateImportPayload(jsonText: string): ImportResult {
  try {
    const raw = object(JSON.parse(jsonText) as unknown, 'tệp JSON');
    if (raw.app !== APP_IDENTIFIER || raw.schema_version !== SCHEMA_VERSION) fail('ứng dụng hoặc phiên bản');
    if (raw.exported_at !== undefined) timestamp(raw.exported_at, 'exported_at');
    const input = object(raw.data, 'data');
    const warnings: string[] = [];
    const missingFoods = input.foods === undefined;
    const data: JsonObject = { user: userSchema(input.user, 'user') };
    let restoredMetadata = false;
    for (const [key, rule] of Object.entries(collectionSchemas)) {
      let entries: unknown = key === 'foods' && missingFoods ? SEED_FOODS : input[key];
      const catalog = seedCatalogs[key];
      if (catalog && Array.isArray(entries)) {
        const seedIds = new Set(catalog.map(row => row.id));
        entries = entries.map((entry: unknown) => {
          const row = object(entry, key);
          if (row.is_system !== undefined && row.is_modified !== undefined) return row;
          restoredMetadata = true;
          return {
            ...row,
            is_system: row.is_system === undefined ? seedIds.has(row.id as string) : row.is_system,
            // An old backup may contain edited seed rows. Never overwrite them on hydration.
            is_modified: row.is_modified === undefined ? true : row.is_modified,
          };
        });
      }
      data[key] = collection(entries, rule, key);
    }
    if (restoredMetadata) warnings.push('Đã bổ sung thông tin danh mục còn thiếu trong bản sao lưu cũ và giữ nguyên nội dung để bảo toàn các chỉnh sửa của bạn.');
    if (missingFoods) warnings.push('Bản sao lưu cũ thiếu danh mục thực phẩm. Đã khôi phục danh mục mẫu; thực phẩm tùy chỉnh không được xuất trước đây không thể phục hồi. Nhật ký bữa ăn vẫn được giữ.');
    data.activeSession = input.activeSession === null ? null : sessionSchema(input.activeSession, 'activeSession');
    data.restTimerActive = boolean(input.restTimerActive, 'restTimerActive');
    data.restTimerSeconds = number(input.restTimerSeconds, 'restTimerSeconds');
    data.restTimerEndsAt = input.restTimerEndsAt === null ? null : integer(input.restTimerEndsAt, 'restTimerEndsAt');
    if (data.restTimerEndsAt !== null && !Number.isFinite(new Date(data.restTimerEndsAt as number).getTime())) fail('restTimerEndsAt');
    const water = object(input.waterLogs, 'waterLogs');
    data.waterLogs = Object.fromEntries(Object.entries(water).map(([key, value]) => {
      date(key, 'waterLogs.date');
      return [key, number(value, `waterLogs.${key}`)];
    }));

    // All scalar fields and collection elements have now been checked and copied.
    const result = data as unknown as PersistedAppData;
    const byId = <T extends { id: string }>(rows: T[]) => new Map(rows.map(row => [row.id, row]));
    const programs = byId(result.programs), days = byId(result.workoutDays), exercises = byId(result.exercises);
    const workoutExercises = byId(result.workoutExercises), meals = byId(result.meals), templates = byId(result.mealTemplates);
    const foods = byId(result.foods), history = byId(result.workoutHistory);
    const check = (condition: boolean, path: string) => { if (!condition) fail(path); };
    const owned = (owner: string, path: string) => check(owner === result.user.id, `${path}: khác người dùng`);
    for (const day of result.workoutDays) check(programs.has(day.program_id), `workoutDays.${day.id}.program_id`);
    for (const exercise of result.workoutExercises) {
      check(days.has(exercise.workout_day_id) && exercises.has(exercise.exercise_id), `workoutExercises.${exercise.id}: tham chiếu`);
      check(exercise.rep_range_min <= exercise.rep_range_max, `workoutExercises.${exercise.id}: khoảng reps`);
    }
    for (const template of result.mealTemplates) owned(template.user_id, `mealTemplates.${template.id}`);
    for (const meal of result.meals) {
      owned(meal.user_id, `meals.${meal.id}`);
      check(templates.has(meal.template_id), `meals.${meal.id}.template_id`);
    }
    for (const item of result.mealItems) {
      check(meals.has(item.meal_id), `mealItems.${item.id}.meal_id`);
      if (item.food_id && !foods.has(item.food_id)) {
        if (!missingFoods) fail(`mealItems.${item.id}.food_id`);
        // Preserve the actual logged snapshot; do not invent a custom catalog entry.
        delete item.food_id;
      }
    }
    for (const log of result.weightLogs) owned(log.user_id, `weightLogs.${log.id}`);
    const sessions = [...result.workoutHistory, ...(result.activeSession ? [result.activeSession] : [])];
    if (result.activeSession) check(!history.has(result.activeSession.id), 'activeSession: trùng lịch sử');
    for (const session of sessions) {
      owned(session.user_id, `sessions.${session.id}`);
      check(days.has(session.workout_day_id), `sessions.${session.id}.workout_day_id`);
      if (session.end_time) check(Date.parse(session.end_time) >= Date.parse(session.start_time), `sessions.${session.id}: thời gian kết thúc`);
      if (session.status !== 'IN_PROGRESS') check(!!session.end_time, `sessions.${session.id}: thiếu thời gian kết thúc`);
      else check(session.end_time === undefined, `sessions.${session.id}: buổi đang tập đã có thời gian kết thúc`);
      const loaded = session.loaded_planned_exercises ?? [];
      check(new Set(loaded).size === loaded.length, `sessions.${session.id}: bài tập trùng`);
      for (const exerciseId of loaded) check(workoutExercises.get(exerciseId)?.workout_day_id === session.workout_day_id, `sessions.${session.id}: bài tập khác ngày`);
    }
    for (const session of result.workoutHistory) check(session.status === 'COMPLETED', `workoutHistory.${session.id}.status`);
    if (result.activeSession) check(result.activeSession.status !== 'COMPLETED', 'activeSession.status');
    if (!result.activeSession) check(result.activeSets.length === 0, 'activeSets: thiếu buổi tập');
    const allSetIds = new Set<string>();
    for (const [rows, active] of [[result.setHistory, false], [result.activeSets, true]] as const) {
      for (const set of rows) {
        check(!allSetIds.has(set.id), 'sets: ID trùng');
        allSetIds.add(set.id);
        const session = active ? result.activeSession : history.get(set.session_id);
        check(!!session && session.id === set.session_id, `sets.${set.id}.session_id`);
        check(workoutExercises.get(set.workout_exercise_id)?.workout_day_id === session?.workout_day_id, `sets.${set.id}: bài tập khác buổi`);
      }
    }
    check(result.restTimerActive ? result.restTimerEndsAt !== null : result.restTimerEndsAt === null, 'timer: trạng thái không nhất quán');
    if (result.restTimerActive) check(result.activeSession?.status === 'IN_PROGRESS', 'timer: thiếu buổi đang tập');
    return { success: true, data: result, warnings };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Không thể đọc tệp sao lưu.' };
  }
}
