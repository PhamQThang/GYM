import { Exercise, WorkoutProgram, WorkoutDay, WorkoutExercise, Food, Meal, MealItem, WeightLog } from './types';

// ==========================================
// SEEDED EXERCISES
// ==========================================
export const SEED_EXERCISES: Exercise[] = [
  { id: 'ex-bench', name: 'Đẩy Ngực Ngang Tạ Đòn', primary_muscle: 'Ngực Giữa', secondary_muscles: ['Vai Trước', 'Tay Sau'], type: 'Barbell' },
  { id: 'ex-incline-smith', name: 'Đẩy Ngực Dốc Lên (Máy Smith)', primary_muscle: 'Ngực Trên', secondary_muscles: ['Vai Trước'], type: 'Machine' },
  { id: 'ex-pec-deck', name: 'Ép Ngực Máy', primary_muscle: 'Ngực Trong', secondary_muscles: [], type: 'Machine' },
  { id: 'ex-lat-pulldown', name: 'Kéo Xô Rộng Tay', primary_muscle: 'Xô', secondary_muscles: ['Bắp Tay Trước'], type: 'Cable' },
  { id: 'ex-cable-row', name: 'Ngồi Kéo Cáp Tập Lưng', primary_muscle: 'Lưng Giữa', secondary_muscles: ['Cầu Vai', 'Xô'], type: 'Cable' },
  { id: 'ex-cable-curl', name: 'Cuốn Cáp Cầm Ngửa', primary_muscle: 'Bắp Tay Trước', secondary_muscles: ['Cẳng Tay'], type: 'Cable' },
  { id: 'ex-tri-ext', name: 'Kéo Cáp Qua Đầu', primary_muscle: 'Tay Sau', secondary_muscles: [], type: 'Cable' },
  { id: 'ex-squat', name: 'Gánh Tạ (Squat)', primary_muscle: 'Đùi Trước', secondary_muscles: ['Mông', 'Lưng Dưới'], type: 'Barbell' },
  { id: 'ex-leg-press', name: 'Máy Đạp Đùi (Leg Press)', primary_muscle: 'Đùi Trước', secondary_muscles: ['Mông'], type: 'Machine' },
  { id: 'ex-leg-curl', name: 'Ngồi Cuốn Đùi Sau', primary_muscle: 'Đùi Sau', secondary_muscles: [], type: 'Machine' },
  { id: 'ex-rdl', name: 'Romanian Deadlift (RDL)', primary_muscle: 'Đùi Sau', secondary_muscles: ['Mông', 'Lưng Dưới'], type: 'Barbell' },
  { id: 'ex-ohp', name: 'Đẩy Tạ Đơn Qua Đầu', primary_muscle: 'Vai Trước', secondary_muscles: ['Tay Sau'], type: 'Dumbbell' },
  { id: 'ex-lat-raise', name: 'Kéo Cáp Dang Vai', primary_muscle: 'Vai Giữa', secondary_muscles: [], type: 'Cable' },
  { id: 'ex-calf-raise', name: 'Nhón Gót (Calf Raise)', primary_muscle: 'Bắp Chân', secondary_muscles: [], type: 'Machine' },
];

// ==========================================
// HYPERTROPHY 5X/WEEK PROGRAM
// ==========================================
export const SEED_PROGRAM: WorkoutProgram = {
  id: 'prog-hyp-5x',
  name: 'Lịch Tập Phì Đại Chuyên Sâu 5 Ngày/Tuần',
  phase: 'Giai Đoạn II',
  description: 'Tối ưu hóa sự phát triển cơ bắp nạc với tần suất cao. Tập lặp lại các nhóm cơ 2 lần mỗi 8 ngày.',
};

export const SEED_WORKOUT_DAYS: WorkoutDay[] = [
  { id: 'day-push', program_id: 'prog-hyp-5x', name: 'Ngày Push', day_of_week: 1, is_active: true, focus: 'Ngực, Vai, Tay Sau', notes: '' },
  { id: 'day-pull', program_id: 'prog-hyp-5x', name: 'Ngày Pull', day_of_week: 2, is_active: true, focus: 'Lưng, Tay Trước, Vai Sau', notes: '' },
  { id: 'day-legs', program_id: 'prog-hyp-5x', name: 'Ngày Chân', day_of_week: 3, is_active: true, focus: 'Đùi Trước, Đùi Sau, Bắp Chân', notes: '' },
  { id: 'day-upper', program_id: 'prog-hyp-5x', name: 'Thân Trên', day_of_week: 5, is_active: true, focus: 'Ngực, Lưng, Tay', notes: '' },
  { id: 'day-lower', program_id: 'prog-hyp-5x', name: 'Thân Dưới', day_of_week: 6, is_active: true, focus: 'Toàn Bộ Thân Dưới', notes: '' },
];

export const SEED_WORKOUT_EXERCISES: WorkoutExercise[] = [
  // Push Day
  { id: 'we-push-1', workout_day_id: 'day-push', exercise_id: 'ex-incline-smith', order_index: 0, planned_sets: 4, rep_range_min: 8, rep_range_max: 10, rest_seconds: 90, notes: '', is_active: true },
  { id: 'we-push-2', workout_day_id: 'day-push', exercise_id: 'ex-bench', order_index: 1, planned_sets: 3, rep_range_min: 8, rep_range_max: 12, rest_seconds: 90, notes: '', is_active: true },
  { id: 'we-push-3', workout_day_id: 'day-push', exercise_id: 'ex-pec-deck', order_index: 2, planned_sets: 3, rep_range_min: 12, rep_range_max: 15, rest_seconds: 60, notes: '', is_active: true },
  { id: 'we-push-4', workout_day_id: 'day-push', exercise_id: 'ex-ohp', order_index: 3, planned_sets: 3, rep_range_min: 8, rep_range_max: 12, rest_seconds: 90, notes: '', is_active: true },
  { id: 'we-push-5', workout_day_id: 'day-push', exercise_id: 'ex-lat-raise', order_index: 4, planned_sets: 3, rep_range_min: 12, rep_range_max: 15, rest_seconds: 60, notes: '', is_active: true },
  { id: 'we-push-6', workout_day_id: 'day-push', exercise_id: 'ex-tri-ext', order_index: 5, planned_sets: 3, rep_range_min: 10, rep_range_max: 12, rest_seconds: 60, notes: '', is_active: true },

  // Pull Day
  { id: 'we-pull-1', workout_day_id: 'day-pull', exercise_id: 'ex-lat-pulldown', order_index: 0, planned_sets: 4, rep_range_min: 10, rep_range_max: 12, rest_seconds: 90, notes: '', is_active: true },
  { id: 'we-pull-2', workout_day_id: 'day-pull', exercise_id: 'ex-cable-row', order_index: 1, planned_sets: 3, rep_range_min: 10, rep_range_max: 12, rest_seconds: 90, notes: '', is_active: true },
  { id: 'we-pull-3', workout_day_id: 'day-pull', exercise_id: 'ex-cable-curl', order_index: 2, planned_sets: 3, rep_range_min: 10, rep_range_max: 12, rest_seconds: 60, notes: '', is_active: true },

  // Legs Day
  { id: 'we-legs-1', workout_day_id: 'day-legs', exercise_id: 'ex-squat', order_index: 0, planned_sets: 4, rep_range_min: 6, rep_range_max: 8, rest_seconds: 120, notes: '', is_active: true },
  { id: 'we-legs-2', workout_day_id: 'day-legs', exercise_id: 'ex-leg-press', order_index: 1, planned_sets: 3, rep_range_min: 10, rep_range_max: 12, rest_seconds: 90, notes: '', is_active: true },
  { id: 'we-legs-3', workout_day_id: 'day-legs', exercise_id: 'ex-rdl', order_index: 2, planned_sets: 3, rep_range_min: 8, rep_range_max: 10, rest_seconds: 90, notes: '', is_active: true },
  { id: 'we-legs-4', workout_day_id: 'day-legs', exercise_id: 'ex-leg-curl', order_index: 3, planned_sets: 3, rep_range_min: 12, rep_range_max: 15, rest_seconds: 60, notes: '', is_active: true },
  { id: 'we-legs-5', workout_day_id: 'day-legs', exercise_id: 'ex-calf-raise', order_index: 4, planned_sets: 4, rep_range_min: 15, rep_range_max: 20, rest_seconds: 60, notes: '', is_active: true },

  // Upper Day
  { id: 'we-upper-1', workout_day_id: 'day-upper', exercise_id: 'ex-bench', order_index: 0, planned_sets: 3, rep_range_min: 8, rep_range_max: 10, rest_seconds: 90, notes: '', is_active: true },
  { id: 'we-upper-2', workout_day_id: 'day-upper', exercise_id: 'ex-lat-pulldown', order_index: 1, planned_sets: 3, rep_range_min: 8, rep_range_max: 10, rest_seconds: 90, notes: '', is_active: true },
  { id: 'we-upper-3', workout_day_id: 'day-upper', exercise_id: 'ex-ohp', order_index: 2, planned_sets: 3, rep_range_min: 8, rep_range_max: 10, rest_seconds: 90, notes: '', is_active: true },
  { id: 'we-upper-4', workout_day_id: 'day-upper', exercise_id: 'ex-cable-row', order_index: 3, planned_sets: 3, rep_range_min: 10, rep_range_max: 12, rest_seconds: 90, notes: '', is_active: true },
  { id: 'we-upper-5', workout_day_id: 'day-upper', exercise_id: 'ex-cable-curl', order_index: 4, planned_sets: 3, rep_range_min: 12, rep_range_max: 15, rest_seconds: 60, notes: '', is_active: true },
  { id: 'we-upper-6', workout_day_id: 'day-upper', exercise_id: 'ex-tri-ext', order_index: 5, planned_sets: 3, rep_range_min: 12, rep_range_max: 15, rest_seconds: 60, notes: '', is_active: true },

  // Lower Day
  { id: 'we-lower-1', workout_day_id: 'day-lower', exercise_id: 'ex-squat', order_index: 0, planned_sets: 3, rep_range_min: 8, rep_range_max: 10, rest_seconds: 120, notes: '', is_active: true },
  { id: 'we-lower-2', workout_day_id: 'day-lower', exercise_id: 'ex-rdl', order_index: 1, planned_sets: 3, rep_range_min: 8, rep_range_max: 10, rest_seconds: 90, notes: '', is_active: true },
  { id: 'we-lower-3', workout_day_id: 'day-lower', exercise_id: 'ex-leg-press', order_index: 2, planned_sets: 3, rep_range_min: 10, rep_range_max: 15, rest_seconds: 90, notes: '', is_active: true },
  { id: 'we-lower-4', workout_day_id: 'day-lower', exercise_id: 'ex-leg-curl', order_index: 3, planned_sets: 3, rep_range_min: 12, rep_range_max: 15, rest_seconds: 60, notes: '', is_active: true },
  { id: 'we-lower-5', workout_day_id: 'day-lower', exercise_id: 'ex-calf-raise', order_index: 4, planned_sets: 4, rep_range_min: 15, rep_range_max: 20, rest_seconds: 60, notes: '', is_active: true },
];

// ==========================================
// SEEDED NUTRITION (FOODS & MEALS)
// ==========================================
export const SEED_FOODS: Food[] = [
  { id: 'f-1', name: 'Sữa Whey Protein', serving_size: '1 Muỗng', calories_per_serving: 140, protein_per_serving: 30, carbs_per_serving: 3, fat_per_serving: 1, is_quick_add: true },
  { id: 'f-2', name: 'Úc Gà Nướng Đút Lò', serving_size: '200g', calories_per_serving: 330, protein_per_serving: 62, carbs_per_serving: 0, fat_per_serving: 7, is_quick_add: true },
  { id: 'f-3', name: 'Cơm Trắng Đã Nấu', serving_size: '200g', calories_per_serving: 260, protein_per_serving: 5, carbs_per_serving: 56, fat_per_serving: 1, is_quick_add: true },
  { id: 'f-4', name: 'Creatine Monohydrate', serving_size: '5g', calories_per_serving: 0, protein_per_serving: 0, carbs_per_serving: 0, fat_per_serving: 0, is_quick_add: true },
];

export const SEED_MEALS: Meal[] = [
  { id: 'm-1', user_id: 'u-1', name: 'Bữa Sáng', scheduled_time: '07:45 Sáng • Đánh thức trao đổi chất', description: 'Đẩy mạnh năng lượng đầu ngày', status: 'CONSUMED' },
  { id: 'm-2', user_id: 'u-1', name: 'Bữa Trưa', scheduled_time: '12:30 Trưa • Nạp Glycogen Tối Đa', description: 'Nhiên liệu chính trong ngày', status: 'CONSUMED' },
  { id: 'm-3', user_id: 'u-1', name: 'Trước Tập', scheduled_time: '04:15 Chiều • Chuẩn Bị Anabolic', description: 'Carb tiêu hoá nhanh', status: 'CONSUMED' },
  { id: 'm-4', user_id: 'u-1', name: 'Bữa Tối', scheduled_time: '08:00 Tối • Phục Hồi Sau Tập', description: 'Đạm và Chất béo tốt', status: 'PLANNED' },
];


// Helper: create an ISO timestamp for today at a given local hour and minute.
// Used only for seed data. Does NOT use toISOString().slice for calendar-day grouping.
const todayAt = (h: number, m: number): string => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export const SEED_MEAL_ITEMS: MealItem[] = [
  // Breakfast — meal m-1 is CONSUMED, items get today's logged_at
  { id: 'mi-1', meal_id: 'm-1', name: '3 Trứng Nguyên Đập + 2 Lòng Trắng', calories: 260, protein: 28, carbs: 2, fat: 15, logged_at: todayAt(7, 45) },
  { id: 'mi-2', meal_id: 'm-1', name: '80g Yến Mạch Cán Mỏng & Quả Mọng', calories: 300, protein: 10, carbs: 58, fat: 5, logged_at: todayAt(7, 46) },
  { id: 'mi-3', meal_id: 'm-1', name: 'Cà Phê Đen + 5g Creatine', calories: 60, protein: 10, carbs: 12, fat: 0, logged_at: todayAt(7, 47) },
  // Lunch — meal m-2 is CONSUMED
  { id: 'mi-4', meal_id: 'm-2', name: '220g Ức Gà Nướng Áp Chảo', calories: 360, protein: 52, carbs: 0, fat: 6, logged_at: todayAt(12, 30) },
  { id: 'mi-5', meal_id: 'm-2', name: '250g Cơm Trắng Dẻo Gạo ST25', calories: 325, protein: 6, carbs: 70, fat: 1, logged_at: todayAt(12, 31) },
  { id: 'mi-6', meal_id: 'm-2', name: 'Bông Cải Xanh Hấp & Dầu Ô-liu', calories: 55, protein: 0, carbs: 25, fat: 7, logged_at: todayAt(12, 32) },
  // Pre-workout — meal m-3 is CONSUMED
  { id: 'mi-7', meal_id: 'm-3', name: 'Bánh Gạo Trắng Bỏ Lò + Chuối + Mật Ong', calories: 240, protein: 4, carbs: 56, fat: 1, logged_at: todayAt(16, 15) },
  { id: 'mi-8', meal_id: 'm-3', name: '1 Muỗng Clear Whey Isolate Tinh Khiết', calories: 140, protein: 20, carbs: 6, fat: 3, logged_at: todayAt(16, 16) },
  // Dinner — meal m-4 is PLANNED (not yet consumed), no logged_at
  { id: 'mi-9', meal_id: 'm-4', name: '200g Bò Bằm Giảm Mỡ (90/10) & Khoai Lang Đỏ', calories: 600, protein: 42, carbs: 55, fat: 20 },
];

// ==========================================
// SEEDED WEIGHT LOGS
// ==========================================
export const SEED_WEIGHT_LOGS: WeightLog[] = [
  { id: 'wl-1', user_id: 'u-1', date: '2026-09-01', weight: 60.0 },
  { id: 'wl-2', user_id: 'u-1', date: '2026-09-15', weight: 61.5 },
  { id: 'wl-3', user_id: 'u-1', date: '2026-09-30', weight: 62.0 },
  { id: 'wl-4', user_id: 'u-1', date: '2026-10-14', weight: 63.2 },
  { id: 'wl-5', user_id: 'u-1', date: '2026-10-21', weight: 64.1 },
  { id: 'wl-6', user_id: 'u-1', date: '2026-10-28', weight: 65.0 },
];
