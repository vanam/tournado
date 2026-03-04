import { useState, type ReactElement } from 'react';
import { ScoreModal } from '../ScoreModal';
import { BracketRounds } from '../common/BracketRounds';
import { WinnerBanner } from '../common/WinnerBanner';
import { TabBar } from '../common/TabBar';
import { FinalResultsTable } from '../common/FinalResultsTable';
import { MatchCard } from './MatchCard';
import { getBracketWinner, canEditMatch } from '../../utils/bracketUtils';
import { buildBracketResults } from '../../utils/resultsUtils';
import { ensureParticipants, getParticipantPlayers } from '../../utils/participantUtils';
import { useTranslation } from '../../i18n/useTranslation';
import { DEFAULT_MAX_SETS } from '../../constants';
import { useTypedTournament } from '../../context/tournamentContext';
import { recordScore, clearScore } from '../../api/client';
import { ScoreMode, Format } from '../../types';
import type { Match, SetScore, SingleElimTournament } from '../../types';

type BracketTab = 'playoff' | 'results';

export const BracketView = (): ReactElement | null => {
  const { tournament, reloadTournament } = useTypedTournament<SingleElimTournament>(Format.SINGLE_ELIM);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [tab, setTab] = useState<BracketTab>('playoff');
  const { t } = useTranslation();

  if (!tournament) return null;

  const { bracket, players } = tournament;
  const storedParticipants = ensureParticipants(players, tournament.participants);
  const participantPlayers = getParticipantPlayers(players, storedParticipants);
  const scoringMode = tournament.scoringMode ?? ScoreMode.SETS;
  const maxSets = tournament.maxSets ?? DEFAULT_MAX_SETS;
  const winner = getBracketWinner(bracket);
  const thirdPlaceMatch = bracket.thirdPlaceMatch;
  const { id: tournamentId } = tournament;

  const tabs: { id: BracketTab; label: string }[] = [
    { id: 'playoff', label: t('tabs.playoff') },
    { id: 'results', label: t('tabs.results') },
  ];

  function handleSave(matchId: string, winnerId: string | null, scores: SetScore[], walkover = false): void {
    const scoreOp = winnerId === null
      ? clearScore(tournamentId, matchId)
      : recordScore(tournamentId, matchId, { scores, walkover });
    void scoreOp.then(reloadTournament).then(() => { setEditingMatch(null); });
  }

  return (
    <div>
      {winner && (
        <WinnerBanner
          label={t('bracket.winner', { name: participantPlayers.find((p) => p.id === winner)?.name ?? '' })}
        />
      )}

      <TabBar tabs={tabs} activeId={tab} onChange={setTab} />

      {tab === 'playoff' ? (
        <>
          <BracketRounds
            bracket={bracket}
            players={players}
            participants={storedParticipants}
            scoringMode={scoringMode}
            maxSets={maxSets}
            showSeedNumbers
            onEditMatch={(match) => { setEditingMatch(match); }}
          />

          {thirdPlaceMatch && (thirdPlaceMatch.player1Id ?? thirdPlaceMatch.player2Id) && (
            <div className="mt-6">
              <div className="text-xs font-semibold text-[var(--color-muted)] mb-2">
                {t('bracket.thirdPlace')}
              </div>
              <MatchCard
                match={thirdPlaceMatch}
                players={players}
                participants={storedParticipants}
                canEdit={canEditMatch(bracket, thirdPlaceMatch.id)}
                onClick={() => { setEditingMatch(thirdPlaceMatch); }}
                scoringMode={scoringMode}
                maxSets={maxSets}
                roundIndex={bracket.rounds.length}
              />
            </div>
          )}

          {editingMatch && (
            <ScoreModal
              match={editingMatch}
              players={players}
              participants={storedParticipants}
              scoringMode={scoringMode}
              maxSets={maxSets}
              onSave={handleSave}
              onClose={() => { setEditingMatch(null); }}
            />
          )}
        </>
      ) : (
        <FinalResultsTable results={buildBracketResults(bracket, participantPlayers)} />
      )}
    </div>
  );
};
