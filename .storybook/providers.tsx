import { useEffect, type ReactElement, type ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { TournadoDatabase } from '../src/db';
import type { LanguageKey, Tournament } from '../src/types';
import { DatabaseContext } from '../src/context/databaseContext';
import { TournamentProvider } from '../src/context/tournamentProvider';
import { LanguageProvider } from '../src/i18n/languageContext';
import { useTranslation } from '../src/i18n/useTranslation';
import { useTheme } from '../src/hooks/useTheme';
import { AnalyticsProvider } from '../src/utils/analytics/context';

const Preferences = ({
  theme,
  language,
}: {
  theme: 'dark' | 'light';
  language: LanguageKey;
}): null => {
  const { setTheme } = useTheme();
  const { setLanguage } = useTranslation();
  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);
  useEffect(() => {
    setLanguage(language);
  }, [language, setLanguage]);
  return null;
};

export const StoryProviders = ({
  children,
  db,
  tournament,
  route = '/',
  routeState,
  theme = 'dark',
  language = 'en',
}: {
  children: ReactNode;
  db: TournadoDatabase;
  tournament?: Tournament;
  route?: string;
  routeState?: unknown;
  theme?: 'dark' | 'light';
  language?: LanguageKey;
}): ReactElement => (
  <DatabaseContext.Provider value={{ db }}>
    <LanguageProvider>
      <AnalyticsProvider
        config={{ measurementId: 'storybook', disableTracking: true }}
      >
        <Preferences theme={theme} language={language} />
        <MemoryRouter initialEntries={[{ pathname: route, state: routeState }]}>
          <Routes>
            <Route
              path="*"
              element={
                tournament ? (
                  <TournamentProvider tournamentId={tournament.id}>
                    {children}
                  </TournamentProvider>
                ) : (
                  children
                )
              }
            />
            <Route path="/players/:id" element={children} />
            <Route path="/tournament/:id" element={children} />
          </Routes>
        </MemoryRouter>
      </AnalyticsProvider>
    </LanguageProvider>
  </DatabaseContext.Provider>
);
