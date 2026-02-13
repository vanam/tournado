import { useState, type ReactElement } from 'react';
import { ScoreModal } from '../scoreModal';
import { BracketRounds } from '../common/bracketRounds';
import { WinnerBanner } from '../common/winnerBanner';
import { TabBar } from '../common/tabBar';
import { FinalResultsTable } from '../common/finalResultsTable';
import { MatchCard } from './matchCard';
import { advanceWinner, getBracketWinner, clearMatchResult, canEditMatch } from '../../utils/bracketUtils';
import { buildBracketResults } from '../../utils/resultsUtils';
import { useTranslation } from '../../i18n/useTranslation';
import { SCORE_MODES, DEFAULT_MAX_SETS, FORMATS } from '../../constants';
import { useTypedTournament } from '../../context/tournamentContext';
import type { Match, SetScore, SingleElimTournament } from '../../types';

type BracketTab = 'playoff' | 'results';

export const BracketView = (): ReactElement | null => {
  const { tournament, updateTournament } = useTypedTournament<SingleElimTournament>(FORMATS.SINGLE_ELIM);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [tab, setTab] = useState<BracketTab>('playoff');
  const { t } = useTranslation();

  if (!tournament) return null;

  const { bracket, players } = tournament;
  const scoringMode = tournament.scoringMode ?? SCORE_MODES.SETS;
  const maxSets = tournament.maxSets ?? DEFAULT_MAX_SETS;
  const winner = getBracketWinner(bracket);
  const thirdPlaceMatch = bracket.thirdPlaceMatch;

  const tabs: { id: BracketTab; label: string }[] = [
    { id: 'playoff', label: t('tabs.playoff') },
    { id: 'results', label: t('tabs.results') },
  ];

  function handleSave(matchId: string, winnerId: string | null, scores: SetScore[], walkover = false): void {
    updateTournament((prev) => {
      const updatedBracket = winnerId
        ? advanceWinner(structuredClone(prev.bracket), matchId, winnerId, scores, walkover)
        : clearMatchResult(structuredClone(prev.bracket), matchId);
      const bracketWinner = getBracketWinner(updatedBracket);
      return {
        ...prev,
        bracket: updatedBracket,
        winnerId: bracketWinner,
        completedAt: bracketWinner ? new Date().toISOString() : null,
      };
    });
    setEditingMatch(null);
  }

  return (
    <div>
      {winner && (
        <WinnerBanner
          label={t('bracket.winner', { name: players.find((p) => p.id === winner)?.name ?? '' })}
        />
      )}

      <TabBar tabs={tabs} activeId={tab} onChange={setTab} />

      {tab === 'playoff' ? (
        <>
          <BracketRounds
            bracket={bracket}
            players={players}
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
              scoringMode={scoringMode}
              maxSets={maxSets}
              onSave={handleSave}
              onClose={() => { setEditingMatch(null); }}
            />
          )}
        </>
      ) : (
        <FinalResultsTable results={buildBracketResults(bracket, players)} />
      )}
    </div>
  );
};
