import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { RoundSchedule } from '../roundrobin/RoundSchedule';
import { StandingsTable } from '../roundrobin/StandingsTable';
import { ScoreModal } from '../ScoreModal';
import { TabBar } from '../common/TabBar';
import { BracketRounds } from '../common/BracketRounds';
import { WinnerBanner } from '../common/WinnerBanner';
import { FinalResultsTable } from '../common/FinalResultsTable';
import { buildBracketResults, buildDoubleElimResults, offsetResults, sortResults } from '../../utils/resultsUtils';
import { GroupAdvancersPanel } from './GroupAdvancersPanel';
import { MatchCard } from '../bracket/MatchCard';
import {
  buildGroupStagePlayoffs,
  getGroupPlayers,
  getGroupStandings,
  isGroupStageComplete,
  getGroupAdvancers,
  indexToGroupLabel,
} from '../../utils/groupStageUtils';
import { advanceWinner, getBracketWinner, clearMatchResult, canEditMatch } from '../../utils/bracketUtils';
import { advanceDoubleElim, clearDoubleElimMatch, getDoubleElimWinner, canEditDoubleElimMatch } from '../../utils/doubleElimUtils';
import { useTranslation } from '../../i18n/useTranslation';
import { DEFAULT_MAX_SETS } from '../../constants';
import { ResultsMatrix } from '../roundrobin/ResultsMatrix';
import { useGroupsToBracketTournament } from '../../context/tournamentContext';
import { BRACKET_TYPES, SCORE_MODES } from '../../types';
import type {
  Bracket,
  DoubleElim,
  GroupStage,
  GroupStagePlayoffs,
  Match,
  Player,
  ScoreMode,
  SetScore,
  GroupAdvancerEntry,
} from '../../types';

type MainTab = 'tournament' | 'results';
type GroupTab = 'standings' | 'results' | 'schedule';

type EditingState =
  | { type: 'group'; groupId: string; matchId: string }
  | { type: 'mainBracket'; matchId: string }
  | { type: 'consolationBracket'; matchId: string }
  | { type: 'mainDoubleElim'; matchId: string }
  | { type: 'consolationDoubleElim'; matchId: string };

interface BracketPanelProps {
  readonly title: string;
  readonly bracket: Bracket | null;
  readonly players: Player[];
  readonly onEditMatch: (match: Match) => void;
  readonly wildCardIds?: Set<string> | null;
  readonly scoringMode?: ScoreMode;
  readonly maxSets?: number;
  readonly groupPlacementByPlayerId?: Map<string, string> | null;
}

interface DoubleElimPanelProps {
  readonly title: string;
  readonly doubleElim: DoubleElim | null;
  readonly players: Player[];
  readonly onEditMatch: (matchId: string) => void;
  readonly wildCardIds?: Set<string> | null;
  readonly scoringMode?: ScoreMode;
  readonly maxSets?: number;
  readonly groupPlacementByPlayerId?: Map<string, string> | null;
}

function findGroupMatch(groupStage: GroupStage, groupId: string, matchId: string): Match | null {
  const group = groupStage.groups.find((g) => g.id === groupId);
  if (!group) return null;
  for (const round of group.schedule.rounds) {
    const match = round.matches.find((m) => m.id === matchId);
    if (match) return match;
  }
  return null;
}

function findBracketMatch(bracket: Bracket | null | undefined, matchId: string): Match | null {
  if (!bracket) return null;
  if (bracket.thirdPlaceMatch?.id === matchId) {
    return bracket.thirdPlaceMatch;
  }
  for (const round of bracket.rounds) {
    const match = round.find((m) => m.id === matchId);
    if (match) return match;
  }
  return null;
}

function findDoubleElimMatch(doubleElim: DoubleElim | null | undefined, matchId: string): Match | null {
  if (!doubleElim) return null;
  for (const round of doubleElim.winners.rounds) {
    const match = round.find((m) => m.id === matchId);
    if (match) return match;
  }
  for (const round of doubleElim.losers.rounds) {
    const match = round.find((m) => m.id === matchId);
    if (match) return match;
  }
  if (doubleElim.finals.grandFinal.id === matchId) {
    return doubleElim.finals.grandFinal;
  }
  if (doubleElim.finals.resetFinal.id === matchId) {
    return doubleElim.finals.resetFinal;
  }
  return null;
}

const BracketPanel = ({
  title,
  bracket,
  players,
  onEditMatch,
  wildCardIds,
  scoringMode,
  maxSets,
  groupPlacementByPlayerId,
}: BracketPanelProps): ReactElement | null => {
  const { t } = useTranslation();
  if (!bracket) return null;

  const tpm = bracket.thirdPlaceMatch ?? null;
  const thirdPlaceRoundIndex = bracket.rounds.length;

  return (
    <div className="border border-[var(--color-border)] rounded-xl p-4 space-y-4">
      <div className="text-sm font-semibold text-[var(--color-muted)]">{title}</div>
      <BracketRounds
        bracket={bracket}
        players={players}
        wildCardIds={wildCardIds}
        scoringMode={scoringMode}
        maxSets={maxSets}
        groupPlacementByPlayerId={groupPlacementByPlayerId}
        onEditMatch={onEditMatch}
      />
      {tpm && (tpm.player1Id ?? tpm.player2Id) && (
        <div className="mt-2">
          <div className="text-xs font-semibold text-[var(--color-muted)] mb-2">
            {t('bracket.thirdPlace')}
          </div>
          <MatchCard
            match={tpm}
            players={players}
            wildCardIds={wildCardIds}
            canEdit={canEditMatch(bracket, tpm.id)}
            onClick={() => { onEditMatch(tpm); }}
            scoringMode={scoringMode}
            maxSets={maxSets}
            roundIndex={thirdPlaceRoundIndex}
          />
        </div>
      )}
    </div>
  );
};

const DoubleElimPanel = ({
  title,
  doubleElim,
  players,
  onEditMatch,
  wildCardIds,
  scoringMode,
  maxSets,
  groupPlacementByPlayerId,
}: DoubleElimPanelProps): ReactElement | null => {
  const { t } = useTranslation();
  if (!doubleElim) return null;

  return (
    <div className="border border-[var(--color-border)] rounded-xl p-4 space-y-4">
      <div className="text-sm font-semibold text-[var(--color-muted)]">{title}</div>
      
      <div className="space-y-2">
        <div className="text-xs font-semibold text-[var(--color-muted)]">{t('doubleElim.winnersBracket')}</div>
        <BracketRounds
          bracket={doubleElim.winners}
          players={players}
          wildCardIds={wildCardIds}
          scoringMode={scoringMode}
          maxSets={maxSets}
          groupPlacementByPlayerId={groupPlacementByPlayerId}
          onEditMatch={(match) => { onEditMatch(match.id); }}
        />
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-[var(--color-muted)]">{t('doubleElim.losersBracket')}</div>
        <BracketRounds
          bracket={doubleElim.losers}
          players={players}
          wildCardIds={wildCardIds}
          scoringMode={scoringMode}
          maxSets={maxSets}
          groupPlacementByPlayerId={groupPlacementByPlayerId}
          onEditMatch={(match) => { onEditMatch(match.id); }}
        />
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-[var(--color-muted)]">{t('doubleElim.finals')}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <MatchCard
            match={doubleElim.finals.grandFinal}
            players={players}
            wildCardIds={wildCardIds}
            canEdit={canEditDoubleElimMatch(doubleElim, doubleElim.finals.grandFinal.id)}
            onClick={() => { onEditMatch(doubleElim.finals.grandFinal.id); }}
            scoringMode={scoringMode}
            maxSets={maxSets}
            roundIndex={doubleElim.winners.rounds.length}
          />
          {doubleElim.finals.resetFinal.player1Id && doubleElim.finals.resetFinal.player2Id && (
            <MatchCard
              match={doubleElim.finals.resetFinal}
              players={players}
              wildCardIds={wildCardIds}
              canEdit={canEditDoubleElimMatch(doubleElim, doubleElim.finals.resetFinal.id)}
              onClick={() => { onEditMatch(doubleElim.finals.resetFinal.id); }}
              scoringMode={scoringMode}
              maxSets={maxSets}
              roundIndex={doubleElim.winners.rounds.length + 1}
            />
          )}
        </div>
      </div>
    </div>
  );
};

function bracketHasResults(bracket: Bracket | null | undefined): boolean {
  if (!bracket) return false;
  return bracket.rounds.some((round) =>
    round.some((match) => match.scores.length > 0 || match.winnerId)
  );
}

function doubleElimHasResults(doubleElim: DoubleElim | null | undefined): boolean {
  if (!doubleElim) return false;
  if (bracketHasResults(doubleElim.winners)) return true;
  if (doubleElim.losers.rounds.some((round) =>
    round.some((match) => match.scores.length > 0 || match.winnerId)
  )) return true;
  if (doubleElim.finals.grandFinal.winnerId) return true;
  if (doubleElim.finals.resetFinal.winnerId) return true;
  return false;
}

function playoffsEqual(
  left: GroupStagePlayoffs | null | undefined,
  right: GroupStagePlayoffs | null | undefined
): boolean {
  if (left === right) return true;
  if (!left || !right) return false;
  return (
    left.bracketType === right.bracketType &&
    JSON.stringify(left.mainBracket) === JSON.stringify(right.mainBracket) &&
    JSON.stringify(left.mainDoubleElim) === JSON.stringify(right.mainDoubleElim) &&
    JSON.stringify(left.consolationBracket) === JSON.stringify(right.consolationBracket) &&
    JSON.stringify(left.consolationDoubleElim) === JSON.stringify(right.consolationDoubleElim)
  );
}

function getPlayoffs(tournament: { groupStagePlayoffs?: GroupStagePlayoffs | null; groupStageBrackets?: GroupStagePlayoffs | null }): GroupStagePlayoffs | null {
  const playoffs = tournament.groupStagePlayoffs ?? tournament.groupStageBrackets;
  if (!playoffs) return null;
  return playoffs;
}

function getMainWinner(playoffs: GroupStagePlayoffs | null, isDoubleElim: boolean): string | null {
  if (!playoffs) return null;
  if (isDoubleElim && playoffs.mainDoubleElim) {
    return getDoubleElimWinner(playoffs.mainDoubleElim);
  }
  if (playoffs.mainBracket) {
    return getBracketWinner(playoffs.mainBracket);
  }
  return null;
}

function hasAnyBracket(playoffs: GroupStagePlayoffs | null, isDoubleElim: boolean): boolean {
  if (!playoffs) return false;
  if (isDoubleElim) {
    return !!playoffs.mainDoubleElim || !!playoffs.consolationDoubleElim;
  }
  return !!playoffs.mainBracket || !!playoffs.consolationBracket;
}

function hasAnyResults(playoffs: GroupStagePlayoffs | null, isDoubleElim: boolean): boolean {
  if (!playoffs) return false;
  if (isDoubleElim) {
    return doubleElimHasResults(playoffs.mainDoubleElim) ||
           doubleElimHasResults(playoffs.consolationDoubleElim);
  }
  return bracketHasResults(playoffs.mainBracket) ||
         bracketHasResults(playoffs.consolationBracket);
}

export const GroupStageView = (): ReactElement | null => {
  const { tournament, updateTournament } = useGroupsToBracketTournament();
  const { t } = useTranslation();
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [groupTabs, setGroupTabs] = useState<Record<string, GroupTab>>({});
  const [mainTab, setMainTab] = useState<MainTab>('tournament');

  const groupStage = tournament?.groupStage;
  const players = useMemo(() => tournament?.players ?? [], [tournament?.players]);
  const playoffs = tournament ? getPlayoffs(tournament) : null;

  const scoringMode = tournament?.scoringMode ?? SCORE_MODES.SETS;
  const groupStageMaxSets = tournament?.groupStageMaxSets ?? tournament?.maxSets ?? DEFAULT_MAX_SETS;
  const bracketMaxSets = tournament?.bracketMaxSets ?? tournament?.maxSets ?? DEFAULT_MAX_SETS;
  const bracketType = playoffs?.bracketType ?? groupStage?.settings.bracketType ?? BRACKET_TYPES.SINGLE_ELIM;
  const isDoubleElim = bracketType === BRACKET_TYPES.DOUBLE_ELIM;

  const standingsByGroup = useMemo(
    () => groupStage ? getGroupStandings(groupStage, players, { scoringMode, maxSets: groupStageMaxSets }) : [],
    [groupStage, players, scoringMode, groupStageMaxSets]
  );

  const groupComplete = useMemo(
    () => groupStage ? isGroupStageComplete(groupStage) : false,
    [groupStage]
  );

  const advancers = useMemo(() => {
    if (!groupComplete || !groupStage) return null;
    return getGroupAdvancers(groupStage, players, { scoringMode, maxSets: groupStageMaxSets });
  }, [groupComplete, groupStage, players, scoringMode, groupStageMaxSets]);

  const wildCardIds = useMemo(() => {
    if (!advancers) return null;
    return new Set(advancers.luckyLosers.map((entry) => entry.id));
  }, [advancers]);

  const groupPlacementByPlayerId = useMemo(() => {
    if (!advancers || !groupStage) return null;
    const groupLabelById = new Map(
      groupStage.groups.map((group, index) => [group.id, indexToGroupLabel(index)])
    );
    const map = new Map<string, string>();
    const addEntry = (entry: GroupAdvancerEntry): void => {
      const label = groupLabelById.get(entry.groupId);
      if (!label || !entry.groupRank) return;
      map.set(entry.id, `${label}${entry.groupRank}`);
    };
    for (const entry of advancers.main) addEntry(entry);
    for (const entry of advancers.luckyLosers) addEntry(entry);
    for (const entry of advancers.consolation) addEntry(entry);
    return map;
  }, [advancers, groupStage]);

  const winnerId = useMemo(() => {
    if (!tournament) return null;
    if (tournament.winnerId) return tournament.winnerId;
    return getMainWinner(playoffs, isDoubleElim);
  }, [playoffs, tournament, isDoubleElim]);

  const winner = useMemo(
    () => (winnerId ? players.find((p) => p.id === winnerId) : null),
    [players, winnerId]
  );

  useEffect(() => {
    if (!groupComplete || !advancers || !groupStage) return;

    const hasBracket = hasAnyBracket(playoffs, isDoubleElim);
    const shouldSkipForPlayed = hasBracket && hasAnyResults(playoffs, isDoubleElim);

    if (shouldSkipForPlayed) return;

    const nextPlayoffs = buildGroupStagePlayoffs(
      groupStage,
      players,
      { scoringMode, maxSets: groupStageMaxSets }
    );

    if (playoffsEqual(playoffs, nextPlayoffs)) return;

    const mainWinner = getMainWinner(nextPlayoffs, isDoubleElim);

    updateTournament((prev) => ({
      ...prev,
      groupStagePlayoffs: nextPlayoffs,
      winnerId: mainWinner ?? null,
      completedAt: mainWinner ? new Date().toISOString() : null,
    }));
  }, [advancers, groupComplete, groupStage, playoffs, players, scoringMode, groupStageMaxSets, updateTournament, isDoubleElim, tournament]);

  const activeMatch = useMemo(() => {
    if (!editing || !groupStage) return null;
    if (editing.type === 'group') {
      return findGroupMatch(groupStage, editing.groupId, editing.matchId);
    }
    if (editing.type === 'mainBracket' || editing.type === 'consolationBracket') {
      const bracket = playoffs?.[editing.type];
      return findBracketMatch(bracket, editing.matchId);
    }
    const doubleElim = playoffs?.[editing.type];
    return findDoubleElimMatch(doubleElim, editing.matchId);
  }, [editing, groupStage, playoffs]);

  const activePlayers = useMemo(() => {
    if (!editing || !groupStage) return players;
    if (editing.type === 'group') {
      const group = groupStage.groups.find((g) => g.id === editing.groupId);
      return group ? getGroupPlayers(group, players) : players;
    }
    return players;
  }, [editing, groupStage, players]);

  const finalResults = useMemo(() => {
    if (mainTab !== 'results') return [];
    let mainResults: { playerId: string; name: string; rankStart?: number; rankEnd?: number }[] = [];
    let consolationResults: { playerId: string; name: string; rankStart?: number; rankEnd?: number }[] = [];

    if (playoffs) {
      if (isDoubleElim && playoffs.mainDoubleElim) {
        mainResults = buildDoubleElimResults(playoffs.mainDoubleElim, players);
      } else if (playoffs.mainBracket) {
        mainResults = buildBracketResults(playoffs.mainBracket, players);
      }

      if (isDoubleElim && playoffs.consolationDoubleElim) {
        consolationResults = offsetResults(
          buildDoubleElimResults(playoffs.consolationDoubleElim, players),
          mainResults.length
        );
      } else if (playoffs.consolationBracket) {
        consolationResults = offsetResults(
          buildBracketResults(playoffs.consolationBracket, players),
          mainResults.length
        );
      }
    }

    return sortResults([...mainResults, ...consolationResults]);
  }, [mainTab, playoffs, players, isDoubleElim]);

  function handleSaveGroupMatch(matchId: string, winnerIdValue: string | null, scores: SetScore[], walkover = false): void {
    if (!groupStage) return;
    const updatedGroupStage = structuredClone(groupStage);
    for (const group of updatedGroupStage.groups) {
      for (const round of group.schedule.rounds) {
        const match = round.matches.find((m) => m.id === matchId);
        if (match) {
          match.winnerId = winnerIdValue;
          match.scores = scores;
          match.walkover = walkover;
          break;
        }
      }
    }

    let nextPlayoffs = playoffs;
    const hasExistingPlayoffs = playoffs && hasAnyBracket(playoffs, isDoubleElim);
    if (
      isGroupStageComplete(updatedGroupStage) &&
      !hasExistingPlayoffs
    ) {
      nextPlayoffs = buildGroupStagePlayoffs(updatedGroupStage, players, { scoringMode, maxSets: groupStageMaxSets });
    }

    const mainWinner = getMainWinner(nextPlayoffs, isDoubleElim);
    updateTournament((prev) => ({
      ...prev,
      groupStage: updatedGroupStage,
      groupStagePlayoffs: nextPlayoffs,
      winnerId: mainWinner ?? null,
      completedAt: mainWinner ? new Date().toISOString() : null,
    }));
    setEditing(null);
  }

  function handleSaveBracketMatch(
    matchId: string,
    winnerIdValue: string | null,
    scores: SetScore[],
    bracketKey: 'mainBracket' | 'consolationBracket',
    walkover = false
  ): void {
    if (!playoffs || !groupStage) return;
    const updatedPlayoffs = structuredClone(playoffs);
    const target = updatedPlayoffs[bracketKey];
    if (!target) return;
    updatedPlayoffs[bracketKey] = winnerIdValue
      ? advanceWinner(target, matchId, winnerIdValue, scores, walkover)
      : clearMatchResult(target, matchId);

    const mainWinner = getMainWinner(updatedPlayoffs, isDoubleElim);
    updateTournament((prev) => ({
      ...prev,
      groupStage,
      groupStagePlayoffs: updatedPlayoffs,
      winnerId: mainWinner ?? null,
      completedAt: mainWinner ? new Date().toISOString() : null,
    }));
    setEditing(null);
  }

  function handleSaveDoubleElimMatch(
    matchId: string,
    winnerIdValue: string | null,
    scores: SetScore[],
    bracketKey: 'mainDoubleElim' | 'consolationDoubleElim',
    walkover = false
  ): void {
    if (!playoffs || !groupStage) return;
    const updatedPlayoffs = structuredClone(playoffs);
    const target = updatedPlayoffs[bracketKey];
    if (!target) return;
    updatedPlayoffs[bracketKey] = winnerIdValue
      ? advanceDoubleElim(target, matchId, winnerIdValue, scores, walkover)
      : clearDoubleElimMatch(target, matchId);

    const mainWinner = getMainWinner(updatedPlayoffs, isDoubleElim);
    updateTournament((prev) => ({
      ...prev,
      groupStage,
      groupStagePlayoffs: updatedPlayoffs,
      winnerId: mainWinner ?? null,
      completedAt: mainWinner ? new Date().toISOString() : null,
    }));
    setEditing(null);
  }

  function getGroupTab(groupId: string): GroupTab {
    return groupTabs[groupId] ?? 'standings';
  }

  function setGroupTab(groupId: string, nextTab: GroupTab): void {
    setGroupTabs((prev) => ({ ...prev, [groupId]: nextTab }));
  }

  const mainTabs: { id: MainTab; label: string }[] = [
    { id: 'tournament', label: t('tabs.tournament') },
    { id: 'results', label: t('tabs.results') },
  ];

  if (!tournament || !groupStage) return null;

  return (
    <div className="space-y-8">
      {winner && (
        <WinnerBanner
          label={t('bracket.winner', { name: winner.name })}
        />
      )}

      <TabBar tabs={mainTabs} activeId={mainTab} onChange={setMainTab} />

      {mainTab === 'results' ? (
        <FinalResultsTable results={finalResults} />
      ) : (
        <>
          <div className="space-y-6">
            {groupStage.groups.map((group, index) => {
              const groupPlayers = getGroupPlayers(group, players);
              const standings = standingsByGroup.find((g) => g.groupId === group.id)
                ?.standings;
              const qualifierCount = groupStage.settings.qualifiers[index] ?? 0;
              const activeTab = getGroupTab(group.id);
              const tabs: { id: GroupTab; label: string }[] = [
                { id: 'standings', label: t('roundRobin.standings') },
                { id: 'results', label: t('roundRobin.matrix') },
                { id: 'schedule', label: t('roundRobin.schedule') },
              ];

              return (
                <div
                  key={group.id}
                  className="border border-[var(--color-border)] rounded-xl p-4"
                >
                  <div className="text-sm font-semibold text-[var(--color-muted)] mb-4">
                    {t('groupStage.groupTitle', { label: indexToGroupLabel(index) })}
                  </div>
                  <TabBar
                    tabs={tabs}
                    activeId={activeTab}
                    onChange={(nextTab) => { setGroupTab(group.id, nextTab); }}
                  />

                  {activeTab === 'schedule' && (
                    <RoundSchedule
                      schedule={group.schedule}
                      players={groupPlayers}
                      onEditMatch={(match) =>
                        { setEditing({
                          type: 'group',
                          groupId: group.id,
                          matchId: match.id,
                        }); }
                      }
                      scoringMode={scoringMode}
                      maxSets={groupStageMaxSets}
                    />
                  )}
                  {activeTab === 'standings' && (
                    <StandingsTable
                      standings={standings ?? []}
                      highlightCount={qualifierCount}
                      wildCardIds={wildCardIds}
                      scoringMode={scoringMode}
                    />
                  )}
                  {activeTab !== 'schedule' && activeTab !== 'standings' && (
                    <ResultsMatrix
                      schedule={group.schedule}
                      players={groupPlayers}
                      scoringMode={scoringMode}
                      maxSets={groupStageMaxSets}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {advancers && (
            <GroupAdvancersPanel
              qualifiers={advancers.main}
              luckyLosers={advancers.luckyLosers}
              luckyCandidates={advancers.luckyCandidates}
              groups={groupStage.groups}
              bracketTargetSize={advancers.bracketTargetSize}
              scoringMode={scoringMode}
            />
          )}

          {playoffs?.mainBracket && !isDoubleElim && (
            <BracketPanel
              title={t('groupStage.mainBracket')}
              bracket={playoffs.mainBracket}
              players={players}
              wildCardIds={wildCardIds}
              scoringMode={scoringMode}
              maxSets={bracketMaxSets}
              groupPlacementByPlayerId={groupPlacementByPlayerId}
              onEditMatch={(match) =>
                { setEditing({ type: 'mainBracket', matchId: match.id }); }
              }
            />
          )}

          {playoffs?.mainDoubleElim && isDoubleElim && (
            <DoubleElimPanel
              title={t('groupStage.mainBracket')}
              doubleElim={playoffs.mainDoubleElim}
              players={players}
              wildCardIds={wildCardIds}
              scoringMode={scoringMode}
              maxSets={bracketMaxSets}
              groupPlacementByPlayerId={groupPlacementByPlayerId}
              onEditMatch={(matchId) =>
                { setEditing({ type: 'mainDoubleElim', matchId }); }
              }
            />
          )}

          {playoffs?.consolationBracket && !isDoubleElim && (
            <BracketPanel
              title={t('groupStage.consolationBracket')}
              bracket={playoffs.consolationBracket}
              players={players}
              wildCardIds={wildCardIds}
              scoringMode={scoringMode}
              maxSets={bracketMaxSets}
              groupPlacementByPlayerId={groupPlacementByPlayerId}
              onEditMatch={(match) =>
                { setEditing({ type: 'consolationBracket', matchId: match.id }); }
              }
            />
          )}

          {playoffs?.consolationDoubleElim && isDoubleElim && (
            <DoubleElimPanel
              title={t('groupStage.consolationBracket')}
              doubleElim={playoffs.consolationDoubleElim}
              players={players}
              wildCardIds={wildCardIds}
              scoringMode={scoringMode}
              maxSets={bracketMaxSets}
              groupPlacementByPlayerId={groupPlacementByPlayerId}
              onEditMatch={(matchId) =>
                { setEditing({ type: 'consolationDoubleElim', matchId }); }
              }
            />
          )}

          {activeMatch && (
            <ScoreModal
              match={activeMatch}
              players={activePlayers}
              scoringMode={scoringMode}
              maxSets={editing?.type === 'group' ? groupStageMaxSets : bracketMaxSets}
              onSave={(matchId, winnerIdValue, scores, walkover) => {
                if (!editing) return;
                switch (editing.type) {
                case 'group': {
                  handleSaveGroupMatch(matchId, winnerIdValue, scores, walkover);
                  break;
                }
                case 'mainBracket': {
                  handleSaveBracketMatch(matchId, winnerIdValue, scores, 'mainBracket', walkover);
                  break;
                }
                case 'consolationBracket': {
                  handleSaveBracketMatch(matchId, winnerIdValue, scores, 'consolationBracket', walkover);
                  break;
                }
                case 'mainDoubleElim': {
                  handleSaveDoubleElimMatch(matchId, winnerIdValue, scores, 'mainDoubleElim', walkover);
                  break;
                }
                case 'consolationDoubleElim': {
                  handleSaveDoubleElimMatch(matchId, winnerIdValue, scores, 'consolationDoubleElim', walkover);
                  break;
                }
              }
              }}
              onClose={() => { setEditing(null); }}
            />
          )}
        </>
      )}
    </div>
  );
};
