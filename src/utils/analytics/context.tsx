import {
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { GoogleAnalyticsTracker } from "./tracker";
import { AnalyticsContext } from "./useAnalytics";
import type { AnalyticsProviderConfig } from "./types";

function initializeGtag(measurementId: string): void {
  window.dataLayer = window.dataLayer ?? [];
  // Must use 'arguments' (not rest params) so GA4 can correctly classify dataLayer entries
  // eslint-disable-next-line prefer-rest-params
  window.gtag = function gtag(): void { (window.dataLayer as unknown[]).push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: false });
}

interface AnalyticsProviderProps {
  readonly config: AnalyticsProviderConfig;
  readonly children: ReactNode;
}

export const AnalyticsProvider = ({ config, children }: AnalyticsProviderProps): ReactElement => {
  const [tracker] = useState(() => {
    // Initialize synchronously so window.gtag exists before any child useEffect fires
    if (!config.disableTracking) {
      initializeGtag(config.measurementId);
    }
    return new GoogleAnalyticsTracker(config);
  });

  useEffect(() => {
    if (config.disableTracking ?? document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${config.measurementId}"]`)) {
      return;
    }
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${config.measurementId}`;
    document.head.append(script);
  }, [config.measurementId, config.disableTracking]);

  return (
    <AnalyticsContext.Provider value={{ tracker }}>
      {children}
    </AnalyticsContext.Provider>
  );
};
