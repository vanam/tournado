import type { Player } from './core';

// --- Standings & Results ---

export interface StandingsRow {
  playerId: string;
  name: string;
  elo?: number | undefined;
  played: number;
  wins: number;
  losses: number;
  points: number;
  setsWon: number;
  setsLost: number;
  pointsWon: number;
  pointsLost: number;
  tiebreakDetails?: RoundRobinTiebreakDetails;
}

export type SwissCriteriaKey = 'buchholz' | 'sonnebornBerger' | 'headToHead' | 'setRatio' | 'ballRatio';

export interface SwissTiebreakDetails {
  buchholz: number;
  sonnebornBerger: number;
  headToHead: number;
  setRatio: number;
  ballRatio: number;
  tiebreakApplied: SwissCriteriaKey[];
}

export interface SwissStandingsRow extends Omit<StandingsRow, 'tiebreakDetails'> {
  buchholz: number;
  tiebreakDetails?: SwissTiebreakDetails;
}

export interface RoundRobinTiebreakDetails {
  headToHead: number;
  headToHeadSetDiff: number;
  headToHeadSetsWon: number;
  setDiff: number;
  setsWon: number;
  pointsDiff: number;
  pointsDiffApplicable: boolean;
  tiebreakApplied: string[];
}

export interface RankedResult {
  playerId: string;
  name: string;
  rankStart?: number;
  rankEnd?: number;
}

export interface NormalizedStats {
  pointsPct: number;
  setDiffPerMatch: number;
  setsWonPerMatch: number;
  pointsDiffPerMatch: number;
  played: number;
}

export interface TiebreakDetails {
  setsWonPerMatch: number;
  setDiffPerMatch: number;
  pointsDiffPerMatch: number;
  opponentAvgRank: number;
  relativeRank: number;
  fairPlay: boolean;
  pointsDiffApplicable: boolean;
  lottery: number | null;
  lotteryUsed: boolean;
}

export interface GroupAdvancerEntry extends Player {
  groupId: string;
  groupRank: number;
  stats: StandingsRow;
  normalized: NormalizedStats;
  tiebreakDetails: TiebreakDetails;
  advanceType: 'qualifier' | 'lucky' | 'nonQualifier';
  tiebreakApplied?: string[];
}

export interface GroupAdvancersResult {
  main: GroupAdvancerEntry[];
  luckyLosers: GroupAdvancerEntry[];
  mainWithLucky: GroupAdvancerEntry[];
  consolation: GroupAdvancerEntry[];
  luckyCandidates: GroupAdvancerEntry[];
  bracketTargetSize: number;
  luckyLoserSlots: number;
}

// --- Tiebreaker Criteria Types ---

export type RoundRobinCriteriaKey =
  | 'headToHead'
  | 'headToHeadSetDiff'
  | 'headToHeadSetsWon'
  | 'setDiff'
  | 'setsWon'
  | 'pointsDiff';

export type GroupStageCriteriaKey =
  | 'setsWonPerMatch'
  | 'setDiffPerMatch'
  | 'pointsDiffPerMatch'
  | 'opponentAvgRank'
  | 'relativeRank'
  | 'fairPlay'
  | 'lottery';

export interface CriteriaRow<T = RoundRobinCriteriaKey | GroupStageCriteriaKey> {
  key: T;
  label: string;
  value: string;
  help: string;
}
