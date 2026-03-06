// --- Match ID Generation ---

export interface MatchIdGenerator {
  nextId: (prefix?: string) => string;
  reset: () => void;
}
