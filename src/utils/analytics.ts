import { GA_ID } from '@/constants';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export function initAnalytics(): void {
  window.dataLayer = window.dataLayer as unknown[] | undefined ?? [];
  window.gtag = function gtag(...args: unknown[]): void {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
}

export function trackTournamentCreated(params: {
  tournament_type: string;
  scoring_mode: string;
  player_count: number;
  playoff_type: string;
}): void {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'tournament_created', params);
}
