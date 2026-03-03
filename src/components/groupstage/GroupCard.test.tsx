import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GroupCard } from './GroupCard';
import type { Group, Match, Participant, Player } from '../../types';
import { ScoreMode } from '../../types';

vi.mock('../../i18n/useTranslation', () => ({
  useTranslation: (): { t: (key: string, params?: Record<string, string | number>) => string } => ({
    t: (key: string): string => key,
  }),
}));

// Suppress noisy console output from TabBar or other sub-components in tests
vi.mock('../common/ProgressBar', () => ({
  ProgressBar: (): null => null,
}));

const rawPlayers: Player[] = [
  { id: 'p1', name: 'Alice' },
  { id: 'p2', name: 'Bob' },
  { id: 'p3', name: 'Carol' },
  { id: 'p4', name: 'Dave' },
];

const storedParticipants: Participant[] = [
  { id: 'part1', playerIds: ['p1', 'p2'] },
  { id: 'part2', playerIds: ['p3', 'p4'] },
];

// Pseudo-players produced by getParticipantPlayers — id=participantId, name="Alice/Bob"
const displayPlayers: Player[] = [
  { id: 'part1', name: 'Alice/Bob' },
  { id: 'part2', name: 'Carol/Dave' },
];

const match: Match = {
  id: 'm1',
  player1Id: 'part1',
  player2Id: 'part2',
  scores: [],
  winnerId: null,
  walkover: false,
  dummy: false,
};

const group: Group = {
  id: 'g1',
  name: 'A',
  playerIds: ['part1', 'part2'],
  schedule: {
    rounds: [
      {
        roundNumber: 1,
        matches: [match],
        byePlayerId: null,
      },
    ],
  },
  order: 0,
};

const commonProps = {
  group,
  groupIndex: 0,
  standings: [],
  qualifierCount: 1,
  wildCardIds: null,
  activeTab: 'schedule' as const,
  onTabChange: (): void => { /* no-op */ },
  onEditMatch: (): void => { /* no-op */ },
  onPrint: (): void => { /* no-op */ },
  scoringMode: ScoreMode.SETS,
  maxSets: 3,
};

describe('GroupCard — 2v2 schedule player display', () => {
  it('shows combined participant name when allPlayers/participants are not passed (bug baseline)', () => {
    render(
      <GroupCard
        {...commonProps}
        groupPlayers={displayPlayers}
      />,
    );
    expect(screen.getByText('Alice/Bob')).toBeDefined();
  });

  it('shows individual player names when allPlayers and participants are passed (fix verification)', () => {
    render(
      <GroupCard
        {...commonProps}
        groupPlayers={displayPlayers}
        allPlayers={rawPlayers}
        participants={storedParticipants}
      />,
    );
    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.getByText('Bob')).toBeDefined();
  });
});
