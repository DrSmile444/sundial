import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-card border border-sand bg-white/60 p-6 shadow-sm ${className}`}
      {...props}
    />
  );
}
