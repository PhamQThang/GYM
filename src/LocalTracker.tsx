import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import { DashboardLayout } from './components/DashboardLayout';
import Overview from './components/views/LocalOverview';
import Workout from './components/views/Workout';
import Nutrition from './components/views/LocalNutrition';
import WorkoutHistory from './components/views/LocalWorkoutHistory';
import Settings from './components/views/Settings';
import { ROUTES } from './lib/navigation';

const Progress = lazy(() => import('./components/views/LocalProgress'));

export default function LocalTracker() {
  return (
    <DashboardLayout sidebar={<Sidebar />} header={<Header />} mobileNav={<BottomNav />}>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 md:w-10 md:h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div></div>}>
        <Routes>
          <Route path={ROUTES.overview} element={<Overview />} />
          <Route path={ROUTES.workout} element={<Workout />} />
          <Route path={ROUTES.workoutProgram} element={<Workout />} />
          <Route path={ROUTES.workoutLibrary} element={<Workout />} />
          <Route path={ROUTES.nutrition} element={<Nutrition />} />
          <Route path={ROUTES.progress} element={<Progress />} />
          <Route path={ROUTES.history} element={<WorkoutHistory />} />
          <Route path={ROUTES.settings} element={<Settings />} />
          <Route path="*" element={<Navigate to={ROUTES.overview} replace />} />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
}
