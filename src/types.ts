export enum FORMATS {
  SINGLE_ELIM = 'SINGLE_ELIM',
  DOUBLE_ELIM = 'DOUBLE_ELIM',
  ROUND_ROBIN = 'ROUND_ROBIN',
  GROUPS_TO_BRACKET = 'GROUPS_TO_BRACKET',
}

export enum BRACKET_TYPES {
  SINGLE_ELIM = 'single_elim',
  DOUBLE_ELIM = 'double_elim',
}

export enum SCORE_MODES {
  SETS = 'SETS',
  POINTS = 'POINTS',
}

export type Format = FORMATS;
export type ScoreMode = SCORE_MODES;
export type BracketType = BRACKET_TYPES;

// --- Core Data ---

export interface Player {
  id: string;
  name: string;
  seed?: number;
  elo?: number | undefined; // sjednoceno na number
}

export type SetScore = [number, number];

export interface Match {
  id: string;
  player1Id: string | null;
  player2Id: string | null;
  scores: SetScore[];
  winnerId: string | null;
  walkover: boolean;
  nextMatchId?: string | null;
  position?: number;
  dummy: boolean;
}

export interface Bracket {
  rounds: Match[][];
  thirdPlaceMatch?: Match | null;
}

// --- Round Robin ---

export interface Round {
  roundNumber: number;
  byePlayerId: string | null;
  matches: Match[];
}

export interface RoundRobinSchedule {
  rounds: Round[];
}

// --- Double Elimination ---

export interface LoserLink {
  matchId: string;
  slot: 'player1Id' | 'player2Id';
}

export interface DoubleElimMatch extends Match {
  winnersSources?: string[];
  loserSlotFromWinners?: 'player1Id' | 'player2Id';
}

export interface DoubleElimFinals {
  grandFinal: Match;
  resetFinal: Match;
}

export interface DoubleElim {
  winners: Bracket;
  losers: { rounds: DoubleElimMatch[][] };
  finals: DoubleElimFinals;
  loserLinks: Record<string, LoserLink>;
}

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
  format: FORMATS.SINGLE_ELIM;
  bracket: Bracket;
}

export interface DoubleElimTournament extends TournamentBase {
  format: FORMATS.DOUBLE_ELIM;
  doubleElim: DoubleElim;
}

export interface RoundRobinTournament extends TournamentBase {
  format: FORMATS.ROUND_ROBIN;
  schedule: RoundRobinSchedule;
}

export interface GroupsToBracketTournament extends TournamentBase {
  format: FORMATS.GROUPS_TO_BRACKET;
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

// --- i18n ---

export type TranslationValue = string | Record<string, string>;

export type TranslationMap = Record<string, TranslationValue>;

export interface I18nContext {
  t: (key: string, params?: Record<string, string | number>) => string;
  language: string;
  setLanguage: (lang: string) => void;
}
