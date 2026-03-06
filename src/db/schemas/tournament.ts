const setScore = {
  type: 'array',
  items: { type: 'number' },
  minItems: 2,
  maxItems: 2,
};

const match = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    player1Id: { type: ['string', 'null'] },
    player2Id: { type: ['string', 'null'] },
    scores: { type: 'array', items: setScore },
    winnerId: { type: ['string', 'null'] },
    walkover: { type: 'boolean' },
    nextMatchId: { type: ['string', 'null'] },
    position: { type: 'integer' },
    dummy: { type: 'boolean' },
    winnersSources: { type: 'array', items: { type: 'string' } },
    loserSlotFromWinners: {
      type: 'string',
      enum: ['player1Id', 'player2Id'],
    },
  },
  required: ['id', 'scores', 'walkover', 'dummy'],
};

const bracket = {
  type: 'object',
  properties: {
    rounds: { type: 'array', items: { type: 'array', items: match } },
    thirdPlaceMatch: {
      type: ['object', 'null'],
      properties: match.properties,
    },
  },
  required: ['rounds'],
};

const round = {
  type: 'object',
  properties: {
    roundNumber: { type: 'integer' },
    byePlayerId: { type: ['string', 'null'] },
    matches: { type: 'array', items: match },
  },
  required: ['roundNumber', 'matches'],
};

const roundRobinSchedule = {
  type: 'object',
  properties: {
    rounds: { type: 'array', items: round },
  },
  required: ['rounds'],
};

const doubleElimFinals = {
  type: 'object',
  properties: {
    grandFinal: match,
    resetFinal: match,
  },
  required: ['grandFinal', 'resetFinal'],
};

const doubleElim = {
  type: 'object',
  properties: {
    winners: bracket,
    losers: {
      type: 'object',
      properties: {
        rounds: { type: 'array', items: { type: 'array', items: match } },
      },
      required: ['rounds'],
    },
    finals: doubleElimFinals,
    loserLinks: { type: 'object' },
  },
  required: ['winners', 'losers', 'finals', 'loserLinks'],
};

const player = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    seed: { type: 'integer' },
    elo: { type: 'number' },
    libraryId: { type: 'string' },
  },
  required: ['id', 'name'],
};

const participant = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    playerIds: { type: 'array', items: { type: 'string' } },
    seed: { type: 'integer' },
  },
  required: ['id', 'playerIds'],
};

const group = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    playerIds: { type: 'array', items: { type: 'string' } },
    schedule: roundRobinSchedule,
    order: { type: 'integer' },
  },
  required: ['id', 'name', 'playerIds', 'schedule', 'order'],
};

const groupStageSettings = {
  type: 'object',
  properties: {
    groupCount: { type: 'integer' },
    qualifiers: { type: 'array', items: { type: 'integer' } },
    consolation: { type: 'boolean' },
    bracketType: { type: 'string', enum: ['single_elim', 'double_elim'] },
  },
  required: ['groupCount', 'qualifiers', 'consolation'],
};

const groupStage = {
  type: 'object',
  properties: {
    groups: { type: 'array', items: group },
    settings: groupStageSettings,
  },
  required: ['groups', 'settings'],
};

const groupStagePlayoffs = {
  type: ['object', 'null'],
  properties: {
    bracketType: { type: 'string', enum: ['single_elim', 'double_elim'] },
    mainBracket: { type: ['object', 'null'] },
    mainDoubleElim: { type: ['object', 'null'] },
    consolationBracket: { type: ['object', 'null'] },
    consolationDoubleElim: { type: ['object', 'null'] },
  },
};

export const tournamentSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
    version: { type: 'integer' },
    format: {
      type: 'string',
      maxLength: 50,
      enum: [
        'SINGLE_ELIM',
        'DOUBLE_ELIM',
        'ROUND_ROBIN',
        'GROUPS_TO_BRACKET',
        'SWISS',
      ],
    },
    players: { type: 'array', items: player },
    teamSize: { type: 'integer' },
    participants: { type: 'array', items: participant },
    createdAt: { type: 'string', maxLength: 50 },
    completedAt: { type: ['string', 'null'] },
    winnerId: { type: ['string', 'null'] },
    scoringMode: { type: 'string', enum: ['SETS', 'POINTS'] },
    maxSets: { type: 'integer' },
    groupStageMaxSets: { type: 'integer' },
    bracketMaxSets: { type: 'integer' },
    bracket,
    doubleElim,
    schedule: roundRobinSchedule,
    groupStage,
    groupStagePlayoffs,
    groupStageBrackets: groupStagePlayoffs,
    maxSetsBracket: { type: 'integer' },
    totalRounds: { type: 'integer' },
  },
  required: ['id', 'name', 'version', 'format', 'players', 'createdAt'],
  indexes: ['format', 'createdAt'],
} as const;
