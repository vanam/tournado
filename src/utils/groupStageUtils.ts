import type {
  BracketType,
  Group,
  GroupAdvancerEntry,
  GroupAdvancersResult,
  GroupStage,
  GroupStageBrackets,
  GroupStagePlayoffs,
  NormalizedStats,
  Player, RoundRobinSchedule,
  ScoreMode,
  StandingsRow,
  TiebreakDetails,
} from '../types';
import {computeStandings, generateSchedule, isScheduleComplete} from './roundRobinUtils';
import {generateBracket, nextPowerOf2} from './bracketUtils';
import {generateDoubleElim} from './doubleElimUtils';
import {hasWalkover} from './scoreUtils';
import {BRACKET_TYPES, SCORE_MODES} from '../constants';

const GROUP_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function indexToGroupLabel(index: number): string {
  let n = Math.max(0, index);
  let label = '';
  do {
    label = (GROUP_LABELS[n % GROUP_LABELS.length] ?? 'A') + label;
    n = Math.floor(n / GROUP_LABELS.length) - 1;
  } while (n >= 0);
  return label;
}

function toElo(value: number | undefined): number {
  return Number.isFinite(value) ? (value as number) : 1000;
}

function normalizeQualifiers(
  qualifiers: number[] | undefined,
  groupCount: number
): number[] {
  return Array.from({length: groupCount}, (_, i) => {
    const raw = qualifiers?.[i];
    return Math.max(0, Number(raw) || 0);
  });
}

function toSeed(value: number | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

interface BaseGroup {
  id: string;
  name: string;
  playerIds: string[];
}

export function distributePlayersToGroups(
  players: Player[],
  groupCount: number
): BaseGroup[] {
  const sorted = players
    .map((player, index) => ({ player, index }))
    .toSorted((a, b) => {
      const seedA = toSeed(a.player.seed);
      const seedB = toSeed(b.player.seed);
      if (seedA !== seedB) return seedA - seedB;
      return a.index - b.index;
    })
    .map(({ player }) => player);
  const groups: BaseGroup[] = Array.from({ length: groupCount }, (_, i) => ({
    id: `g${i + 1}`,
    name: `Group ${indexToGroupLabel(i)}`,
    playerIds: [],
  }));

  for (const [index, player] of sorted.entries()) {
    const group = groups[index % groupCount];
    if (group) group.playerIds.push(player.id);
  }

  return groups;
}

interface CreateGroupStageSettings {
  groupCount: number | string;
  qualifiers?: number[] | undefined;
  consolation?: boolean | undefined;
  bracketType?: BracketType | undefined;
}

export function createGroupStage(
  players: Player[],
  settings: CreateGroupStageSettings
): GroupStage {
  const groupCount = Math.max(1, Number.parseInt(settings.groupCount as string, 10) || 1);
  const qualifiers = normalizeQualifiers(settings.qualifiers, groupCount);
  const baseGroups = distributePlayersToGroups(players, groupCount);

  const groups: Group[] = baseGroups.map((group, index) => {
    const groupPlayers = players.filter((p) => group.playerIds.includes(p.id));
    const schedule = generateSchedule(groupPlayers, { idPrefix: `${group.id}-` });
    return { ...group, schedule, order: index + 1 };
  });

  return {
    groups,
    settings: {
      groupCount,
      qualifiers,
      consolation: !!settings.consolation,
      bracketType: settings.bracketType ?? BRACKET_TYPES.SINGLE_ELIM,
    },
  };
}

export function getGroupPlayers(group: Group, players: Player[]): Player[] {
  return players.filter((p) => group.playerIds.includes(p.id));
}

interface StandingsOptions {
  scoringMode?: ScoreMode | undefined;
  maxSets?: number | undefined;
}

interface GroupStandingsEntry {
  groupId: string;
  standings: StandingsRow[];
}

export function getGroupStandings(
  groupStage: GroupStage,
  players: Player[],
  options: StandingsOptions = {}
): GroupStandingsEntry[] {
  return groupStage.groups.map((group) => {
    const groupPlayers = getGroupPlayers(group, players);
    const standings = computeStandings(group.schedule, groupPlayers, options);
    return { groupId: group.id, standings };
  });
}

export function isGroupStageComplete(groupStage: GroupStage): boolean {
  return groupStage.groups.every((group) => isScheduleComplete(group.schedule));
}

function normalizeStats(row: StandingsRow): NormalizedStats {
  const played = row.played || 0;
  const safePlayed = played > 0 ? played : 1;
  const pointsDiff = row.pointsWon - row.pointsLost;
  return {
    pointsPct: row.points / safePlayed,
    setDiffPerMatch: (row.setsWon - row.setsLost) / safePlayed,
    setsWonPerMatch: row.setsWon / safePlayed,
    pointsDiffPerMatch: pointsDiff / safePlayed,
    played,
  };
}

function stableHash(text: string = ''): number {
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 33) ^ (text.codePointAt(i) ?? 0);
  }
  return hash >>> 0;
}

function stableLotteryValue(entry: GroupAdvancerEntry): number {
  const seed = `${entry.id}|${entry.groupId}`;
  return stableHash(seed) / 0xFF_FF_FF_FF;
}

function compareLuckyCandidates(a: GroupAdvancerEntry, b: GroupAdvancerEntry): number {
  const aDetail = a.tiebreakDetails;
  const bDetail = b.tiebreakDetails;
  if (bDetail.setsWonPerMatch !== aDetail.setsWonPerMatch) {
    return bDetail.setsWonPerMatch - aDetail.setsWonPerMatch;
  }
  if (bDetail.setDiffPerMatch !== aDetail.setDiffPerMatch) {
    return bDetail.setDiffPerMatch - aDetail.setDiffPerMatch;
  }
  if (aDetail.pointsDiffApplicable && bDetail.pointsDiffApplicable && bDetail.pointsDiffPerMatch !== aDetail.pointsDiffPerMatch) {
      return bDetail.pointsDiffPerMatch - aDetail.pointsDiffPerMatch;
    }
  if (aDetail.opponentAvgRank !== bDetail.opponentAvgRank) {
    return aDetail.opponentAvgRank - bDetail.opponentAvgRank;
  }
  if (aDetail.relativeRank !== bDetail.relativeRank) {
    return aDetail.relativeRank - bDetail.relativeRank;
  }
  if (aDetail.fairPlay !== bDetail.fairPlay) return aDetail.fairPlay ? -1 : 1;
  return 0;
}

function getLuckyCriteriaKey(entry: GroupAdvancerEntry): string {
  const detail = entry.tiebreakDetails;
  const parts: (number | boolean | null)[] = [
    detail.setsWonPerMatch,
    detail.setDiffPerMatch,
    detail.pointsDiffApplicable ? detail.pointsDiffPerMatch : null,
    detail.opponentAvgRank,
    detail.relativeRank,
    detail.fairPlay,
  ];
  return parts
    .map((value) => {
      if (Number.isFinite(value)) {
        return (value as number).toFixed(6);
      }
      if (typeof value === 'boolean') {
        return String(value);
      }
      return 'n/a';
    })
    .join('|');
}

function buildAppliedCriteria(
  entry: GroupAdvancerEntry,
  peer: GroupAdvancerEntry | null
): string[] {
  if (!peer) return [];
  const detail = entry.tiebreakDetails;
  const peerDetail = peer.tiebreakDetails;
  const criteriaOrder: (keyof TiebreakDetails)[] = [
    'setsWonPerMatch',
    'setDiffPerMatch',
    'pointsDiffPerMatch',
    'opponentAvgRank',
    'relativeRank',
    'fairPlay',
  ];
  const applied: string[] = [];

  for (const key of criteriaOrder) {
    if (key === 'pointsDiffPerMatch' && !detail.pointsDiffApplicable) {
      continue;
    }
    const a = detail[key];
    const b = peerDetail[key];
    let cmp = 0;

    if (key === 'opponentAvgRank' || key === 'relativeRank') {
      cmp = (a as number) - (b as number);
    } else if (key === 'fairPlay') {
      const aVal = detail.fairPlay ? 1 : 0;
      const bVal = peerDetail.fairPlay ? 1 : 0;
      cmp = bVal - aVal;
    } else {
      cmp = (b as number) - (a as number);
    }

    if (cmp === 0) {
      applied.push(key);
      continue;
    }
    applied.push(key);
    return applied;
  }

  if (detail.lotteryUsed) {
    applied.push('lottery');
  }
  return applied;
}

interface GetAdvancersOptions {
  scoringMode?: ScoreMode | undefined;
  maxSets?: number | undefined;
}

function buildGroupMaps(schedule: RoundRobinSchedule): {
  opponentsByPlayer: Map<string, Set<string>>;
  walkoverByPlayer: Map<string, boolean>;
} {
  const opponentsByPlayer = new Map<string, Set<string>>();
  const walkoverByPlayer = new Map<string, boolean>();
  for (const round of schedule.rounds) {
    for (const match of round.matches) {
      if (!match.winnerId) continue;
      const p1 = match.player1Id;
      const p2 = match.player2Id;
      if (!p1 || !p2) continue;
      if (!opponentsByPlayer.has(p1)) opponentsByPlayer.set(p1, new Set());
      if (!opponentsByPlayer.has(p2)) opponentsByPlayer.set(p2, new Set());
      opponentsByPlayer.get(p1)?.add(p2);
      opponentsByPlayer.get(p2)?.add(p1);
      if (match.walkover || hasWalkover(match.scores)) {
        walkoverByPlayer.set(p1, true);
        walkoverByPlayer.set(p2, true);
      }
    }
  }
  return { opponentsByPlayer, walkoverByPlayer };
}

function processGroup(
  group: Group,
  players: Player[],
  take: number,
  showBalls: boolean,
  options: GetAdvancersOptions
): { main: GroupAdvancerEntry[]; nonQualifiers: GroupAdvancerEntry[] } {
  const groupPlayers = getGroupPlayers(group, players);
  const standings = computeStandings(group.schedule, groupPlayers, options);
  const groupSize = standings.length || 1;
  const rankById = new Map(standings.map((row, index) => [row.playerId, index + 1]));
  const { opponentsByPlayer, walkoverByPlayer } = buildGroupMaps(group.schedule);
  const main: GroupAdvancerEntry[] = [];
  const nonQualifiers: GroupAdvancerEntry[] = [];
  for (const [rankIndex, row] of standings.entries()) {
    const player = players.find((p) => p.id === row.playerId);
    if (!player) continue;
    const normalized = normalizeStats(row);
    const tiebreakDetails: TiebreakDetails = {
      setsWonPerMatch: normalized.setsWonPerMatch,
      setDiffPerMatch: normalized.setDiffPerMatch,
      pointsDiffPerMatch: normalized.pointsDiffPerMatch,
      opponentAvgRank: getOpponentAvgRank(row.playerId, opponentsByPlayer, rankById, groupSize),
      relativeRank: (rankIndex + 1) / groupSize,
      fairPlay: !walkoverByPlayer.get(row.playerId),
      pointsDiffApplicable: showBalls,
      lottery: null,
      lotteryUsed: false,
    };
    const baseEntry: Omit<GroupAdvancerEntry, 'advanceType'> = {
      ...player,
      groupId: group.id,
      groupRank: rankIndex + 1,
      stats: row,
      normalized,
      tiebreakDetails,
    };
    if (rankIndex < take) {
      main.push({ ...baseEntry, advanceType: 'qualifier' });
    } else {
      nonQualifiers.push({ ...baseEntry, advanceType: 'nonQualifier' });
    }
  }
  return { main, nonQualifiers };
}

function applyLotteryAndTiebreak(sortedCandidates: GroupAdvancerEntry[], missing: number): void {
  let i = 0;
  while (i < sortedCandidates.length) {
    let j = i + 1;
    const entry = sortedCandidates[i];
    if (!entry) break;
    const key = getLuckyCriteriaKey(entry);
    while (j < sortedCandidates.length) {
      const nextEntry = sortedCandidates[j];
      if (!nextEntry) break;
      if (getLuckyCriteriaKey(nextEntry) !== key) break;
      j += 1;
    }
    if (j - i > 1) {
      const slice = sortedCandidates.slice(i, j).map((entry) => {
        entry.tiebreakDetails.lottery = stableLotteryValue(entry);
        entry.tiebreakDetails.lotteryUsed = true;
        return entry;
      });
      slice.toSorted((a, b) => (a.tiebreakDetails.lottery ?? 0) - (b.tiebreakDetails.lottery ?? 0));
      for (const [k, sliceEntry] of slice.entries()) {
        sortedCandidates[i + k] = sliceEntry;
      }
    }
    i = j;
  }
  for (const [index, entry] of sortedCandidates.entries()) {
    if (missing <= 0 || sortedCandidates.length < 2) {
      entry.tiebreakApplied = [];
      continue;
    }
    const cutoffIndex = missing - 1;
    const peerIndex = index <= cutoffIndex ? cutoffIndex + 1 : cutoffIndex;
    const peer = sortedCandidates[peerIndex] ?? null;
    entry.tiebreakApplied = buildAppliedCriteria(entry, peer);
  }
}

export function getGroupAdvancers(
  groupStage: GroupStage,
  players: Player[],
  options: GetAdvancersOptions = {}
): GroupAdvancersResult {
  const qualifiers = normalizeQualifiers(groupStage.settings.qualifiers, groupStage.groups.length);
  let main: GroupAdvancerEntry[] = [];
  const nonQualifiers: GroupAdvancerEntry[] = [];
  const showBalls = options.scoringMode === SCORE_MODES.POINTS;

  for (const [groupIndex, group] of groupStage.groups.entries()) {
    const take = Math.min(qualifiers[groupIndex] ?? 0, group.playerIds.length);
    const { main: groupMain, nonQualifiers: groupNonQualifiers } = processGroup(
      group,
      players,
      take,
      showBalls,
      options
    );
    main.push(...groupMain);
    nonQualifiers.push(...groupNonQualifiers);
  }

  main = main.toSorted((a, b) => {
    if (a.groupRank !== b.groupRank) return a.groupRank - b.groupRank;
    return toElo(b.elo) - toElo(a.elo);
  });

  const targetSize = nextPowerOf2(main.length || 1);
  const missing = Math.max(0, targetSize - main.length);
  const sortedCandidates = [...nonQualifiers].toSorted(compareLuckyCandidates);
  applyLotteryAndTiebreak(sortedCandidates, missing);

  const luckyLosers = sortedCandidates.slice(0, missing).map((entry) => ({
    ...entry,
    advanceType: 'lucky' as const,
  }));
  const luckyIds = new Set(luckyLosers.map((entry) => entry.id));

  const consolation = nonQualifiers
    .filter((entry) => !luckyIds.has(entry.id))
    .toSorted((a, b) => toElo(b.elo) - toElo(a.elo));

  return {
    main,
    luckyLosers,
    mainWithLucky: [...main, ...luckyLosers],
    consolation,
    luckyCandidates: sortedCandidates,
    bracketTargetSize: targetSize,
    luckyLoserSlots: missing,
  };
}

export function buildGroupStagePlayoffs(
  groupStage: GroupStage,
  players: Player[],
  options: GetAdvancersOptions = {}
): GroupStagePlayoffs {
  const { mainWithLucky, consolation } = getGroupAdvancers(groupStage, players, options);
  const bracketType = groupStage.settings.bracketType ?? BRACKET_TYPES.SINGLE_ELIM;

  const mainBracket = bracketType === BRACKET_TYPES.SINGLE_ELIM && mainWithLucky.length >= 2
    ? generateBracket(mainWithLucky)
    : null;
  const mainDoubleElim = bracketType === BRACKET_TYPES.DOUBLE_ELIM && mainWithLucky.length >= 2
    ? generateDoubleElim(mainWithLucky)
    : null;

  const consolationBracket = bracketType === BRACKET_TYPES.SINGLE_ELIM
    && groupStage.settings.consolation
    && consolation.length >= 2
    ? generateBracket(consolation)
    : null;
  const consolationDoubleElim = bracketType === BRACKET_TYPES.DOUBLE_ELIM
    && groupStage.settings.consolation
    && consolation.length >= 2
    ? generateDoubleElim(consolation)
    : null;

  return {
    bracketType,
    mainBracket,
    mainDoubleElim,
    consolationBracket,
    consolationDoubleElim,
  };
}

export function buildGroupStageBrackets(
  groupStage: GroupStage,
  players: Player[],
  options: GetAdvancersOptions = {}
): GroupStageBrackets {
  return buildGroupStagePlayoffs(groupStage, players, options);
}

function getOpponentAvgRank(playerId: string, opponentsByPlayer: Map<string, Set<string>>, rankById: Map<string, number>, groupSize: number): number {
  const opponents = opponentsByPlayer.get(playerId);
  if (!opponents || opponents.size === 0) return groupSize;
  let sum = 0;
  let count = 0;
  for (const opponentId of opponents) {
    const rank = rankById.get(opponentId) ?? groupSize;
    sum += rank;
    count += 1;
  }
  return count > 0 ? sum / count : groupSize;
}
