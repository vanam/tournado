import type { ReactElement } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Format } from '../types';
import { useTranslation } from '../i18n/useTranslation';
import { usePageTitle } from '../hooks/usePageTitle';
import { TournamentProvider, useTournament } from '../context/tournamentContext';
import { BracketView } from '../components/bracket/BracketView';
import { DoubleElimView } from '../components/doubleelim/DoubleElimView';
import { RoundRobinView } from '../components/roundrobin/RoundRobinView';
import { PlayerList } from '../components/PlayerList';
import { GroupStageView } from '../components/groupstage/GroupStageView';

const FORMAT_KEYS: Record<Format, string> = {
  [Format.SINGLE_ELIM]: 'format.singleElim',
  [Format.ROUND_ROBIN]: 'format.roundRobin',
  [Format.GROUPS_TO_BRACKET]: 'format.groupsToBracket',
  [Format.DOUBLE_ELIM]: 'format.doubleElim',
};

const TournamentContent = (): ReactElement => {
  const { tournament, isLoading } = useTournament();
  const { t } = useTranslation();

  usePageTitle(tournament ? tournament.name : t('tournament.notFoundTitle'));

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--color-muted)]">{t('tournament.loading')}</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--color-muted)] mb-4">{t('tournament.notFound')}</p>
        <Link to="/" className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]">
          {t('tournament.backHome')}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/"
          className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
        >
          {t('tournament.back')}
        </Link>
        <h1 className="text-2xl font-bold text-[var(--color-text)] mt-2">
          {tournament.name}
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          {t(FORMAT_KEYS[tournament.format])} &middot;{' '}
          {t('tournament.players', { count: tournament.players.length })}
        </p>
      </div>

      <PlayerList />

      {tournament.format === Format.SINGLE_ELIM && <BracketView />}
      {tournament.format === Format.ROUND_ROBIN && <RoundRobinView />}
      {tournament.format === Format.DOUBLE_ELIM && <DoubleElimView />}
      {tournament.format === Format.GROUPS_TO_BRACKET && <GroupStageView />}
    </div>
  );
}

export const TournamentPage = (): ReactElement => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--color-muted)]">No tournament ID provided</p>
        <Link to="/" className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <TournamentProvider tournamentId={id}>
      <TournamentContent />
    </TournamentProvider>
  );
}
