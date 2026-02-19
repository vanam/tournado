import type {
  AnalyticsProviderConfig,
  TrackPageViewParams,
  TrackTournamentCreatedParams,
} from "./types";

export class GoogleAnalyticsTracker {
  private disabled: boolean;
  private urlTransformer: ((url: string) => string) | undefined;

  constructor(config: AnalyticsProviderConfig) {
    this.disabled = config.disableTracking ?? false;
    this.urlTransformer = config.urlTransformer;
  }

  trackPageView(params?: TrackPageViewParams): void {
    if (this.disabled || typeof window.gtag !== "function") return;

    let pageLocation: string;
    if (params?.page_location) {
      pageLocation =
        typeof params.page_location === "string"
          ? params.page_location
          : params.page_location.href;
    } else {
      pageLocation = window.location.href;
    }

    const transformedLocation = this.urlTransformer
      ? this.urlTransformer(pageLocation)
      : pageLocation;

    const language = params?.language ?? (document.documentElement.lang || undefined);

    const eventParams = {
        page_location: transformedLocation,
        language,
        user_agent: params?.user_agent,
    };

    window.gtag("event", "page_view", eventParams);
  }

  trackEvent(name: string, parameters?: Record<string, unknown>): void {
    if (this.disabled || typeof window.gtag !== "function") return;
    window.gtag("event", name, parameters);
  }

  trackTournamentCreated(params: TrackTournamentCreatedParams): void {
    this.trackEvent("tournament_created", { ...params });
  }
}
