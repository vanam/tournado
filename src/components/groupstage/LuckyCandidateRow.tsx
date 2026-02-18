import { Fragment, type ReactElement } from 'react';
import type { GroupAdvancerEntry, StandingsRow } from '../../types';
import { useTranslation } from '../../i18n/useTranslation';
import { CriteriaTable } from './CriteriaTable';

interface LuckyCandidateRowProps {
  player: GroupAdvancerEntry;
  index: number;
  groupLabel: string;
  isLucky: boolean;
  showBalls: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

export const LuckyCandidateRow = ({
  player,
  index,
  groupLabel,
  isLucky,
  showBalls,
  isExpanded,
  onToggle,
}: LuckyCandidateRowProps): ReactElement => {
  const { t } = useTranslation();
  const stats: Partial<StandingsRow> = player.stats;
  const rowClass = isLucky ? 'bg-[var(--color-accent-soft)]' : '';
  const colSpan = showBalls ? 9 : 8;

  return (
    <Fragment>
      <tr
        className={`border-b border-[var(--color-border-soft)] ${rowClass} cursor-pointer`}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggle();
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <td className="py-2 pr-2 text-[var(--color-faint)]">
          <span
            className="mr-1 inline-flex h-3 w-3 items-center justify-center text-[var(--color-muted)]"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 20 20"
              className={`h-3 w-3 transition-transform ${
                isExpanded ? 'rotate-90' : 'rotate-0'
              }`}
              fill="currentColor"
            >
              <path d="M7.5 5.5 12.5 10 7.5 14.5" />
            </svg>
          </span>
          {index + 1}
        </td>
        <td className="py-2 pr-2 font-medium text-[var(--color-text)]">{player.name}</td>
        <td className="py-2 pr-2 text-[var(--color-muted)]">
          {t('groupStage.advancerGroupRank', {
            group: groupLabel,
            rank: player.groupRank,
          })}
        </td>
        <td className="py-2 pr-2 text-center">{stats.played ?? 0}</td>
        <td className="py-2 pr-2 text-center">{stats.wins ?? 0}</td>
        <td className="py-2 pr-2 text-center">{stats.losses ?? 0}</td>
        <td className="py-2 pr-2 text-center">
          {(stats.setsWon ?? 0)}-{(stats.setsLost ?? 0)}
        </td>
        {showBalls && (
          <td className="py-2 pr-2 text-center">
            {(stats.pointsWon ?? 0)}-{(stats.pointsLost ?? 0)}
          </td>
        )}
        <td className="py-2 text-center font-semibold">{stats.points ?? 0}</td>
      </tr>
      {isExpanded && (
        <tr className={`border-b border-[var(--color-border-soft)] ${rowClass}`}>
          <td className="px-2" colSpan={colSpan}>
            <CriteriaTable player={player} showBalls={showBalls} />
          </td>
        </tr>
      )}
    </Fragment>
  );
};