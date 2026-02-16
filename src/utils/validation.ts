import { Format, BracketType, ScoreMode } from '../types';
import type {
  Tournament,
  Player,
  Match,
  Bracket,
  Round,
  RoundRobinSchedule,
  DoubleElim,
  DoubleElimMatch,
  DoubleElimFinals,
  Group,
  GroupStage,
  GroupStagePlayoffs,
  GroupStageSettings,
  LoserLink,
} from '../types';

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

function isValidFormat(value: unknown): value is Format {
  return Object.values(Format).includes(value as Format);
}

function isValidBracketType(value: unknown): value is BracketType {
  return Object.values(BracketType).includes(value as BracketType);
}

function isValidScoreMode(value: unknown): value is ScoreMode {
  return Object.values(ScoreMode).includes(value as ScoreMode);
}

function isValidSetScore(value: unknown): value is [number, number] {
  return isArray(value) && value.length === 2 && isNumber(value[0]) && isNumber(value[1]);
}

function isValidPlayer(value: unknown): value is Player {
  if (!isObject(value)) return false;
  if (!isString(value['id'])) return false;
  if (!isString(value['name'])) return false;
  if ('seed' in value && !isNullish(value['seed']) && !isNumber(value['seed'])) return false;
  if ('elo' in value && !isNullish(value['elo']) && !isNumber(value['elo'])) return false;
  return true;
}

function isValidMatch(value: unknown): value is Match {
  if (!isObject(value)) return false;
  if (!isString(value['id'])) return false;
  if ('player1Id' in value && !isNullish(value['player1Id']) && !isString(value['player1Id'])) return false;
  if ('player2Id' in value && !isNullish(value['player2Id']) && !isString(value['player2Id'])) return false;
  if ('scores' in value && !isArray(value['scores'])) return false;
  if ('scores' in value && isArray(value['scores']) && !value['scores'].every((s) => isValidSetScore(s))) return false;
  if ('winnerId' in value && !isNullish(value['winnerId']) && !isString(value['winnerId'])) return false;
  if ('walkover' in value && !isBoolean(value['walkover'])) return false;
  if ('nextMatchId' in value && !isNullish(value['nextMatchId']) && !isString(value['nextMatchId'])) return false;
  if ('position' in value && !isNullish(value['position']) && !isNumber(value['position'])) return false;
  if ('dummy' in value && !isBoolean(value['dummy'])) return false;
  return true;
}

function isValidBracket(value: unknown): value is Bracket {
  if (!isObject(value)) return false;
  if (!isArray(value['rounds'])) return false;
  if (!value['rounds'].every((round) => isArray(round) && round.every((m) => isValidMatch(m)))) return false;
  if ('thirdPlaceMatch' in value && !isNullish(value['thirdPlaceMatch']) && !isValidMatch(value['thirdPlaceMatch'])) return false;
  return true;
}

function isValidRound(value: unknown): value is Round {
  if (!isObject(value)) return false;
  if (!isNumber(value['roundNumber'])) return false;
  if ('byePlayerId' in value && !isNullish(value['byePlayerId']) && !isString(value['byePlayerId'])) return false;
  if (!isArray(value['matches'])) return false;
  if (!value['matches'].every((m) => isValidMatch(m))) return false;
  return true;
}

function isValidRoundRobinSchedule(value: unknown): value is RoundRobinSchedule {
  if (!isObject(value)) return false;
  if (!isArray(value['rounds'])) return false;
  if (!value['rounds'].every((r) => isValidRound(r))) return false;
  return true;
}

function isValidLoserLink(value: unknown): value is LoserLink {
  if (!isObject(value)) return false;
  if (!isString(value['matchId'])) return false;
  if (value['slot'] !== 'player1Id' && value['slot'] !== 'player2Id') return false;
  return true;
}

function isValidDoubleElimMatch(value: unknown): value is DoubleElimMatch {
  if (!isValidMatch(value)) return false;
  if ('winnersSources' in value && !isNullish(value['winnersSources']) && (!isArray(value['winnersSources']) || !value['winnersSources'].every((s) => isString(s)))) return false;
  if ('loserSlotFromWinners' in value && !isNullish(value['loserSlotFromWinners']) && value['loserSlotFromWinners'] !== 'player1Id' && value['loserSlotFromWinners'] !== 'player2Id') return false;
  return true;
}

function isValidDoubleElimFinals(value: unknown): value is DoubleElimFinals {
  if (!isObject(value)) return false;
  if (!isValidMatch(value['grandFinal'])) return false;
  if (!isValidMatch(value['resetFinal'])) return false;
  return true;
}

function isValidDoubleElim(value: unknown): value is DoubleElim {
  if (!isObject(value)) return false;
  if (!isValidBracket(value['winners'])) return false;
  if (!isObject(value['losers'])) return false;
  if (!isArray(value['losers']['rounds'])) return false;
  if (!value['losers']['rounds'].every((round) => isArray(round) && round.every((m) => isValidDoubleElimMatch(m)))) return false;
  if (!isValidDoubleElimFinals(value['finals'])) return false;
  if (!isObject(value['loserLinks'])) return false;
  for (const link of Object.values(value['loserLinks'])) {
    if (!isValidLoserLink(link)) return false;
  }
  return true;
}

function isValidGroupStageSettings(value: unknown): value is GroupStageSettings {
  if (!isObject(value)) return false;
  if (!isNumber(value['groupCount'])) return false;
  if (!isArray(value['qualifiers']) || !value['qualifiers'].every((q) => isNumber(q))) return false;
  if (!isBoolean(value['consolation'])) return false;
  if ('bracketType' in value && !isNullish(value['bracketType']) && !isValidBracketType(value['bracketType'])) return false;
  return true;
}

function isValidGroup(value: unknown): value is Group {
  if (!isObject(value)) return false;
  if (!isString(value['id'])) return false;
  if (!isString(value['name'])) return false;
  if (!isArray(value['playerIds']) || !value['playerIds'].every((p) => isString(p))) return false;
  if (!isValidRoundRobinSchedule(value['schedule'])) return false;
  if (!isNumber(value['order'])) return false;
  return true;
}

function isValidGroupStage(value: unknown): value is GroupStage {
  if (!isObject(value)) return false;
  if (!isArray(value['groups']) || !value['groups'].every((g) => isValidGroup(g))) return false;
  if (!isValidGroupStageSettings(value['settings'])) return false;
  return true;
}

function isValidGroupStagePlayoffs(value: unknown): value is GroupStagePlayoffs {
  if (!isObject(value)) return false;
  if (!isValidBracketType(value['bracketType'])) return false;
  if ('mainBracket' in value && !isNullish(value['mainBracket']) && !isValidBracket(value['mainBracket'])) return false;
  if ('mainDoubleElim' in value && !isNullish(value['mainDoubleElim']) && !isValidDoubleElim(value['mainDoubleElim'])) return false;
  if ('consolationBracket' in value && !isNullish(value['consolationBracket']) && !isValidBracket(value['consolationBracket'])) return false;
  if ('consolationDoubleElim' in value && !isNullish(value['consolationDoubleElim']) && !isValidDoubleElim(value['consolationDoubleElim'])) return false;
  return true;
}

function isValidTournamentBase(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) return false;
  if (!isString(value['id'])) return false;
  if (!isString(value['name'])) return false;
  if (!isArray(value['players']) || !value['players'].every((p) => isValidPlayer(p))) return false;
  if (!isString(value['createdAt'])) return false;
  if ('completedAt' in value && !isNullish(value['completedAt']) && !isString(value['completedAt'])) return false;
  if ('winnerId' in value && !isNullish(value['winnerId']) && !isString(value['winnerId'])) return false;
  if ('scoringMode' in value && !isNullish(value['scoringMode']) && !isValidScoreMode(value['scoringMode'])) return false;
  if ('maxSets' in value && !isNullish(value['maxSets']) && !isNumber(value['maxSets'])) return false;
  if ('groupStageMaxSets' in value && !isNullish(value['groupStageMaxSets']) && !isNumber(value['groupStageMaxSets'])) return false;
  if ('bracketMaxSets' in value && !isNullish(value['bracketMaxSets']) && !isNumber(value['bracketMaxSets'])) return false;
  return true;
}

export function isValidTournament(value: unknown): value is Tournament {
  if (!isValidTournamentBase(value)) return false;

  if (!isValidFormat(value['format'])) return false;

  switch (value['format']) {
    case Format.SINGLE_ELIM: {
      if (!isValidBracket(value['bracket'])) return false;
      break;
    }
    case Format.DOUBLE_ELIM: {
      if (!isValidDoubleElim(value['doubleElim'])) return false;
      break;
    }
    case Format.ROUND_ROBIN: {
      if (!isValidRoundRobinSchedule(value['schedule'])) return false;
      break;
    }
    case Format.GROUPS_TO_BRACKET: {
      if (!isValidGroupStage(value['groupStage'])) return false;
      if ('groupStagePlayoffs' in value && !isNullish(value['groupStagePlayoffs']) && !isValidGroupStagePlayoffs(value['groupStagePlayoffs'])) return false;
      if ('groupStageBrackets' in value && !isNullish(value['groupStageBrackets']) && !isValidGroupStagePlayoffs(value['groupStageBrackets'])) return false;
      if ('maxSetsBracket' in value && !isNullish(value['maxSetsBracket']) && !isNumber(value['maxSetsBracket'])) return false;
      break;
    }
  }

  return true;
}

export function validateTournaments(data: unknown): Tournament[] {
  if (!isArray(data)) return [];
  return data.filter((t) => isValidTournament(t));
}
