import type { ReactElement } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { persistence } from '../services/persistence';
import { useTranslation } from '../i18n/useTranslation';
import { usePageTitle } from '../utils/usePageTitle';
import { TournamentCard } from '../components/tournamentCard';
import { ConfirmModal } from '../components/confirmModal';
import type { Tournament } from '../types';

export const HomePage = (): ReactElement => {
  const [tournaments, setTournaments] = useState<Tournament[]>(() => persistence.loadAll());
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { t } = useTranslation();

  usePageTitle(t('home.title'));

  function getTournamentName(id: string): string {
    const tournament = tournaments.find((t) => t.id === id);
    return tournament?.name ?? '';
  }

  function handleDelete(id: string): void {
    setDeleteTargetId(id);
  }

  function handleConfirmDelete(): void {
    if (!deleteTargetId) return;
    persistence.delete(deleteTargetId);
    setTournaments(persistence.loadAll());
    setDeleteTargetId(null);
  }

  function handleCancelDelete(): void {
    setDeleteTargetId(null);
  }

  function handleDeleteAll(): void {
    persistence.deleteAll();
    setTournaments([]);
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
            <button
              onClick={() => { setShowDeleteAll(true); }}
              className="text-[var(--color-accent)] hover:text-[var(--color-primary-dark)] px-3 py-2 text-sm rounded-lg border border-[var(--color-accent-border)] hover:border-[var(--color-accent)] transition-colors"
            >
              {t('home.deleteAll')}
            </button>
          )}
          <Link
            to="/create"
            className="bg-[var(--color-primary)] text-[var(--color-surface)] px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm hover:shadow-md hover:bg-[var(--color-primary-dark)] transition-colors"
          >
            {t('home.newTournament')}
          </Link>
        </div>
      </div>

      {tournaments.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-subtle)]">
          <p className="text-4xl mb-4">&#127955;</p>
          <p className="text-lg font-medium mb-3">{t('home.noTournaments')}</p>
          <Link
            to="/create"
            className="inline-block bg-[var(--color-primary)] text-[var(--color-surface)] px-6 py-3 rounded-lg text-sm font-medium shadow-sm hover:shadow-md hover:bg-[var(--color-primary-dark)] transition-colors"
          >
            {t('home.noTournamentsDesc')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tr) => (
            <TournamentCard
              key={tr.id}
              tournament={tr}
              onDelete={handleDelete}
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
}
