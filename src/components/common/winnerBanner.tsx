import type { ReactElement } from 'react';

interface WinnerBannerProps {
  label?: string | null;
}

export const WinnerBanner = ({ label }: WinnerBannerProps): ReactElement | null => {
  if (!label) return null;

  return (
    <div className="mb-6 bg-[var(--color-accent-soft)] border border-[var(--color-accent-border)] rounded-xl p-5 shadow-sm text-center">
      <p className="text-xl font-bold text-[var(--color-accent)] tracking-wide">&#127942; {label}</p>
    </div>
  );
}
