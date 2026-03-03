import { useState } from 'react';
import type { DragEvent, ReactElement } from 'react';
import { GripVertical, X } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Player, Participant } from '../../types';
import { buildParticipants } from '../../utils/participantUtils';
import { Button } from '@/components/ui/Button';
import { PlayerOrderActions } from './PlayerOrderActions';
import { usePlayerOrder } from '../../hooks/usePlayerOrder';
import { ImportPlayersModal } from '../ImportPlayersModal';

interface ParticipantPlayerInputProps {
  teamSize: number;
  players: Player[];
  participants: Participant[];
  useElo: boolean;
  onPlayersChange: (players: Player[], participants: Participant[]) => void;
}

interface DragState {
  playerIndex: number;
}

function getSlotClass(isDragged: boolean, isOver: boolean): string {
  if (isDragged) return 'opacity-40';
  if (isOver) return 'bg-[var(--color-soft)] border-l-2 border-l-[var(--color-primary)]';
  return 'hover:bg-[var(--color-soft)]';
}

export const ParticipantPlayerInput = ({
  teamSize,
  players,
  participants,
  useElo,
  onPlayersChange,
}: ParticipantPlayerInputProps): ReactElement => {
  const { t } = useTranslation();
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [overPlayerIndex, setOverPlayerIndex] = useState<number | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  function syncPlayers(newPlayers: Player[]): void {
    const newParticipants = buildParticipants(newPlayers, teamSize, participants);
    onPlayersChange(newPlayers, newParticipants);
  }

  const { shufflePlayers, sortPlayersByElo } = usePlayerOrder(players, syncPlayers);

  function removePlayer(id: string): void {
    const updated = players
      .filter((p) => p.id !== id)
      .map((p, i) => ({ ...p, seed: i + 1 }));
    syncPlayers(updated);
  }

  function handleImportPlayers(imported: Array<{ name: string; elo?: number }>): void {
    const merged = [
      ...players,
      ...imported.map((p, i) => {
        const player: Player = {
          id: crypto.randomUUID(),
          name: p.name,
          seed: players.length + i + 1,
        };
        if (p.elo !== undefined) player.elo = p.elo;
        return player;
      }),
    ];
    syncPlayers(merged);
  }

  function handleDragStart(playerIndex: number): void {
    setDragState({ playerIndex });
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>, toPlayerIndex: number): void {
    e.preventDefault();
    if (overPlayerIndex !== toPlayerIndex) setOverPlayerIndex(toPlayerIndex);
  }

  function handleDrop(toPlayerIndex: number): void {
    if (dragState === null || dragState.playerIndex === toPlayerIndex) {
      setDragState(null);
      setOverPlayerIndex(null);
      return;
    }
    const updated = [...players];
    const [moved] = updated.splice(dragState.playerIndex, 1);
    if (moved === undefined) { setDragState(null); setOverPlayerIndex(null); return; }
    updated.splice(toPlayerIndex, 0, moved);
    syncPlayers(updated.map((p, i) => ({ ...p, seed: i + 1 })));
    setDragState(null);
    setOverPlayerIndex(null);
  }

  function handleDragEnd(): void {
    setDragState(null);
    setOverPlayerIndex(null);
  }

  // Group players into participant-sized chunks using the participants array for ordering
  const participantCards: Array<{ participant: Participant | null; slots: Array<Player | null> }> = [];
  const usedPlayerIds = new Set<string>();

  // Build participant cards from participants array
  for (const participant of participants) {
    const slots: Array<Player | null> = participant.playerIds.map(
      (id) => players.find((p) => p.id === id) ?? null,
    );
    // Pad to teamSize if incomplete
    while (slots.length < teamSize) slots.push(null);
    for (const slot of slots) {
      if (slot) usedPlayerIds.add(slot.id);
    }
    participantCards.push({ participant, slots });
  }

  // Remaining players not in any participant (shouldn't normally happen, but safety)
  const unassigned = players.filter((p) => !usedPlayerIds.has(p.id));
  if (unassigned.length > 0) {
    const slots: Array<Player | null> = unassigned.slice(0, teamSize);
    while (slots.length < teamSize) slots.push(null);
    participantCards.push({ participant: null, slots });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-[var(--color-muted)]">
          {t('players.title', { count: players.length })}
        </span>
        <PlayerOrderActions
          useElo={useElo}
          canReorder={players.length > 1}
          onSortByElo={sortPlayersByElo}
          onShuffle={shufflePlayers}
          onImport={() => { setShowImportModal(true); }}
        />
      </div>

      {showImportModal && (
        <ImportPlayersModal
          open={showImportModal}
          onClose={() => { setShowImportModal(false); }}
          onImport={handleImportPlayers}
          existingNames={players.map((p) => p.name)}
        />
      )}

      <div className="space-y-3">
        {participantCards.map((card, participantIndex) => (
          <div
            key={card.participant?.id ?? `unassigned-${participantIndex}`}
            className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-card)]"
          >
            <div className="px-3 py-1.5 bg-[var(--color-soft)] border-b border-[var(--color-border-soft)]">
              <span className="text-xs font-semibold text-[var(--color-muted)]">
                {t('players.participant', { n: participantIndex + 1 })}
              </span>
            </div>
            <div className="divide-y divide-[var(--color-border-soft)]">
              {card.slots.map((player, slotIndex) => {
                const playerIndex = player ? players.findIndex((p) => p.id === player.id) : -1;
                const isDragged = dragState !== null && playerIndex >= 0 && dragState.playerIndex === playerIndex;
                const isOver = overPlayerIndex !== null && playerIndex >= 0 && overPlayerIndex === playerIndex;

                if (player === null) {
                  return (
                    <div
                      key={`empty-${participantIndex}-${slotIndex}`}
                      className="flex items-center gap-2 px-3 py-2"
                    >
                      <span className="text-xs text-[var(--color-faintest)] italic">
                        {t('players.emptySlot')}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={player.id}
                    draggable
                    onDragStart={() => { handleDragStart(playerIndex); }}
                    onDragOver={(e) => { handleDragOver(e, playerIndex); }}
                    onDrop={() => { handleDrop(playerIndex); }}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 px-3 py-2 transition-colors ${getSlotClass(isDragged, isOver)}`}
                  >
                    <GripVertical className="h-4 w-4 text-[var(--color-faint)] cursor-grab shrink-0" />
                    <span className="flex-1 text-sm">{player.name}</span>
                    {player.elo !== undefined && (
                      <span className="text-xs text-[var(--color-faint)]">
                        {t('players.elo', { elo: player.elo })}
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { removePlayer(player.id); }}
                      className="h-auto px-1.5 py-0.5 text-[var(--color-accent)] hover:text-[var(--color-primary-dark)] hover:bg-[var(--color-accent-soft)]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
