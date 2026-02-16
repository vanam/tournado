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
