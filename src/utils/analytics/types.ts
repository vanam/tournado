declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export interface TrackPageViewParams {
  page_location?: string | Location;
  language?: string;
  user_agent?: string;
}

export interface AnalyticsProviderConfig {
  measurementId: string;
  disableTracking?: boolean;
  urlTransformer?: (url: string) => string;
}

export interface TrackTournamentCreatedParams {
  tournament_type: string;
  scoring_mode: string;
  player_count: number;
  playoff_type: string;
}
