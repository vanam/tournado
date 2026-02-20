import type { Player } from '../types';

interface UsePlayerOrderReturn {
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
  shufflePlayers: () => void;
  sortPlayersByElo: () => void;
}

export function usePlayerOrder(
  players: Player[],
  setPlayers: (players: Player[]) => void,
): UsePlayerOrderReturn {
  function moveUp(index: number): void {
    if (index === 0) return;
    const updated = [...players];
    const prev = updated[index - 1];
    const curr = updated[index];
    if (!prev || !curr) return;
    updated[index - 1] = curr;
    updated[index] = prev;
    setPlayers(updated.map((p, i) => ({ ...p, seed: i + 1 })));
  }

  function moveDown(index: number): void {
    if (index === players.length - 1) return;
    const updated = [...players];
    const curr = updated[index];
    const next = updated[index + 1];
    if (!curr || !next) return;
    updated[index] = next;
    updated[index + 1] = curr;
    setPlayers(updated.map((p, i) => ({ ...p, seed: i + 1 })));
  }

  function shufflePlayers(): void {
    const shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Weak random shuffle is fine here since it's just for tournament seeding and not security-sensitive
      // eslint-disable-next-line sonarjs/pseudo-random
      const j = Math.floor(Math.random() * (i + 1));
      const a = shuffled[i];
      const b = shuffled[j];
      if (!a || !b) continue;
      shuffled[i] = b;
      shuffled[j] = a;
    }
    setPlayers(shuffled.map((p, i) => ({ ...p, seed: i + 1 })));
  }

  function sortPlayersByElo(): void {
    const sorted = [...players].toSorted((a, b) => {
      const aElo = Number(a.elo);
      const bElo = Number(b.elo);
      const safeAElo = Number.isFinite(aElo) ? aElo : 0;
      const safeBElo = Number.isFinite(bElo) ? bElo : 0;
      if (safeBElo !== safeAElo) return safeBElo - safeAElo;
      return (a.seed ?? 0) - (b.seed ?? 0);
    });
    setPlayers(sorted.map((p, i) => ({ ...p, seed: i + 1 })));
  }

  return { moveUp, moveDown, shufflePlayers, sortPlayersByElo };
}
