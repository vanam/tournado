import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { Settings } from 'lucide-react';
import { TabBar } from '../common/TabBar';
import { WinnerBanner } from '../common/WinnerBanner';
import { FinalResultsTable } from '../common/FinalResultsTable';
import { buildBracketResults, buildDoubleElimResults, offsetResults, sortResults } from '../../utils/resultsUtils';
import { GroupAdvancersPanel } from './GroupAdvancersPanel';
import { GroupStageGroups } from './GroupStageGroups';
import { GroupStageSettingsModal } from './GroupStageSettingsModal';
import { PlayoffSection } from './PlayoffSection';
import { ScoreModalWrapper } from './ScoreModalWrapper';
import { ensureParticipants, getParticipantPlayers } from '../../utils/participantUtils';
import {
  getGroupPlayers,
} from '../../utils/groupStageUtils';
import { findGroupMatch, findBracketMatch, findDoubleElimMatch } from '../../utils/matchFinders';
import { hasPlayedDownstreamMatch } from '../../utils/bracketUtils';
import { hasPlayedDownstreamDoubleElimMatch } from '../../utils/doubleElimUtils';
import { useTranslation } from '../../i18n/useTranslation';
import { DEFAULT_MAX_SETS } from '../../constants';
import { useGroupsToBracketTournament } from '../../context/tournamentContext';
import { recordScore, clearScore } from '../../services/matchService';
import { generatePlayoffs, syncBracketParticipants, updateGroupStageSettings } from '../../services/groupStageService';
import { showToast } from '../../utils/toastUtils';
import { BracketType, ScoreMode } from '../../types';
import type {
  Bracket,
  DoubleElim,
  GroupStagePlayoffs,
  SetScore,
} from '../../types';
import { useGroupStageStandings, useGroupComplete, useAdvancers, useWildCardIds, useGroupPlacementByPlayerId } from '../../utils/useGroupStage';
import { Button } from '@/components/ui/Button';

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


function bracketHasPlayedMatch(b: Bracket | null): boolean {
  return b?.rounds.some((r) => r.some((m) => m.player1Id !== null && m.player2Id !== null && m.winnerId !== null)) ?? false;
}

function doubleElimHasPlayedMatch(de: DoubleElim | null): boolean {
  if (de === null) return false;
  return (
    de.winners.rounds.some((r) => r.some((m) => m.player1Id !== null && m.player2Id !== null && m.winnerId !== null)) ||
    de.losers.rounds.some((r) => r.some((m) => m.player1Id !== null && m.player2Id !== null && m.winnerId !== null)) ||
    de.finals.grandFinal.winnerId !== null ||
    de.finals.resetFinal.winnerId !== null
  );
}

function hasAnyPlayedPlayoffMatch(playoffs: GroupStagePlayoffs): boolean {
  return (
    bracketHasPlayedMatch(playoffs.mainBracket) ||
    bracketHasPlayedMatch(playoffs.consolationBracket) ||
    doubleElimHasPlayedMatch(playoffs.mainDoubleElim) ||
    doubleElimHasPlayedMatch(playoffs.consolationDoubleElim)
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
    for (const round of playoffs.mainDoubleElim.winners.rounds) {
      for (const match of round) {
        if (match.winnerId && playoffs.mainDoubleElim.winners.rounds.indexOf(round) === playoffs.mainDoubleElim.winners.rounds.length - 1) {
          return match.winnerId;
        }
      }
    }
    return playoffs.mainDoubleElim.finals.grandFinal.winnerId ?? playoffs.mainDoubleElim.finals.resetFinal.winnerId ?? null;
  }
  if (playoffs.mainBracket) {
    const lastRound = playoffs.mainBracket.rounds.at(-1);
    if (lastRound) {
      const finalMatch = lastRound[0];
      return finalMatch?.winnerId ?? null;
    }
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


interface GroupStageViewProps {
  onRegisterHeaderActions?: (node: ReactNode) => void;
}

export const GroupStageView = ({ onRegisterHeaderActions }: GroupStageViewProps): ReactElement | null => {
  const { tournament, reloadTournament } = useGroupsToBracketTournament();
  const { t } = useTranslation();
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [groupTabs, setGroupTabs] = useState<Record<string, GroupTab>>({});
  const [mainTab, setMainTab] = useState<MainTab>('tournament');
  const [showSettings, setShowSettings] = useState(false);

  const groupStage = tournament?.groupStage;
  const players = useMemo(() => tournament?.players ?? [], [tournament?.players]);
  const storedParticipants = useMemo(
    () => ensureParticipants(players, tournament?.participants),
    [players, tournament?.participants],
  );
  const participants = useMemo(
    () => getParticipantPlayers(players, storedParticipants),
    [players, storedParticipants],
  );
  const playoffs = tournament ? getPlayoffs(tournament) : null;

  const scoringMode = tournament?.scoringMode ?? ScoreMode.SETS;
  const groupStageMaxSets = tournament?.groupStageMaxSets ?? tournament?.maxSets ?? DEFAULT_MAX_SETS;
  const bracketMaxSets = tournament?.bracketMaxSets ?? tournament?.maxSets ?? DEFAULT_MAX_SETS;
  const bracketType = playoffs?.bracketType ?? groupStage?.settings.bracketType ?? BracketType.SINGLE_ELIM;
  const isDoubleElim = bracketType === BracketType.DOUBLE_ELIM;

  const canEditSettings = playoffs === null || !hasAnyPlayedPlayoffMatch(playoffs);

  const standingsByGroup = useGroupStageStandings(groupStage, participants, scoringMode, groupStageMaxSets);
  const groupComplete = useGroupComplete(groupStage);
  const advancers = useAdvancers(groupComplete, groupStage, participants, scoringMode, groupStageMaxSets);
  const wildCardIds = useWildCardIds(advancers);
  const groupPlacementByPlayerId = useGroupPlacementByPlayerId(advancers, groupStage);

  const winnerId = useMemo(() => {
    if (!tournament) return null;
    if (tournament.winnerId) return tournament.winnerId;
    return getMainWinner(playoffs, isDoubleElim);
  }, [playoffs, tournament, isDoubleElim]);

  const winner = useMemo(
    () => (winnerId ? participants.find((p) => p.id === winnerId) : null),
    [participants, winnerId]
  );

  useEffect(() => {
    if (!groupComplete || !advancers || !groupStage) return;
    if (hasAnyBracket(playoffs, isDoubleElim)) return;
    void generatePlayoffs(tournament.id).then(reloadTournament);
  }, [advancers, groupComplete, groupStage, playoffs, tournament, isDoubleElim, reloadTournament]);

  useEffect(() => {
    if (!onRegisterHeaderActions) return;
    onRegisterHeaderActions(
      <Button
        variant="primary-ghost"
        size="icon"
        onClick={() => { setShowSettings(true); }}
        disabled={!canEditSettings}
        aria-label={t('groupStage.settingsButtonLabel')}
        title={t('groupStage.settingsButtonLabel')}
      >
        <Settings />
      </Button>
    );
    return (): void => { onRegisterHeaderActions(null); };
  }, [onRegisterHeaderActions, canEditSettings, t]);

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

  const lockedWinnerId = useMemo((): string | undefined => {
    if (!editing || !activeMatch?.winnerId) return;
    let isLocked = false;
    switch (editing.type) {
      case 'group': {
        break;
      }
      case 'mainBracket': {
        isLocked = !!playoffs?.mainBracket && hasPlayedDownstreamMatch(playoffs.mainBracket, editing.matchId);
        break;
      }
      case 'consolationBracket': {
        isLocked = !!playoffs?.consolationBracket && hasPlayedDownstreamMatch(playoffs.consolationBracket, editing.matchId);
        break;
      }
      case 'mainDoubleElim': {
        isLocked = !!playoffs?.mainDoubleElim && hasPlayedDownstreamDoubleElimMatch(playoffs.mainDoubleElim, editing.matchId);
        break;
      }
      case 'consolationDoubleElim': {
        isLocked = !!playoffs?.consolationDoubleElim && hasPlayedDownstreamDoubleElimMatch(playoffs.consolationDoubleElim, editing.matchId);
        break;
      }
    }
    if (!isLocked) return;
    return activeMatch.winnerId;
  }, [editing, activeMatch, playoffs]);

  const activePlayers = useMemo(() => {
    if (!editing || !groupStage) return participants;
    if (editing.type === 'group') {
      const group = groupStage.groups.find((g) => g.id === editing.groupId);
      return group ? getGroupPlayers(group, participants) : participants;
    }
    return participants;
  }, [editing, groupStage, participants]);

  const finalResults = useMemo(() => {
    if (mainTab !== 'results') return [];
    let mainResults: { playerId: string; name: string; rankStart?: number; rankEnd?: number }[] = [];
    let consolationResults: { playerId: string; name: string; rankStart?: number; rankEnd?: number }[] = [];

    if (playoffs) {
      if (isDoubleElim && playoffs.mainDoubleElim) {
        mainResults = buildDoubleElimResults(playoffs.mainDoubleElim, participants);
      } else if (playoffs.mainBracket) {
        mainResults = buildBracketResults(playoffs.mainBracket, participants);
      }

      if (isDoubleElim && playoffs.consolationDoubleElim) {
        consolationResults = offsetResults(
          buildDoubleElimResults(playoffs.consolationDoubleElim, participants),
          mainResults.length
        );
      } else if (playoffs.consolationBracket) {
        consolationResults = offsetResults(
          buildBracketResults(playoffs.consolationBracket, participants),
          mainResults.length
        );
      }
    }

    return sortResults([...mainResults, ...consolationResults]);
  }, [mainTab, playoffs, participants, isDoubleElim]);

  function handleSave(matchId: string, winnerIdValue: string | null, scores: SetScore[], walkover: boolean): void {
    if (!editing || !tournament) return;
    const tid = tournament.id;
    let scoreOp: Promise<void> = Promise.resolve();
    switch (editing.type) {
      case 'group': {
        const { groupId } = editing;
        if (!groupId) return;
        if (winnerIdValue === null) {
          scoreOp = clearScore(tid, matchId, groupId).then(() => {});
        } else {
          const hasBracket = playoffs != null;
          scoreOp = recordScore(tid, matchId, scores, walkover, groupId).then(() => {
            if (!hasBracket) return;
            return syncBracketParticipants(tid).then((result) => {
              if (result.updated) {
                showToast({ message: t('groupStage.bracketParticipantsUpdated') });
              } else if (result.blocked) {
                showToast({ message: t('groupStage.bracketSyncBlocked') });
              }
            });
          });
        }
        break;
      }
      case 'mainBracket':
      case 'consolationBracket':
      case 'mainDoubleElim':
      case 'consolationDoubleElim': {
        scoreOp = winnerIdValue === null
          ? clearScore(tid, matchId).then(() => {})
          : recordScore(tid, matchId, scores, walkover).then(() => {});
        break;
      }
    }
    void scoreOp.then(reloadTournament).then(() => { setEditing(null); });
  }

  function handleSaveSettings(newQualifiers: number[], newBracketType: BracketType): void {
    if (!tournament) return;
    const { id: tournamentId } = tournament;
    void updateGroupStageSettings(tournamentId, {
      qualifiers: newQualifiers,
      bracketType: newBracketType,
    }).then(reloadTournament);
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
            players={participants}
            allPlayers={players}
            participants={storedParticipants}
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
            players={participants}
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
            participants={storedParticipants}
            scoringMode={scoringMode}
            groupStageMaxSets={groupStageMaxSets}
            bracketMaxSets={bracketMaxSets}
            lockedWinnerId={lockedWinnerId}
            onSave={handleSave}
            onClose={() => { setEditing(null); }}
          />

          {showSettings && (
            <GroupStageSettingsModal
              open={showSettings}
              groups={groupStage.groups}
              initialQualifiers={groupStage.settings.qualifiers}
              initialBracketType={groupStage.settings.bracketType ?? BracketType.SINGLE_ELIM}
              onSave={handleSaveSettings}
              onClose={() => { setShowSettings(false); }}
            />
          )}
        </>
      )}
    </div>
  );
};
