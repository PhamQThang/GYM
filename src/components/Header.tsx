import { Calendar, Bell, User } from 'lucide-react';
import { formatTodayVietnamese } from '../lib/analytics';

export default function Header() {
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
        
        
        
        
      </div>
    </header>
  );
}
