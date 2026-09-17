import type { ReactNode } from 'react';

export function PageShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:px-8">{children}</div>;
}
