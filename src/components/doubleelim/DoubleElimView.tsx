import { useMemo, useState, type ReactElement } from 'react';
import { BracketRounds } from '../common/BracketRounds';
import { MatchCard } from '../bracket/MatchCard';
import { ScoreModal } from '../ScoreModal';
import { WinnerBanner } from '../common/WinnerBanner';
import { TabBar } from '../common/TabBar';
import { FinalResultsTable } from '../common/FinalResultsTable';
import {
  canEditDoubleElimMatch,
  getDoubleElimWinner,
} from '../../utils/doubleElimUtils';
import { buildDoubleElimResults } from '../../utils/resultsUtils';
import { ensureParticipants, getParticipantPlayers } from '../../utils/participantUtils';
import { useTranslation } from '../../i18n/useTranslation';
import { DEFAULT_MAX_SETS } from '../../constants';
import { useTypedTournament } from '../../context/tournamentContext';
import { recordScore, clearScore } from '../../api/client';
import { ScoreMode, Format } from '../../types';
import type { DoubleElimTournament, Match, SetScore } from '../../types';

type DoubleElimTab = 'playoff' | 'results';

function shouldShowFinal(match?: Match | null): boolean {
  if (!match) return false;
  if (match.player1Id || match.player2Id) return true;
  if (match.winnerId) return true;
  return Array.isArray(match.scores) && match.scores.length > 0;
}

export const DoubleElimView = (): ReactElement | null => {
  const { tournament, reloadTournament } = useTypedTournament<DoubleElimTournament>(Format.DOUBLE_ELIM);
  const { t } = useTranslation();
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [tab, setTab] = useState<DoubleElimTab>('playoff');

  const doubleElim = tournament?.doubleElim;
  const players = useMemo(() => tournament?.players ?? [], [tournament?.players]);
  const storedParticipants = useMemo(
    () => ensureParticipants(players, tournament?.participants),
    [players, tournament?.participants],
  );
  const participantPlayers = useMemo(
    () => getParticipantPlayers(players, storedParticipants),
    [players, storedParticipants],
  );
  const scoringMode = tournament?.scoringMode ?? ScoreMode.SETS;
  const maxSets = tournament?.maxSets ?? DEFAULT_MAX_SETS;

  const tabs: { id: DoubleElimTab; label: string }[] = [
    { id: 'playoff', label: t('tabs.playoff') },
    { id: 'results', label: t('tabs.results') },
  ];

  const winnerId = useMemo(() => (doubleElim ? getDoubleElimWinner(doubleElim) : null), [doubleElim]);
  const winner = useMemo(
    () => (winnerId ? participantPlayers.find((p) => p.id === winnerId) : null),
    [participantPlayers, winnerId]
  );
  const finalsRoundIndex = doubleElim?.winners.rounds.length ?? 0;

  function handleSave(matchId: string, winnerIdValue: string | null, scores: SetScore[], walkover = false): void {
    if (!tournament) return;
    const scoreOp = winnerIdValue === null
      ? clearScore(tournament.id, matchId)
      : recordScore(tournament.id, matchId, { scores, walkover });
    void scoreOp.then(reloadTournament).then(() => { setEditingMatch(null); });
  }

  if (!tournament || !doubleElim) return null;

  const finals = doubleElim.finals;
  const showGrandFinal = shouldShowFinal(finals.grandFinal);
  const showResetFinal = shouldShowFinal(finals.resetFinal);

  return (
    <div className="space-y-8">
      {winner && (
        <WinnerBanner
          label={t('bracket.winner', { name: winner.name })}
        />
      )}

      <TabBar tabs={tabs} activeId={tab} onChange={setTab} />

      {tab === 'playoff' ? (
        <>
          <div className="space-y-4">
            <div className="text-sm font-semibold text-[var(--color-muted)]">
              {t('doubleElim.winnersBracket')}
            </div>
            <BracketRounds
              bracket={doubleElim.winners}
              players={players}
              participants={storedParticipants}
              scoringMode={scoringMode}
              maxSets={maxSets}
              showSeedNumbers
              onEditMatch={(match) => { setEditingMatch(match); }}
              canEditMatchFn={(_bracket, matchId) => canEditDoubleElimMatch(doubleElim, matchId)}
            />
          </div>

          {doubleElim.losers.rounds.length > 0 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-[var(--color-muted)]">
                {t('doubleElim.losersBracket')}
              </div>
              <BracketRounds
                bracket={doubleElim.losers}
                players={players}
                participants={storedParticipants}
                scoringMode={scoringMode}
                maxSets={maxSets}
                showSeedNumbers
                onEditMatch={(match) => { setEditingMatch(match); }}
                canEditMatchFn={(_bracket, matchId) => canEditDoubleElimMatch(doubleElim, matchId)}
              />
            </div>
          )}

          {(showGrandFinal || showResetFinal) && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-[var(--color-muted)]">
                {t('doubleElim.grandFinal')}
              </div>
              {showGrandFinal && (
                <MatchCard
                  match={finals.grandFinal}
                  players={players}
                  participants={storedParticipants}
                  canEdit={canEditDoubleElimMatch(doubleElim, finals.grandFinal.id)}
                  scoringMode={scoringMode}
                  maxSets={maxSets}
                  showSeedNumbers
                  roundIndex={finalsRoundIndex}
                  onClick={() => { setEditingMatch(finals.grandFinal); }}
                />
              )}
              {showResetFinal && (
                <div>
                  <div className="text-xs font-semibold text-[var(--color-muted)] mb-2">
                    {t('doubleElim.resetFinal')}
                  </div>
                  <MatchCard
                    match={finals.resetFinal}
                    players={players}
                    participants={storedParticipants}
                    canEdit={canEditDoubleElimMatch(doubleElim, finals.resetFinal.id)}
                    scoringMode={scoringMode}
                    maxSets={maxSets}
                    showSeedNumbers
                    roundIndex={finalsRoundIndex}
                    onClick={() => { setEditingMatch(finals.resetFinal); }}
                  />
                </div>
              )}
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
        <FinalResultsTable results={buildDoubleElimResults(doubleElim, participantPlayers)} />
      )}
    </div>
  );
};
