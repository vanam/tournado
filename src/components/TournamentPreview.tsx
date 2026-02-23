import { useState, useMemo } from 'react';
import type { DragEvent, ReactElement } from 'react';
import { GripVertical } from 'lucide-react';
import { BracketRounds } from './common/BracketRounds';
import { useTranslation } from '../i18n/useTranslation';
import { generateBracket } from '../utils/bracketUtils';
import { generateDoubleElim } from '../utils/doubleElimUtils';
import { distributePlayersToGroups, indexToGroupLabel } from '../utils/groupStageUtils';
import type { BaseGroup } from '../utils/groupStageUtils';
import { Format } from '../types';
import type { Player } from '../types';

interface TournamentPreviewProps {
  format: Format;
  players: Player[];
  groupCount: number;
  externalGroups?: BaseGroup[] | null;
  onGroupsChange?: (groups: BaseGroup[]) => void;
}

function getUpdatedPlayerIds(
  currentIds: string[],
  groupIndex: number,
  fromGroupIndex: number,
  toGroupIndex: number,
  playerId: string,
): string[] {
  if (groupIndex === fromGroupIndex) return currentIds.filter((id) => id !== playerId);
  if (groupIndex === toGroupIndex) return [...currentIds, playerId];
  return currentIds;
}

export const TournamentPreview = ({
  format,
  players,
  groupCount,
  externalGroups,
  onGroupsChange,
}: TournamentPreviewProps): ReactElement | null => {
  const { t } = useTranslation();

  const bracket = useMemo(
    () => (format === Format.SINGLE_ELIM ? generateBracket(players) : null),
    [format, players],
  );

  const doubleElim = useMemo(
    () => (format === Format.DOUBLE_ELIM ? generateDoubleElim(players) : null),
    [format, players],
  );

  const groups = useMemo(
    () =>
      format === Format.GROUPS_TO_BRACKET
        ? distributePlayersToGroups(players, groupCount)
        : null,
    [format, players, groupCount],
  );

  const [localGroups, setLocalGroups] = useState<BaseGroup[] | null>(null);
  const [prevGroups, setPrevGroups] = useState<BaseGroup[] | null>(groups);
  const [drag, setDrag] = useState<{ playerId: string; fromGroupIndex: number } | null>(null);
  const [overGroupIndex, setOverGroupIndex] = useState<number | null>(null);

  if (prevGroups !== groups) {
    setPrevGroups(groups);
    setLocalGroups(externalGroups ?? groups);
    setDrag(null);
    setOverGroupIndex(null);
  }

  function handleDragStart(playerId: string, fromGroupIndex: number): void {
    setDrag({ playerId, fromGroupIndex });
  }

  function handleGroupDragOver(e: DragEvent<HTMLDivElement>, groupIndex: number): void {
    e.preventDefault();
    if (overGroupIndex !== groupIndex) setOverGroupIndex(groupIndex);
  }

  function handleGroupDragLeave(e: DragEvent<HTMLDivElement>): void {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setOverGroupIndex(null);
    }
  }

  function handleGroupDrop(toGroupIndex: number): void {
    if (!drag || !localGroups) {
      setDrag(null);
      setOverGroupIndex(null);
      return;
    }
    const { playerId, fromGroupIndex } = drag;
    if (fromGroupIndex !== toGroupIndex) {
      const newGroups = localGroups.map((g, i) => ({
        ...g,
        playerIds: getUpdatedPlayerIds(g.playerIds, i, fromGroupIndex, toGroupIndex, playerId),
      }));
      setLocalGroups(newGroups);
      onGroupsChange?.(newGroups);
    }
    setDrag(null);
    setOverGroupIndex(null);
  }

  function handleDragEnd(): void {
    setDrag(null);
    setOverGroupIndex(null);
  }

  const displayGroups = localGroups ?? groups;

  if (!bracket && !doubleElim && !displayGroups) return null;

  return (
    <div>
      {bracket && (
        <div className="border border-[var(--color-border)] rounded-xl p-4">
          <BracketRounds bracket={bracket} players={players} />
        </div>
      )}

      {doubleElim && (
        <div className="border border-[var(--color-border)] rounded-xl p-4">
          <BracketRounds bracket={doubleElim.winners} players={players} />
        </div>
      )}

      {displayGroups && (
        <div className="space-y-3">
          {displayGroups.map((group, i) => (
            <div
              key={group.id}
              onDragOver={(e) => { handleGroupDragOver(e, i); }}
              onDragLeave={handleGroupDragLeave}
              onDrop={() => { handleGroupDrop(i); }}
              className={`border rounded-xl p-4 transition-colors ${
                overGroupIndex === i && drag?.fromGroupIndex !== i
                  ? 'border-[var(--color-primary)] bg-[var(--color-soft)]'
                  : 'border-[var(--color-border)]'
              }`}
            >
              <div className="text-sm font-semibold text-[var(--color-muted)] mb-3">
                {t('groupStage.groupTitle', { label: indexToGroupLabel(i) })}
              </div>
              <ul className="space-y-1 min-h-[2rem]">
                {group.playerIds.map((pid, rank) => {
                  const player = players.find((p) => p.id === pid);
                  const isDragging = drag?.playerId === pid;
                  return (
                    <li
                      key={pid}
                      draggable
                      onDragStart={() => { handleDragStart(pid, i); }}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-2 border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm transition-colors ${
                        isDragging ? 'opacity-40' : ''
                      }`}
                    >
                      <GripVertical className="h-4 w-4 text-[var(--color-faint)] cursor-grab shrink-0" />
                      <span className="text-[var(--color-faint)] w-5 text-right">
                        #{rank + 1}
                      </span>
                      <span className="flex-1">{player?.name ?? pid}</span>
                      {player?.elo != null && (
                        <span className="text-xs text-[var(--color-faint)]">
                          {t('players.elo', { elo: player.elo })}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
