import type { Format, BracketType, ScoreMode } from './enums';
import type { Player, Bracket, RoundRobinSchedule, DoubleElim } from './core';

// --- Group Stage ---

export interface Group {
  id: string;
  name: string;
  playerIds: string[];
  schedule: RoundRobinSchedule;
  order: number;
}

export interface GroupStageSettings {
  groupCount: number;
  qualifiers: number[];
  consolation: boolean;
  bracketType?: BracketType;
}

export interface GroupStage {
  groups: Group[];
  settings: GroupStageSettings;
}

export interface GroupStagePlayoffs {
  bracketType: BracketType;
  mainBracket: Bracket | null;
  mainDoubleElim: DoubleElim | null;
  consolationBracket: Bracket | null;
  consolationDoubleElim: DoubleElim | null;
}

export type GroupStageBrackets = GroupStagePlayoffs;

// --- Tournament ---

interface TournamentBase {
  id: string;
  name: string;
  players: Player[];
  createdAt: string;
  completedAt?: string | null;
  winnerId?: string | null;
  scoringMode?: ScoreMode;
  maxSets?: number;
  groupStageMaxSets?: number;
  bracketMaxSets?: number;
}

export interface SingleElimTournament extends TournamentBase {
  format: Format.SINGLE_ELIM;
  bracket: Bracket;
}

export interface DoubleElimTournament extends TournamentBase {
  format: Format.DOUBLE_ELIM;
  doubleElim: DoubleElim;
}

export interface RoundRobinTournament extends TournamentBase {
  format: Format.ROUND_ROBIN;
  schedule: RoundRobinSchedule;
}

export interface GroupsToBracketTournament extends TournamentBase {
  format: Format.GROUPS_TO_BRACKET;
  groupStage: GroupStage;
  groupStagePlayoffs?: GroupStagePlayoffs | null;
  groupStageBrackets?: GroupStagePlayoffs | null;
  maxSetsBracket?: number;
}

export type Tournament =
  | SingleElimTournament
  | DoubleElimTournament
  | RoundRobinTournament
  | GroupsToBracketTournament;
