import { useState, Fragment, type ReactElement } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { SwissStandingsRow, SwissTiebreakDetails, SwissCriteriaKey } from '../../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

// ─── Sub-components ───────────────────────────────────────────────────────────

const ExpandIcon = ({ isExpanded }: { isExpanded: boolean }): ReactElement => (
  <span
    className="mr-1 inline-flex h-3 w-3 items-center justify-center text-[var(--color-muted)]"
    aria-hidden="true"
  >
    <svg
      viewBox="0 0 20 20"
      className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : 'rotate-0'}`}
      fill="currentColor"
    >
      <path d="M7.5 5.5 12.5 10 7.5 14.5" />
    </svg>
  </span>
);

type TFunc = (key: string, params?: Record<string, string | number>) => string;

interface SwissTiebreakTableProps {
  details: SwissTiebreakDetails;
  t: TFunc;
  showPoints: boolean;
}

const CRITERIA_DISPLAY: SwissCriteriaKey[] = [
  'buchholz', 'sonnebornBerger', 'headToHead', 'setRatio', 'ballRatio',
];

const SwissTiebreakTable = ({ details, t, showPoints }: SwissTiebreakTableProps): ReactElement | null => {
  if (details.tiebreakApplied.length === 0) return null;

  const labelMap: Record<SwissCriteriaKey, string> = {
    buchholz: t('swiss.tiebreakBuchholz'),
    sonnebornBerger: t('swiss.tiebreakSonnebornBerger'),
    headToHead: t('swiss.tiebreakHeadToHead'),
    setRatio: t('swiss.tiebreakSetRatio'),
    ballRatio: t('swiss.tiebreakBallRatio'),
  };

  const helpMap: Record<SwissCriteriaKey, string> = {
    buchholz: t('swiss.tiebreakBuchholzHelp'),
    sonnebornBerger: t('swiss.tiebreakSonnebornBergerHelp'),
    headToHead: t('swiss.tiebreakHeadToHeadHelp'),
    setRatio: t('swiss.tiebreakSetRatioHelp'),
    ballRatio: t('swiss.tiebreakBallRatioHelp'),
  };

  function formatValue(key: SwissCriteriaKey): string {
    switch (key) {
      case 'buchholz': { return String(details.buchholz); }
      case 'sonnebornBerger': { return String(details.sonnebornBerger); }
      case 'headToHead': { return String(details.headToHead); }
      case 'setRatio': { return details.setRatio.toFixed(3); }
      case 'ballRatio': { return details.ballRatio.toFixed(3); }
    }
  }

  const appliedSet = new Set(details.tiebreakApplied);
  const visibleCriteria = CRITERIA_DISPLAY.filter(
    (key) => appliedSet.has(key) && (showPoints || key !== 'ballRatio')
  );

  if (visibleCriteria.length === 0) return null;

  return (
    <table className="w-full text-[0.7rem] text-[var(--color-muted)]">
      <tbody>
        {visibleCriteria.map((key) => (
          <TableRow key={key} className="border-t border-[var(--color-border-soft)]">
            <TableCell className="py-1 pr-2 font-medium p-0">
              <span
                className="underline decoration-dotted underline-offset-2 cursor-help"
                title={helpMap[key]}
              >
                {labelMap[key]}
              </span>
            </TableCell>
            <TableCell className="py-1 text-right p-0">{formatValue(key)}</TableCell>
          </TableRow>
        ))}
      </tbody>
    </table>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface SwissStandingsTableProps {
  standings: SwissStandingsRow[];
  showPoints?: boolean;
}

export const SwissStandingsTable = ({
  standings,
  showPoints = false,
}: SwissStandingsTableProps): ReactElement => {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const headClass = 'py-2.5 pr-3 text-xs uppercase tracking-wider font-semibold text-[var(--color-muted)]';
  const colSpan = showPoints ? 7 : 6;

  function handleToggleExpand(playerId: string): void {
    setExpandedId((prev) => (prev === playerId ? null : playerId));
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-b-2 border-[var(--color-border)]">
          <TableHead className={headClass}>{t('standings.rank')}</TableHead>
          <TableHead className={headClass}>{t('standings.player')}</TableHead>
          <TableHead className={headClass}>{t('standings.wins')}</TableHead>
          <TableHead className={headClass}>{t('standings.losses')}</TableHead>
          <TableHead className={headClass}>{t('standings.sets')}</TableHead>
          {showPoints && <TableHead className={headClass}>{t('standings.balls')}</TableHead>}
          <TableHead
            className={`${headClass} cursor-help`}
            title={t('swiss.standingsBuchholzHelp')}
          >
            {t('swiss.standingsBuchholz')}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {standings.map((row, i) => {
          const hasTiebreak = (row.tiebreakDetails?.tiebreakApplied.length ?? 0) > 0;
          const isExpanded = expandedId === row.playerId;

          const handleKeyDown = (e: React.KeyboardEvent): void => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggleExpand(row.playerId);
            }
          };

          return (
            <Fragment key={row.playerId}>
              <TableRow
                className={`transition-colors ${hasTiebreak ? 'cursor-pointer' : ''}`}
                onClick={hasTiebreak ? (): void => { handleToggleExpand(row.playerId); } : undefined}
                onKeyDown={hasTiebreak ? handleKeyDown : undefined}
                role={hasTiebreak ? 'button' : undefined}
                tabIndex={hasTiebreak ? 0 : undefined}
                aria-expanded={hasTiebreak ? isExpanded : undefined}
              >
                <TableCell className="py-2.5 pr-3 text-[var(--color-faint)] tabular-nums">
                  {hasTiebreak && <ExpandIcon isExpanded={isExpanded} />}
                  {i + 1}.
                </TableCell>
                <TableCell className="py-2.5 pr-3 font-medium">
                  <span className="inline-flex items-center gap-2">
                    <span>{row.name}</span>
                    {row.elo != null && (
                      <span className="text-xs font-normal text-[var(--color-muted)]">
                        {t('players.elo', { elo: row.elo })}
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell className="py-2.5 pr-3 tabular-nums">{row.wins}</TableCell>
                <TableCell className="py-2.5 pr-3 tabular-nums">{row.losses}</TableCell>
                <TableCell className="py-2.5 pr-3 tabular-nums">{row.setsWon}-{row.setsLost}</TableCell>
                {showPoints && (
                  <TableCell className="py-2.5 pr-3 tabular-nums">{row.pointsWon}-{row.pointsLost}</TableCell>
                )}
                <TableCell className="py-2.5 pr-3 tabular-nums">{row.buchholz}</TableCell>
              </TableRow>
              {isExpanded && row.tiebreakDetails && (
                <TableRow>
                  <TableCell className="px-2" colSpan={colSpan}>
                    <SwissTiebreakTable
                      details={row.tiebreakDetails}
                      t={t}
                      showPoints={showPoints}
                    />
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
};
