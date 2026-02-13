import { useState, Fragment, type ReactElement } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { SCORE_MODES } from '../../constants';
import type { ScoreMode, StandingsRow, RoundRobinTiebreakDetails } from '../../types';

interface StandingsTableProps {
  standings: StandingsRow[];
  highlightCount?: number | string;
  wildCardIds?: Set<string> | null;
  scoringMode?: ScoreMode;
}

type CriteriaKey =
  | 'headToHead'
  | 'headToHeadSetDiff'
  | 'headToHeadSetsWon'
  | 'setDiff'
  | 'setsWon'
  | 'pointsDiff';

interface CriteriaRow {
  key: CriteriaKey;
  label: string;
  value: string;
  help: string;
}

function buildCriteriaRows(
  details: RoundRobinTiebreakDetails,
  applied: string[],
  t: (key: string) => string,
  showBalls: boolean
): CriteriaRow[] {
  const filteredApplied = applied.filter((key): key is CriteriaKey =>
    key === 'headToHead' ||
    key === 'headToHeadSetDiff' ||
    key === 'headToHeadSetsWon' ||
    key === 'setDiff' ||
    key === 'setsWon' ||
    key === 'pointsDiff'
  );

  const labelMap: Record<CriteriaKey, string> = {
    headToHead: t('roundRobin.tiebreakH2H'),
    headToHeadSetDiff: t('roundRobin.tiebreakH2HSetDiff'),
    headToHeadSetsWon: t('roundRobin.tiebreakH2HSetsWon'),
    setDiff: t('roundRobin.tiebreakSetDiff'),
    setsWon: t('roundRobin.tiebreakSetsWon'),
    pointsDiff: t('roundRobin.tiebreakPointsDiff'),
  };

  const helpMap: Record<CriteriaKey, string> = {
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
          <tr key={row.key} className="border-t border-[var(--color-border-soft)]">
            <td className="py-1 pr-2 font-medium">
              <span
                className="underline decoration-dotted underline-offset-2 cursor-help"
                title={row.help}
              >
                {row.label}
              </span>
            </td>
            <td className="py-1 text-right">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const StandingsTable = ({
  standings,
  highlightCount = 0,
  wildCardIds,
  scoringMode = SCORE_MODES.SETS,
}: StandingsTableProps): ReactElement => {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const qualifierCount = Math.max(0, Number.parseInt(String(highlightCount), 10) || 0);
  const isSinglePlayerGroup = standings.length === 1 && qualifierCount > 0;
  const showBalls = scoringMode === SCORE_MODES.POINTS;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-[var(--color-border)] text-left text-[var(--color-muted)]">
            <th className="py-2.5 pr-3 text-xs uppercase tracking-wider font-semibold">{t('standings.rank')}</th>
            <th className="py-2.5 pr-3 text-xs uppercase tracking-wider font-semibold">{t('standings.player')}</th>
            <th className="py-2.5 pr-3 text-center text-xs uppercase tracking-wider font-semibold">{t('standings.played')}</th>
            <th className="py-2.5 pr-3 text-center text-xs uppercase tracking-wider font-semibold">{t('standings.wins')}</th>
            <th className="py-2.5 pr-3 text-center text-xs uppercase tracking-wider font-semibold">{t('standings.losses')}</th>
            <th className="py-2.5 pr-3 text-center text-xs uppercase tracking-wider font-semibold">{t('standings.sets')}</th>
            {showBalls && (
              <th className="py-2.5 pr-3 text-center text-xs uppercase tracking-wider font-semibold">{t('standings.balls')}</th>
            )}
            <th className="py-2.5 text-center text-xs uppercase tracking-wider font-semibold">{t('standings.points')}</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => {
            const isDirectQualifier =
              (row.played > 0 || isSinglePlayerGroup) &&
              (i === 0 || (qualifierCount > 0 && i < qualifierCount));
            const isWildCard = wildCardIds?.has(row.playerId);
            let rowClass = '';
            if (isDirectQualifier) {
              rowClass = 'bg-[var(--color-soft)]';
            } else if (isWildCard) {
              rowClass = 'bg-[var(--color-accent-soft)]';
            }

            const hasTiebreak = row.tiebreakDetails && row.tiebreakDetails.tiebreakApplied.length > 0;
            const isExpanded = expandedId === row.playerId;
            const handleKeyDown = (e: React.KeyboardEvent): void => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setExpandedId((prev) => (prev === row.playerId ? null : row.playerId));
              }
            };
            const toggleExpanded = (): void => {
              setExpandedId((prev) => (prev === row.playerId ? null : row.playerId));
            };
            const colSpan = showBalls ? 8 : 7;

            return (
              <Fragment key={row.playerId}>
                <tr
                  className={`border-b border-[var(--color-border-soft)] hover:bg-[var(--color-soft)] transition-colors ${rowClass} ${hasTiebreak ? 'cursor-pointer' : ''}`}
                  onClick={hasTiebreak ? toggleExpanded : undefined}
                  onKeyDown={hasTiebreak ? handleKeyDown : undefined}
                  role={hasTiebreak ? 'button' : undefined}
                  tabIndex={hasTiebreak ? 0 : undefined}
                  aria-expanded={hasTiebreak ? isExpanded : undefined}
                >
                  <td className="py-2.5 pr-3 text-[var(--color-faint)] tabular-nums">
                    {hasTiebreak && (
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
                    )}
                    {i + 1}
                  </td>
                  <td className="py-2.5 pr-3 font-medium">
                    <span className="inline-flex items-center gap-2">
                      <span>{row.name}</span>
                      {isWildCard && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                          {t('groupStage.wildCardBadge')}
                        </span>
                      )}
                      {row.elo != null && (
                        <span className="text-xs font-normal text-[var(--color-muted)]">
                          {t('players.elo', { elo: row.elo })}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-center tabular-nums">{row.played}</td>
                  <td className="py-2.5 pr-3 text-center tabular-nums">{row.wins}</td>
                  <td className="py-2.5 pr-3 text-center tabular-nums">{row.losses}</td>
                  <td className="py-2.5 pr-3 text-center tabular-nums">
                    {row.setsWon}-{row.setsLost}
                  </td>
                  {showBalls && (
                    <td className="py-2.5 pr-3 text-center tabular-nums">
                      {row.pointsWon}-{row.pointsLost}
                    </td>
                  )}
                  <td className="py-2.5 text-center font-semibold tabular-nums">{row.points}</td>
                </tr>
                {isExpanded && row.tiebreakDetails && (
                  <tr className={`border-b border-[var(--color-border-soft)] ${rowClass}`}>
                    <td className="px-2" colSpan={colSpan}>
                      <TiebreakTable
                        details={row.tiebreakDetails}
                        applied={row.tiebreakDetails.tiebreakApplied}
                        t={t}
                        showBalls={showBalls}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
