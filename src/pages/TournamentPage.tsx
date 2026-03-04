import {type ReactElement, useEffect, useRef} from 'react';
import {useParams, Link, useLocation} from 'react-router-dom';
import { SearchX, CircleHelp, Maximize2, User, Users } from 'lucide-react';
import { Format } from '../types';
import { useTranslation } from '../i18n/useTranslation';
import { usePageTitle } from '../hooks/usePageTitle';
import { TournamentProvider } from '../context/tournamentProvider';
import { useTournament } from '../context/tournamentContext';
import { BracketView } from '../components/bracket/BracketView';
import { DoubleElimView } from '../components/doubleelim/DoubleElimView';
import { RoundRobinView } from '../components/roundrobin/RoundRobinView';
import { PlayerList } from '../components/PlayerList';
import { GroupStageView } from '../components/groupstage/GroupStageView';
import { SwissView } from '../components/swiss/SwissView';
import { Button } from '@/components/ui/Button';
import {useAnalytics} from "@/utils/analytics";
import { ProgressBar } from '../components/common/ProgressBar';
import { computeTournamentProgress } from '../utils/progressUtils';

const TournamentContent = (): ReactElement => {
  const { tournament, isLoading } = useTournament();
  const { t } = useTranslation();
  const location = useLocation();
  const { tracker } = useAnalytics();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      tracker.trackPageView({})
  }, [location, tracker]);

  const toggleFullscreen = (): void => {
    if (document.fullscreenElement === null) {
      void containerRef.current?.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  };

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

  const progress = computeTournamentProgress(tournament);

  return (
    <div ref={containerRef} className="tournament-fullscreen-container">
      <div className="fullscreen-hidden mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          {tournament.name}
        </h1>
        <div className="flex items-center justify-between mt-1">
          <p className="flex items-center gap-1.5 text-sm text-[var(--color-muted)]">
            {tournament.teamSize === 2 ? <Users className="h-3.5 w-3.5 shrink-0" /> : <User className="h-3.5 w-3.5 shrink-0" />}
            <span>{tournament.teamSize === 2 ? '2v2' : '1v1'}</span>
            &middot;{' '}
            {t(`format.${tournament.format}`)} &middot;{' '}
            {t('tournament.players', { count: tournament.players.length })}
          </p>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            aria-label={t('tournament.fullscreen')}
            title={t('tournament.fullscreen')}
          >
            <Maximize2 />
          </Button>
        </div>
        <ProgressBar
          value={progress.completed}
          max={progress.total}
          className="mt-2"
        />
      </div>

      <div className="fullscreen-hidden">
        <PlayerList />
      </div>

      {tournament.format === Format.SINGLE_ELIM && <BracketView />}
      {tournament.format === Format.ROUND_ROBIN && <RoundRobinView />}
      {tournament.format === Format.DOUBLE_ELIM && <DoubleElimView />}
      {tournament.format === Format.GROUPS_TO_BRACKET && <GroupStageView />}
      {tournament.format === Format.SWISS && <SwissView />}
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
