import { useState, Fragment, type ReactElement } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { ScoreMode } from '../../types';
import type { StandingsRow, RoundRobinTiebreakDetails, RoundRobinCriteriaKey, CriteriaRow } from '../../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

interface StandingsTableProps {
  standings: StandingsRow[];
  highlightCount?: number | string;
  wildCardIds?: Set<string> | null;
  scoringMode?: ScoreMode;
}

function buildCriteriaRows(
  details: RoundRobinTiebreakDetails,
  applied: string[],
  t: (key: string) => string,
  showBalls: boolean
): CriteriaRow<RoundRobinCriteriaKey>[] {
  const filteredApplied = applied.filter((key): key is RoundRobinCriteriaKey =>
    key === 'headToHead' ||
    key === 'headToHeadSetDiff' ||
    key === 'headToHeadSetsWon' ||
    key === 'setDiff' ||
    key === 'setsWon' ||
    key === 'pointsDiff'
  );

  const labelMap: Record<RoundRobinCriteriaKey, string> = {
    headToHead: t('roundRobin.tiebreakH2H'),
    headToHeadSetDiff: t('roundRobin.tiebreakH2HSetDiff'),
    headToHeadSetsWon: t('roundRobin.tiebreakH2HSetsWon'),
    setDiff: t('roundRobin.tiebreakSetDiff'),
    setsWon: t('roundRobin.tiebreakSetsWon'),
    pointsDiff: t('roundRobin.tiebreakPointsDiff'),
  };

  const helpMap: Record<RoundRobinCriteriaKey, string> = {
    headToHead: t('roundRobin.tiebreakH2HHelp'),
    headToHeadSetDiff: t('roundRobin.tiebreakH2HSetDiffHelp'),
    headToHeadSetsWon: t('roundRobin.tiebreakH2HSetsWonHelp'),
    setDiff: t('roundRobin.tiebreakSetDiffHelp'),
    setsWon: t('roundRobin.tiebreakSetsWonHelp'),
    pointsDiff: t('roundRobin.tiebreakPointsDiffHelp'),
  };

  return filteredApplied
    .filter((key) => showBalls || key !== 'pointsDiff')
    .map((key) => {
      let value = '-';
      if (key === 'headToHead') value = String(details.headToHead);
      if (key === 'headToHeadSetDiff') value = formatSignedNumber(details.headToHeadSetDiff);
      if (key === 'headToHeadSetsWon') value = String(details.headToHeadSetsWon);
      if (key === 'setDiff') value = formatSignedNumber(details.setDiff);
      if (key === 'setsWon') value = String(details.setsWon);
      if (key === 'pointsDiff') value = formatSignedNumber(details.pointsDiff);
      return { key, label: labelMap[key], value, help: helpMap[key] };
    });
}

function formatSignedNumber(value: number): string {
  const formatted = value.toFixed(0);
  return value > 0 ? `+${formatted}` : formatted;
}

interface TiebreakTableProps {
  details: RoundRobinTiebreakDetails;
  applied: string[];
  t: (key: string) => string;
  showBalls: boolean;
}

const TiebreakTable = ({ details, applied, t, showBalls }: TiebreakTableProps): ReactElement | null => {
  const rows = buildCriteriaRows(details, applied, t, showBalls);
  if (rows.length === 0) return null;
  return (
    <table className="w-full text-[0.7rem] text-[var(--color-muted)]">
      <tbody>
        {rows.map((row) => (
          <TableRow key={row.key} className="border-t border-[var(--color-border-soft)]">
            <TableCell className="py-1 pr-2 font-medium p-0">
              <span
                className="underline decoration-dotted underline-offset-2 cursor-help"
                title={row.help}
              >
                {row.label}
              </span>
            </TableCell>
            <TableCell className="py-1 text-right p-0">{row.value}</TableCell>
          </TableRow>
        ))}
      </tbody>
    </table>
  );
};

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

interface PlayerNameCellProps {
  name: string;
  isWildCard: boolean;
  elo: number | null | undefined;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const PlayerNameCell = ({ name, isWildCard, elo, t }: PlayerNameCellProps): ReactElement => (
  <TableCell className="py-2.5 pr-3 font-medium">
    <span className="inline-flex items-center gap-2">
      <span>{name}</span>
      {isWildCard && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          {t('groupStage.wildCardBadge')}
        </span>
      )}
      {elo != null && (
        <span className="text-xs font-normal text-[var(--color-muted)]">
          {t('players.elo', { elo })}
        </span>
      )}
    </span>
  </TableCell>
);

interface TiebreakExpandedRowProps {
  tiebreakDetails: RoundRobinTiebreakDetails;
  rowClass: string;
  colSpan: number;
  t: (key: string) => string;
  showBalls: boolean;
}

const TiebreakExpandedRow = ({ tiebreakDetails, rowClass, colSpan, t, showBalls }: TiebreakExpandedRowProps): ReactElement => (
  <TableRow className={rowClass}>
    <TableCell className="px-2" colSpan={colSpan}>
      <TiebreakTable
        details={tiebreakDetails}
        applied={tiebreakDetails.tiebreakApplied}
        t={t}
        showBalls={showBalls}
      />
    </TableCell>
  </TableRow>
);

interface StandingsTableRowProps {
  row: StandingsRow;
  rank: number;
  isDirectQualifier: boolean;
  isWildCard: boolean;
  hasTiebreak: boolean;
  isExpanded: boolean;
  showBalls: boolean;
  onToggleExpand: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const StandingsTableRow = ({
  row,
  rank,
  isDirectQualifier,
  isWildCard,
  hasTiebreak,
  isExpanded,
  showBalls,
  onToggleExpand,
  t,
}: StandingsTableRowProps): ReactElement => {
  let rowClass = '';
  if (isDirectQualifier) {
    rowClass = 'bg-[var(--color-soft)]';
  } else if (isWildCard) {
    rowClass = 'bg-[var(--color-accent-soft)]';
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggleExpand();
    }
  };

  const colSpan = showBalls ? 8 : 7;

  return (
    <Fragment>
      <TableRow
        className={`transition-colors ${rowClass} ${hasTiebreak ? 'cursor-pointer' : ''}`}
        onClick={hasTiebreak ? onToggleExpand : undefined}
        onKeyDown={hasTiebreak ? handleKeyDown : undefined}
        role={hasTiebreak ? 'button' : undefined}
        tabIndex={hasTiebreak ? 0 : undefined}
        aria-expanded={hasTiebreak ? isExpanded : undefined}
      >
        <TableCell className="py-2.5 pr-3 text-[var(--color-faint)] tabular-nums">
          {hasTiebreak && <ExpandIcon isExpanded={isExpanded} />}
          {rank}
        </TableCell>
        <PlayerNameCell name={row.name} isWildCard={isWildCard} elo={row.elo} t={t} />
        <TableCell className="py-2.5 pr-3 text-center tabular-nums">{row.played}</TableCell>
        <TableCell className="py-2.5 pr-3 text-center tabular-nums">{row.wins}</TableCell>
        <TableCell className="py-2.5 pr-3 text-center tabular-nums">{row.losses}</TableCell>
        <TableCell className="py-2.5 pr-3 text-center tabular-nums">
          {row.setsWon}-{row.setsLost}
        </TableCell>
        {showBalls && (
          <TableCell className="py-2.5 pr-3 text-center tabular-nums">
            {row.pointsWon}-{row.pointsLost}
          </TableCell>
        )}
        <TableCell className="py-2.5 text-center font-semibold tabular-nums">{row.points}</TableCell>
      </TableRow>
      {isExpanded && row.tiebreakDetails && (
        <TiebreakExpandedRow
          tiebreakDetails={row.tiebreakDetails}
          rowClass={rowClass}
          colSpan={colSpan}
          t={t}
          showBalls={showBalls}
        />
      )}
    </Fragment>
  );
};

export const StandingsTable = ({
  standings,
  highlightCount = 0,
  wildCardIds,
  scoringMode = ScoreMode.SETS,
}: StandingsTableProps): ReactElement => {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const qualifierCount = Math.max(0, Number.parseInt(String(highlightCount), 10) || 0);
  const isSinglePlayerGroup = standings.length === 1 && qualifierCount > 0;
  const showBalls = scoringMode === ScoreMode.POINTS;

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-b-2 border-[var(--color-border)]">
          <TableHead className="py-2.5 pr-2 sm:pr-3 text-xs uppercase tracking-wider font-semibold whitespace-nowrap text-[var(--color-muted)]">{t('standings.rank')}</TableHead>
          <TableHead className="py-2.5 pr-2 sm:pr-3 text-xs uppercase tracking-wider font-semibold whitespace-nowrap text-[var(--color-muted)]">{t('standings.player')}</TableHead>
          <TableHead className="py-2.5 pr-2 sm:pr-3 text-center text-xs uppercase tracking-wider font-semibold whitespace-nowrap text-[var(--color-muted)]">{t('standings.played')}</TableHead>
          <TableHead className="py-2.5 pr-2 sm:pr-3 text-center text-xs uppercase tracking-wider font-semibold whitespace-nowrap text-[var(--color-muted)]">{t('standings.wins')}</TableHead>
          <TableHead className="py-2.5 pr-2 sm:pr-3 text-center text-xs uppercase tracking-wider font-semibold whitespace-nowrap text-[var(--color-muted)]">{t('standings.losses')}</TableHead>
          <TableHead className="py-2.5 pr-2 sm:pr-3 text-center text-xs uppercase tracking-wider font-semibold whitespace-nowrap text-[var(--color-muted)]">{t('standings.sets')}</TableHead>
          {showBalls && (
            <TableHead className="py-2.5 pr-2 sm:pr-3 text-center text-xs uppercase tracking-wider font-semibold whitespace-nowrap text-[var(--color-muted)]">{t('standings.balls')}</TableHead>
          )}
          <TableHead className="py-2.5 text-center text-xs uppercase tracking-wider font-semibold whitespace-nowrap text-[var(--color-muted)]">{t('standings.points')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {standings.map((row, i) => {
          const isDirectQualifier =
            (row.played > 0 || isSinglePlayerGroup) &&
            (i === 0 || (qualifierCount > 0 && i < qualifierCount));
          const isWildCard = wildCardIds?.has(row.playerId) ?? false;
          const hasTiebreak = row.tiebreakDetails != null && row.tiebreakDetails.tiebreakApplied.length > 0;
          const isExpanded = expandedId === row.playerId;

          const handleToggleExpand = (): void => {
            setExpandedId((prev) => (prev === row.playerId ? null : row.playerId));
          };

          return (
            <StandingsTableRow
              key={row.playerId}
              row={row}
              rank={i + 1}
              isDirectQualifier={isDirectQualifier}
              isWildCard={isWildCard}
              hasTiebreak={hasTiebreak}
              isExpanded={isExpanded}
              showBalls={showBalls}
              onToggleExpand={handleToggleExpand}
              t={t}
            />
          );
        })}
      </TableBody>
    </Table>
  );
}
