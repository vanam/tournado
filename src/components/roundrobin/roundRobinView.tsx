import type { ReactElement } from 'react';
import { useState } from 'react';
import { StandingsTable } from './standingsTable';
import { ScoreModal } from '../scoreModal';
import { ResultsMatrix } from './resultsMatrix';
import { TabBar } from '../common/tabBar';
import { WinnerBanner } from '../common/winnerBanner';
import { FinalResultsTable } from '../common/finalResultsTable';
import { computeStandings, isScheduleComplete } from '../../utils/roundRobinUtils';
import { buildRoundRobinResults } from '../../utils/resultsUtils';
import { useTranslation } from '../../i18n/useTranslation';
import { DEFAULT_MAX_SETS } from '../../constants';
import { useTypedTournament } from '../../context/tournamentContext';
import { SCORE_MODES, FORMATS } from '../../types';
import type { Match, RoundRobinTournament, SetScore } from '../../types';
import { RoundSchedule } from './roundSchedule';

type RoundRobinTab = 'standings' | 'matrix' | 'schedule' | 'results';

export const RoundRobinView = (): ReactElement | null => {
  const { tournament, updateTournament } = useTypedTournament<RoundRobinTournament>(FORMATS.ROUND_ROBIN);
  const [tab, setTab] = useState<RoundRobinTab>('standings');
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const { t } = useTranslation();

  if (!tournament) return null;

  const { schedule, players } = tournament;
  const scoringMode = tournament.scoringMode ?? SCORE_MODES.SETS;
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
    </div>
  );
};
