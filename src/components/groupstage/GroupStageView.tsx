import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { TabBar } from '../common/TabBar';
import { WinnerBanner } from '../common/WinnerBanner';
import { FinalResultsTable } from '../common/FinalResultsTable';
import { buildBracketResults, buildDoubleElimResults, offsetResults, sortResults } from '../../utils/resultsUtils';
import { GroupAdvancersPanel } from './GroupAdvancersPanel';
import { GroupStageGroups } from './GroupStageGroups';
import { PlayoffSection } from './PlayoffSection';
import { ScoreModalWrapper } from './ScoreModalWrapper';
import {
  buildGroupStagePlayoffs,
  getGroupPlayers,
  isGroupStageComplete,
} from '../../utils/groupStageUtils';
import { findGroupMatch, findBracketMatch, findDoubleElimMatch } from '../../utils/matchFinders';
import { advanceWinner, getBracketWinner, clearMatchResult } from '../../utils/bracketUtils';
import { advanceDoubleElim, clearDoubleElimMatch, getDoubleElimWinner } from '../../utils/doubleElimUtils';
import { useTranslation } from '../../i18n/useTranslation';
import { DEFAULT_MAX_SETS } from '../../constants';
import { useGroupsToBracketTournament } from '../../context/tournamentContext';
import { BracketType, ScoreMode } from '../../types';
import type {
  Bracket,
  DoubleElim,
  GroupStagePlayoffs,
  SetScore,
} from '../../types';
import { useGroupStageStandings, useGroupComplete, useAdvancers, useWildCardIds, useGroupPlacementByPlayerId } from '../../utils/useGroupStage';

type MainTab = 'tournament' | 'results';
type GroupTab = 'standings' | 'results' | 'schedule';

type EditingType =
  | 'group'
  | 'mainBracket'
  | 'consolationBracket'
  | 'mainDoubleElim'
  | 'consolationDoubleElim';

interface EditingState {
  type: EditingType;
  groupId?: string;
  matchId: string;
}

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

  const scoringMode = tournament?.scoringMode ?? ScoreMode.SETS;
  const groupStageMaxSets = tournament?.groupStageMaxSets ?? tournament?.maxSets ?? DEFAULT_MAX_SETS;
  const bracketMaxSets = tournament?.bracketMaxSets ?? tournament?.maxSets ?? DEFAULT_MAX_SETS;
  const bracketType = playoffs?.bracketType ?? groupStage?.settings.bracketType ?? BracketType.SINGLE_ELIM;
  const isDoubleElim = bracketType === BracketType.DOUBLE_ELIM;

  const standingsByGroup = useGroupStageStandings(groupStage, players, scoringMode, groupStageMaxSets);
  const groupComplete = useGroupComplete(groupStage);
  const advancers = useAdvancers(groupComplete, groupStage, players, scoringMode, groupStageMaxSets);
  const wildCardIds = useWildCardIds(advancers);
  const groupPlacementByPlayerId = useGroupPlacementByPlayerId(advancers, groupStage);

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
    if (editing.type === 'group' && editing.groupId) {
      return findGroupMatch(groupStage, editing.groupId, editing.matchId);
    }
    if (editing.type === 'mainBracket' || editing.type === 'consolationBracket') {
      const bracket = playoffs?.[editing.type];
      return findBracketMatch(bracket, editing.matchId);
    }
    if (editing.type === 'mainDoubleElim' || editing.type === 'consolationDoubleElim') {
      const doubleElim = playoffs?.[editing.type];
      return findDoubleElimMatch(doubleElim, editing.matchId);
    }
    return null;
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

  function handleSave(matchId: string, winnerIdValue: string | null, scores: SetScore[], walkover: boolean): void {
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
  }

  function setGroupTab(groupId: string, nextTab: GroupTab): void {
    setGroupTabs((prev) => ({ ...prev, [groupId]: nextTab }));
  }

  function handleGroupEditMatch(groupId: string, matchId: string): void {
    setEditing({ type: 'group', groupId, matchId });
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
          <GroupStageGroups
            groupStage={groupStage}
            players={players}
            standingsByGroup={standingsByGroup}
            wildCardIds={wildCardIds}
            groupTabs={groupTabs}
            onGroupTabChange={setGroupTab}
            onEditMatch={handleGroupEditMatch}
            scoringMode={scoringMode}
            maxSets={groupStageMaxSets}
          />

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

          <PlayoffSection
            playoffs={playoffs}
            isDoubleElim={isDoubleElim}
            players={players}
            wildCardIds={wildCardIds}
            groupPlacementByPlayerId={groupPlacementByPlayerId}
            scoringMode={scoringMode}
            maxSets={bracketMaxSets}
            onEditMainBracketMatch={(match) => { setEditing({ type: 'mainBracket', matchId: match.id }); }}
            onEditConsolationBracketMatch={(match) => { setEditing({ type: 'consolationBracket', matchId: match.id }); }}
            onEditMainDoubleElimMatch={(matchId) => { setEditing({ type: 'mainDoubleElim', matchId }); }}
            onEditConsolationDoubleElimMatch={(matchId) => { setEditing({ type: 'consolationDoubleElim', matchId }); }}
          />

          <ScoreModalWrapper
            editing={editing}
            activeMatch={activeMatch}
            activePlayers={activePlayers}
            scoringMode={scoringMode}
            groupStageMaxSets={groupStageMaxSets}
            bracketMaxSets={bracketMaxSets}
            onSave={handleSave}
            onClose={() => { setEditing(null); }}
          />
        </>
      )}
    </div>
  );
};