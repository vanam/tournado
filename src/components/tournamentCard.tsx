import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { FORMATS } from '../constants';
import { useTranslation } from '../i18n/useTranslation';
import type { Format, Tournament } from '../types';

const FORMAT_KEYS: Record<Format, string> = {
  [FORMATS.SINGLE_ELIM]: 'format.singleElim',
  [FORMATS.ROUND_ROBIN]: 'format.roundRobin',
  [FORMATS.GROUPS_TO_BRACKET]: 'format.groupsToBracket',
  [FORMATS.DOUBLE_ELIM]: 'format.doubleElim',
};

interface TournamentCardProps {
  tournament: Tournament;
  onDelete: (id: string) => void;
}

export const TournamentCard = ({ tournament, onDelete }: TournamentCardProps): ReactElement => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const winner = tournament.winnerId
    ? tournament.players.find((p) => p.id === tournament.winnerId)
    : null;

  const handleCardActivate = (): void => {
    void navigate(`/tournament/${tournament.id}`);
  };

  return (
    <div
      className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm p-5 hover:shadow-lg hover:border-[var(--color-primary)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={handleCardActivate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleCardActivate();
        }
      }}
    >
      <div className="flex items-start justify-between">
        <span className="text-lg font-semibold text-[var(--color-primary-dark)] group-hover:text-[var(--color-primary)] transition-colors">
          {tournament.name}
        </span>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onDelete(tournament.id);
          }}
          className="text-[var(--color-accent)] hover:text-[var(--color-primary-dark)] text-sm opacity-0 group-hover:opacity-100 transition-colors"
        >
          {t('card.delete')}
        </button>
      </div>
      <p className="text-sm text-[var(--color-muted)] mt-1">
        {t(FORMAT_KEYS[tournament.format])} &middot;{' '}
        {t('tournament.players', { count: tournament.players.length })}
      </p>
      <p className="text-xs text-[var(--color-subtle)] mt-1">
        {t('card.created', { date: new Date(tournament.createdAt).toLocaleDateString() })}
      </p>
      {winner && (
        <p className="text-xs text-[var(--color-accent)] font-medium mt-2">
          {t('card.winner', {
            name: winner.name,
          })}
        </p>
      )}
    </div>
  );
}
