import type {ReactElement} from 'react';
import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {DEFAULT_MAX_SETS, MIN_PLAYERS} from '../constants';
import {useTranslation} from '../i18n/useTranslation';
import {usePageTitle} from '../hooks/usePageTitle';
import {persistence} from '../services/persistence';
import {generateBracket} from '../utils/bracketUtils';
import {generateSchedule} from '../utils/roundRobinUtils';
import {createGroupStage, indexToGroupLabel} from '../utils/groupStageUtils';
import {generateDoubleElim} from '../utils/doubleElimUtils';
import {PlayerInput} from '../components/playerInput';
import {BRACKET_TYPES, FORMATS, SCORE_MODES} from '../types';
import type {BracketType, Format, Player, ScoreMode, Tournament} from '../types';

const FORMAT_KEYS: Record<Format, string> = {
  [FORMATS.SINGLE_ELIM]: 'format.singleElim',
  [FORMATS.ROUND_ROBIN]: 'format.roundRobin',
  [FORMATS.GROUPS_TO_BRACKET]: 'format.groupsToBracket',
  [FORMATS.DOUBLE_ELIM]: 'format.doubleElim',
};

export const CreateTournamentPage = (): ReactElement => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  usePageTitle(t('create.title'));

  const [name, setName] = useState('');
  const [format, setFormat] = useState<Format>(FORMATS.SINGLE_ELIM);
  const [players, setPlayers] = useState<Player[]>([]);
  const [groupCount, setGroupCount] = useState(2);
  const [qualifiers, setQualifiers] = useState<number[]>([2, 2]);
  const [consolation, setConsolation] = useState(false);
  const [bracketType, setBracketType] = useState<BracketType>(BRACKET_TYPES.SINGLE_ELIM);
  const [scoringMode, setScoringMode] = useState<ScoreMode>(SCORE_MODES.SETS);
  const [maxSets, setMaxSets] = useState(DEFAULT_MAX_SETS);
  const [groupStageMaxSets, setGroupStageMaxSets] = useState(DEFAULT_MAX_SETS);
  const [bracketMaxSets, setBracketMaxSets] = useState(DEFAULT_MAX_SETS);
  const [error, setError] = useState('');

  function normalizeMaxSets(value: string): number {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return DEFAULT_MAX_SETS;
    return Math.max(1, parsed);
  }

  function handleGroupCountChange(value: string): void {
    const count = Math.max(1, Number.parseInt(value, 10) || 1);
    setGroupCount(count);
    setQualifiers((prev) => {
      const next = [...prev];
      if (count > next.length) {
        while (next.length < count) next.push(2);
      }
      return next.slice(0, count);
    });
  }

  function handleQualifierChange(index: number, value: string): void {
    const parsed = Math.max(0, Number.parseInt(value, 10) || 0);
    setQualifiers((prev) => prev.map((q, i) => (i === index ? parsed : q)));
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('create.errorName'));
      return;
    }
    if (players.length < MIN_PLAYERS) {
      setError(t('create.errorPlayers', { minPlayers: MIN_PLAYERS }));
      return;
    }
    if (format === FORMATS.GROUPS_TO_BRACKET && groupCount > players.length) {
      setError(t('create.errorGroupsTooMany'));
      return;
    }

    const base = {
      id: crypto.randomUUID(),
      name: name.trim(),
      scoringMode,
      maxSets,
      groupStageMaxSets,
      bracketMaxSets,
      players: players.map((p) => ({ ...p })),
      createdAt: new Date().toISOString(),
      completedAt: null,
      winnerId: null,
    };

    let tournament: Tournament;

    switch (format) {
      case FORMATS.SINGLE_ELIM: {
        tournament = {
          ...base,
          format: FORMATS.SINGLE_ELIM,
          bracket: generateBracket(players),
        };
        break;
      }
      case FORMATS.ROUND_ROBIN: {
        tournament = {
          ...base,
          format: FORMATS.ROUND_ROBIN,
          schedule: generateSchedule(players),
        };
        break;
      }
      case FORMATS.DOUBLE_ELIM: {
        tournament = {
          ...base,
          format: FORMATS.DOUBLE_ELIM,
          doubleElim: generateDoubleElim(players),
        };
        break;
      }
      case FORMATS.GROUPS_TO_BRACKET: {
        const groupStage = createGroupStage(players, {
          groupCount,
          qualifiers,
          consolation,
          bracketType,
        });
        tournament = {
          ...base,
          format: FORMATS.GROUPS_TO_BRACKET,
          groupStage,
          groupStagePlayoffs: null,
        };
        break;
      }
      default: {
        throw new Error(`Unsupported format: ${String(format)}`);
      }
    }

    persistence.save(tournament);
    void navigate(`/tournament/${tournament.id}`);
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-8">
        {t('create.title')}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-7">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
            {t('create.nameLabel')}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder={t('create.namePlaceholder')}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
            {t('create.formatLabel')}
          </label>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
            {Object.values(FORMATS).map((f) => (
              <label
                key={f}
                className={`flex items-center justify-center flex-1 text-center px-4 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                  format === f
                    ? 'bg-[var(--color-primary)] text-[var(--color-surface)] border-[var(--color-primary)] shadow-sm'
                    : 'text-[var(--color-muted)] border-[var(--color-border)] hover:border-[var(--color-primary)]'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value={f}
                  checked={format === f}
                  onChange={() => { setFormat(f); }}
                  className="sr-only"
                />
                {t(FORMAT_KEYS[f])}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
            {t('create.scoringLabel')}
          </label>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
            {Object.values(SCORE_MODES).map((mode) => (
              <label
                key={mode}
                className={`flex-1 text-center px-4 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                  scoringMode === mode
                    ? 'bg-[var(--color-primary)] text-[var(--color-surface)] border-[var(--color-primary)] shadow-sm'
                    : 'text-[var(--color-muted)] border-[var(--color-border)] hover:border-[var(--color-primary)]'
                }`}
              >
                <input
                  type="radio"
                  name="scoring"
                  value={mode}
                  checked={scoringMode === mode}
                  onChange={() => { setScoringMode(mode); }}
                  className="sr-only"
                />
                {t(mode === SCORE_MODES.SETS ? 'create.scoringSets' : 'create.scoringPoints')}
              </label>
            ))}
          </div>
        </div>

        {format !== FORMATS.GROUPS_TO_BRACKET && (
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
              {t('create.maxSetsLabel')}
            </label>
            <input
              type="number"
              min="1"
              value={maxSets}
              onChange={(e) => { setMaxSets(normalizeMaxSets(e.target.value)); }}
              className="w-24 border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        )}

        {format === FORMATS.GROUPS_TO_BRACKET && (
          <div className="space-y-4 border border-[var(--color-border)] rounded-xl p-5 bg-[var(--color-soft)]">
            <div className="text-sm font-semibold text-[var(--color-muted)]">
              {t('create.groupStageTitle')}
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="text-xs text-[var(--color-muted)]">
                {t('create.maxSetsGroupLabel')}
                <input
                  type="number"
                  min="1"
                  value={groupStageMaxSets}
                  onChange={(e) => { setGroupStageMaxSets(normalizeMaxSets(e.target.value)); }}
                  className="mt-1 w-24 border border-[var(--color-border)] rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </label>
              <label className="text-xs text-[var(--color-muted)]">
                {t('create.maxSetsBracketLabel')}
                <input
                  type="number"
                  min="1"
                  value={bracketMaxSets}
                  onChange={(e) => { setBracketMaxSets(normalizeMaxSets(e.target.value)); }}
                  className="mt-1 w-24 border border-[var(--color-border)] rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                {t('create.groupCountLabel')}
              </label>
              <input
                type="number"
                min="1"
                value={groupCount}
                onChange={(e) => { handleGroupCountChange(e.target.value); }}
                className="w-24 border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                {t('create.qualifiersLabel')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: groupCount }, (_, i) => (
                  <label key={i} className="text-xs text-[var(--color-muted)]">
                    {t('create.groupLabel', { label: indexToGroupLabel(i) })}
                    <input
                      type="number"
                      min="0"
                      value={qualifiers[i] ?? 0}
                      onChange={(e) => { handleQualifierChange(i, e.target.value); }}
                      className="mt-1 w-full border border-[var(--color-border)] rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
              <input
                type="checkbox"
                checked={consolation}
                onChange={(e) => { setConsolation(e.target.checked); }}
              />
              {t('create.consolationLabel')}
            </label>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                {t('create.bracketTypeLabel')}
              </label>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
                {Object.values(BRACKET_TYPES).map((bt) => (
                  <label
                    key={bt}
                    className={`flex-1 text-center px-4 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                      bracketType === bt
                        ? 'bg-[var(--color-primary)] text-[var(--color-surface)] border-[var(--color-primary)] shadow-sm'
                        : 'text-[var(--color-muted)] border-[var(--color-border)] hover:border-[var(--color-primary)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="bracketType"
                      value={bt}
                      checked={bracketType === bt}
                      onChange={() => { setBracketType(bt); }}
                      className="sr-only"
                    />
                    {t(bt === BRACKET_TYPES.SINGLE_ELIM ? 'create.bracketTypeSingle' : 'create.bracketTypeDouble')}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <PlayerInput players={players} setPlayers={setPlayers} />

        {error && <p className="text-[var(--color-accent)] text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full bg-[var(--color-primary)] text-[var(--color-surface)] py-3 rounded-lg font-medium shadow-sm hover:shadow-md hover:bg-[var(--color-primary-dark)] active:scale-[0.99]"
        >
          {t('create.submit')}
        </button>
      </form>
    </div>
  );
}
