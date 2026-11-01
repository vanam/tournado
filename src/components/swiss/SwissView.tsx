import { type ReactElement, useState } from 'react';
import { TabBar } from '../common/TabBar';
import { WinnerBanner } from '../common/WinnerBanner';
import { FinalResultsTable } from '../common/FinalResultsTable';
import { RoundSchedule } from '../roundrobin/RoundSchedule';
import { ScoreModal } from '../ScoreModal';
import { SwissStandingsTable } from './SwissStandingsTable';
import {
  computeSwissStandings,
  canGenerateNextSwissRound,
  isSwissTournamentComplete,
  buildSwissResults,
} from '../../utils/swissUtils';
import { ensureParticipants, getParticipantPlayers } from '../../utils/participantUtils';
import { useTranslation } from '../../i18n/useTranslation';
import { DEFAULT_MAX_SETS } from '../../constants';
import { useTypedTournament } from '../../context/tournamentContext';
import { generateNextRound } from '../../services/swissService';
import { Format, ScoreMode } from '../../types';
import type { Match, SwissTournament } from '../../types';
import { Button } from '@/components/ui/Button';

type SwissTab = 'standings' | 'schedule' | 'results';

// ─── Main view ────────────────────────────────────────────────────────────────

export const SwissView = (): ReactElement | null => {
  const { tournament, reloadTournament } = useTypedTournament<SwissTournament>(Format.SWISS);
  const [tab, setTab] = useState<SwissTab>('standings');
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const { t } = useTranslation();

  if (!tournament) return null;

  const { schedule, players } = tournament;
  const storedParticipants = ensureParticipants(players, tournament.participants);
  const participantPlayers = getParticipantPlayers(players, storedParticipants);
  const scoringMode = tournament.scoringMode ?? ScoreMode.SETS;
  const maxSets = tournament.maxSets ?? DEFAULT_MAX_SETS;
  const showPoints = scoringMode === ScoreMode.POINTS;

  const standings = computeSwissStandings(schedule, participantPlayers, { scoringMode, maxSets });
  const canGenerate = canGenerateNextSwissRound(tournament);
  const complete = isSwissTournamentComplete(tournament);
  const currentRound = schedule.rounds.length;
  const totalRounds = tournament.totalRounds;
  const { id: tournamentId } = tournament;

  const tabs: { id: SwissTab; label: string }[] = [
    { id: 'standings', label: t('swiss.standings') },
    { id: 'schedule', label: t('swiss.schedule') },
    ...(complete ? [{ id: 'results' as SwissTab, label: t('swiss.results') }] : []),
  ];



  function handleGenerateNextRound(): void {
    void generateNextRound(tournamentId).then(reloadTournament);
  }

  return (
    <div>
      {complete && (
        <WinnerBanner label={t('swiss.winner', { name: standings[0]?.name ?? '' })} />
      )}

      <TabBar tabs={tabs} activeId={tab} onChange={setTab} />

      {tab === 'standings' && (
        <SwissStandingsTable standings={standings} showPoints={showPoints} />
      )}

      {tab === 'schedule' && (
        <div>
          <RoundSchedule
            schedule={schedule}
            players={participantPlayers}
            allPlayers={players}
            participants={storedParticipants}
            onEditMatch={setEditingMatch}
            scoringMode={scoringMode}
            maxSets={maxSets}
            roundLabelKey="swiss.round"
            byeLabelKey="swiss.bye"
          />
          <div className="mt-4 text-sm text-[var(--color-muted)]">
            {t('swiss.roundProgress', { current: currentRound, total: totalRounds })}
          </div>
          {canGenerate && (
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
          participants={storedParticipants}
          scoringMode={scoringMode}
          maxSets={maxSets}
          history={{ tournament }}
          onClose={() => { setEditingMatch(null); }}
        />
      )}
    </div>
  );
};
