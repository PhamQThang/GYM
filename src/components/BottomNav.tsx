import { Timer } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useRestTimer } from '../lib/useRestTimer';
import { useAppStore } from '../lib/store';
import { navItems } from '../lib/nav';
import { ROUTES } from '../lib/navigation';

export default function BottomNav() {
  const { pathname } = useLocation();
  const { remaining, active: restTimerActive } = useRestTimer();
  const resetRestTimer = useAppStore(state => state.resetRestTimer);
  
  const m = Math.floor(remaining / 60).toString().padStart(2, '0');
  const s = (remaining % 60).toString().padStart(2, '0');

  return (
    <>
      <nav
        aria-label="Mobile Navigation"
        className="
          lg:hidden
          fixed
          bottom-0
          left-0
          right-0
          z-50
          bg-[var(--color-panel-bg)]
          border-t
          border-[var(--color-border)]
          pb-[env(safe-area-inset-bottom)]
        "
      >
        {/* Mobile Timer Pill - Renders above the nav bar when active */}
        {restTimerActive && (
          <div className="absolute left-4 right-4 -top-16 flex justify-center pointer-events-none">
            <div className="bg-[var(--color-app-bg)]/90 backdrop-blur-md border border-[var(--color-border)] shadow-lg rounded-full px-4 py-2 flex items-center gap-3 pointer-events-auto shadow-[var(--color-primary)]/10">
              <Timer className="w-4 h-4 text-blue-400 animate-pulse" />
              <div className="font-bold text-sm tracking-wider">
                {m}:{s} <span className="text-[10px] text-[var(--color-text-muted)] font-normal ml-1 uppercase">Đang Nghỉ</span>
              </div>
              <button 
                onClick={resetRestTimer} 
                className="ml-2 text-[10px] bg-[var(--color-card-bg)] border border-[var(--color-border)] px-2 py-1 rounded hover:bg-[var(--color-card-hover)] transition-colors active:scale-95 min-h-[30px]"
                aria-label="Làm mới thời gian nghỉ"
              >
                Làm Mới
              </button>
            </div>
          </div>
        )}

        <ul className="flex items-center justify-around px-2 py-1">
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
              <li key={item.id} className="relative">
                <NavLink
                  to={item.path}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-2 py-1.5 transition-all duration-200 rounded-xl outline-none active:scale-95 touch-manipulation",
                    active
                      ? "text-[var(--color-primary)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg mb-0.5 relative z-10 transition-colors",
                    active ? "bg-[var(--color-primary)]/10" : "bg-transparent"
                  )}>
                    <item.icon className="w-5 h-5 mx-auto" />
                  </div>
                  <span className={cn(
                    "text-[9px] font-medium transition-all duration-200 whitespace-nowrap",
                    active ? "font-bold" : ""
                  )}>
                    {item.label}
                  </span>
                  
                  {/* Active Indicator Line */}
                  {active && (
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[var(--color-primary)] rounded-full" />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
