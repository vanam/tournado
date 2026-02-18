import { useMemo } from 'react';
import type {
  GroupStage,
  Player,
  GroupAdvancerEntry,
  GroupAdvancersResult,
  StandingsRow,
  ScoreMode,
} from '../types';
import { indexToGroupLabel, getGroupStandings, isGroupStageComplete, getGroupAdvancers } from './groupStageUtils';

interface GroupStandingsEntry {
  groupId: string;
  standings: StandingsRow[];
}

export function useGroupStageStandings(
  groupStage: GroupStage | null | undefined,
  players: Player[],
  scoringMode: ScoreMode,
  maxSets: number
): GroupStandingsEntry[] {
  return useMemo(() => {
    if (!groupStage) return [];
    return getGroupStandings(groupStage, players, { scoringMode, maxSets });
  }, [groupStage, players, scoringMode, maxSets]);
}

export function useGroupComplete(groupStage: GroupStage | null | undefined): boolean {
  return useMemo(() => {
    if (!groupStage) return false;
    return isGroupStageComplete(groupStage);
  }, [groupStage]);
}

export function useAdvancers(
  groupComplete: boolean,
  groupStage: GroupStage | null | undefined,
  players: Player[],
  scoringMode: ScoreMode,
  maxSets: number
): GroupAdvancersResult | null {
  return useMemo(() => {
    if (!groupComplete || !groupStage) return null;
    return getGroupAdvancers(groupStage, players, { scoringMode, maxSets });
  }, [groupComplete, groupStage, players, scoringMode, maxSets]);
}

export function useWildCardIds(advancers: { luckyLosers: GroupAdvancerEntry[] } | null): Set<string> | null {
  return useMemo(() => {
    if (!advancers) return null;
    return new Set(advancers.luckyLosers.map((entry) => entry.id));
  }, [advancers]);
}

export function useGroupPlacementByPlayerId(
  advancers: { main: GroupAdvancerEntry[]; luckyLosers: GroupAdvancerEntry[]; consolation: GroupAdvancerEntry[] } | null,
  groupStage: GroupStage | null | undefined
): Map<string, string> | null {
  return useMemo(() => {
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
}
