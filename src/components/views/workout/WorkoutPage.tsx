import type { ReactNode } from 'react';

export function WorkoutPage({ children }: { children: ReactNode }) {
  return <div className="space-y-6 pb-20 animate-in fade-in duration-500">{children}</div>;
}
