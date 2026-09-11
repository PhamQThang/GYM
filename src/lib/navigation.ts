import { TabId } from './types';

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

export const PRIMARY_NAV_ITEMS = [
  { id: 'overview', path: ROUTES.overview },
  { id: 'workout', path: ROUTES.workout },
  { id: 'nutrition', path: ROUTES.nutrition },
  { id: 'progress', path: ROUTES.progress },
  { id: 'history', path: ROUTES.history },
  { id: 'settings', path: ROUTES.settings },
] satisfies ReadonlyArray<{
  id: TabId;
  path: string;
}>;
