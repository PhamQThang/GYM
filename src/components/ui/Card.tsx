import React, { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  key?: React.Key;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn("bg-[var(--color-panel-bg)] border border-[var(--color-border)] rounded-2xl p-6", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={cn("flex items-start justify-between mb-6", className)}>{children}</div>;
}

export function CardTitle({ children, className }: CardProps) {
  return <h3 className={cn("text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]", className)}>{children}</h3>;
}
