import { type ReactElement } from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
}

export const ProgressBar = ({ value, max, className }: ProgressBarProps): ReactElement => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <div className="h-1 flex-1 rounded-full bg-[var(--color-border)]">
        <div
          style={{ width: `${pct}%` }}
          className="h-full rounded-full bg-[var(--color-border-strong)] transition-[width]"
        />
      </div>
      <span className="shrink-0 w-8 text-right text-xs tabular-nums text-[var(--color-muted)]">
        {Math.round(pct)}%
      </span>
    </div>
  );
};
