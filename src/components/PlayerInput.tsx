import { useState } from 'react';
import type { DragEvent, KeyboardEvent, ReactElement } from 'react';
import type { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { GripVertical, X } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import type { Player } from '../types';
import type { TournamentFormValues } from '../pages/CreateTournamentPage';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import {FieldGroupLabel} from "@/components/ui/FieldGroupLabel";
import { usePlayerOrder } from '../hooks/usePlayerOrder';
import { PlayerMoveButtons } from './common/PlayerMoveButtons';
import { PlayerOrderActions } from './common/PlayerOrderActions';

interface PlayerInputProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  register: UseFormRegister<TournamentFormValues>;
  errors: FieldErrors<TournamentFormValues>;
  setValue: UseFormSetValue<TournamentFormValues>;
  useElo: boolean;
  onAddPlayer: () => void;
}

function getItemClass(isDragged: boolean, isOver: boolean): string {
  if (isDragged) return 'opacity-40 border-[var(--color-border)]';
  if (isOver) return 'border-[var(--color-primary)] bg-[var(--color-soft)]';
  return 'border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-soft)]';
}

export const PlayerInput = ({ players, setPlayers, register, errors, setValue, useElo, onAddPlayer }: PlayerInputProps): ReactElement => {
  const { t } = useTranslation();
  const { moveUp, moveDown, shufflePlayers, sortPlayersByElo } = usePlayerOrder(players, setPlayers);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function handleDragStart(index: number): void {
    setDragIndex(index);
  }

  function handleDragOver(e: DragEvent<HTMLLIElement>, index: number): void {
    e.preventDefault();
    if (overIndex !== index) setOverIndex(index);
  }

  function handleDrop(toIndex: number): void {
    if (dragIndex === null || dragIndex === toIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const updated = [...players];
    const [moved] = updated.splice(dragIndex, 1);
    if (moved === undefined) { setDragIndex(null); setOverIndex(null); return; }
    updated.splice(toIndex, 0, moved);
    setPlayers(updated.map((p, i) => ({ ...p, seed: i + 1 })));
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleDragEnd(): void {
    setDragIndex(null);
    setOverIndex(null);
  }

  function removePlayer(id: string): void {
    const updated = players
      .filter((p) => p.id !== id)
      .map((p, i) => ({ ...p, seed: i + 1 }));
    setPlayers(updated);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <FieldGroupLabel>
          {t('players.title', { count: players.length })}
        </FieldGroupLabel>
        {players.length > 1 && (
          <PlayerOrderActions
            useElo={useElo}
            onSortByElo={sortPlayersByElo}
            onShuffle={shufflePlayers}
          />
        )}
      </div>
      <div className="mb-3 space-y-2">
        <div className="grid grid-cols-[1fr_auto] gap-2 sm:flex sm:gap-2">
          <Input
            id="player-name"
            type="text"
            aria-label={t('players.placeholder')}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAddPlayer();
              }
            }}
            placeholder={t('players.placeholder')}
            className="min-w-0 sm:flex-1"
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
          />
          <Button
            type="button"
            onClick={() => { onAddPlayer(); }}
          >
            {t('players.add')}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="use-elo"
            checked={useElo}
            onCheckedChange={(checked) => { setValue('useElo', checked === true); }}
          />
          <Label htmlFor="use-elo" className="text-sm text-[var(--color-text)]">
            {t('players.useElo')}
          </Label>
          <Input
            id="elo-rating"
            type="number"
            min="0"
            aria-label={t('players.eloPlaceholder')}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAddPlayer();
              }
            }}
            placeholder={t('players.eloPlaceholder')}
            disabled={!useElo}
            className="w-24"
            {...register('playerElo', { valueAsNumber: true })}
          />
        </div>
      </div>
      {errors.playerName && <p className="text-[var(--color-accent)] text-sm mb-2">{errors.playerName.message}</p>}
      <ul className="space-y-1">
        {players.map((player, index) => (
          <li
            key={player.id}
            draggable
            onDragStart={() => { handleDragStart(index); }}
            onDragOver={(e) => { handleDragOver(e, index); }}
            onDrop={() => { handleDrop(index); }}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-2 border rounded-lg px-3 py-2 transition-colors ${getItemClass(dragIndex === index, overIndex === index)}`}
          >
            <GripVertical className="h-4 w-4 text-[var(--color-faint)] cursor-grab shrink-0" />
            <span className="text-[var(--color-faint)] text-sm w-6 text-right">
              #{player.seed}
            </span>
            <span className="flex-1 text-sm">{player.name}</span>
            {player.elo != null && (
              <span className="text-xs text-[var(--color-faint)]">
                {t('players.elo', { elo: player.elo })}
              </span>
            )}
            <PlayerMoveButtons
              index={index}
              total={players.length}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { removePlayer(player.id); }}
              className="h-auto px-1.5 py-0.5 text-[var(--color-accent)] hover:text-[var(--color-primary-dark)] hover:bg-[var(--color-accent-soft)]"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};
