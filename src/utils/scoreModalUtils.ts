import type { Match, Player } from '../types';

export function getWinnerName(
  winnerId: string | null,
  match: Match,
  p1?: Player,
  p2?: Player,
  p1Members?: Player[],
  p2Members?: Player[],
): string {
  if (!winnerId) return '';
  const isP1 = winnerId === match.player1Id;
  const members = isP1 ? (p1Members ?? []) : (p2Members ?? []);
  if (members.length > 0) {
    return members.map((m) => m.name).join('/');
  }
  const p = isP1 ? p1 : p2;
  return p?.name ?? '';
}
