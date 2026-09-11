import { Flame, Timer, Dumbbell } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { navItems } from '../lib/nav';
import { useAppStore } from '../lib/store';
import { useRestTimer } from '../lib/useRestTimer';
import { calculateWorkoutStreak } from '../lib/analytics';
import { ROUTES } from '../lib/navigation';

export default function Sidebar() {
  const { pathname } = useLocation();
  const user = useAppStore((s) => s.user);
  const resetRestTimer = useAppStore((s) => s.resetRestTimer);
  const workoutHistory = useAppStore((s) => s.workoutHistory);
  const { remaining, active: restTimerActive } = useRestTimer();
  
  const m = Math.floor(remaining / 60).toString().padStart(2, '0');
  const s = (remaining % 60).toString().padStart(2, '0');
  const streak = calculateWorkoutStreak(workoutHistory);

  return (
    <aside className="w-[280px] min-w-[280px] bg-[var(--color-panel-bg)] border-r border-[var(--color-border)] flex flex-col h-full shrink-0 z-20 hidden lg:flex">
      {/* Brand */}
      <div className="h-24 flex items-center px-6 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-app-bg)] rounded-xl flex items-center justify-center border border-[var(--color-border)]">
            <Flame className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide">PULSE / KINETIC</h1>
            <p className="text-xs text-[var(--color-text-muted)] tracking-wider">HỆ THỐNG APEX GYM</p>
          </div>
        </div>
      </div>

      {/* Profile */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#1e293b] rounded-full flex items-center justify-center border border-[var(--color-border)]">
             <Dumbbell className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">{user.name}</h2>
            <p className="text-xs text-[var(--color-text-muted)]">{user.current_weight.toFixed(1)} kg • Đang Hoạt Động</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className="bg-[rgba(74,222,128,0.1)] text-[var(--color-primary)] px-2 py-1 rounded-md font-medium uppercase tracking-wider">
            Tăng Cơ Nạc
          </span>
          <span className="text-[var(--color-text-muted)]">Mục tiêu: {user.target_weight.toFixed(1)} kg</span>
        </div>
      </div>

      {/* Navigation */}
      <nav aria-label="Điều hướng chính" className="px-4 flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => {
            let active;
            if (item.id === 'overview') {
              active = pathname === ROUTES.overview;
            } else if (item.id === 'workout') {
              active = pathname === ROUTES.workout || pathname === ROUTES.workoutProgram || pathname === ROUTES.workoutLibrary;
            } else {
              active = pathname === item.path;
            }

            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium",
                    active
                      ? "bg-[var(--color-card-bg)] text-[var(--color-primary)] border border-[var(--color-border)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-app-bg)] border border-transparent"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", active ? "text-[var(--color-primary)]" : "")} />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Widgets */}
      <div className="p-6 space-y-4">
        {/* Streak */}
        <div className="bg-[var(--color-card-bg)] rounded-xl p-4 border border-[var(--color-border)] flex items-center justify-between">
           <div className="flex items-center gap-3">
             <Flame className="w-5 h-5 text-orange-400" />
             <div>
               <div className="font-semibold text-sm">
                 {streak > 0 ? `${streak} Ngày` : 'Chưa Có'}
               </div>
               <div className="text-[10px] text-[var(--color-text-muted)]">Chuỗi Ngày Tập</div>
             </div>
           </div>
           <div className={`w-2 h-2 rounded-full ${streak > 0 ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-text-muted)]'}`}></div>
        </div>
        
        {/* Timer */}
        {restTimerActive && (
          <div className="bg-[var(--color-app-bg)] rounded-xl p-4 border border-[var(--color-border)] flex items-center justify-between">
             <div className="flex items-center gap-3">
               <Timer className="w-5 h-5 text-blue-400" />
               <div>
                 <div className="font-semibold text-sm">{m}:{s}</div>
                 <div className="text-[10px] text-[var(--color-text-muted)]">Đang Nghỉ</div>
               </div>
             </div>
             <button onClick={resetRestTimer} className="text-[10px] bg-[var(--color-card-bg)] border border-[var(--color-border)] px-2 py-1 rounded hover:bg-[var(--color-card-hover)] transition-colors">
               Làm Mới
             </button>
          </div>
        )}
      </div>
    </aside>
  );
}
