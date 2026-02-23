import type { ReactElement } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { StandingsTable } from './StandingsTable';
import { ScoreModal } from '../ScoreModal';
import { ResultsMatrix } from './ResultsMatrix';
import { TabBar } from '../common/TabBar';
import { WinnerBanner } from '../common/WinnerBanner';
import { FinalResultsTable } from '../common/FinalResultsTable';
import { computeStandings, isScheduleComplete } from '../../utils/roundRobinUtils';
import { buildRoundRobinResults } from '../../utils/resultsUtils';
import { useTranslation } from '../../i18n/useTranslation';
import { DEFAULT_MAX_SETS } from '../../constants';
import { useTypedTournament } from '../../context/tournamentContext';
import { ScoreMode, Format } from '../../types';
import type { Match, RoundRobinTournament, SetScore } from '../../types';
import { RoundSchedule } from './RoundSchedule';
import { GroupPrintView } from '../groupstage/GroupPrintView';
import type { GroupPrintData } from '../groupstage/GroupPrintView';

type RoundRobinTab = 'standings' | 'matrix' | 'schedule' | 'results';

export const RoundRobinView = (): ReactElement | null => {
  const { tournament, updateTournament } = useTypedTournament<RoundRobinTournament>(Format.ROUND_ROBIN);
  const [tab, setTab] = useState<RoundRobinTab>('standings');
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [printData, setPrintData] = useState<GroupPrintData | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (printData === null) return;
    const reset = (): void => { setPrintData(null); };
    window.addEventListener('afterprint', reset, { once: true });
    window.print();
    return (): void => { window.removeEventListener('afterprint', reset); };
  }, [printData]);

  const handlePrint = useCallback((): void => {
    if (!tournament) return;
    setPrintData({
      groupLabel: tournament.name,
      players: tournament.players,
      schedule: tournament.schedule,
      scoringMode: tournament.scoringMode ?? ScoreMode.SETS,
      maxSets: tournament.maxSets ?? DEFAULT_MAX_SETS,
    });
  }, [tournament]);

  if (!tournament) return null;

  const { schedule, players } = tournament;
  const scoringMode = tournament.scoringMode ?? ScoreMode.SETS;
  const maxSets = tournament.maxSets ?? DEFAULT_MAX_SETS;

  const standings = computeStandings(schedule, players, { scoringMode, maxSets });
  const complete = isScheduleComplete(schedule);

  const tabs: { id: RoundRobinTab; label: string }[] = [
    { id: 'standings', label: t('roundRobin.standings') },
    { id: 'matrix', label: t('roundRobin.matrix') },
    { id: 'schedule', label: t('roundRobin.schedule') },
    { id: 'results', label: t('roundRobin.results') },
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

      const nowComplete = isScheduleComplete(updatedSchedule);
      const newStandings = nowComplete
        ? computeStandings(updatedSchedule, prev.players, { scoringMode, maxSets })
        : null;

      return {
        ...prev,
        schedule: updatedSchedule,
        winnerId: nowComplete ? newStandings?.[0]?.playerId ?? null : null,
        completedAt: nowComplete ? new Date().toISOString() : null,
      };
    });
    setEditingMatch(null);
  }

  return (
    <div>
      {complete && (
        <WinnerBanner
          label={t('roundRobin.winner', { name: standings[0]?.name ?? '' })}
        />
      )}

      <TabBar tabs={tabs} activeId={tab} onChange={setTab} />

      {tab === 'schedule' ? (
        <RoundSchedule
          schedule={schedule}
          players={players}
          onEditMatch={setEditingMatch}
          scoringMode={scoringMode}
          maxSets={maxSets}
        />
      ) : (
        <>
          {tab === 'standings' && <StandingsTable standings={standings} scoringMode={scoringMode} />}
          {tab === 'matrix' && (
            <div className="mt-6">
              <div className="flex justify-end mb-2">
                <button
                  onClick={handlePrint}
                  title={t('roundRobin.print')}
                  className="p-1 rounded text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-soft)] transition-colors"
                  aria-label={t('roundRobin.print')}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                </button>
              </div>
              <ResultsMatrix schedule={schedule} players={players} scoringMode={scoringMode} maxSets={maxSets} />
            </div>
          )}
          {tab !== 'standings' && tab !== 'matrix' && (
            <div className="mt-6">
              <FinalResultsTable results={buildRoundRobinResults(schedule, players, { scoringMode })} />
            </div>
          )}
        </>
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
      {((): ReactElement | null => {
        const printRoot = document.querySelector('#print-root');
        return printData !== null && printRoot !== null
          ? createPortal(<GroupPrintView {...printData} />, printRoot)
          : null;
      })()}
    </div>
  );
};
