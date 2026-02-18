import type { ReactElement } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SearchX, CircleHelp } from 'lucide-react';
import { Format } from '../types';
import { useTranslation } from '../i18n/useTranslation';
import { usePageTitle } from '../hooks/usePageTitle';
import { TournamentProvider, useTournament } from '../context/tournamentContext';
import { BracketView } from '../components/bracket/BracketView';
import { DoubleElimView } from '../components/doubleelim/DoubleElimView';
import { RoundRobinView } from '../components/roundrobin/RoundRobinView';
import { PlayerList } from '../components/PlayerList';
import { GroupStageView } from '../components/groupstage/GroupStageView';
import { Button } from '@/components/ui/Button';

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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <SearchX className="h-12 w-12 text-[var(--color-muted)] mb-4" />
        <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">
          {t('tournament.notFoundTitle')}
        </h2>
        <p className="text-[var(--color-muted)] mb-6 max-w-md">
          {t('tournament.notFoundDesc')}
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Button asChild>
            <Link to="/create">{t('home.newTournament')}</Link>
          </Button>
          <Button variant="primary-outlined" asChild>
            <Link to="/">{t('tournament.backHome')}</Link>
          </Button>
        </div>
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
          {t(`format.${tournament.format}`)} &middot;{' '}
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
  const { t } = useTranslation();

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <CircleHelp className="h-12 w-12 text-[var(--color-muted)] mb-4" />
        <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">
          {t('tournament.notFoundTitle')}
        </h2>
        <p className="text-[var(--color-muted)] mb-6 max-w-md">
          {t('tournament.noIdDesc')}
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Button asChild>
            <Link to="/create">{t('home.newTournament')}</Link>
          </Button>
          <Button variant="primary-outlined" asChild>
            <Link to="/">{t('tournament.backHome')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TournamentProvider tournamentId={id}>
      <TournamentContent />
    </TournamentProvider>
  );
}
