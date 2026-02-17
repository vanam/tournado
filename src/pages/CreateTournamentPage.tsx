import {useState} from 'react';
import type {ChangeEvent, ReactElement} from 'react';
import {useForm, useFieldArray, useWatch} from 'react-hook-form';
import {useNavigate} from 'react-router-dom';
import {DEFAULT_MAX_SETS, MIN_PLAYERS} from '../constants';
import {useTranslation} from '../i18n/useTranslation';
import {usePageTitle} from '../hooks/usePageTitle';
import {persistence} from '../services/persistence';
import {generateBracket} from '../utils/bracketUtils';
import {generateSchedule} from '../utils/roundRobinUtils';
import {createGroupStage, indexToGroupLabel} from '../utils/groupStageUtils';
import {generateDoubleElim} from '../utils/doubleElimUtils';
import {PlayerInput} from '../components/PlayerInput';
import {BracketType, Format, ScoreMode} from '../types';
import type {Player, Tournament} from '../types';
import { Button } from '@/components/ui/Button';
import { FieldGroupLabel } from '@/components/ui/FieldGroupLabel';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

type QualifierField = { value: number };

export type TournamentFormValues = {
  name: string;
  format: Format;
  scoringMode: ScoreMode;
  maxSets: number;
  groupStageMaxSets: number;
  bracketMaxSets: number;
  groupCount: number;
  consolation: boolean;
  bracketType: BracketType;
  qualifiers: QualifierField[];
  playerName: string;
  playerElo: number;
  useElo: boolean;
};

export const CreateTournamentPage = (): ReactElement => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  usePageTitle(t('create.title'));

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    trigger,
    getValues,
    resetField,
    formState: { errors },
  } = useForm<TournamentFormValues>({
    defaultValues: {
      name: '',
      format: Format.SINGLE_ELIM,
      scoringMode: ScoreMode.SETS,
      maxSets: DEFAULT_MAX_SETS,
      groupStageMaxSets: DEFAULT_MAX_SETS,
      bracketMaxSets: DEFAULT_MAX_SETS,
      groupCount: 2,
      consolation: false,
      bracketType: BracketType.SINGLE_ELIM,
      qualifiers: [{ value: 2 }, { value: 2 }],
      playerName: '',
      playerElo: 1000,
      useElo: false,
    },
  });

  const [players, setPlayers] = useState<Player[]>([]);

  const {
    fields: qualifierFields,
    append: appendQualifier,
    remove: removeQualifiers,
  } = useFieldArray({ control, name: 'qualifiers' });

  const format = useWatch({ control, name: 'format' });
  const scoringMode = useWatch({ control, name: 'scoringMode' });
  const bracketType = useWatch({ control, name: 'bracketType' });
  const useElo = useWatch({ control, name: 'useElo' });

  async function handleAddPlayer(): Promise<void> {
    const valid = await trigger('playerName');
    if (!valid) return;
    const name = getValues('playerName').trim();
    if (!name) return;
    const eloValue = getValues('playerElo');
    const useEloValue = getValues('useElo');
    setPlayers([
      ...players,
      {
        id: crypto.randomUUID(),
        name,
        seed: players.length + 1,
        elo: useEloValue && Number.isFinite(eloValue) ? eloValue : undefined,
      },
    ]);
    resetField('playerName');
    resetField('playerElo');
  }

  function normalizeMaxSets(value: string): number {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return DEFAULT_MAX_SETS;
    return Math.max(1, parsed);
  }

  function handleGroupCountChange(value: string): void {
    const count = Math.max(1, Number.parseInt(value, 10) || 1);
    setValue('groupCount', count);
    if (count > qualifierFields.length) {
      const toAdd = count - qualifierFields.length;
      for (let i = 0; i < toAdd; i++) appendQualifier({ value: 2 });
    } else if (count < qualifierFields.length) {
      const indicesToRemove = Array.from(
        { length: qualifierFields.length - count },
        (_, i) => count + i,
      );
      removeQualifiers(indicesToRemove);
    }
  }

  const onSubmit = handleSubmit((data) => {
    if (players.length < MIN_PLAYERS) {
      setError('root', { message: t('create.errorPlayers', { minPlayers: MIN_PLAYERS }) });
      return;
    }
    if (data.format === Format.GROUPS_TO_BRACKET && data.groupCount > players.length) {
      setError('root', { message: t('create.errorGroupsTooMany') });
      return;
    }

    const qualifiers = data.qualifiers.map((q) => q.value);

    const base = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      scoringMode: data.scoringMode,
      maxSets: data.maxSets,
      groupStageMaxSets: data.groupStageMaxSets,
      bracketMaxSets: data.bracketMaxSets,
      players: players.map((p) => ({ ...p })),
      createdAt: new Date().toISOString(),
      completedAt: null,
      winnerId: null,
    };

    let tournament: Tournament;

    switch (data.format) {
      case Format.SINGLE_ELIM: {
        tournament = {
          ...base,
          format: Format.SINGLE_ELIM,
          bracket: generateBracket(players),
        };
        break;
      }
      case Format.ROUND_ROBIN: {
        tournament = {
          ...base,
          format: Format.ROUND_ROBIN,
          schedule: generateSchedule(players),
        };
        break;
      }
      case Format.DOUBLE_ELIM: {
        tournament = {
          ...base,
          format: Format.DOUBLE_ELIM,
          doubleElim: generateDoubleElim(players),
        };
        break;
      }
      case Format.GROUPS_TO_BRACKET: {
        const groupStage = createGroupStage(players, {
          groupCount: data.groupCount,
          qualifiers,
          consolation: data.consolation,
          bracketType: data.bracketType,
        });
        tournament = {
          ...base,
          format: Format.GROUPS_TO_BRACKET,
          groupStage,
          groupStagePlayoffs: null,
        };
        break;
      }
      default: {
        throw new Error(`Unsupported format: ${String(data.format)}`);
      }
    }

    persistence.save(tournament);
    void navigate(`/tournament/${tournament.id}`);
  });

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-8">
        {t('create.title')}
      </h1>

      <form onSubmit={(e) => { void onSubmit(e); }} className="space-y-7">
        <div>
          <Label htmlFor="tournament-name" className="block text-sm font-medium text-[var(--color-text)] mb-1">
            {t('create.nameLabel')}
          </Label>
          <Input
            id="tournament-name"
            type="text"
            placeholder={t('create.namePlaceholder')}
            {...register('name', { required: t('create.errorName') })}
          />
          {errors.name && <p className="text-[var(--color-accent)] text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <FieldGroupLabel>
            {t('create.formatLabel')}
          </FieldGroupLabel>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
            {Object.values(Format).map((f) => (
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
                  value={f}
                  className="sr-only"
                  {...register('format')}
                />
                {t(`format.${f}`)}
              </label>
            ))}
          </div>
        </div>

        <div>
          <FieldGroupLabel>
            {t('create.scoringLabel')}
          </FieldGroupLabel>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
            {Object.values(ScoreMode).map((mode) => (
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
                  value={mode}
                  className="sr-only"
                  {...register('scoringMode')}
                />
                {t(mode === ScoreMode.SETS ? 'create.scoringSets' : 'create.scoringPoints')}
              </label>
            ))}
          </div>
        </div>

        {format !== Format.GROUPS_TO_BRACKET && (
          <div>
            <Label htmlFor="max-sets" className="block text-sm font-medium text-[var(--color-text)] mb-1">
              {t('create.maxSetsLabel')}
            </Label>
            <Input
              id="max-sets"
              type="number"
              min="1"
              className="w-24"
              {...register('maxSets', {
                valueAsNumber: true,
                onChange: (e: ChangeEvent<HTMLInputElement>) => { setValue('maxSets', normalizeMaxSets(e.target.value)); },
              })}
            />
          </div>
        )}

        {format === Format.GROUPS_TO_BRACKET && (
          <div className="space-y-4 border border-[var(--color-border)] rounded-xl p-5 bg-[var(--color-soft)]">
            <div className="text-sm font-semibold text-[var(--color-muted)]">
              {t('create.groupStageTitle')}
            </div>
            <div className="flex flex-wrap gap-4">
              <Label className="text-xs text-[var(--color-muted)]">
                {t('create.maxSetsGroupLabel')}
                <Input
                  id="group-stage-max-sets"
                  type="number"
                  min="1"
                  className="mt-1 w-24 h-8 px-2 py-1"
                  {...register('groupStageMaxSets', {
                    valueAsNumber: true,
                    onChange: (e: ChangeEvent<HTMLInputElement>) => { setValue('groupStageMaxSets', normalizeMaxSets(e.target.value)); },
                  })}
                />
              </Label>
              <Label className="text-xs text-[var(--color-muted)]">
                {t('create.maxSetsBracketLabel')}
                <Input
                  id="bracket-max-sets"
                  type="number"
                  min="1"
                  className="mt-1 w-24 h-8 px-2 py-1"
                  {...register('bracketMaxSets', {
                    valueAsNumber: true,
                    onChange: (e: ChangeEvent<HTMLInputElement>) => { setValue('bracketMaxSets', normalizeMaxSets(e.target.value)); },
                  })}
                />
              </Label>
            </div>
            <div>
              <Label htmlFor="group-count" className="block text-sm font-medium text-[var(--color-text)] mb-1">
                {t('create.groupCountLabel')}
              </Label>
              <Input
                id="group-count"
                type="number"
                min="1"
                className="w-24"
                {...register('groupCount', {
                  valueAsNumber: true,
                  onChange: (e: ChangeEvent<HTMLInputElement>) => { handleGroupCountChange(e.target.value); },
                })}
              />
            </div>
            <div>
              <FieldGroupLabel>
                {t('create.qualifiersLabel')}
              </FieldGroupLabel>
              <div className="grid grid-cols-2 gap-2">
                {qualifierFields.map((field, i) => (
                  <Label key={field.id} className="text-xs text-[var(--color-muted)]">
                    {t('create.groupLabel', { label: indexToGroupLabel(i) })}
                    <Input
                      type="number"
                      min="0"
                      className="mt-1 w-full h-8 px-2 py-1"
                      {...register(`qualifiers.${i}.value`, { valueAsNumber: true })}
                    />
                  </Label>
                ))}
              </div>
            </div>
            <Label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
              <input
                id="consolation"
                type="checkbox"
                {...register('consolation')}
              />
              {t('create.consolationLabel')}
            </Label>
            <div>
              <FieldGroupLabel>
                {t('create.bracketTypeLabel')}
              </FieldGroupLabel>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
                {Object.values(BracketType).map((bt) => (
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
                      value={bt}
                      className="sr-only"
                      {...register('bracketType')}
                    />
                    {t(bt === BracketType.SINGLE_ELIM ? 'create.bracketTypeSingle' : 'create.bracketTypeDouble')}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <PlayerInput
          players={players}
          setPlayers={setPlayers}
          register={register}
          errors={errors}
          setValue={setValue}
          useElo={useElo}
          onAddPlayer={() => { void handleAddPlayer(); }}
        />

        {errors.root && <p className="text-[var(--color-accent)] text-sm">{errors.root.message}</p>}

        <Button
          type="submit"
          className="w-full bg-[var(--color-primary)] text-[var(--color-surface)] py-3 rounded-lg font-medium shadow-sm hover:shadow-md hover:bg-[var(--color-primary-dark)] active:scale-[0.99]"
        >
          {t('create.submit')}
        </Button>
      </form>
    </div>
  );
}
