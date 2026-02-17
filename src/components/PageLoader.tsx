import type { ReactElement } from 'react';

export const PageLoader = (): ReactElement => (
  <div
    className="flex items-center justify-center gap-2 py-24"
    role="status"
    aria-label="Loading"
  >
    {[0, 150, 300].map((delay) => (
      <span
        key={delay}
        className="h-3 w-3 rounded-full bg-[var(--color-primary)] animate-pulse"
        style={{ animationDelay: `${delay}ms` }}
      />
    ))}
  </div>
);
