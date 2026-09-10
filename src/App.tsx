import { useState } from 'react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import Overview from './components/views/Overview';
import Workout from './components/views/Workout';
import Nutrition from './components/views/Nutrition';
import Progress from './components/views/Progress';
import WorkoutHistory from './components/views/WorkoutHistory';
import Settings from './components/views/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'workout' | 'nutrition' | 'progress' | 'history' | 'settings'>('overview');

  return (
    <div className="flex h-screen bg-[var(--color-app-bg)] text-[var(--color-text-main)] overflow-hidden">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header activeTab={activeTab} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 lg:p-10 hide-scrollbar pb-24">
          <div className="max-w-[1400px] mx-auto w-full">
            {activeTab === 'overview' && <Overview />}
            {activeTab === 'workout' && <Workout />}
            {activeTab === 'nutrition' && <Nutrition />}
            {activeTab === 'progress' && <Progress />}
            {activeTab === 'history' && <WorkoutHistory />}
            {activeTab === 'settings' && <Settings />}
          </div>
        </main>
        
        {/* Mobile Navigation */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}
