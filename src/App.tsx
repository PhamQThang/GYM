import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import Overview from './components/views/Overview';
import Workout from './components/views/Workout';
import Nutrition from './components/views/Nutrition';
import WorkoutHistory from './components/views/WorkoutHistory';
import Settings from './components/views/Settings';
import { ROUTES } from './lib/navigation';

const Progress = lazy(() => import('./components/views/Progress'));

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-[var(--color-app-bg)] text-[var(--color-text-main)] overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <Header />
          
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 lg:p-10 hide-scrollbar pb-24">
            <div className="max-w-[1400px] mx-auto w-full flex-1 flex flex-col relative h-full min-h-[50vh]">
              <Suspense fallback={
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin opacity-50"></div>
                </div>
              }>
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
            </div>
          </main>
          
          {/* Mobile Navigation */}
          <BottomNav />
        </div>
      </div>
    </BrowserRouter>
  );
}
