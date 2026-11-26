import type { ReactNode } from 'react';

export function DashboardLayout({ sidebar, header, mobileNav, children, scrollKey }: {
  sidebar: ReactNode;
  header: ReactNode;
  mobileNav: ReactNode;
  children: ReactNode;
  scrollKey?: string;
}) {
  return <div className="flex h-dvh overflow-hidden bg-[var(--color-app-bg)] text-[var(--color-text-main)]">
    {sidebar}
    <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
      {header}
      <main key={scrollKey} className="relative z-0 w-full flex-1 overflow-y-auto">
        <div className="mx-auto min-h-full w-full max-w-[1920px] px-4 py-6 sm:px-6 md:py-8 lg:p-10">
          {children}
        </div>
      </main>
      {mobileNav}
    </div>
  </div>;
}
