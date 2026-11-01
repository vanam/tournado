import { describe, expect, it } from 'vitest';
import { BracketType, Format } from '../types';
import type { GroupsToBracketTournament } from '../types';
import { generateBracket } from './bracketUtils';
import { createGroupStage } from './groupStageUtils';
import { getTournamentPlayoffs, normalizeTournament } from './tournamentCompatibility';
import { evaluateTournament } from './tournamentStatus';
import { planMatchChange } from './matchChanges';
import { getPlayoffState } from './playoffLifecycle';

const players = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }];

function fixture(): GroupsToBracketTournament {
  const mainBracket = generateBracket(players);
  Object.assign(mainBracket.rounds[0]![0]!, { winnerId: 'a', scores: [[3, 0]] });
  return {
    id: 'legacy', name: 'Legacy tournament', version: 1, createdAt: '',
    format: Format.GROUPS_TO_BRACKET, players,
    groupStage: createGroupStage(players, { groupCount: 1, qualifiers: [2] }),
    groupStageBrackets: {
      bracketType: BracketType.SINGLE_ELIM, mainBracket,
      mainDoubleElim: null, consolationBracket: null, consolationDoubleElim: null,
    },
  };
}

describe('tournament compatibility', () => {
  it('gives legacy and canonical documents the same evaluation, lifecycle and history confirmation', () => {
    const legacy = fixture();
    const current = normalizeTournament(structuredClone(legacy));
    expect(evaluateTournament(legacy)).toEqual(evaluateTournament(current));
    expect(getPlayoffState(legacy)).toEqual(getPlayoffState(current));
    const change = { type: 'clear', matchId: legacy.groupStageBrackets!.mainBracket!.rounds[0]![0]!.id, section: 'mainBracket' } as const;
    expect(planMatchChange(legacy, change)).toEqual(planMatchChange(current, change));
  });

  it('promotes a historical Playoff without changing its results or the source document', () => {
    const original = fixture();
    const snapshot = structuredClone(original);
    const normalized = normalizeTournament(original);

    expect(normalized.groupStagePlayoffs).toEqual(snapshot.groupStageBrackets);
    expect(normalized.groupStageBrackets).toBeNull();
    expect(original).toEqual(snapshot);
    expect(normalizeTournament(normalized)).toEqual(normalized);
  });

  it('uses the current Playoff when both historical and current draws exist', () => {
    const original = fixture();
    const current = { ...original.groupStageBrackets!, mainBracket: generateBracket(players.toReversed()) };
    original.groupStagePlayoffs = current;

    const normalized = normalizeTournament(original);

    expect(getTournamentPlayoffs(normalized)).toEqual(current);
    expect(normalized.groupStageBrackets).toBeNull();
  });

  it('preserves the historical fallback for a null current Playoff, then prevents its revival', () => {
    const original = fixture();
    original.groupStagePlayoffs = null;
    const normalized = normalizeTournament(original);

    expect(getTournamentPlayoffs(normalized)).toEqual(original.groupStageBrackets);
    normalized.groupStagePlayoffs = null;
    expect(getTournamentPlayoffs(normalizeTournament(normalized))).toBeNull();
    expect(original.groupStageBrackets).not.toBeNull();
  });
});
