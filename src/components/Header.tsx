import { Calendar, Bell, User } from 'lucide-react';
import { formatTodayVietnamese } from '../lib/analytics';

interface HeaderProps {}

export default function Header(_props: HeaderProps) {
  return (
    <header className="h-20 min-h-20 shrink-0 border-b border-[var(--color-border)] px-6 md:px-8 lg:px-10 flex items-center justify-between sticky top-0 bg-[var(--color-app-bg)]/80 backdrop-blur-md z-10">
      <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] font-medium uppercase tracking-widest">
        <Calendar className="w-4 h-4" />
        <span>Hôm Nay • {formatTodayVietnamese()}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 bg-[var(--color-card-bg)] border border-[var(--color-border)] px-3 py-1.5 rounded-full">
           <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></div>
           <span className="text-xs font-semibold tracking-wider text-[var(--color-text-muted)]">SẴN SÀNG ĐẨY</span>
        </div>
        
        <button className="w-10 h-10 rounded-full bg-[var(--color-panel-bg)] border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-card-bg)] transition-colors relative">
          <Bell className="w-4 h-4 text-[var(--color-text-main)]" />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        </button>
        
        <button className="w-10 h-10 rounded-full bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/50 flex items-center justify-center hover:bg-[var(--color-primary)]/30 transition-colors">
          <User className="w-4 h-4 text-[var(--color-primary)]" />
        </button>
      </div>
    </header>
  );
}
