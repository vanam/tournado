import { showToast } from '../../utils/toastUtils';
import { PlayoffRecalculation } from '../PlayoffRecalculation';
import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { Settings } from 'lucide-react';
import { TabBar } from '../common/TabBar';
import { WinnerBanner } from '../common/WinnerBanner';
import { FinalResultsTable } from '../common/FinalResultsTable';
import { evaluateTournament } from '../../utils/tournamentStatus';
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
import { useTranslation } from '../../i18n/useTranslation';
import { DEFAULT_MAX_SETS } from '../../constants';
import { useGroupsToBracketTournament } from '../../context/tournamentContext';
import { generatePlayoffs, updateGroupStageSettings, PlayoffSettingsLockedError } from '../../services/groupStageService';
import { BracketType, ScoreMode } from '../../types';
import { useGroupStageStandings, useGroupComplete, useAdvancers, useWildcardIds, useGroupPlacementByPlayerId } from '../../utils/useGroupStage';
import { getPlayoffState } from '../../utils/playoffLifecycle';
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
  const playoffState = tournament ? getPlayoffState(tournament) : null;
  const playoffs = playoffState?.playoffs ?? null;

  const scoringMode = tournament?.scoringMode ?? ScoreMode.SETS;
  const groupStageMaxSets = tournament?.groupStageMaxSets ?? tournament?.maxSets ?? DEFAULT_MAX_SETS;
  const bracketMaxSets = tournament?.bracketMaxSets ?? tournament?.maxSets ?? DEFAULT_MAX_SETS;
  const bracketType = playoffs?.bracketType ?? groupStage?.settings.bracketType ?? BracketType.SINGLE_ELIM;
  const isDoubleElim = bracketType === BracketType.DOUBLE_ELIM;

  const canEditSettings = !playoffState?.locked;

  const standingsByGroup = useGroupStageStandings(groupStage, participants, scoringMode, groupStageMaxSets);
  const groupComplete = useGroupComplete(groupStage);
  const advancers = useAdvancers(groupComplete, groupStage, participants, scoringMode, groupStageMaxSets);
  const wildcardIds = useWildcardIds(advancers);
  const groupPlacementByPlayerId = useGroupPlacementByPlayerId(advancers, groupStage);

  const evaluation = useMemo(() => tournament ? evaluateTournament(tournament) : null, [tournament]);
  const winnerId = evaluation?.winnerId ?? evaluation?.playoffWinnerId;

  const winner = useMemo(
    () => (winnerId ? participants.find((p) => p.id === winnerId) : null),
    [participants, winnerId]
  );

  useEffect(() => {
    if (!tournament || !playoffState?.needsGeneration) return;
    void generatePlayoffs(tournament.id).then(reloadTournament);
  }, [playoffState?.needsGeneration, tournament, reloadTournament]);

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

  const activePlayers = useMemo(() => {
    if (!editing || !groupStage) return participants;
    if (editing.type === 'group') {
      const group = groupStage.groups.find((g) => g.id === editing.groupId);
      return group ? getGroupPlayers(group, participants) : participants;
    }
    return participants;
  }, [editing, groupStage, participants]);

  const finalResults = mainTab === 'results' ? (evaluation?.results ?? []) : [];

  function handleSaveSettings(newQualifiers: number[], newBracketType: BracketType): void {
    if (!tournament) return;
    const { id: tournamentId } = tournament;
    void updateGroupStageSettings(tournamentId, {
      qualifiers: newQualifiers,
      bracketType: newBracketType,
    }).then(reloadTournament).catch((error_: unknown) => {
      showToast({ message: t(error_ instanceof PlayoffSettingsLockedError ? 'history.settingsLocked' : 'api.errorSave') });
    });
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

      <PlayoffRecalculation tournament={tournament} />
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
            wildcardIds={wildcardIds}
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
            wildcardIds={wildcardIds}
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
            tournament={tournament}
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
