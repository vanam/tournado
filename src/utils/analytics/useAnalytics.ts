import { createContext, useContext } from "react";
import type { GoogleAnalyticsTracker } from "./tracker";

type AnalyticsContextProps = {
  tracker: GoogleAnalyticsTracker;
};

export const AnalyticsContext = createContext<AnalyticsContextProps>(
  {} as AnalyticsContextProps
);

export const useAnalytics = (): AnalyticsContextProps => useContext(AnalyticsContext);
