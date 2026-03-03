import { type ReactElement, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { usePageTitle } from '../hooks/usePageTitle';
import { loadLibrary } from '../services/playerLibraryService';
import { persistence } from '../services/persistence';
import { getTournamentResults } from '../utils/resultsUtils';
import type { Tournament } from '../types';
import { FormatBadge } from '../components/ui/FormatBadge';
import { TabBar } from '../components/common/TabBar';


const GROUP_COLORS = [
  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
];

function getGroupColor(index: number): string {
  return GROUP_COLORS[index % GROUP_COLORS.length] ?? 'bg-gray-100 text-gray-800';
}

interface TournamentEntry {
  tournament: Tournament;
  rankStart?: number | undefined;
  rankEnd?: number | undefined;
}

function rankLabel(rankStart: number, rankEnd: number): string {
  if (rankStart === rankEnd) return `${rankStart}.`;
  return `${rankStart}.-${rankEnd}.`;
}

function rankBadgeClass(rankStart: number): string {
  if (rankStart === 1) return 'bg-[var(--color-primary)] text-white';
  if (rankStart === 2) return 'bg-[var(--color-podium-silver)] text-[var(--color-text)]';
  if (rankStart === 3) return 'bg-[var(--color-podium-bronze)] text-[var(--color-text)]';
  return 'border border-[var(--color-border)] text-[var(--color-muted)]';
}

interface RankBadgeProps {
  readonly rankStart: number;
  readonly rankEnd: number;
}

const RankBadge = ({ rankStart, rankEnd }: RankBadgeProps): ReactElement => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${rankBadgeClass(rankStart)}`}>
    {rankLabel(rankStart, rankEnd)}
  </span>
);

function getTournamentEntries(libraryId: string): TournamentEntry[] {
  const tournaments = persistence.loadAll();
  const entries: TournamentEntry[] = [];

  for (const tournament of tournaments) {
    const matchedPlayer = tournament.players.find((p) => p.libraryId === libraryId);
    if (matchedPlayer === undefined) continue;

    const isCompleted = tournament.winnerId !== undefined && tournament.winnerId !== null;
    let rankStart: number | undefined;
    let rankEnd: number | undefined;

    if (isCompleted) {
      const results = getTournamentResults(tournament);
      const result = results.find((r) => r.libraryId === libraryId);
      if (result?.rankStart !== undefined) {
        rankStart = result.rankStart;
        rankEnd = result.rankEnd ?? result.rankStart;
      }
    }

    entries.push({ tournament, rankStart, rankEnd });
  }

  return entries.toSorted((a, b) => {
    const aInProgress = a.tournament.winnerId === undefined || a.tournament.winnerId === null;
    const bInProgress = b.tournament.winnerId === undefined || b.tournament.winnerId === null;
    if (aInProgress && !bInProgress) return -1;
    if (!aInProgress && bInProgress) return 1;
    return b.tournament.createdAt.localeCompare(a.tournament.createdAt);
  });
}

export const PlayerProfilePage = (): ReactElement => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  const library = loadLibrary();
  const libraryEntry = id === undefined ? undefined : library.players.find((p) => p.id === id);

  usePageTitle(libraryEntry === undefined ? t('playerProfile.notFoundTitle') : libraryEntry.name);

  const entries = libraryEntry === undefined ? [] : getTournamentEntries(libraryEntry.id);
  const years = [...new Set(entries.map((e) => new Date(e.tournament.createdAt).getFullYear()))]
    .toSorted((a, b) => b - a)
    .map(String);
  const [activeYear, setActiveYear] = useState<string>(years.at(0) ?? '');
  const yearTabs = years.map((y) => ({ id: y, label: y }));
  const visibleEntries = entries.filter(
    (e) => String(new Date(e.tournament.createdAt).getFullYear()) === activeYear,
  );

  if (libraryEntry === undefined) {
    return (
      <div className="space-y-4">
        <Link
          to="/players"
          className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
        >
          {t('playerProfile.back')}
        </Link>
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            {t('playerProfile.notFoundTitle')}
          </h1>
          <p className="mt-2 text-[var(--color-muted)]">
            {t('playerProfile.notFoundMessage')}
          </p>
          <Link
            to="/players"
            className="mt-6 px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-lg font-medium shadow-sm hover:shadow-md hover:bg-[var(--color-primary-dark)] transition-all"
          >
            {t('playerProfile.backToLibrary')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/players"
          className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
        >
          {t('playerProfile.back')}
        </Link>
        <div className="mt-3 flex items-baseline gap-3">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">{libraryEntry.name}</h1>
          {libraryEntry.elo !== undefined && (
            <span className="text-sm text-[var(--color-muted)]">
              {t('players.elo', { elo: String(libraryEntry.elo) })}
            </span>
          )}
        </div>
        {libraryEntry.groupIds.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {libraryEntry.groupIds.map((gid) => {
              const colorIdx = library.groups.findIndex((g) => g.id === gid);
              const group = library.groups.find((g) => g.id === gid);
              if (group === undefined) return null;
              return (
                <span
                  key={gid}
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getGroupColor(colorIdx)}`}
                >
                  {group.name}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
          {t('playerProfile.tournamentsTitle')}
        </h2>
        {entries.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            {t('playerProfile.noTournaments')}
          </p>
        ) : (
          <>
            <TabBar tabs={yearTabs} activeId={activeYear} onChange={setActiveYear} />
            <div className="space-y-2">
              {visibleEntries.map(({ tournament, rankStart, rankEnd }) => {
                const isInProgress = tournament.winnerId === undefined || tournament.winnerId === null;
                const date = new Date(tournament.createdAt);
                return (
                  <Link
                    key={tournament.id}
                    to={`/tournament/${tournament.id}`}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 hover:border-[var(--color-primary)] hover:bg-[var(--color-soft)] transition-colors"
                  >
                    <span className="font-medium text-sm text-[var(--color-text)] flex-1">
                      {tournament.name}
                    </span>
                    <FormatBadge format={tournament.format} />
                    <span className="text-xs text-[var(--color-faint)]">
                      {t('card.created', { date: date.toLocaleDateString() })}
                    </span>
                    {!isInProgress && rankStart !== undefined && rankEnd !== undefined && (
                      <RankBadge rankStart={rankStart} rankEnd={rankEnd} />
                    )}
                    {!isInProgress && rankStart === undefined && (
                      <span className="inline-flex items-center rounded-full border border-[var(--color-border)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-muted)]">
                        {t('playerProfile.statusCompleted')}
                      </span>
                    )}
                    {isInProgress && (
                      <span className="inline-flex items-center rounded-full bg-[var(--color-soft)] border border-[var(--color-border)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text)]">
                        {t('playerProfile.statusInProgress')}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
