export const ROUTES = {
  overview: '/',
  workout: '/workout',
  workoutProgram: '/workout/program',
  workoutLibrary: '/workout/library',
  nutrition: '/nutrition',
  progress: '/progress',
  history: '/history',
  settings: '/settings',
} as const;

export const WORKOUT_TABS = [
  { id: 'active', path: ROUTES.workout, label: 'Bắt Đầu' },
  { id: 'program', path: ROUTES.workoutProgram, label: 'Lịch Trình' },
  { id: 'library', path: ROUTES.workoutLibrary, label: 'Thư Viện' },
] as const;
