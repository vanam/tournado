import { useState } from 'react';
import type { ChangeEvent, KeyboardEvent, ReactElement, SyntheticEvent } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import type { Player } from '../types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';

interface PlayerInputProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
}

export const PlayerInput = ({ players, setPlayers }: PlayerInputProps): ReactElement => {
  const [name, setName] = useState('');
  const [elo, setElo] = useState('1000');
  const [useElo, setUseElo] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  function addPlayer(e: SyntheticEvent): void {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(t('players.errorUnique'));
      return;
    }
    const parsedElo = useElo ? Number.parseInt(elo, 10) : undefined;
    setPlayers([
      ...players,
      {
        id: crypto.randomUUID(),
        name: trimmed,
        seed: players.length + 1,
        elo: useElo && Number.isFinite(parsedElo) ? parsedElo : undefined,
      },
    ]);
    setName('');
    setElo('1000');
    setError('');
  }

  function removePlayer(id: string): void {
    const updated = players
      .filter((p) => p.id !== id)
      .map((p, i) => ({ ...p, seed: i + 1 }));
    setPlayers(updated);
  }

  function moveUp(index: number): void {
    if (index === 0) return;
    const updated = [...players];
    const prev = updated[index - 1];
    const curr = updated[index];
    if (!prev || !curr) return;
    updated[index - 1] = curr;
    updated[index] = prev;
    setPlayers(updated.map((p, i) => ({ ...p, seed: i + 1 })));
  }

  function moveDown(index: number): void {
    if (index === players.length - 1) return;
    const updated = [...players];
    const curr = updated[index];
    const next = updated[index + 1];
    if (!curr || !next) return;
    updated[index] = next;
    updated[index + 1] = curr;
    setPlayers(updated.map((p, i) => ({ ...p, seed: i + 1 })));
  }

  function shufflePlayers(): void {
    const shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Weak random shuffle is fine here since it's just for tournament seeding and not security-sensitive
      // eslint-disable-next-line sonarjs/pseudo-random
      const j = Math.floor(Math.random() * (i + 1));
      const a = shuffled[i];
      const b = shuffled[j];
      if (!a || !b) continue;
      shuffled[i] = b;
      shuffled[j] = a;
    }
    setPlayers(shuffled.map((p, i) => ({ ...p, seed: i + 1 })));
  }

  function sortPlayersByElo(): void {
    const sorted = [...players].toSorted((a, b) => {
      const aElo = Number(a.elo);
      const bElo = Number(b.elo);
      const safeAElo = Number.isFinite(aElo) ? aElo : 0;
      const safeBElo = Number.isFinite(bElo) ? bElo : 0;
      if (safeBElo !== safeAElo) return safeBElo - safeAElo;
      return (a.seed ?? 0) - (b.seed ?? 0);
    });
    setPlayers(sorted.map((p, i) => ({ ...p, seed: i + 1 })));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="block text-sm font-medium text-[var(--color-text)]">
          {t('players.title', { count: players.length })}
        </Label>
        {players.length > 1 && (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="link"
              onClick={sortPlayersByElo}
              disabled={!useElo}
              className="text-sm px-0 h-auto"
            >
              {t('players.sortByElo')}
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={shufflePlayers}
              className="text-sm px-0 h-auto"
            >
              {t('players.shuffle')}
            </Button>
          </div>
        )}
      </div>
      <div className="mb-3 space-y-2">
        <div className="grid grid-cols-[1fr_auto] gap-2 sm:flex sm:gap-2">
          <Input
            type="text"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setName(e.target.value);
              setError('');
            }}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addPlayer(e);
              }
            }}
            placeholder={t('players.placeholder')}
            className="min-w-0 sm:flex-1"
          />
          <Button
            type="button"
            onClick={addPlayer}
          >
            {t('players.add')}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
            <Checkbox
              checked={useElo}
              onCheckedChange={(checked) => { setUseElo(checked === true); }}
            />
            {t('players.useElo')}
          </Label>
          <Input
            type="number"
            min="0"
            value={elo}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setElo(e.target.value);
              setError('');
            }}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addPlayer(e);
              }
            }}
            placeholder={t('players.eloPlaceholder')}
            disabled={!useElo}
            className="w-24"
          />
        </div>
      </div>
      {error && <p className="text-[var(--color-accent)] text-sm mb-2">{error}</p>}
      <ul className="space-y-1">
        {players.map((player, index) => (
          <li
            key={player.id}
            className="flex items-center gap-2 border border-[var(--color-border)] rounded-lg px-3 py-2 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-soft)] transition-colors"
          >
            <span className="text-[var(--color-faint)] text-sm w-6 text-right">
              #{player.seed}
            </span>
            <span className="flex-1 text-sm">{player.name}</span>
            {player.elo != null && (
              <span className="text-xs text-[var(--color-faint)]">
                {t('players.elo', { elo: player.elo })}
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { moveUp(index); }}
              disabled={index === 0}
              className="h-auto px-1.5 py-0.5 text-[var(--color-faint)] hover:text-[var(--color-text)] hover:bg-[var(--color-soft)]"
            >
              &uarr;
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { moveDown(index); }}
              disabled={index === players.length - 1}
              className="h-auto px-1.5 py-0.5 text-[var(--color-faint)] hover:text-[var(--color-text)] hover:bg-[var(--color-soft)]"
            >
              &darr;
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { removePlayer(player.id); }}
              className="h-auto px-1.5 py-0.5 text-[var(--color-accent)] hover:text-[var(--color-primary-dark)] hover:bg-[var(--color-accent-soft)]"
            >
              &times;
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};
