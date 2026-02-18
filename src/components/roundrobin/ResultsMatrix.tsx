import type { ReactElement } from 'react';
import { useMemo } from 'react';
import {
  getSetTotals,
  getWalkoverSetWinner,
  hasWalkover,
  isWalkoverScore,
} from '../../utils/scoreUtils';
import { ScoreMode } from '../../types';
import type { Match, Player, RoundRobinSchedule, SetScore } from '../../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

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

interface ResultsMatrixCellProps {
  rowPlayer: Player;
  colPlayer: Player;
  match: Match | undefined;
  showPoints: boolean;
  scoringMode: ScoreMode;
  maxSets: number | undefined;
}

interface ResultsMatrixRowProps {
  rowPlayer: Player;
  players: Player[];
  matchIndex: Map<string, Match>;
  showPoints: boolean;
  scoringMode: ScoreMode;
  maxSets: number | undefined;
}

function getMatchFromIndex(matchIndex: Map<string, Match>, rowId: string, colId: string): Match | undefined {
  const key = [rowId, colId].toSorted((a, b) => a.localeCompare(b)).join('|');
  return matchIndex.get(key);
}

function buildSetEntries(
  scores: (SetScore | null)[],
  swapped: boolean
): SetEntry[] {
  return scores
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
    .filter((entry): entry is SetEntry => entry != null);
}

const ResultsMatrixHeader = ({ players }: { players: Player[] }): ReactElement => (
  <TableHeader>
    <TableRow className="border-b-0 hover:bg-transparent">
      <TableHead className="py-2 pr-3 sticky left-0 z-10" />
      {players.map((p) => (
        <TableHead
          key={p.id}
          className="py-2 pr-3 text-left font-medium text-[var(--color-text)] sticky left-0 z-10 whitespace-nowrap"
        >
          {p.name}
        </TableHead>
      ))}
    </TableRow>
  </TableHeader>
);

const ResultsMatrixCell = ({
  rowPlayer,
  colPlayer,
  match,
  showPoints,
  scoringMode,
  maxSets,
}: ResultsMatrixCellProps): ReactElement => {
  if (rowPlayer.id === colPlayer.id) {
    return (
      <TableCell className="py-2 px-2 text-center bg-[var(--color-soft)] text-[var(--color-faint)]">
        -
      </TableCell>
    );
  }

  if (!match || match.scores.length === 0) {
    if (match?.walkover || hasWalkover(match?.scores ?? [])) {
      const rowIsWinner = match?.winnerId === rowPlayer.id;
      return (
        <TableCell
          className={`py-2 px-2 text-center ${
            rowIsWinner ? 'font-semibold' : 'text-[var(--color-muted)]'
          }`}
        >
          <div className="font-mono text-xs">WO</div>
        </TableCell>
      );
    }
    return (
      <TableCell className="py-2 px-2 text-center text-[var(--color-faintest)]">
        -
      </TableCell>
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

  const setEntries = showPoints
    ? buildSetEntries(match.scores, swapped)
    : [];

  return (
    <TableCell className="py-2 px-2 text-center">
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
    </TableCell>
  );
};

const ResultsMatrixRow = ({
  rowPlayer,
  players,
  matchIndex,
  showPoints,
  scoringMode,
  maxSets,
}: ResultsMatrixRowProps): ReactElement => (
  <TableRow>
    <TableHead className="py-2 pr-3 text-left font-medium text-[var(--color-text)] sticky left-0 z-10 whitespace-nowrap">
      {rowPlayer.name}
    </TableHead>
    {players.map((colPlayer) => {
      const match = getMatchFromIndex(matchIndex, rowPlayer.id, colPlayer.id);
      return (
        <ResultsMatrixCell
          key={colPlayer.id}
          rowPlayer={rowPlayer}
          colPlayer={colPlayer}
          match={match}
          showPoints={showPoints}
          scoringMode={scoringMode}
          maxSets={maxSets}
        />
      );
    })}
  </TableRow>
);

export const ResultsMatrix = ({
  players,
  schedule,
  scoringMode = ScoreMode.SETS,
  maxSets,
}: ResultsMatrixProps): ReactElement => {
  const showPoints = scoringMode === ScoreMode.POINTS;

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

  return (
    <Table className="border-separate border-spacing-0">
      <ResultsMatrixHeader players={players} />
      <TableBody>
        {players.map((rowPlayer) => (
          <ResultsMatrixRow
            key={rowPlayer.id}
            rowPlayer={rowPlayer}
            players={players}
            matchIndex={matchIndex}
            showPoints={showPoints}
            scoringMode={scoringMode}
            maxSets={maxSets}
          />
        ))}
      </TableBody>
    </Table>
  );
};
