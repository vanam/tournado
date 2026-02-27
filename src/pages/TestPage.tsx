import {useState} from 'react';
import type {ReactElement, ChangeEvent} from 'react';
import {useNavigate} from 'react-router-dom';
import {DEFAULT_MAX_SETS} from '../constants';
import {persistence} from '../services/persistence';
import {generateBracket} from '../utils/bracketUtils';
import {generateSchedule} from '../utils/roundRobinUtils';
import {generateSwissInitialSchedule, computeTotalRounds} from '../utils/swissUtils';
import {createGroupStage} from '../utils/groupStageUtils';
import {generateDoubleElim} from '../utils/doubleElimUtils';
import {BracketType, Format, ScoreMode} from '../types';
import type {Player, Tournament} from '../types';
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

function generatePlayers(count: number, useElo: boolean): Player[] {
  return Array.from({length: count}, (_, i) => ({
    id: crypto.randomUUID(),
    name: String.fromCodePoint(65 + i),
    seed: i + 1,
    elo: useElo ? 1000 - i * 10 : undefined,
  }));
}

function buildTournament(
  players: Player[],
  format: Format,
  scoringMode: ScoreMode,
  groupCount: number,
  qualifiersPerGroup: number,
  bracketType: BracketType,
): Tournament {
  const base = {
    id: crypto.randomUUID(),
    name: `${FORMAT_LABELS[format]} - ${players.length} players`,
    scoringMode,
    maxSets: DEFAULT_MAX_SETS,
    groupStageMaxSets: DEFAULT_MAX_SETS,
    bracketMaxSets: DEFAULT_MAX_SETS,
    players: players.map((p) => ({...p})),
    createdAt: new Date().toISOString(),
    completedAt: null,
    winnerId: null,
  };

  switch (format) {
    case Format.SINGLE_ELIM: {
      return {
        ...base,
        format: Format.SINGLE_ELIM,
        bracket: generateBracket(players),
      };
    }
    case Format.DOUBLE_ELIM: {
      return {
        ...base,
        format: Format.DOUBLE_ELIM,
        doubleElim: generateDoubleElim(players),
      };
    }
    case Format.ROUND_ROBIN: {
      return {
        ...base,
        format: Format.ROUND_ROBIN,
        schedule: generateSchedule(players),
      };
    }
    case Format.GROUPS_TO_BRACKET: {
      const qualifiers = Array.from({length: groupCount}, () => qualifiersPerGroup);
      const groupStage = createGroupStage(players, {
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
        schedule: generateSwissInitialSchedule(players),
        totalRounds: computeTotalRounds(players.length),
      };
    }
  }
}

export const TestPage = (): ReactElement => {
  const navigate = useNavigate();

  const [format, setFormat] = useState<Format>(Format.SINGLE_ELIM);
  const [scoringMode, setScoringMode] = useState<ScoreMode>(ScoreMode.SETS);
  const [minPlayers, setMinPlayers] = useState(2);
  const [maxPlayers, setMaxPlayers] = useState(9);
  const [groupCount, setGroupCount] = useState(2);
  const [qualifiersPerGroup, setQualifiersPerGroup] = useState(2);
  const [bracketType, setBracketType] = useState<BracketType>(BracketType.SINGLE_ELIM);
  const [useElo, setUseElo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string[] | null>(null);

  function handleGenerate(): void {
    setError(null);
    setSuccess(null);

    if (minPlayers < 2) {
      setError('Min players must be at least 2.');
      return;
    }
    if (maxPlayers > 26) {
      setError('Max players must be at most 26.');
      return;
    }
    if (minPlayers > maxPlayers) {
      setError('Min players must not exceed max players.');
      return;
    }

    const created: string[] = [];

    for (let n = minPlayers; n <= maxPlayers; n++) {
      if (format === Format.GROUPS_TO_BRACKET && n < groupCount * 2) {
        continue;
      }
      const players = generatePlayers(n, format === Format.SWISS && useElo);
      const tournament = buildTournament(players, format, scoringMode, groupCount, qualifiersPerGroup, bracketType);
      persistence.save(tournament);
      created.push(tournament.name);
    }

    if (created.length === 0) {
      setError('No tournaments were created. Check your settings (e.g. min players vs group count).');
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
            onChange={(e: ChangeEvent<HTMLSelectElement>) => { setFormat(e.target.value as Format); }}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)]"
          >
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
          <Label htmlFor="test-min" className="block text-sm font-medium text-[var(--color-text)] mb-1">
            Min players
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
            Max players
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

        {format === Format.GROUPS_TO_BRACKET && (
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

        {format === Format.SWISS && (
          <Label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
            <input
              type="checkbox"
              checked={useElo}
              onChange={(e: ChangeEvent<HTMLInputElement>) => { setUseElo(e.target.checked); }}
            />
            Use ELO
          </Label>
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
