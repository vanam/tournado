import type { CSSProperties, ReactElement } from 'react';
import { useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Match, Player, RoundRobinSchedule, ScoreMode } from '../../types';
import { getSetTotals, hasWalkover } from '../../utils/scoreUtils';

export interface GroupPrintData {
  groupLabel: string;
  players: Player[];
  schedule: RoundRobinSchedule;
  scoringMode: ScoreMode;
  maxSets: number | undefined;
}

function buildMatchIndex(schedule: RoundRobinSchedule): Map<string, Match> {
  const index = new Map<string, Match>();
  for (const round of schedule.rounds) {
    for (const match of round.matches) {
      if (match.dummy) continue;
      const key = [match.player1Id, match.player2Id]
        .toSorted((a, b) => {
          if (a === null && b === null) return 0;
          if (a === null) return 1;
          if (b === null) return -1;
          return a.localeCompare(b);
        })
        .join('|');
      index.set(key, match);
    }
  }
  return index;
}

function getMatchByPlayers(index: Map<string, Match>, idA: string, idB: string): Match | undefined {
  const key = [idA, idB].toSorted((a, b) => a.localeCompare(b)).join('|');
  return index.get(key);
}

function getCellContent(
  rowPlayer: Player,
  match: Match | undefined,
  scoringMode: ScoreMode,
  maxSets: number | undefined,
): { text: string; bold: boolean } {
  if (!match) return { text: '', bold: false };
  if (match.scores.length === 0 && !match.walkover) return { text: '', bold: false };

  const isWalkover = match.walkover || hasWalkover(match.scores);
  const swapped = match.player1Id !== rowPlayer.id;
  const { p1Sets, p2Sets } = getSetTotals(match.scores, { scoringMode, maxSets });
  const setsText = swapped ? `${p2Sets}-${p1Sets}` : `${p1Sets}-${p2Sets}`;

  let rowIsWinner: boolean;
  if (match.winnerId) {
    rowIsWinner = match.winnerId === rowPlayer.id;
  } else if (swapped) {
    rowIsWinner = p2Sets > p1Sets;
  } else {
    rowIsWinner = p1Sets > p2Sets;
  }

  return {
    text: isWalkover ? `${setsText} WO` : setsText,
    bold: rowIsWinner,
  };
}

function getMatchLine(
  match: Match,
  players: Player[],
  scoringMode: ScoreMode,
  maxSets: number | undefined,
): string {
  const p1 = players.find((p) => p.id === match.player1Id);
  const p2 = players.find((p) => p.id === match.player2Id);
  const p1Name = p1?.name ?? '?';
  const p2Name = p2?.name ?? '?';

  if (match.scores.length === 0 && !match.walkover) {
    return `${p1Name} \u2013 ${p2Name}`;
  }

  const isWalkover = match.walkover || hasWalkover(match.scores);
  const { p1Sets, p2Sets } = getSetTotals(match.scores, { scoringMode, maxSets });
  const score = isWalkover ? `${p1Sets}-${p2Sets} WO` : `${p1Sets}-${p2Sets}`;
  return `${p1Name} \u2013 ${p2Name}: ${score}`;
}

const baseCellStyle: CSSProperties = {
  border: '1px solid #555',
  padding: '2px 4px',
  fontSize: '10px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  textAlign: 'center',
  verticalAlign: 'middle',
};

export const GroupPrintView = ({
  groupLabel,
  players,
  schedule,
  scoringMode,
  maxSets,
}: GroupPrintData): ReactElement => {
  const { t } = useTranslation();
  const matchIndex = useMemo(() => buildMatchIndex(schedule), [schedule]);

  const colPct = `${(100 / (players.length + 1)).toFixed(3)}%`;
  const columnCount = Math.min(Math.max(schedule.rounds.length, 1), 4);

  return (
    <div
      style={{
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: '#000',
        backgroundColor: '#fff',
        height: '190mm',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '2mm',
        boxSizing: 'border-box',
      }}
    >
      {/* Group heading */}
      <div style={{ flexShrink: 0, fontWeight: 'bold', fontSize: '13px' }}>
        {groupLabel}
      </div>

      {/* Cross table */}
      <div style={{ flexShrink: 0 }}>
        <table
          style={{
            width: '100%',
            tableLayout: 'fixed',
            borderCollapse: 'collapse',
          }}
        >
          <colgroup>
            {Array.from({ length: players.length + 1 }).map((_, i) => (
              <col key={i} style={{ width: colPct }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th
                style={{
                  ...baseCellStyle,
                  textAlign: 'left',
                  backgroundColor: '#f0f0f0',
                }}
              />
              {players.map((p) => (
                <th
                  key={p.id}
                  style={{
                    ...baseCellStyle,
                    fontWeight: 'bold',
                    backgroundColor: '#f0f0f0',
                  }}
                >
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((rowPlayer) => (
              <tr key={rowPlayer.id}>
                <th
                  style={{
                    ...baseCellStyle,
                    textAlign: 'left',
                    fontWeight: 'bold',
                    backgroundColor: '#f0f0f0',
                  }}
                >
                  {rowPlayer.name}
                </th>
                {players.map((colPlayer) => {
                  if (rowPlayer.id === colPlayer.id) {
                    return (
                      <td
                        key={colPlayer.id}
                        style={{ ...baseCellStyle, backgroundColor: '#d8d8d8' }}
                      >
                        ×
                      </td>
                    );
                  }
                  const match = getMatchByPlayers(matchIndex, rowPlayer.id, colPlayer.id);
                  const { text, bold } = getCellContent(
                    rowPlayer,
                    match,
                    scoringMode,
                    maxSets,
                  );
                  return (
                    <td
                      key={colPlayer.id}
                      style={{
                        ...baseCellStyle,
                        fontWeight: bold ? 'bold' : 'normal',
                      }}
                    >
                      {text}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Divider */}
      <hr
        style={{
          flexShrink: 0,
          border: 'none',
          borderTop: '1px solid #999',
          margin: '0',
        }}
      />

      {/* Schedule */}
      <div style={{ flex: '1 1 auto', overflow: 'hidden' }}>
        <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '1mm' }}>
          {t('roundRobin.schedule')}
        </div>
        <div
          style={{
            columnCount,
            columnGap: '5mm',
            fontSize: '9px',
            lineHeight: '1.5',
          }}
        >
          {schedule.rounds.map((round) => {
            const byePlayer = round.byePlayerId
              ? players.find((p) => p.id === round.byePlayerId)
              : null;
            const realMatches = round.matches.filter(
              (m) => !m.dummy && m.player1Id != null && m.player2Id != null,
            );

            return (
              <div
                key={round.roundNumber}
                style={{ breakInside: 'avoid', marginBottom: '1.5mm' }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '0.5mm' }}>
                  {t('roundRobin.round', { n: round.roundNumber })}
                  {byePlayer != null && (
                    <span style={{ fontWeight: 'normal' }}>
                      {' '}
                      {t('roundRobin.bye', { name: byePlayer.name })}
                    </span>
                  )}
                </div>
                {realMatches.map((match) => (
                  <div key={match.id} style={{ paddingLeft: '3mm' }}>
                    {getMatchLine(match, players, scoringMode, maxSets)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
