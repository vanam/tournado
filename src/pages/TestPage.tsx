import {useState} from 'react';
import type {ReactElement, ChangeEvent} from 'react';
import {useNavigate} from 'react-router-dom';
import {DEFAULT_MAX_SETS} from '../constants';
import {persistence} from '../services/persistence';
import {generateBracket} from '../utils/bracketUtils';
import {generateSchedule} from '../utils/roundRobinUtils';
import {generateSwissInitialSchedule, computeMinTotalRounds} from '../utils/swissUtils';
import {createGroupStage} from '../utils/groupStageUtils';
import {generateDoubleElim} from '../utils/doubleElimUtils';
import {buildParticipants, getParticipantPlayers} from '../utils/participantUtils';
import {BracketType, Format, ScoreMode} from '../types';
import type {Player, Participant, Tournament} from '../types';
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

function randomElo(): number {
  const buf = new Uint16Array(1);
  crypto.getRandomValues(buf);
  const val = buf[0] ?? 0;
  return 800 + (val % 801);
}

function generatePlayers(participantCount: number, teamSize: number): Player[] {
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

function buildTournament(
  players: Player[],
  participants: Participant[],
  participantPlayers: Player[],
  teamSize: number,
  format: Format,
  scoringMode: ScoreMode,
  groupCount: number,
  qualifiersPerGroup: number,
  bracketType: BracketType,
): Tournament {
  const label = teamSize >= 2 ? ` (${teamSize}v${teamSize})` : '';
  const base = {
    id: crypto.randomUUID(),
    name: `${FORMAT_LABELS[format]} - ${participantPlayers.length} participants${label}`,
    scoringMode,
    maxSets: DEFAULT_MAX_SETS,
    groupStageMaxSets: DEFAULT_MAX_SETS,
    bracketMaxSets: DEFAULT_MAX_SETS,
    players: players.map((p) => ({...p})),
    teamSize,
    participants: participants.map((p) => ({...p})),
    createdAt: new Date().toISOString(),
    completedAt: null,
    winnerId: null,
  };

  switch (format) {
    case Format.SINGLE_ELIM: {
      return {
        ...base,
        format: Format.SINGLE_ELIM,
        bracket: generateBracket(participantPlayers),
      };
    }
    case Format.DOUBLE_ELIM: {
      return {
        ...base,
        format: Format.DOUBLE_ELIM,
        doubleElim: generateDoubleElim(participantPlayers),
      };
    }
    case Format.ROUND_ROBIN: {
      return {
        ...base,
        format: Format.ROUND_ROBIN,
        schedule: generateSchedule(participantPlayers),
      };
    }
    case Format.GROUPS_TO_BRACKET: {
      const qualifiers = Array.from({length: groupCount}, () => qualifiersPerGroup);
      const groupStage = createGroupStage(participantPlayers, {
        groupCount,
        qualifiers,
        consolation: false,
        bracketType,
      });
      return {
        ...base,
        format: Format.GROUPS_TO_BRACKET,
        groupStage,
        groupStagePlayoffs: null,
      };
    }
    case Format.SWISS: {
      return {
        ...base,
        format: Format.SWISS,
        schedule: generateSwissInitialSchedule(participantPlayers),
        totalRounds: computeMinTotalRounds(participantPlayers.length),
      };
    }
  }
}

export const TestPage = (): ReactElement => {
  const navigate = useNavigate();

  const [format, setFormat] = useState<Format | 'ALL'>('ALL');
  const [scoringMode, setScoringMode] = useState<ScoreMode>(ScoreMode.SETS);
  const [teamSize, setTeamSize] = useState<1 | 2>(1);
  const [minPlayers, setMinPlayers] = useState(2);
  const [maxPlayers, setMaxPlayers] = useState(9);
  const [groupCount, setGroupCount] = useState(2);
  const [qualifiersPerGroup, setQualifiersPerGroup] = useState(2);
  const [bracketType, setBracketType] = useState<BracketType>(BracketType.SINGLE_ELIM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string[] | null>(null);

  function handleGenerate(): void {
    setError(null);
    setSuccess(null);

    if (minPlayers < 2) {
      setError('Min participants must be at least 2.');
      return;
    }
    if (maxPlayers > 26) {
      setError('Max participants must be at most 26.');
      return;
    }
    if (minPlayers > maxPlayers) {
      setError('Min participants must not exceed max participants.');
      return;
    }

    const created: string[] = [];
    const formats = format === 'ALL' ? Object.values(Format) : [format];

    for (const fmt of formats) {
      for (let n = minPlayers; n <= maxPlayers; n++) {
        if (fmt === Format.GROUPS_TO_BRACKET && n < groupCount * 2) {
          continue;
        }
        const players = generatePlayers(n, teamSize);
        const participants = buildParticipants(players, teamSize, []);
        const participantPlayers = getParticipantPlayers(players, participants);
        const tournament = buildTournament(
          players,
          participants,
          participantPlayers,
          teamSize,
          fmt,
          scoringMode,
          groupCount,
          qualifiersPerGroup,
          bracketType,
        );
        persistence.save(tournament);
        created.push(tournament.name);
      }
    }

    if (created.length === 0) {
      setError('No tournaments were created. Check your settings (e.g. min participants vs group count).');
      return;
    }

    setSuccess(created);
    void navigate('/');
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">Test Tournament Generator</h1>

      <div className="space-y-4">
        <div>
          <Label htmlFor="test-format" className="block text-sm font-medium text-[var(--color-text)] mb-1">
            Format
          </Label>
          <select
            id="test-format"
            value={format}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => { setFormat(e.target.value as Format | 'ALL'); }}
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
            onChange={(e: ChangeEvent<HTMLSelectElement>) => { setScoringMode(e.target.value as ScoreMode); }}
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
                onChange={(e: ChangeEvent<HTMLSelectElement>) => { setBracketType(e.target.value as BracketType); }}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)]"
              >
                <option value={BracketType.SINGLE_ELIM}>Single elimination</option>
                <option value={BracketType.DOUBLE_ELIM}>Double elimination</option>
              </select>
            </div>
          </>
        )}

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
