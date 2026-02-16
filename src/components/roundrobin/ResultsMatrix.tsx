import type { ReactElement } from 'react';
import { useMemo } from 'react';
import {
  getSetTotals,
  getWalkoverSetWinner,
  hasWalkover,
  isWalkoverScore,
} from '../../utils/scoreUtils';
import { SCORE_MODES } from '../../types';
import type { Match, Player, RoundRobinSchedule, ScoreMode, SetScore } from '../../types';

interface SetEntry {
  text: string;
  isWin: boolean;
}

interface ResultsMatrixProps {
  players: Player[];
  schedule: RoundRobinSchedule;
  scoringMode?: ScoreMode | undefined;
  maxSets?: number | undefined;
}

export const ResultsMatrix = ({
  players,
  schedule,
  scoringMode = SCORE_MODES.SETS,
  maxSets,
}: ResultsMatrixProps): ReactElement => {
  const showPoints = scoringMode === SCORE_MODES.POINTS;

  const matchIndex = useMemo(() => {
    const index = new Map<string, Match>();
    for (const round of schedule.rounds) {
      for (const match of round.matches) {
        const key = [match.player1Id, match.player2Id].toSorted((a, b) => {
          if (a === null && b === null) return 0;
          if (a === null) return 1;
          if (b === null) return -1;
          return a.localeCompare(b);
        }).join('|');
        index.set(key, match);
      }
    }
    return index;
  }, [schedule]);

  function getMatch(rowId: string, colId: string): Match | undefined {
    const key = [rowId, colId].toSorted((a, b) => a.localeCompare(b)).join('|');
    return matchIndex.get(key);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="py-2 pr-3 sticky left-0 z-10" />
            {players.map((p) => (
              <th
                key={p.id}
                className="py-2 pr-3 text-left font-medium text-[var(--color-text)] sticky left-0 z-10 whitespace-nowrap"
              >
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((rowPlayer) => (
            <tr key={rowPlayer.id} className="border-b border-[var(--color-border-soft)]">
              <th className="py-2 pr-3 text-left font-medium text-[var(--color-text)] sticky left-0 z-10 whitespace-nowrap">
                {rowPlayer.name}
              </th>
              {players.map((colPlayer) => {
                if (rowPlayer.id === colPlayer.id) {
                  return (
                    <td
                      key={colPlayer.id}
                      className="py-2 px-2 text-center bg-[var(--color-soft)] text-[var(--color-faint)]"
                    >
                      -
                    </td>
                  );
                }

                const match = getMatch(rowPlayer.id, colPlayer.id);
                if (!match || match.scores.length === 0) {
                  if (match?.walkover || hasWalkover(match?.scores ?? [])) {
                    const rowIsWinner = match?.winnerId === rowPlayer.id;
                    return (
                      <td
                        key={colPlayer.id}
                        className={`py-2 px-2 text-center ${
                          rowIsWinner ? 'font-semibold' : 'text-[var(--color-muted)]'
                        }`}
                      >
                        <div className="font-mono text-xs">WO</div>
                      </td>
                    );
                  }
                  return (
                    <td key={colPlayer.id} className="py-2 px-2 text-center text-[var(--color-faintest)]">
                      -
                    </td>
                  );
                }

                const swapped = match.player1Id !== rowPlayer.id;
                const { p1Sets, p2Sets } = getSetTotals(match.scores, { scoringMode, maxSets });
                const setsText = swapped ? `${p2Sets}-${p1Sets}` : `${p1Sets}-${p2Sets}`;
                const isWalkover = match.walkover || hasWalkover(match.scores);
                let rowIsWinner: boolean;
                if (match.winnerId) {
                  rowIsWinner = match.winnerId === rowPlayer.id;
                } else if (swapped) {
                  rowIsWinner = p2Sets > p1Sets;
                } else {
                  rowIsWinner = p1Sets > p2Sets;
                }
                const setEntries: SetEntry[] = showPoints
                  ? match.scores
                      .filter((s): s is SetScore => Array.isArray(s))
                      .map((s) => {
                        const originalA = s[0];
                        const originalB = s[1];
                        if (isWalkoverScore(originalA) || isWalkoverScore(originalB)) {
                          const winner = getWalkoverSetWinner(originalA, originalB);
                          if (winner === 0) return null;
                          const isWin = swapped ? winner === 2 : winner === 1;
                          return { text: 'WO', isWin };
                        }
                        const aNum = swapped ? originalB : originalA;
                        const bNum = swapped ? originalA : originalB;
                        if (!Number.isFinite(aNum) || !Number.isFinite(bNum)) return null;
                        return { text: `${aNum}-${bNum}`, isWin: aNum > bNum };
                      })
                      .filter((entry): entry is SetEntry => entry != null)
                  : [];

                return (
                  <td key={colPlayer.id} className="py-2 px-2 text-center">
                    <div
                      className={`font-mono text-xs ${
                        rowIsWinner ? 'font-semibold' : 'text-[var(--color-text)]'
                      }`}
                    >
                      {isWalkover ? setsText + ' WO' : setsText}
                    </div>
                    {showPoints && setEntries.length > 0 && (
                      <div className="text-[10px] text-[var(--color-faint)]">
                        {setEntries.map((entry, index) => (
                          <span
                            key={`set-${index}`}
                            className={entry.isWin ? 'font-semibold' : ''}
                          >
                            {index > 0 ? ', ' : ''}
                            {entry.text}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
