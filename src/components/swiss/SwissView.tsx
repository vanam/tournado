import { type ReactElement, Fragment, useState } from 'react';
import { TabBar } from '../common/TabBar';
import { WinnerBanner } from '../common/WinnerBanner';
import { FinalResultsTable } from '../common/FinalResultsTable';
import { RoundSchedule } from '../roundrobin/RoundSchedule';
import { ScoreModal } from '../ScoreModal';
import {
  computeSwissStandings,
  isCurrentRoundComplete,
  isSwissTournamentComplete,
  generateNextSwissRound,
  buildSwissResults,
} from '../../utils/swissUtils';
import { useTranslation } from '../../i18n/useTranslation';
import { DEFAULT_MAX_SETS } from '../../constants';
import { useTypedTournament } from '../../context/tournamentContext';
import { Format, ScoreMode } from '../../types';
import type { Match, SwissTournament, SetScore, SwissCriteriaKey, SwissTiebreakDetails } from '../../types';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';

type SwissTab = 'standings' | 'schedule' | 'results';

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

// ─── Main view ────────────────────────────────────────────────────────────────

export const SwissView = (): ReactElement | null => {
  const { tournament, updateTournament } = useTypedTournament<SwissTournament>(Format.SWISS);
  const [tab, setTab] = useState<SwissTab>('standings');
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { t } = useTranslation();

  if (!tournament) return null;

  const { schedule, players } = tournament;
  const scoringMode = tournament.scoringMode ?? ScoreMode.SETS;
  const maxSets = tournament.maxSets ?? DEFAULT_MAX_SETS;
  const showPoints = scoringMode === ScoreMode.POINTS;

  const standings = computeSwissStandings(schedule, players, { scoringMode, maxSets });
  const roundComplete = isCurrentRoundComplete(schedule);
  const complete = isSwissTournamentComplete(tournament);
  const currentRound = schedule.rounds.length;
  const totalRounds = tournament.totalRounds;

  const colSpan = showPoints ? 8 : 7;

  const tabs: { id: SwissTab; label: string }[] = [
    { id: 'standings', label: t('swiss.standings') },
    { id: 'schedule', label: t('swiss.schedule') },
    ...(complete ? [{ id: 'results' as SwissTab, label: t('swiss.results') }] : []),
  ];

  function handleSave(matchId: string, winnerId: string | null, scores: SetScore[], walkover = false): void {
    updateTournament((prev) => {
      const updatedSchedule = structuredClone(prev.schedule);
      for (const round of updatedSchedule.rounds) {
        const match = round.matches.find((m) => m.id === matchId);
        if (match) {
          match.winnerId = winnerId;
          match.scores = scores;
          match.walkover = walkover;
          break;
        }
      }

      const nowComplete = isSwissTournamentComplete({ ...prev, schedule: updatedSchedule });
      const newStandings = nowComplete
        ? computeSwissStandings(updatedSchedule, prev.players, { scoringMode, maxSets })
        : null;

      return {
        ...prev,
        schedule: updatedSchedule,
        winnerId: nowComplete ? (newStandings?.[0]?.playerId ?? null) : null,
        completedAt: nowComplete ? new Date().toISOString() : null,
      };
    });
    setEditingMatch(null);
  }

  function handleGenerateNextRound(): void {
    updateTournament((prev) => ({
      ...prev,
      schedule: { rounds: [...prev.schedule.rounds, generateNextSwissRound(prev)] },
    }));
  }

  function handleToggleExpand(playerId: string): void {
    setExpandedId((prev) => (prev === playerId ? null : playerId));
  }

  const headClass = 'py-2.5 pr-3 text-xs uppercase tracking-wider font-semibold text-[var(--color-muted)]';

  return (
    <div>
      {complete && (
        <WinnerBanner label={t('swiss.winner', { name: standings[0]?.name ?? '' })} />
      )}

      <TabBar tabs={tabs} activeId={tab} onChange={setTab} />

      {tab === 'standings' && (
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
              <TableHead className={headClass}>ELO</TableHead>
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
                    <TableCell className="py-2.5 pr-3 font-medium">{row.name}</TableCell>
                    <TableCell className="py-2.5 pr-3 tabular-nums">{row.wins}</TableCell>
                    <TableCell className="py-2.5 pr-3 tabular-nums">{row.losses}</TableCell>
                    <TableCell className="py-2.5 pr-3 tabular-nums">{row.setsWon}-{row.setsLost}</TableCell>
                    {showPoints && (
                      <TableCell className="py-2.5 pr-3 tabular-nums">{row.pointsWon}-{row.pointsLost}</TableCell>
                    )}
                    <TableCell className="py-2.5 pr-3 tabular-nums">{row.buchholz}</TableCell>
                    <TableCell className="py-2.5 pr-3 tabular-nums text-[var(--color-faint)]">
                      {row.elo ?? '—'}
                    </TableCell>
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
      )}

      {tab === 'schedule' && (
        <div>
          <RoundSchedule
            schedule={schedule}
            players={players}
            onEditMatch={setEditingMatch}
            scoringMode={scoringMode}
            maxSets={maxSets}
            roundLabelKey="swiss.round"
            byeLabelKey="swiss.bye"
          />
          <div className="mt-4 text-sm text-[var(--color-muted)]">
            {t('swiss.roundProgress', { current: currentRound, total: totalRounds })}
          </div>
          {roundComplete && !complete && (
            <div className="mt-4">
              <Button onClick={handleGenerateNextRound}>
                {t('swiss.generateNextRound', { n: currentRound + 1 })}
              </Button>
            </div>
          )}
        </div>
      )}

      {tab === 'results' && complete && (
        <div className="mt-6">
          <FinalResultsTable results={buildSwissResults(standings)} />
        </div>
      )}

      {editingMatch && (
        <ScoreModal
          match={editingMatch}
          players={players}
          scoringMode={scoringMode}
          maxSets={maxSets}
          onSave={handleSave}
          onClose={() => { setEditingMatch(null); }}
        />
      )}
    </div>
  );
};
