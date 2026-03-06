import { useState, type ReactElement } from 'react';
import { Check, X } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { useTournament } from '../context/tournamentContext';
import { updateTournamentPlayer } from '../services/tournamentService';
import type { Player } from '../types';

export const PlayerList = (): ReactElement => {
  const { tournament, reloadTournament } = useTournament();
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editEloValue, setEditEloValue] = useState('');
  const [error, setError] = useState('');

  if (!tournament) {
    return <div className="mb-6" />;
  }

  const { players } = tournament;

  function startEdit(player: Player): void {
    setEditingId(player.id);
    setEditValue(player.name);
    setEditEloValue(player.elo == null ? '' : String(player.elo));
    setError('');
  }

  function cancelEdit(): void {
    setEditingId(null);
    setEditValue('');
    setEditEloValue('');
    setError('');
  }

  async function saveEdit(playerId: string): Promise<void> {
    if (!tournament) return;
    const trimmed = editValue.trim();
    if (!trimmed) {
      setError(t('tournament.nameEmpty'));
      return;
    }
    if (
      players.some(
        (p) => p.id !== playerId && p.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      setError(t('tournament.nameDuplicate'));
      return;
    }

    let elo: number | undefined;
    const eloTrimmed = editEloValue.trim();
    if (eloTrimmed !== '') {
      const parsed = Number(eloTrimmed);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 9999) {
        setError(t('tournament.eloInvalid'));
        return;
      }
      elo = parsed;
    }

    await updateTournamentPlayer(tournament.id, playerId, trimmed, elo);
    await reloadTournament();
    setEditingId(null);
    setEditValue('');
    setEditEloValue('');
    setError('');
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-2">
        {t('tournament.playersList')} ({players.length})
      </h3>
      <div className="flex flex-wrap gap-2">
        {players.map((player) => (
          <div key={player.id}>
            {editingId === player.id ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  id={`edit-player-${player.id}`}
                  aria-label={t('tournament.editName')}
                  value={editValue}
                  onChange={(e) => {
                    setEditValue(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { void saveEdit(player.id); }
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className={`border rounded px-2 py-1 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-card)] ${
                    error ? 'border-[var(--color-accent-border)]' : 'border-[var(--color-border)]'
                  }`}
                />
                <input
                  type="number"
                  aria-label={t('players.eloPlaceholder')}
                  placeholder={t('players.eloPlaceholder')}
                  value={editEloValue}
                  min={1}
                  max={9999}
                  onChange={(e) => {
                    setEditEloValue(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { void saveEdit(player.id); }
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className={`border rounded px-2 py-1 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-card)] ${
                    error ? 'border-[var(--color-accent-border)]' : 'border-[var(--color-border)]'
                  }`}
                />
                <button
                  onClick={() => { void saveEdit(player.id); }}
                  className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] text-sm px-1"
                  title={t('tournament.saveName')}
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={cancelEdit}
                  className="text-[var(--color-faint)] hover:text-[var(--color-muted)] text-sm px-1"
                  title={t('tournament.cancelEdit')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { startEdit(player); }}
                className="inline-flex items-center gap-2 bg-[var(--color-soft)] border border-[var(--color-border)] rounded-full px-3 py-1 text-sm text-[var(--color-text)] cursor-pointer hover:bg-[var(--color-soft)] hover:border-[var(--color-primary)] transition-colors"
                title={t('tournament.editName')}
                aria-label={t('tournament.editName')}
              >
                <span className="truncate">{player.name}</span>
                {player.elo != null && (
                  <span className="text-xs font-normal text-[var(--color-muted)]">
                    {t('players.elo', { elo: player.elo })}
                  </span>
                )}
              </button>
            )}
          </div>
        ))}
      </div>
      {error && <p className="text-[var(--color-accent)] text-xs mt-1">{error}</p>}
    </div>
  );
};
