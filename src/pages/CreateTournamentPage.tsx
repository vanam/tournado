import {useState, useEffect} from 'react';
import type {ChangeEvent, ReactElement} from 'react';
import {useForm, useFieldArray, useWatch} from 'react-hook-form';
import {useNavigate, useLocation} from 'react-router-dom';
import {DEFAULT_MAX_SETS, MIN_PLAYERS} from '../constants';
import {useTranslation} from '../i18n/useTranslation';
import {usePageTitle} from '../hooks/usePageTitle';
import {createTournament as createTournamentApi} from '../services/tournamentService';
import type {CreateTournamentRequest} from '../services/tournamentService';
import {useAnalytics} from '../utils/analytics';
import {computeMinTotalRounds} from '../utils/swissUtils';
import {distributePlayersToGroups, indexToGroupLabel} from '../utils/groupStageUtils';
import type {BaseGroup} from '../utils/groupStageUtils';
import {allParticipantsComplete, buildParticipants, getParticipantPlayers} from '../utils/participantUtils';
import {PlayerInput} from '../components/PlayerInput';
import { showToast } from '../utils/toastUtils';
import {ParticipantPlayerInput} from '../components/common/ParticipantPlayerInput';
import {TournamentPreview} from '../components/TournamentPreview';
import {BracketType, Format, ScoreMode} from '../types';
import type {Player, Participant, Tournament} from '../types';
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
  swissRounds: number;
};

export const CreateTournamentPage = (): ReactElement => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { tracker } = useAnalytics();

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
    reset,
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
      swissRounds: 1,
    },
  });

  const [players, setPlayers] = useState<Player[]>([]);
  const [teamSize, setTeamSize] = useState(1);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const {
    fields: qualifierFields,
    append: appendQualifier,
    remove: removeQualifiers,
  } = useFieldArray({ control, name: 'qualifiers' });

  const duplicate = (location.state as { duplicate?: Tournament } | null)?.duplicate ?? null;

  useEffect(() => {
    if (duplicate === null) return;
    const src = duplicate;
    const useElo = src.players.some((p) => p.elo !== undefined);
    const commonFields = {
      name: src.name,
      format: src.format,
      scoringMode: src.scoringMode ?? ScoreMode.SETS,
      maxSets: src.maxSets ?? DEFAULT_MAX_SETS,
      playerName: '',
      playerElo: 1000,
      useElo,
    };
    if (src.format === Format.GROUPS_TO_BRACKET) {
      const settings = src.groupStage.settings;
      reset({
        ...commonFields,
        groupStageMaxSets: src.groupStageMaxSets ?? DEFAULT_MAX_SETS,
        bracketMaxSets: src.bracketMaxSets ?? DEFAULT_MAX_SETS,
        groupCount: settings.groupCount,
        consolation: settings.consolation,
        bracketType: settings.bracketType ?? BracketType.SINGLE_ELIM,
        qualifiers: settings.qualifiers.map((v) => ({ value: v })),
        swissRounds: 1,
      });
    } else if (src.format === Format.SWISS) {
      reset({
        ...commonFields,
        groupStageMaxSets: DEFAULT_MAX_SETS,
        bracketMaxSets: DEFAULT_MAX_SETS,
        groupCount: 2,
        consolation: false,
        bracketType: BracketType.SINGLE_ELIM,
        qualifiers: [{ value: 2 }, { value: 2 }],
        swissRounds: src.totalRounds,
      });
    } else {
      reset({
        ...commonFields,
        groupStageMaxSets: DEFAULT_MAX_SETS,
        bracketMaxSets: DEFAULT_MAX_SETS,
        groupCount: 2,
        consolation: false,
        bracketType: BracketType.SINGLE_ELIM,
        qualifiers: [{ value: 2 }, { value: 2 }],
        swissRounds: 1,
      });
    }
    const dupPlayers = src.players.map((p, i) => ({ ...p, id: crypto.randomUUID(), seed: i + 1 }));
    const dupTeamSize = src.teamSize ?? 1;
    setTeamSize(dupTeamSize);
    setPlayers(dupPlayers);
    if (src.participants && src.participants.length > 0) {
      // Remap old player IDs to new player IDs sequentially
      const idMap = new Map(src.players.map((p, i) => [p.id, dupPlayers[i]?.id ?? '']));
      setParticipants(src.participants.map((p, pi) => ({
        id: crypto.randomUUID(),
        playerIds: p.playerIds.map((pid) => idMap.get(pid) ?? pid),
        seed: pi + 1,
      })));
    } else {
      setParticipants(buildParticipants(dupPlayers, dupTeamSize, []));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const format = useWatch({ control, name: 'format' });
  const scoringMode = useWatch({ control, name: 'scoringMode' });
  const bracketType = useWatch({ control, name: 'bracketType' });
  const useElo = useWatch({ control, name: 'useElo' });
  const groupCount = useWatch({ control, name: 'groupCount' });
  const swissRounds = useWatch({ control, name: 'swissRounds' });

  const participantCount = participants.length;
  const swissMinRounds = participantCount >= 2 ? computeMinTotalRounds(participantCount) : 1;
  const swissRoundRobinMax = participantCount % 2 === 0 ? participantCount - 1 : participantCount;
  const swissMaxRounds = participantCount >= 2 ? swissRoundRobinMax : 1;

  useEffect(() => {
    if (format === Format.SWISS && (swissRounds < swissMinRounds || swissRounds > swissMaxRounds)) {
      setValue('swissRounds', swissMinRounds);
    }
  }, [participantCount, format, swissMinRounds, swissMaxRounds, swissRounds, setValue]);

  // Custom group assignments stored with their context so they auto-invalidate when inputs change.
  const [customGroupsState, setCustomGroupsState] = useState<{
    groups: BaseGroup[];
    players: Player[];
    participants: Participant[];
    format: Format;
    groupCount: number;
  } | null>(null);

  const customGroups =
    customGroupsState !== null &&
    customGroupsState.players === players &&
    customGroupsState.participants === participants &&
    customGroupsState.format === format &&
    customGroupsState.groupCount === groupCount
      ? customGroupsState.groups
      : null;

  async function handleAddPlayer(): Promise<void> {
    const valid = await trigger('playerName');
    if (!valid) return;
    const name = getValues('playerName').trim();
    if (!name) return;
    const eloValue = getValues('playerElo');
    const useEloValue = getValues('useElo');
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name,
      seed: players.length + 1,
    };
    if (useEloValue && Number.isFinite(eloValue)) newPlayer.elo = eloValue;
    const newPlayers = [...players, newPlayer];
    setPlayers(newPlayers);
    setParticipants(buildParticipants(newPlayers, teamSize, participants));
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
    const participantPlayers = getParticipantPlayers(players, participants);

    if (participantPlayers.length < MIN_PLAYERS) {
      setError('root', { message: t('create.errorPlayers', { minPlayers: MIN_PLAYERS }) });
      return;
    }
    if (!allParticipantsComplete(participants, teamSize)) {
      setError('root', { message: t('create.errorIncompleteParticipant', { teamSize }) });
      return;
    }
    if (data.format === Format.GROUPS_TO_BRACKET && data.groupCount > participantPlayers.length) {
      setError('root', { message: t('create.errorGroupsTooMany') });
      return;
    }

    const qualifiers = data.qualifiers.map((q) => q.value);

    if (data.format === Format.GROUPS_TO_BRACKET) {
      const groups = customGroups ?? distributePlayersToGroups(participantPlayers, data.groupCount);
      for (const [i, group] of groups.entries()) {
        const required = qualifiers[i] ?? 0;
        if (required > 0 && group.playerIds.length < required) {
          setError('root', {
            message: t('create.errorGroupTooFewPlayers', {
              label: indexToGroupLabel(i),
              count: required,
            }),
          });
          return;
        }
      }
    }

    const playoffTypeMap: Record<string, string> = {
      [Format.SINGLE_ELIM]: BracketType.SINGLE_ELIM,
      [Format.DOUBLE_ELIM]: BracketType.DOUBLE_ELIM,
      [Format.GROUPS_TO_BRACKET]: data.bracketType,
      [Format.ROUND_ROBIN]: 'none',
      [Format.SWISS]: 'none',
    };

    tracker.trackTournamentCreated({
      tournament_type: data.format,
      scoring_mode: data.scoringMode,
      player_count: participantPlayers.length,
      playoff_type: playoffTypeMap[data.format] ?? 'none',
    });

    const req: CreateTournamentRequest = {
      name: data.name.trim(),
      format: data.format,
      players: players.map((p) => ({
        name: p.name,
        ...(p.seed !== undefined && { seed: p.seed }),
        ...(p.elo !== undefined && { elo: p.elo }),
        ...(p.libraryId !== undefined && { libraryId: p.libraryId }),
      })),
      teamSize,
      scoringMode: data.scoringMode,
      maxSets: data.maxSets,
      groupStageMaxSets: data.groupStageMaxSets,
      bracketMaxSets: data.bracketMaxSets,
    };
    if (data.format === Format.GROUPS_TO_BRACKET) {
      req.groupCount = data.groupCount;
      req.qualifiers = qualifiers;
      req.consolation = data.consolation;
      req.bracketType = data.bracketType;
    }
    if (data.format === Format.SWISS) {
      req.swissRounds = data.swissRounds;
    }
    void createTournamentApi(req)
      .then((created) => {
        void navigate(`/tournament/${created.id}`);
      })
      .catch(() => { showToast({ message: t('api.errorSave') }); });
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">
        {t('create.title')}
      </h1>

      <form onSubmit={(e) => { void onSubmit(e); }} className="space-y-7">
        {/* Two-column layout on large screens */}
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2 lg:gap-8 lg:items-start">
          {/* Left column: tournament settings */}
          <div className="space-y-7">
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
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
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
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
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
              <div className="flex flex-wrap gap-6 items-start">
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
                {format === Format.SWISS && players.length >= 2 && (
                  <div>
                    <Label htmlFor="swiss-rounds" className="block text-sm font-medium text-[var(--color-text)] mb-1">
                      {t('create.swissRoundsLabel')}
                    </Label>
                    <Input
                      id="swiss-rounds"
                      type="number"
                      min={swissMinRounds}
                      max={swissMaxRounds}
                      className="w-24"
                      {...register('swissRounds', {
                        valueAsNumber: true,
                        min: swissMinRounds,
                        max: swissMaxRounds,
                      })}
                    />
                    <p className="text-xs text-[var(--color-muted)] mt-1">
                      (min: {swissMinRounds}, max: {swissMaxRounds})
                    </p>
                  </div>
                )}
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
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
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
          </div>

          {/* Right column: team size + player input */}
          <div className="space-y-4">
            <div>
              <FieldGroupLabel>
                {t('create.teamSize')}
              </FieldGroupLabel>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {([1, 2] as const).map((size) => (
                  <label
                    key={size}
                    className={`flex items-center justify-center flex-1 text-center px-4 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                      teamSize === size
                        ? 'bg-[var(--color-primary)] text-[var(--color-surface)] border-[var(--color-primary)] shadow-sm'
                        : 'text-[var(--color-muted)] border-[var(--color-border)] hover:border-[var(--color-primary)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="teamSize"
                      value={size}
                      className="sr-only"
                      checked={teamSize === size}
                      onChange={() => {
                        setTeamSize(size);
                        setPlayers([]);
                        setParticipants([]);
                      }}
                    />
                    {size === 1 ? t('create.singles') : t('create.doubles')}
                  </label>
                ))}
              </div>
            </div>
            {teamSize === 1 ? (
              <PlayerInput
                players={players}
                setPlayers={(newPlayers) => {
                  setPlayers(newPlayers);
                  setParticipants(buildParticipants(newPlayers, 1, participants));
                }}
                register={register}
                errors={errors}
                setValue={setValue}
                useElo={useElo}
                onAddPlayer={() => { void handleAddPlayer(); }}
              />
            ) : (
              <div>
                <div className="mb-3 space-y-2">
                  <div className="grid grid-cols-[1fr_auto] gap-2 sm:flex sm:gap-2">
                    <input
                      id="player-name"
                      type="text"
                      aria-label={t('players.placeholder')}
                      placeholder={t('players.placeholder')}
                      className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm min-w-0 sm:flex-1 bg-[var(--color-card)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      {...register('playerName', {
                        validate: (v) => {
                          const trimmed = v.trim();
                          if (!trimmed) return true;
                          return (
                            !players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase()) ||
                            t('players.errorUnique')
                          );
                        },
                      })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); void handleAddPlayer(); }
                      }}
                    />
                    <Button type="button" onClick={() => { void handleAddPlayer(); }}>
                      {t('players.add')}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="use-elo-doubles"
                      type="checkbox"
                      checked={useElo}
                      onChange={(e) => { setValue('useElo', e.target.checked); }}
                    />
                    <Label htmlFor="use-elo-doubles" className="text-sm text-[var(--color-text)]">
                      {t('players.useElo')}
                    </Label>
                    <Input
                      id="elo-rating-doubles"
                      type="number"
                      min="0"
                      aria-label={t('players.eloPlaceholder')}
                      placeholder={t('players.eloPlaceholder')}
                      disabled={!useElo}
                      className="w-24"
                      {...register('playerElo', { valueAsNumber: true })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); void handleAddPlayer(); }
                      }}
                    />
                  </div>
                </div>
                {errors.playerName && <p className="text-[var(--color-accent)] text-sm mb-2">{errors.playerName.message}</p>}
                <ParticipantPlayerInput
                  teamSize={teamSize}
                  players={players}
                  participants={participants}
                  useElo={useElo}
                  onPlayersChange={(newPlayers, newParticipants) => {
                    setPlayers(newPlayers);
                    setParticipants(newParticipants);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Full-width: preview + submit */}
        <TournamentPreview
          format={format}
          players={getParticipantPlayers(players, participants)}
          groupCount={groupCount}
          externalGroups={customGroups}
          onGroupsChange={(groups) => {
            const orderedIds = groups.flatMap((g) => g.playerIds);
            const currentParticipantPlayers = getParticipantPlayers(players, participants);
            const reordered = orderedIds
              .map((id) => currentParticipantPlayers.find((p) => p.id === id))
              .filter((p): p is Player => p !== undefined)
              .map((p, i) => ({ ...p, seed: i + 1 }));
            // Reorder participants to match new order
            const reorderedParticipants = reordered
              .map((rp) => participants.find((p) => p.id === rp.id))
              .filter((p): p is Participant => p !== undefined)
              .map((p, i) => ({ ...p, seed: i + 1 }));
            setParticipants(reorderedParticipants);
            if (teamSize <= 1) {
              // For singles, also keep players array in sync with participant order
              const reorderedPlayers = reorderedParticipants
                .map((p) => players.find((pl) => pl.id === p.id))
                .filter((pl): pl is Player => pl !== undefined)
                .map((pl, i) => ({ ...pl, seed: i + 1 }));
              setPlayers(reorderedPlayers);
              setCustomGroupsState({ groups, players: reorderedPlayers, participants: reorderedParticipants, format, groupCount });
            } else {
              setCustomGroupsState({ groups, players, participants: reorderedParticipants, format, groupCount });
            }
          }}
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
