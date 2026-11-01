import { BracketType, Format, ScoreMode } from '../src/types';
import type {
  Bracket,
  DoubleElim,
  DoubleElimTournament,
  GroupsToBracketTournament,
  Match,
  Player,
  PlayerGroup,
  PlayerLibraryEntry,
  RoundRobinTournament,
  SingleElimTournament,
  SwissTournament,
  Tournament,
} from '../src/types';
import { generateBracket, advanceWinner } from '../src/utils/bracketUtils';
import {
  generateDoubleElim,
  advanceDoubleElim,
} from '../src/utils/doubleElimUtils';
import {
  generateSchedule,
  computeStandings,
} from '../src/utils/roundRobinUtils';
import {
  generateSwissInitialSchedule,
  generateNextSwissRound,
  computeSwissStandings,
} from '../src/utils/swissUtils';
import {
  createGroupStage,
  buildGroupStagePlayoffs,
  getGroupAdvancers,
  getGroupStandings,
} from '../src/utils/groupStageUtils';
import { getParticipantPlayers } from '../src/utils/participantUtils';
import { updateTournamentStatus } from '../src/utils/tournamentStatus';
import { getTournamentResults } from '../src/utils/resultsUtils';

export type FixturePhase = 'new' | 'inProgress' | 'completed';
const names = [
  'Alice',
  'Boris',
  'Clara',
  'David',
  'Eva',
  'Filip',
  'Grace',
  'Henry',
  'Iris',
  'Jakub',
  'Klara',
  'Lukas',
  'Marta',
  'Nina',
  'Oskar',
  'Petra',
];

function base(
  id: string,
  teamSize = 1,
  count = 8,
): {
  id: string;
  version: number;
  name: string;
  createdAt: string;
  scoringMode: ScoreMode;
  maxSets: number;
  teamSize: number;
  players: Player[];
  participants: { id: string; playerIds: string[]; seed: number }[];
} {
  const players = names.slice(0, count).map((name, index) => ({
    id: `p${index + 1}`,
    name,
    elo: 1600 - index * 40,
    seed: index + 1,
    libraryId: `library-${index + 1}`,
  }));
  const participants = Array.from(
    { length: Math.ceil(players.length / teamSize) },
    (_, i) => ({
      id: teamSize === 1 ? `p${i + 1}` : `team-${i + 1}`,
      playerIds: players
        .slice(i * teamSize, (i + 1) * teamSize)
        .map((p) => p.id),
      seed: i + 1,
    }),
  );
  return {
    id,
    version: 1,
    name: 'Club championship',
    createdAt: '2026-10-01T09:00:00.000Z',
    scoringMode: ScoreMode.SETS,
    maxSets: 5,
    teamSize,
    players,
    participants,
  };
}

function playMatch(match: Match): void {
  match.winnerId = match.player1Id;
  match.scores = [[3, 1]];
}

function playBracket(bracket: Bracket, limit = Infinity): void {
  let played = 0;
  for (const match of [
    ...bracket.rounds.flat(),
    ...(bracket.thirdPlaceMatch ? [bracket.thirdPlaceMatch] : []),
  ]) {
    if (played >= limit) break;
    if (match.player1Id && match.player2Id && !match.winnerId) {
      advanceWinner(bracket, match.id, match.player1Id, [[3, 1]]);
      played++;
    }
  }
}

function playDouble(
  bracket: DoubleElim,
  limit = Infinity,
  reset = false,
): void {
  for (let i = 0; i < limit; i++) {
    const match = [
      ...bracket.winners.rounds.flat(),
      ...bracket.losers.rounds.flat(),
      bracket.finals.grandFinal,
      bracket.finals.resetFinal,
    ].find((m) => !m.dummy && m.player1Id && m.player2Id && !m.winnerId);
    if (!match?.player1Id || !match.player2Id) break;
    advanceDoubleElim(
      bracket,
      match.id,
      reset && match.id === bracket.finals.grandFinal.id
        ? match.player2Id
        : match.player1Id,
      reset && match.id === bracket.finals.grandFinal.id ? [[1, 3]] : [[3, 1]],
    );
    if (reset && match.id === bracket.finals.grandFinal.id) break;
  }
}

export function singleFixture(
  phase: FixturePhase = 'new',
  teamSize = 1,
): SingleElimTournament {
  const data = base(
    `single-${phase}-${teamSize}`,
    teamSize,
    teamSize === 2 ? 16 : 8,
  );
  const tournament: SingleElimTournament = {
    ...data,
    format: Format.SINGLE_ELIM,
    bracket: generateBracket(
      getParticipantPlayers(data.players, data.participants),
    ),
  };
  if (phase !== 'new')
    playBracket(tournament.bracket, phase === 'inProgress' ? 1 : Infinity);
  updateTournamentStatus(tournament);
  return tournament;
}

export function doubleFixture(
  phase: FixturePhase = 'new',
  reset = false,
): DoubleElimTournament {
  const data = base(`double-${phase}-${reset}`);
  const tournament: DoubleElimTournament = {
    ...data,
    format: Format.DOUBLE_ELIM,
    doubleElim: generateDoubleElim(data.players),
  };
  if (phase !== 'new')
    playDouble(
      tournament.doubleElim,
      phase === 'inProgress' ? 2 : Infinity,
      reset,
    );
  updateTournamentStatus(tournament);
  return tournament;
}

export function robinFixture(
  phase: FixturePhase = 'new',
): RoundRobinTournament {
  const data = base(`robin-${phase}`, 1, 5);
  const tournament: RoundRobinTournament = {
    ...data,
    format: Format.ROUND_ROBIN,
    schedule: generateSchedule(data.players),
  };
  if (phase !== 'new')
    for (const match of tournament.schedule.rounds
      .flatMap((r) => r.matches)
      .slice(0, phase === 'inProgress' ? 3 : Infinity))
      playMatch(match);
  updateTournamentStatus(tournament);
  return tournament;
}

export function swissFixture(
  phase: FixturePhase = 'new',
  teamSize = 1,
): SwissTournament {
  const data = base(
    `swiss-${phase}-${teamSize}`,
    teamSize,
    teamSize === 2 ? 16 : 8,
  );
  const tournament: SwissTournament = {
    ...data,
    format: Format.SWISS,
    totalRounds: 3,
    schedule: generateSwissInitialSchedule(
      getParticipantPlayers(data.players, data.participants),
    ),
  };
  if (phase !== 'new') {
    for (let round = 0; round < (phase === 'completed' ? 3 : 1); round++) {
      for (const match of tournament.schedule.rounds.at(-1)?.matches ?? [])
        playMatch(match);
      if (round < 2 && phase === 'completed')
        tournament.schedule.rounds.push(generateNextSwissRound(tournament));
    }
  }
  updateTournamentStatus(tournament);
  return tournament;
}

export function groupsFixture(
  phase: FixturePhase = 'new',
  double = false,
): GroupsToBracketTournament {
  const data = base(`groups-${phase}-${double}`, 1, 9);
  const tournament: GroupsToBracketTournament = {
    ...data,
    format: Format.GROUPS_TO_BRACKET,
    groupStage: createGroupStage(data.players, {
      groupCount: 3,
      qualifiers: [1, 1, 1],
      consolation: true,
      bracketType: double ? BracketType.DOUBLE_ELIM : BracketType.SINGLE_ELIM,
    }),
  };
  if (phase !== 'new') {
    for (const group of tournament.groupStage.groups)
      for (const match of group.schedule.rounds.flatMap((r) => r.matches))
        playMatch(match);
    tournament.groupStagePlayoffs = buildGroupStagePlayoffs(
      tournament.groupStage,
      data.players,
      { scoringMode: data.scoringMode, maxSets: data.maxSets },
    );
    if (phase === 'completed') {
      const playoffs = tournament.groupStagePlayoffs;
      if (playoffs.mainBracket) playBracket(playoffs.mainBracket);
      if (playoffs.consolationBracket) playBracket(playoffs.consolationBracket);
      if (playoffs.mainDoubleElim) playDouble(playoffs.mainDoubleElim);
      if (playoffs.consolationDoubleElim)
        playDouble(playoffs.consolationDoubleElim);
    }
  }
  updateTournamentStatus(tournament);
  return tournament;
}

export const single = singleFixture();
export const singlePlaying = singleFixture('inProgress');
export const singleCompleted = singleFixture('completed');
export const doubles = singleFixture('new', 2);
export const double = doubleFixture();
export const doublePlaying = doubleFixture('inProgress');
export const doubleCompleted = doubleFixture('completed');
export const resetPending = doubleFixture('completed', true);
export const resetCompleted = structuredClone(resetPending);
advanceDoubleElim(
  resetCompleted.doubleElim,
  resetCompleted.doubleElim.finals.resetFinal.id,
  resetCompleted.doubleElim.finals.resetFinal.player1Id ?? '',
  [[3, 1]],
);
updateTournamentStatus(resetCompleted);
resetCompleted.id += '-finished';
export const robin = robinFixture();
export const robinPlaying = robinFixture('inProgress');
export const robinCompleted = robinFixture('completed');
export const swiss = swissFixture();
export const swissNextRound = swissFixture('inProgress');
export const swissCompleted = swissFixture('completed');
export const swissDoubles = swissFixture('inProgress', 2);
export const groups = groupsFixture();
export const groupsPlayoffs = groupsFixture('inProgress');
export const groupsCompleted = groupsFixture('completed');
export const groupsDouble = groupsFixture('inProgress', true);
export const groupsDoubleCompleted = groupsFixture('completed', true);
export const tournaments: Tournament[] = [
  single,
  singlePlaying,
  singleCompleted,
  doubles,
  double,
  doublePlaying,
  doubleCompleted,
  resetPending,
  resetCompleted,
  robin,
  robinPlaying,
  robinCompleted,
  swiss,
  swissNextRound,
  swissCompleted,
  swissDoubles,
  groups,
  groupsPlayoffs,
  groupsCompleted,
  groupsDouble,
  groupsDoubleCompleted,
];
export const players = single.players;
export const participants = single.participants ?? [];
function first<T>(values: T[]): T {
  const value = values[0];
  if (!value) throw new Error('Missing story fixture');
  return value;
}
export const match = first(single.bracket.rounds[0] ?? []);
export const playedMatch: Match = {
  ...match,
  scores: [[3, 1]],
  winnerId: match.player1Id,
};
export const pointsMatch: Match = {
  ...match,
  scores: [
    [11, 8],
    [8, 11],
    [11, 9],
    [11, 5],
  ],
  winnerId: match.player1Id,
};
export const standings = computeStandings(
  robinCompleted.schedule,
  robinCompleted.players,
  { scoringMode: ScoreMode.SETS },
);
export const swissStandings = computeSwissStandings(
  swissCompleted.schedule,
  swissCompleted.players,
  { scoringMode: ScoreMode.SETS, maxSets: 5 },
);
export const advancers = getGroupAdvancers(
  groupsPlayoffs.groupStage,
  groupsPlayoffs.players,
  { scoringMode: ScoreMode.SETS },
);
export const standingsByGroup = getGroupStandings(
  groupsPlayoffs.groupStage,
  groupsPlayoffs.players,
  { scoringMode: ScoreMode.SETS },
);
export const groupLabels = new Map(
  groups.groupStage.groups.map((g, i) => [g.id, String.fromCodePoint(65 + i)]),
);
export const libraryGroups: PlayerGroup[] = [
  { id: 'club', name: 'Club players', version: 1, order: 0 },
  { id: 'guests', name: 'Guests', version: 1, order: 1 },
];
export const libraryPlayers: PlayerLibraryEntry[] = names.map((name, i) => ({
  id: `library-${i + 1}`,
  name,
  elo: 1600 - i * 40,
  groupIds: [i < 8 ? 'club' : 'guests'],
  version: 1,
}));
export const results = getTournamentResults(singleCompleted);
export const summary = {
  id: single.id,
  name: single.name,
  format: single.format,
  createdAt: single.createdAt,
  completedAt: null,
  winnerId: null,
  playerCount: players.length,
  teamSize: 1,
};

export const group = first(groupsPlayoffs.groupStage.groups);
export const qualifier = first(advancers.main);
export const lucky = first(advancers.luckyCandidates);
export const groupPlayers = groupsPlayoffs.players.filter((p) =>
  group.playerIds.includes(p.id),
);
