import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Trophy } from 'lucide-react';
import {
  listTournaments,
  deleteTournament as deleteTournamentApi,
  deleteAllTournaments,
  duplicateTournament as duplicateTournamentApi,
} from '../api/client';
import { useTranslation } from '../i18n/useTranslation';
import { usePageTitle } from '../hooks/usePageTitle';
import { TournamentCard } from '../components/TournamentCard';
import { ConfirmModal } from '../components/ConfirmModal';
import type { TournamentSummary } from '../api/types';
import { Button } from '@/components/ui/Button';
import { useAnalytics } from '@/utils/analytics';
import { showToast } from '../utils/toastUtils';

function sortTournaments(list: TournamentSummary[]): TournamentSummary[] {
  return list.toSorted((a, b) => {
    const aFinished = !!a.winnerId;
    const bFinished = !!b.winnerId;
    if (aFinished !== bFinished) return aFinished ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export const HomePage = (): ReactElement => {
  const location = useLocation();
  const { tracker } = useAnalytics();

  useEffect(() => {
    tracker.trackPageView({});
  }, [location, tracker]);

  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    void listTournaments()
      .then((all) => { setTournaments(sortTournaments(all)); })
      .catch(() => { showToast({ message: t('api.errorLoad') }); });
  }, [t]);

  usePageTitle(t('home.title'));

  function getTournamentName(id: string): string {
    const tournament = tournaments.find((tr) => tr.id === id);
    return tournament?.name ?? '';
  }

  function handleDelete(id: string): void {
    setDeleteTargetId(id);
  }

  function handleDuplicate(id: string): void {
    void duplicateTournamentApi(id)
      .then(() => {
        void listTournaments().then((all) => { setTournaments(sortTournaments(all)); });
      })
      .catch(() => { showToast({ message: t('api.errorSave') }); });
  }

  function handleConfirmDelete(): void {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    setTournaments((prev) => prev.filter((tr) => tr.id !== id));
    void deleteTournamentApi(id).catch(() => {
      void listTournaments().then((all) => { setTournaments(sortTournaments(all)); });
      showToast({ message: t('api.errorSave') });
    });
  }

  function handleCancelDelete(): void {
    setDeleteTargetId(null);
  }

  function handleDeleteAll(): void {
    void deleteAllTournaments()
      .then(() => { setTournaments([]); })
      .catch(() => { showToast({ message: t('api.errorSave') }); });
    setShowDeleteAll(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('home.title')}</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">{t('home.cta')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {tournaments.length > 1 && (
            <Button
              onClick={() => { setShowDeleteAll(true); }}
              variant="secondary-outlined"
            >
              {t('home.deleteAll')}
            </Button>
          )}
          <Button asChild>
            <Link
              to="/create"
              className="bg-[var(--color-primary)] text-[var(--color-surface)] px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm hover:shadow-md hover:bg-[var(--color-primary-dark)] transition-colors inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> {t('home.newTournament')}
            </Link>
          </Button>
        </div>
      </div>

      {tournaments.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-subtle)]">
          <div className="flex justify-center mb-4">
            <Trophy className="h-16 w-16 text-[var(--color-faint)]" />
          </div>
          <p className="text-lg font-medium mb-3">{t('home.noTournaments')}</p>
          <Button asChild>
            <Link
              to="/create"
              className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-surface)] px-6 py-3 rounded-lg text-sm font-medium shadow-sm hover:shadow-md hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              <Plus className="h-4 w-4" /> {t('home.noTournamentsDesc')}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tr) => (
            <TournamentCard
              key={tr.id}
              tournament={tr}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}

      {deleteTargetId && (
        <ConfirmModal
          title={t('home.deleteConfirm')}
          message={getTournamentName(deleteTargetId)}
          confirmLabel={t('card.delete')}
          cancelLabel={t('home.cancel')}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}

      {showDeleteAll && (
        <ConfirmModal
          title={t('home.deleteAllConfirm')}
          message={t('home.deleteAllDesc', { count: tournaments.length })}
          confirmLabel={t('home.deleteAll')}
          cancelLabel={t('home.cancel')}
          onConfirm={handleDeleteAll}
          onCancel={() => { setShowDeleteAll(false); }}
        />
      )}
    </div>
  );
};
