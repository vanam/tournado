export interface MatchIdGenerator {
  nextId: (prefix?: string) => string;
  reset: () => void;
}

export function createMatchIdGenerator(startAt = 0): MatchIdGenerator {
  let counter = startAt;
  return {
    nextId(prefix = ''): string {
      counter += 1;
      return prefix + String(counter);
    },
    reset(): void {
      counter = startAt;
    },
  };
}

