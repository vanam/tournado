import {type ReactElement, lazy, Suspense} from 'react';
import {HashRouter, Routes, Route} from 'react-router-dom';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PageLoader } from './components/PageLoader';
import { DatabaseProvider } from './context/databaseProvider';
import { AnalyticsProvider, type AnalyticsProviderConfig } from './utils/analytics';
import {GA_ID} from "@/constants";

const UUID_V4_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;

function maskSensitiveUrl(url: string): string {
  return url.replaceAll(UUID_V4_REGEX, "**MASKED**");
}

const config: AnalyticsProviderConfig = {
  measurementId: GA_ID,
  urlTransformer: maskSensitiveUrl,
};


const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const CreateTournamentPage = lazy(() => import('./pages/CreateTournamentPage').then(m => ({ default: m.CreateTournamentPage })));
const TournamentPage = lazy(() => import('./pages/TournamentPage').then(m => ({ default: m.TournamentPage })));
const FaqPage = lazy(() => import('./pages/FaqPage').then(m => ({ default: m.FaqPage })));
const CreditsPage = lazy(() => import('./pages/CreditsPage').then(m => ({ default: m.CreditsPage })));
const FormatsPage = lazy(() => import('./pages/FormatsPage').then(m => ({ default: m.FormatsPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const TestPage = lazy(() => import('./pages/TestPage').then(m => ({ default: m.TestPage })));
const PlayerLibraryPage = lazy(() => import('./pages/PlayerLibraryPage').then(m => ({ default: m.PlayerLibraryPage })));
const PlayerProfilePage = lazy(() => import('./pages/PlayerProfilePage').then(m => ({ default: m.PlayerProfilePage })));
const FeaturesPage = lazy(() => import('./pages/FeaturesPage').then(m => ({ default: m.FeaturesPage })));
const DataPage = lazy(() => import('./pages/DataPage').then(m => ({ default: m.DataPage })));

export const App = (): ReactElement => {
  return (
    <DatabaseProvider>
      <AnalyticsProvider config={config}>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <HomePage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/create" element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <CreateTournamentPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/tournament/:id" element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <TournamentPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/faq" element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <FaqPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/credits" element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <CreditsPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/formats" element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <FormatsPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/test" element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <TestPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/players" element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <PlayerLibraryPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/players/:id" element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <PlayerProfilePage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/features" element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <FeaturesPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/data" element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <DataPage />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="*" element={
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <NotFoundPage />
                </Suspense>
              </ErrorBoundary>
            } />
          </Route>
        </Routes>
      </HashRouter>
    </AnalyticsProvider>
  </DatabaseProvider>
  );
}
