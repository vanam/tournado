import { type ReactElement, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PageLoader } from './components/PageLoader';

const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const CreateTournamentPage = lazy(() => import('./pages/CreateTournamentPage').then(m => ({ default: m.CreateTournamentPage })));
const TournamentPage = lazy(() => import('./pages/TournamentPage').then(m => ({ default: m.TournamentPage })));
const FaqPage = lazy(() => import('./pages/FaqPage').then(m => ({ default: m.FaqPage })));
const CreditsPage = lazy(() => import('./pages/CreditsPage').then(m => ({ default: m.CreditsPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

export const App = (): ReactElement => {
  return (
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
  );
}
