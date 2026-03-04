import type { Format, ScoreMode, BracketType } from '../types';

export interface TournamentSummary {
  id: string;
  name: string;
  format: Format;
  createdAt: string;
  completedAt: string | null | undefined;
  winnerId: string | null | undefined;
  playerCount: number;
  teamSize: number;
}

export interface CreateTournamentRequest {
  name: string;
  format: Format;
  players: Array<{ name: string; seed?: number; elo?: number; libraryId?: string }>;
  teamSize?: number;
  scoringMode?: ScoreMode;
  maxSets?: number;
  groupStageMaxSets?: number;
  bracketMaxSets?: number;
  groupCount?: number;
  qualifiers?: number[];
  consolation?: boolean;
  bracketType?: BracketType;
  swissRounds?: number;
}

export interface RecordScoreRequest {
  scores: [number, number][];
  walkover?: boolean;
}

export interface BulkImportRequest {
  text: string;
}

export interface CreatePlayerRequest {
  name: string;
  elo?: number;
  groupIds?: string[];
}

export interface UpdatePlayerRequest {
  name?: string;
  elo?: number;
  groupIds?: string[];
}

export interface CreateGroupRequest {
  name: string;
}

export interface UpdateGroupRequest {
  name: string;
}

export interface ProgressResponse {
  completed: number;
  total: number;
}

export interface EditableResponse {
  editable: boolean;
}

export interface RoundCompleteResponse {
  complete: boolean;
}

export interface MatrixCell {
  player1Id: string;
  player2Id: string;
  scores: [number, number][];
  winnerId: string | null;
}

export interface MatrixResponse {
  playerIds: string[];
  cells: MatrixCell[];
}

export interface PlayerProfile {
  id: string;
  name: string;
  elo?: number;
  groupIds: string[];
  tournaments: Array<{
    tournamentId: string;
    tournamentName: string;
    format: Format;
    teamSize: number;
    playerCount: number;
    createdAt: string;
    isCompleted: boolean;
    rankStart?: number;
    rankEnd?: number;
  }>;
}
