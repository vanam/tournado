import { getTournamentPlayoffs } from '../utils/tournamentCompatibility';
import {useState} from 'react';
import type {ReactElement, ChangeEvent} from 'react';
import {useNavigate} from 'react-router-dom';
import {DEFAULT_MAX_SETS} from '../constants';
import {
  createTournament as createTournamentApi,
} from '../services/tournamentService';
import type {CreateTournamentRequest} from '../services/tournamentService';
import {recordScore} from '../services/matchService';
import {generatePlayoffs} from '../services/groupStageService';
import {generateNextRound} from '../services/swissService';
import {
  listPlayers as listPlayersApi,
  createPlayer as createPlayerApi,
} from '../services/playerService';
import {
  createPlayerGroup as createPlayerGroupApi,
} from '../services/playerGroupService';
import {computeMinTotalRounds} from '../utils/swissUtils';
import {BracketType, Format, ScoreMode} from '../types';
import type {Player, Tournament, Match, SetScore} from '../types';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {Label} from '@/components/ui/Label';

const FORMAT_LABELS: Record<Format, string> = {
  [Format.SINGLE_ELIM]: 'Single elimination',
  [Format.DOUBLE_ELIM]: 'Double elimination',
  [Format.ROUND_ROBIN]: 'Round robin',
  [Format.GROUPS_TO_BRACKET]: 'Groups to bracket',
  [Format.SWISS]: 'Swiss',
};

const PLAYER_NAMES = [
  'Aria', 'Blake', 'Casey', 'Dana', 'Eden', 'Finn', 'Gray', 'Harper',
  'Ira', 'Jules', 'Kai', 'Lane', 'Morgan', 'Nova', 'Owen', 'Paris',
  'Quinn', 'Reese', 'Sage', 'Taylor', 'Uma', 'Vale', 'West', 'Xander',
  'Yara', 'Zoe', 'Alex', 'Brett', 'Chris', 'Drew',
];

const GROUP_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta'];

function randomInt(min: number, max: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const val = buf[0] ?? 0;
  return min + (val % (max - min + 1));
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    const a = result[i] as T;
    const b = result[j] as T;
    result[i] = b;
    result[j] = a;
  }
  return result;
}

function randomElo(): number {
  return 800 + randomInt(0, 800);
}

function generateLibraryPlayers(participantCount: number, teamSize: number): Player[] {
  if (teamSize <= 1) {
    return Array.from({length: participantCount}, (_, i) => ({
      id: crypto.randomUUID(),
      name: String.fromCodePoint(65 + i),
      seed: i + 1,
      elo: randomElo(),
    }));
  }
  return Array.from({length: participantCount * teamSize}, (_, i) => {
    const teamIndex = Math.floor(i / teamSize);
    const memberIndex = i % teamSize;
    return {
      id: crypto.randomUUID(),
      name: `${String.fromCodePoint(65 + teamIndex)}${memberIndex + 1}`,
      seed: i + 1,
      elo: randomElo(),
    };
  });
}

async function samplePlayers(participantCount: number, teamSize: number, useLib: boolean): Promise<Player[]> {
  const totalNeeded = participantCount * teamSize;

  if (!useLib) {
    return generateLibraryPlayers(participantCount, teamSize);
  }

  const libPlayers = shuffle(await listPlayersApi()).slice(0, totalNeeded);

  const fromLib: Player[] = libPlayers.map((entry, i) => ({
    id: entry.id,
    name: entry.name,
    seed: i + 1,
    elo: entry.elo ?? randomElo(),
    libraryId: entry.id,
  }));

  if (fromLib.length >= totalNeeded) {
    return fromLib;
  }

  // Fill remaining slots with generated players
  const remaining = totalNeeded - fromLib.length;
  const libNames = new Set(fromLib.map((p) => p.name));
  const fallback: Player[] = [];
  let letterIdx = 0;
  while (fallback.length < remaining) {
    const name = String.fromCodePoint(65 + letterIdx);
    if (!libNames.has(name)) {
      fallback.push({
        id: crypto.randomUUID(),
        name,
        seed: fromLib.length + fallback.length + 1,
        elo: randomElo(),
      });
    }
    letterIdx++;
    if (letterIdx > 25) break;
  }

  const all = [...fromLib, ...fallback].map((p, i) => ({...p, seed: i + 1}));
  return all;
}

async function generateRandomLibrary(): Promise<string> {
  const usedNames = shuffle([...PLAYER_NAMES]);
  let nameIdx = 0;

  const createdGroups = await Promise.all(
    GROUP_NAMES.map((name) => createPlayerGroupApi(name))
  );

  const playerDefs: Array<{name: string; elo: number; groupIds: string[]}> = [];
  for (const group of createdGroups) {
    const count = randomInt(3, 5);
    for (let i = 0; i < count; i++) {
      const name = usedNames[nameIdx] ?? `Player${nameIdx}`;
      nameIdx++;
      playerDefs.push({name, elo: randomElo(), groupIds: [group.id]});
    }
  }

  const players = await Promise.all(playerDefs.map((p) => createPlayerApi(p.name, p.elo, p.groupIds)));
  return `Generated ${createdGroups.length} groups with ${players.length} players.`;
}

function buildRequest(
  players: Player[],
  teamSize: number,
  n: number,
  format: Format,
  scoringMode: ScoreMode,
  groupCount: number,
  qualifiersPerGroup: number,
  bracketType: BracketType,
): CreateTournamentRequest {
  const label = teamSize >= 2 ? ` (${teamSize}v${teamSize})` : '';
  const req: CreateTournamentRequest = {
    name: `${FORMAT_LABELS[format]} - ${n} participants${label}`,
    format,
    players: players.map((p) => ({
      name: p.name,
      ...(p.seed !== undefined && { seed: p.seed }),
      ...(p.elo !== undefined && { elo: p.elo }),
      ...(p.libraryId !== undefined && { libraryId: p.libraryId }),
    })),
    teamSize,
    scoringMode,
    maxSets: DEFAULT_MAX_SETS,
  };
  if (format === Format.GROUPS_TO_BRACKET) {
    req.groupCount = groupCount;
    req.qualifiers = Array.from({length: groupCount}, () => qualifiersPerGroup);
    req.consolation = false;
    req.bracketType = bracketType;
  }
  if (format === Format.SWISS) {
    req.swissRounds = computeMinTotalRounds(n);
  }
  return req;
}

function findOption<T extends string>(options: readonly T[], value: string): T | undefined {
  return options.find((option) => option === value);
}

function getResolvedMaxSets(tournament: Tournament): number {
  return Number.isFinite(tournament.maxSets) && (tournament.maxSets ?? 0) > 0 ? (tournament.maxSets as number) : DEFAULT_MAX_SETS;
}

function randomSetSummary(maxSets: number): SetScore {
  const setsToWin = Math.ceil(maxSets / 2);
  const winnerIsP1 = randomInt(0, 1) === 1;
  const loserSets = randomInt(0, Math.max(0, setsToWin - 1));
  return winnerIsP1 ? [setsToWin, loserSets] : [loserSets, setsToWin];
}

function randomWinningSet(winnerIndex: 0 | 1): SetScore {
  const winnerPoints = randomInt(11, 21);
  const loserPoints = randomInt(0, winnerPoints - 1);
  return winnerIndex === 0 ? [winnerPoints, loserPoints] : [loserPoints, winnerPoints];
}

function randomPointSeries(maxSets: number): SetScore[] {
  const setsToWin = Math.ceil(maxSets / 2);
  const winnerIsP1 = randomInt(0, 1) === 1;
  const loserSets = randomInt(0, Math.max(0, setsToWin - 1));
  const winnerIndex: 0 | 1 = winnerIsP1 ? 0 : 1;
  const loserIndex: 0 | 1 = winnerIsP1 ? 1 : 0;
  const entries: SetScore[] = [];

  for (let i = 0; i < setsToWin; i++) {
    entries.push(randomWinningSet(winnerIndex));
  }
  for (let i = 0; i < loserSets; i++) {
    entries.push(randomWinningSet(loserIndex));
  }
  return shuffle(entries);
}

function randomScoresForTournament(tournament: Tournament): SetScore[] {
  const maxSets = getResolvedMaxSets(tournament);
  if (tournament.scoringMode === ScoreMode.POINTS) {
    return randomPointSeries(maxSets);
  }
  return [randomSetSummary(maxSets)];
}

interface PendingMatchRef {
  matchId: string;
  groupId?: string;
}

function isReadyMatch(match: Match): boolean {
  return !match.dummy && match.winnerId === null && match.player1Id !== null && match.player2Id !== null;
}

function getPendingMatches(tournament: Tournament): PendingMatchRef[] {
  switch (tournament.format) {
    case Format.SINGLE_ELIM: {
      const pending = tournament.bracket.rounds.flat().filter((match) => isReadyMatch(match)).map((match) => ({matchId: match.id}));
      if (tournament.bracket.thirdPlaceMatch && isReadyMatch(tournament.bracket.thirdPlaceMatch)) {
        pending.push({matchId: tournament.bracket.thirdPlaceMatch.id});
      }
      return pending;
    }
    case Format.DOUBLE_ELIM: {
      return [
        ...tournament.doubleElim.winners.rounds.flat(),
        ...tournament.doubleElim.losers.rounds.flat(),
        tournament.doubleElim.finals.grandFinal,
        tournament.doubleElim.finals.resetFinal,
      ]
        .filter((match) => isReadyMatch(match))
        .map((match) => ({matchId: match.id}));
    }
    case Format.ROUND_ROBIN:
    case Format.SWISS: {
      return tournament.schedule.rounds
        .flatMap((round) => round.matches)
          .filter((match) => isReadyMatch(match))
          .map((match) => ({matchId: match.id}));
    }
    case Format.GROUPS_TO_BRACKET: {
      const groupMatches = tournament.groupStage.groups.flatMap((group) =>
        group.schedule.rounds
          .flatMap((round) => round.matches)
          .filter((match) => isReadyMatch(match))
          .map((match) => ({matchId: match.id, groupId: group.id}))
      );

      const playoffs = getTournamentPlayoffs(tournament);
      if (playoffs === null) {
        return groupMatches;
      }

      const playoffMatches = [
        ...(playoffs.mainBracket?.rounds.flat() ?? []),
        ...(playoffs.consolationBracket?.rounds.flat() ?? []),
        ...(playoffs.mainDoubleElim?.winners.rounds.flat() ?? []),
        ...(playoffs.mainDoubleElim?.losers.rounds.flat() ?? []),
        ...(playoffs.consolationDoubleElim?.winners.rounds.flat() ?? []),
        ...(playoffs.consolationDoubleElim?.losers.rounds.flat() ?? []),
        ...(playoffs.mainBracket?.thirdPlaceMatch ? [playoffs.mainBracket.thirdPlaceMatch] : []),
        ...(playoffs.consolationBracket?.thirdPlaceMatch ? [playoffs.consolationBracket.thirdPlaceMatch] : []),
        ...(playoffs.mainDoubleElim ? [playoffs.mainDoubleElim.finals.grandFinal, playoffs.mainDoubleElim.finals.resetFinal] : []),
        ...(playoffs.consolationDoubleElim ? [playoffs.consolationDoubleElim.finals.grandFinal, playoffs.consolationDoubleElim.finals.resetFinal] : []),
      ]
        .filter((match) => isReadyMatch(match))
        .map((match) => ({matchId: match.id}));

      return [...groupMatches, ...playoffMatches];
    }
  }
}

async function populateRandomResults(tournament: Tournament): Promise<Tournament> {
  let current = tournament;
  const maxIterations = 2000;

  for (let i = 0; i < maxIterations; i++) {
    if (current.format === Format.SWISS) {
      const swissPending = getPendingMatches(current);
      if (swissPending.length === 0 && current.schedule.rounds.length < current.totalRounds) {
        current = await generateNextRound(current.id);
        continue;
      }
    }

    if (current.format === Format.GROUPS_TO_BRACKET) {
      const groupPending = current.groupStage.groups.flatMap((group) =>
        group.schedule.rounds.flatMap((round) => round.matches).filter((match) => isReadyMatch(match))
      );
      const playoffs = getTournamentPlayoffs(current);
      if (groupPending.length === 0 && (playoffs === null)) {
        current = await generatePlayoffs(current.id);
        continue;
      }
    }

    const pending = getPendingMatches(current);
    if (pending.length === 0) {
      return current;
    }

    for (const {matchId, groupId} of pending) {
      current = await recordScore(current.id, matchId, randomScoresForTournament(current), false, groupId);
    }
  }

  throw new Error(`Failed to populate all random results for tournament ${tournament.id}.`);
}

export const TestPage = (): ReactElement => {
  const navigate = useNavigate();

  const [format, setFormat] = useState<Format | 'ALL'>('ALL');
  const [scoringMode, setScoringMode] = useState(ScoreMode.SETS);
  const [teamSize, setTeamSize] = useState<1 | 2>(1);
  const [minPlayers, setMinPlayers] = useState(2);
  const [maxPlayers, setMaxPlayers] = useState(9);
  const [groupCount, setGroupCount] = useState(2);
  const [qualifiersPerGroup, setQualifiersPerGroup] = useState(2);
  const [bracketType, setBracketType] = useState(BracketType.SINGLE_ELIM);
  const [useLibraryPlayers, setUseLibraryPlayers] = useState(false);
  const [withRandomResults, setWithRandomResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string[] | null>(null);
  const [libraryMsg, setLibraryMsg] = useState<string | null>(null);

  function handleGenerateLibrary(): void {
    void generateRandomLibrary().then((msg) => { setLibraryMsg(msg); });
  }

  function handleGenerate(): void {
    setError(null);
    setSuccess(null);

    if (minPlayers < 2) {
      setError('Min participants must be at least 2.');
      return;
    }
    if (maxPlayers > 36) {
      setError('Max participants must be at most 36.');
      return;
    }
    if (minPlayers > maxPlayers) {
      setError('Min participants must not exceed max participants.');
      return;
    }

    const formats = format === 'ALL' ? Object.values(Format) : [format];

    const generate = async (): Promise<void> => {
      const created: string[] = [];
      for (const fmt of formats) {
        for (let n = minPlayers; n <= maxPlayers; n++) {
          if (fmt === Format.GROUPS_TO_BRACKET && n < groupCount * 2) {
            continue;
          }
          const players = await samplePlayers(n, teamSize, useLibraryPlayers);
          const req = buildRequest(players, teamSize, n, fmt, scoringMode, groupCount, qualifiersPerGroup, bracketType);
          let tournament = await createTournamentApi(req);
          if (withRandomResults) {
            tournament = await populateRandomResults(tournament);
          }
          created.push(tournament.name);
        }
      }

      if (created.length === 0) {
        setError('No tournaments were created. Check your settings (e.g. min participants vs group count).');
        return;
      }

      setSuccess(created);
      void navigate('/');
    };
    void generate();
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">Test Tournament Generator</h1>

      <div className="space-y-4">

        {/* Player library section */}
        <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-soft)] space-y-3">
          <p className="text-sm font-medium text-[var(--color-text)]">Player library</p>
          <p className="text-xs text-[var(--color-muted)]">
            Generates 4 groups (Alpha–Delta) with 3–5 random named players each and saves them to the library.
          </p>
          <Button type="button" onClick={handleGenerateLibrary}>
            Generate random library
          </Button>
          {libraryMsg !== null && (
            <p className="text-xs text-[var(--color-muted)]">{libraryMsg}</p>
          )}
        </div>

        <div>
          <Label htmlFor="test-format" className="block text-sm font-medium text-[var(--color-text)] mb-1">
            Format
          </Label>
          <select
            id="test-format"
            value={format}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => { setFormat(findOption(Object.values(Format), e.target.value) ?? 'ALL'); }}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)]"
          >
            <option value="ALL">All formats</option>
            {Object.values(Format).map((f) => (
              <option key={f} value={f}>{FORMAT_LABELS[f]}</option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="test-scoring" className="block text-sm font-medium text-[var(--color-text)] mb-1">
            Scoring mode
          </Label>
          <select
            id="test-scoring"
            value={scoringMode}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => { setScoringMode(findOption(Object.values(ScoreMode), e.target.value) ?? ScoreMode.SETS); }}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)]"
          >
            <option value={ScoreMode.SETS}>Sets</option>
            <option value={ScoreMode.POINTS}>Points</option>
          </select>
        </div>

        <div>
          <p className="block text-sm font-medium text-[var(--color-text)] mb-1">Team size</p>
          <div className="flex gap-2">
            {([1, 2] as const).map((size) => (
              <label
                key={size}
                className={`flex-1 text-center px-4 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                  teamSize === size
                    ? 'bg-[var(--color-primary)] text-[var(--color-surface)] border-[var(--color-primary)] shadow-sm'
                    : 'text-[var(--color-muted)] border-[var(--color-border)] hover:border-[var(--color-primary)]'
                }`}
              >
                <input
                  type="radio"
                  name="test-team-size"
                  value={size}
                  className="sr-only"
                  checked={teamSize === size}
                  onChange={() => { setTeamSize(size); }}
                />
                {size === 1 ? '1v1' : '2v2'}
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="test-min" className="block text-sm font-medium text-[var(--color-text)] mb-1">
            Min participants
          </Label>
          <Input
            id="test-min"
            type="number"
            min="2"
            max="26"
            className="w-24"
            value={minPlayers}
            onChange={(e: ChangeEvent<HTMLInputElement>) => { setMinPlayers(Number.parseInt(e.target.value, 10) || 2); }}
          />
        </div>

        <div>
          <Label htmlFor="test-max" className="block text-sm font-medium text-[var(--color-text)] mb-1">
            Max participants
          </Label>
          <Input
            id="test-max"
            type="number"
            min="2"
            max="26"
            className="w-24"
            value={maxPlayers}
            onChange={(e: ChangeEvent<HTMLInputElement>) => { setMaxPlayers(Number.parseInt(e.target.value, 10) || 9); }}
          />
        </div>

        {(format === Format.GROUPS_TO_BRACKET || format === 'ALL') && (
          <>
            <div>
              <Label htmlFor="test-group-count" className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Group count
              </Label>
              <Input
                id="test-group-count"
                type="number"
                min="1"
                className="w-24"
                value={groupCount}
                onChange={(e: ChangeEvent<HTMLInputElement>) => { setGroupCount(Math.max(1, Number.parseInt(e.target.value, 10) || 1)); }}
              />
            </div>

            <div>
              <Label htmlFor="test-qualifiers" className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Qualifiers per group
              </Label>
              <Input
                id="test-qualifiers"
                type="number"
                min="1"
                className="w-24"
                value={qualifiersPerGroup}
                onChange={(e: ChangeEvent<HTMLInputElement>) => { setQualifiersPerGroup(Math.max(1, Number.parseInt(e.target.value, 10) || 1)); }}
              />
            </div>

            <div>
              <Label htmlFor="test-bracket-type" className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Bracket type
              </Label>
              <select
                id="test-bracket-type"
                value={bracketType}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => { setBracketType(findOption(Object.values(BracketType), e.target.value) ?? BracketType.SINGLE_ELIM); }}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)]"
              >
                <option value={BracketType.SINGLE_ELIM}>Single elimination</option>
                <option value={BracketType.DOUBLE_ELIM}>Double elimination</option>
              </select>
            </div>
          </>
        )}

        <Label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
          <input
            type="checkbox"
            checked={useLibraryPlayers}
            onChange={(e: ChangeEvent<HTMLInputElement>) => { setUseLibraryPlayers(e.target.checked); }}
          />
          Use library players (fills gaps with A/B/C... if library is too small)
        </Label>

        <Label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
          <input
            type="checkbox"
            checked={withRandomResults}
            onChange={(e: ChangeEvent<HTMLInputElement>) => { setWithRandomResults(e.target.checked); }}
          />
          Also generate random results for all matches
        </Label>

        {error !== null && <p className="text-[var(--color-accent)] text-sm">{error}</p>}

        <Button
          type="button"
          onClick={handleGenerate}
          className="w-full bg-[var(--color-primary)] text-[var(--color-surface)] py-3 rounded-lg font-medium shadow-sm hover:shadow-md hover:bg-[var(--color-primary-dark)] active:scale-[0.99]"
        >
          Generate tournaments
        </Button>

        {success !== null && (
          <div className="text-sm text-[var(--color-text)]">
            <p className="font-medium mb-1">Created {success.length} tournament(s):</p>
            <ul className="list-disc list-inside space-y-0.5">
              {success.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
