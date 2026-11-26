import { Calendar, Flame, LayoutDashboard as DashboardIcon, UserCircle, Users } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { formatTodayVietnamese } from '../lib/analytics';
import { cn } from '../lib/utils';
import { navItems } from '../lib/nav';
import type { AuthProfile } from '../features/auth/auth-types';

export function RoleDashboard({ profile }: { profile: AuthProfile }) {
  const { pathname } = useLocation();
  const trainer = profile.role === 'pt';
  const area = trainer ? 'Khu vực PT' : 'Khu vực học viên';
  const items = trainer ? [
    { to: '/pt', label: 'Tổng quan', Icon: DashboardIcon },
    { to: '/pt/clients', label: 'Học viên', Icon: Users },
    { to: '/account', label: 'Tài khoản', Icon: UserCircle },
  ] : navItems.map(item => ({
    to: item.id === 'settings' ? '/account' : item.id === 'overview' ? '/client' : '/client' + item.path,
    label: item.id === 'settings' ? 'Tài khoản' : item.label,
    Icon: item.id === 'settings' ? UserCircle : item.icon,
  }));
  function navigation(mobile: boolean) {
    return <nav aria-label="Điều hướng khu vực" className={mobile
      ? 'shrink-0 border-t border-[var(--color-border)] bg-[var(--color-panel-bg)] px-3 pb-[env(safe-area-inset-bottom)] lg:hidden'
      : 'px-4'}>
      <ul className={mobile ? `grid gap-1 py-1 ${trainer ? 'grid-cols-3' : 'grid-cols-6'}` : 'space-y-1'}>
        {items.map(({ to, label, Icon }) => <li key={to}>
          <NavLink to={to} end className={({ isActive }) => cn(
            'flex min-h-12 items-center rounded-xl border border-transparent font-medium hover:bg-[var(--color-card-bg)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]',
            mobile ? 'flex-col justify-center gap-0.5 px-0.5 text-center text-[9px] sm:text-xs' : 'gap-3 px-4 text-sm',
            isActive ? 'border-[var(--color-border)] bg-[var(--color-card-bg)] text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]',
          )}>
            <Icon aria-hidden="true" className="size-5" />
            {label}
          </NavLink>
        </li>)}
      </ul>
    </nav>;
  }
  const sidebar = <aside className="hidden w-[280px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-panel-bg)] lg:flex">
    <div className="flex h-24 items-center gap-3 border-b border-[var(--color-border)] px-6">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-app-bg)]">
        <Flame aria-hidden="true" className="size-5 text-[var(--color-primary)]" />
      </div>
      <span className="text-lg font-bold tracking-wide">PULSE / KINETIC</span>
    </div>
    {profile.full_name && <p className="break-words px-6 pt-5 font-semibold">{profile.full_name}</p>}
    <div className="pt-4">{navigation(false)}</div>
  </aside>;
  const header = <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 sm:px-6 lg:min-h-20 lg:px-10">
    <span className="font-semibold">{area}</span>
    <span className="inline-flex items-center gap-2 text-right text-sm text-[var(--color-text-muted)]">
      <Calendar aria-hidden="true" className="hidden size-4 shrink-0 sm:block" />
      {formatTodayVietnamese()}
    </span>
  </header>;

  return <DashboardLayout sidebar={sidebar} header={header} mobileNav={navigation(true)} scrollKey={pathname}>
    <Outlet />
  </DashboardLayout>;
}
