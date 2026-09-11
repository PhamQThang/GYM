import { LayoutDashboard, Dumbbell, Utensils, TrendingUp, Settings, History } from 'lucide-react';

import { ROUTES } from './navigation';

export const navItems = [
  { id: 'overview', label: 'Tổng Quan', icon: LayoutDashboard, path: ROUTES.overview },
  { id: 'workout', label: 'Tập Luyện', icon: Dumbbell, path: ROUTES.workout },
  { id: 'nutrition', label: 'Dinh Dưỡng', icon: Utensils, path: ROUTES.nutrition },
  { id: 'progress', label: 'Tiến Độ', icon: TrendingUp, path: ROUTES.progress },
  { id: 'history', label: 'Lịch Sử', icon: History, path: ROUTES.history },
  { id: 'settings', label: 'Cài Đặt', icon: Settings, path: ROUTES.settings },
] as const;
