import type { ReactElement } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { ErrorBoundary } from './components/errorBoundary';
import { HomePage } from './pages/homePage';
import { CreateTournamentPage } from './pages/createTournamentPage';
import { TournamentPage } from './pages/tournamentPage';
import { FaqPage } from './pages/faqPage';
import { CreditsPage } from './pages/creditsPage';
import { NotFoundPage } from './pages/notFoundPage';

export const App = (): ReactElement => {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={
            <ErrorBoundary>
              <HomePage />
            </ErrorBoundary>
          } />
          <Route path="/create" element={
            <ErrorBoundary>
              <CreateTournamentPage />
            </ErrorBoundary>
          } />
          <Route path="/tournament/:id" element={
            <ErrorBoundary>
              <TournamentPage />
            </ErrorBoundary>
          } />
          <Route path="/faq" element={
            <ErrorBoundary>
              <FaqPage />
            </ErrorBoundary>
          } />
          <Route path="/credits" element={
            <ErrorBoundary>
              <CreditsPage />
            </ErrorBoundary>
          } />
          <Route path="*" element={
            <ErrorBoundary>
              <NotFoundPage />
            </ErrorBoundary>
          } />
        </Route>
      </Routes>
    </HashRouter>
  );
}
