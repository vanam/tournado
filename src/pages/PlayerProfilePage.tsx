import { type ReactElement, useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { User, Users } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { usePageTitle } from '../hooks/usePageTitle';
import { getPlayerProfile } from '../services/playerService';
import { listPlayerGroups } from '../services/playerGroupService';
import type { PlayerProfile } from '../services/playerService';
import type { PlayerGroup } from '../types';
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

export const PlayerProfilePage = (): ReactElement => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [groups, setGroups] = useState<PlayerGroup[]>([]);
  const [isLoading, setIsLoading] = useState(id !== undefined);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    if (id === undefined) return;
    void Promise.all([getPlayerProfile(id), listPlayerGroups()])
      .then(([p, g]) => {
        setProfile(p);
        setGroups(g);
        setIsLoading(false);
      })
      .catch(() => {
        setIsNotFound(true);
        setIsLoading(false);
      });
  }, [id]);

  usePageTitle(profile === null ? t('playerProfile.notFoundTitle') : profile.name);

  const entries = profile === null ? [] : profile.tournaments.toSorted((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const years = [...new Set(entries.map((e) => new Date(e.createdAt).getFullYear()))]
    .toSorted((a, b) => b - a)
    .map(String);
  const defaultYear = years.at(0) ?? '';
  const [activeYear, setActiveYear] = useState<string>('');
  const yearTabs = years.map((y) => ({ id: y, label: y }));

  const effectiveYear = activeYear === '' ? defaultYear : activeYear;

  const visibleEntries = entries.filter(
    (e) => String(new Date(e.createdAt).getFullYear()) === effectiveYear,
  );

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--color-muted)]">{t('tournament.loading')}</p>
      </div>
    );
  }

  if (isNotFound || profile === null) {
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
          <h1 className="text-2xl font-bold text-[var(--color-text)]">{profile.name}</h1>
          {profile.elo !== undefined && (
            <span className="text-sm text-[var(--color-muted)]">
              {t('players.elo', { elo: String(profile.elo) })}
            </span>
          )}
        </div>
        {profile.groupIds.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {profile.groupIds.map((gid) => {
              const colorIdx = groups.findIndex((g) => g.id === gid);
              const group = groups.find((g) => g.id === gid);
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
            <TabBar tabs={yearTabs} activeId={effectiveYear} onChange={setActiveYear} />
            <div className="space-y-2">
              {visibleEntries.map((entry) => {
                const date = new Date(entry.createdAt);
                return (
                  <Link
                    key={entry.tournamentId}
                    to={`/tournament/${entry.tournamentId}`}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 hover:border-[var(--color-primary)] hover:bg-[var(--color-soft)] transition-colors"
                  >
                    <span className="font-medium text-sm text-[var(--color-text)] flex-1">
                      {entry.tournamentName}
                    </span>
                    {entry.isCompleted && entry.rankStart !== undefined && entry.rankEnd !== undefined && (
                      <RankBadge rankStart={entry.rankStart} rankEnd={entry.rankEnd} />
                    )}
                    {entry.isCompleted && entry.rankStart === undefined && (
                      <span className="inline-flex items-center rounded-full border border-[var(--color-border)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-muted)]">
                        {t('playerProfile.statusCompleted')}
                      </span>
                    )}
                    {!entry.isCompleted && (
                      <span className="inline-flex items-center rounded-full bg-[var(--color-soft)] border border-[var(--color-border)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text)]">
                        {t('playerProfile.statusInProgress')}
                      </span>
                    )}
                    <FormatBadge format={entry.format} />
                    <span className="flex items-center gap-1 text-xs text-[var(--color-faint)]">
                      {entry.teamSize === 2 ? <Users className="h-3.5 w-3.5 shrink-0" /> : <User className="h-3.5 w-3.5 shrink-0" />}
                      <span>{entry.teamSize === 2 ? '2v2' : '1v1'}</span>
                      <span>|</span>
                      <span>{t('tournament.players', { count: entry.playerCount })}</span>
                      <span>|</span>
                      <span>{date.toLocaleDateString()}</span>
                    </span>
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
