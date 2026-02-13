import { describe, it, expect } from 'vitest';
import {
  buildGroupStageBrackets,
  createGroupStage,
  distributePlayersToGroups,
  getGroupAdvancers,
  isGroupStageComplete,
} from './groupStageUtils';
import { SCORE_MODES } from '../constants';
import type { Player, SetScore } from '../types';

function makePlayers(list: number[]): Player[] {
  return list.map((elo, index) => ({
    id: `p${index + 1}`,
    name: `Player ${index + 1}`,
    elo,
    seed: index + 1,
  }));
}

describe('distributePlayersToGroups', () => {
  it('distributes players in round-robin order by seed', () => {
    const players = makePlayers([2000, 1900, 1800, 1700, 1600, 1500, 3000, 2500]);
    const groups = distributePlayersToGroups(players, 2);
    expect(groups).toHaveLength(2);
    expect(groups[0]!.playerIds).toEqual(['p1', 'p3', 'p5', 'p7']);
    expect(groups[1]!.playerIds).toEqual(['p2', 'p4', 'p6', 'p8']);
  });
});

describe('createGroupStage', () => {
  it('creates schedules for each group', () => {
    const players = makePlayers([1600, 1500, 1400, 1300]);
    const groupStage = createGroupStage(players, {
      groupCount: 2,
      qualifiers: [1, 1],
      consolation: false,
    });
    expect(groupStage.groups).toHaveLength(2);
    for (const group of groupStage.groups) {
      expect(group.schedule.rounds.length).toBeGreaterThan(0);
    }
  });
});

describe('getGroupAdvancers', () => {
  it('respects variable qualifiers per group', () => {
    const players = makePlayers([2000, 1900, 1800, 1700]);
    const groupStage = createGroupStage(players, {
      groupCount: 2,
      qualifiers: [1, 2],
      consolation: false,
    });

    for (const group of groupStage.groups) {
      for (const round of group.schedule.rounds) {
        for (const match of round.matches) {
          match.winnerId = match.player1Id!;
          match.scores = [[11, 5], [11, 7], [11, 3]];
        }
      }
    }

    const { main, consolation, luckyLosers, mainWithLucky } = getGroupAdvancers(
      groupStage,
      players
    );
    expect(main).toHaveLength(3);
    expect(luckyLosers).toHaveLength(1);
    expect(mainWithLucky).toHaveLength(4);
    expect(consolation).toHaveLength(0);
  });

  it('selects lucky losers fairly across uneven group sizes', () => {
    const players = makePlayers([2000, 1900, 1800, 1700, 1600, 1500, 1400]);
    const groupStage = createGroupStage(players, {
      groupCount: 3,
      qualifiers: [1, 1, 1],
      consolation: false,
    });

    const winnerByPair = new Map([
      ['p1-p4', 'p1'],
      ['p1-p7', 'p1'],
      ['p4-p7', 'p4'],
      ['p2-p5', 'p2'],
      ['p3-p6', 'p3'],
    ]);

    for (const group of groupStage.groups) {
      for (const round of group.schedule.rounds) {
        for (const match of round.matches) {
          const key = [match.player1Id!, match.player2Id!].toSorted((a, b) => a.localeCompare(b)).join('-');
          const winnerId = winnerByPair.get(key);
          match.winnerId = winnerId ?? match.player1Id!;
          match.scores = [[11, 5], [11, 7], [11, 3]];
        }
      }
    }

    const { main, consolation, luckyLosers, mainWithLucky } = getGroupAdvancers(
      groupStage,
      players
    );
    expect(main).toHaveLength(3);
    expect(luckyLosers).toHaveLength(1);
    expect(mainWithLucky).toHaveLength(4);
    expect(consolation).toHaveLength(3);
  });

  it('shows only shared criteria plus the deciding one for lucky cards', () => {
    const players = makePlayers([2000, 1900, 1800, 1700, 1600, 1500]);
    const groupStage = createGroupStage(players, {
      groupCount: 3,
      qualifiers: [1, 1, 1],
      consolation: false,
    });

    const scoreByPair = new Map<string, SetScore[]>([
      ['p1-p4', [[11, 9], [9, 11], [11, 9]]],
      ['p2-p5', [[11, 5], [9, 11], [11, 4]]],
      ['p3-p6', [[11, 6], [11, 6]]],
    ]);

    for (const group of groupStage.groups) {
      for (const round of group.schedule.rounds) {
        for (const match of round.matches) {
          const key = [match.player1Id!, match.player2Id!].toSorted((a, b) => a.localeCompare(b)).join('-');
          const scores = scoreByPair.get(key);
          match.scores = scores ?? [[11, 5], [11, 5]];
          match.winnerId = match.player1Id!;
          if (key === 'p1-p4') match.winnerId = 'p1';
          if (key === 'p2-p5') match.winnerId = 'p2';
          if (key === 'p3-p6') match.winnerId = 'p3';
        }
      }
    }

    const { luckyCandidates, luckyLosers } = getGroupAdvancers(groupStage, players, {
      scoringMode: SCORE_MODES.POINTS,
    });

    expect(luckyLosers).toHaveLength(1);

    const byId = new Map(luckyCandidates.map((entry) => [entry.id, entry]));
    const p4 = byId.get('p4')!;
    const p5 = byId.get('p5')!;
    const p6 = byId.get('p6')!;

    expect(p4.tiebreakApplied).toEqual([
      'setsWonPerMatch',
      'setDiffPerMatch',
      'pointsDiffPerMatch',
    ]);
    expect(p5.tiebreakApplied).toEqual([
      'setsWonPerMatch',
      'setDiffPerMatch',
      'pointsDiffPerMatch',
    ]);
    expect(p6.tiebreakApplied).toEqual(['setsWonPerMatch']);
  });
});

describe('buildGroupStageBrackets', () => {
  it('builds main and consolation brackets when enabled', () => {
    const players = makePlayers([2000, 1900, 1800, 1700]);
    const groupStage = createGroupStage(players, {
      groupCount: 2,
      qualifiers: [1, 1],
      consolation: true,
    });

    for (const group of groupStage.groups) {
      for (const round of group.schedule.rounds) {
        for (const match of round.matches) {
          match.winnerId = match.player1Id!;
          match.scores = [[11, 5], [11, 7], [11, 3]];
        }
      }
    }

    expect(isGroupStageComplete(groupStage)).toBe(true);

    const { mainBracket, consolationBracket } = buildGroupStageBrackets(
      groupStage,
      players
    );
    expect(mainBracket).toBeTruthy();
    expect(consolationBracket).toBeTruthy();
  });
});
