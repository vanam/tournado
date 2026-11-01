import { describe, expect, it } from 'vitest';
import { BracketType, Format } from '../types';
import type { GroupsToBracketTournament } from '../types';
import { generateBracket } from './bracketUtils';
import { generateDoubleElim } from './doubleElimUtils';
import { createGroupStage } from './groupStageUtils';
import { changePlayoffSettings, getPlayoffState, PlayoffSettingsLockedError } from './playoffLifecycle';

const players = Array.from({ length: 4 }, (_, i) => ({ id: `p${i}`, name: `Player ${i}` }));

function fixture(): GroupsToBracketTournament {
  return { id: 'groups', name: 'Groups', version: 1, createdAt: '', format: Format.GROUPS_TO_BRACKET, players,
    groupStage: createGroupStage(players, { groupCount: 2, qualifiers: [1, 1], consolation: true }),
    groupStageBrackets: { bracketType: BracketType.SINGLE_ELIM, mainBracket: null, consolationBracket: null, mainDoubleElim: null, consolationDoubleElim: null },
  };
}

describe('playoff lifecycle', () => {
  it.each(['mainBracket', 'consolationBracket', 'mainDoubleElim', 'consolationDoubleElim'] as const)(
    'locks settings for played bronze or reset matches in legacy %s', (section) => {
      const tournament = fixture();
      const playoffs = tournament.groupStageBrackets!;
      const bracket = section === 'mainBracket' || section === 'consolationBracket'
        ? generateBracket(players) : generateDoubleElim(players);
      Object.assign(playoffs, { [section]: bracket });
      const match = 'winners' in bracket ? bracket.finals.resetFinal : bracket.thirdPlaceMatch!;
      Object.assign(match, { player1Id: 'p0', player2Id: 'p1', winnerId: 'p0', scores: [[3, 0]] });
      expect(getPlayoffState(tournament).locked).toBe(true);
      const before = structuredClone(tournament);
      expect(() => { changePlayoffSettings(tournament, { qualifiers: [2, 2], bracketType: BracketType.DOUBLE_ELIM }); })
        .toThrow(PlayoffSettingsLockedError);
      expect(tournament).toEqual(before);
    },
  );

  it('allows settings changes after automatic BYE advancement', () => {
    const tournament = fixture();
    tournament.groupStageBrackets!.mainBracket = generateBracket(players.slice(0, 3));
    expect(getPlayoffState(tournament).locked).toBe(false);
    changePlayoffSettings(tournament, { qualifiers: [2, 2], bracketType: BracketType.DOUBLE_ELIM });
    expect(tournament.groupStage.settings).toMatchObject({ qualifiers: [2, 2], bracketType: BracketType.DOUBLE_ELIM });
    expect(tournament.groupStageBrackets).toBeNull();
    expect(tournament.groupStagePlayoffs).toBeNull();
  });
});
