import type { ReactElement } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import { CreateTournamentPage } from './pages/CreateTournamentPage';
import { TournamentPage } from './pages/TournamentPage';
import { FaqPage } from './pages/FaqPage';
import { CreditsPage } from './pages/CreditsPage';
import { NotFoundPage } from './pages/NotFoundPage';

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
