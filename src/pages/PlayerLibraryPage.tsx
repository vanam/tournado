import { useState, useRef, useEffect } from 'react';
import type { ReactElement, KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, Plus, X, Upload } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  listPlayers,
  listPlayerGroups,
  createPlayer,
  updatePlayer as updatePlayerApi,
  deletePlayer as deletePlayerApi,
  deleteAllPlayers as deleteAllPlayersApi,
  createPlayerGroup,
  updatePlayerGroup,
  deletePlayerGroup,
} from '../api/client';
import type { PlayerLibrary, PlayerGroup, PlayerLibraryEntry } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { CustomDialog } from '../components/CustomDialog';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { parseBulkInput } from '../utils/importUtils';

const GROUP_COLORS = [
  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
];

function getGroupColor(index: number): string {
  return GROUP_COLORS[index % GROUP_COLORS.length] ?? 'bg-gray-100 text-gray-800';
}

export const PlayerLibraryPage = (): ReactElement => {
  const { t, language } = useTranslation();
  usePageTitle(t('playerLibrary.title'));

  const [library, setLibrary] = useState<PlayerLibrary>({ groups: [], players: [] });
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  function reloadLibrary(): void {
    void Promise.all([listPlayers(), listPlayerGroups()]).then(([players, groups]) => {
      setLibrary({ players, groups });
    });
  }

  useEffect(() => {
    void Promise.all([listPlayers(), listPlayerGroups()]).then(([players, groups]) => {
      setLibrary({ players, groups });
    });
  }, []);

  // Group form state
  const [newGroupName, setNewGroupName] = useState('');
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [deleteGroupTarget, setDeleteGroupTarget] = useState<PlayerGroup | null>(null);
  const [showDeleteAllGroupsConfirm, setShowDeleteAllGroupsConfirm] = useState(false);

  // Player form state
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerElo, setNewPlayerElo] = useState('');
  const [newPlayerEloError, setNewPlayerEloError] = useState(false);
  const [newPlayerGroupIds, setNewPlayerGroupIds] = useState<string[]>([]);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState('');
  const [editingPlayerElo, setEditingPlayerElo] = useState('');
  const [addingGroupForPlayerId, setAddingGroupForPlayerId] = useState<string | null>(null);

  // Delete-all state
  const [showDeleteAllPlayersConfirm, setShowDeleteAllPlayersConfirm] = useState(false);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importErrors, setImportErrors] = useState<Array<{ line: number; msg: string }>>([]);

  const groupInputRef = useRef<HTMLInputElement>(null);
  const editGroupInputRef = useRef<HTMLInputElement>(null);
  const editPlayerNameRef = useRef<HTMLInputElement>(null);

  const filteredPlayers = (selectedGroupId === null
    ? library.players
    : library.players.filter((p) => p.groupIds.includes(selectedGroupId))
  ).toSorted((a, b) => a.name.localeCompare(b.name, language));

  // --- Group handlers ---

  function handleStartAddGroup(): void {
    setShowAddGroup(true);
    setNewGroupName('');
    setTimeout(() => { groupInputRef.current?.focus(); }, 0);
  }

  function handleSaveNewGroup(): void {
    const trimmed = newGroupName.trim();
    if (trimmed.length === 0) {
      setShowAddGroup(false);
      return;
    }
    void createPlayerGroup({ name: trimmed }).then(reloadLibrary);
    setNewGroupName('');
    setShowAddGroup(false);
  }

  function handleNewGroupKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') {
      handleSaveNewGroup();
    } else if (e.key === 'Escape') {
      setShowAddGroup(false);
      setNewGroupName('');
    }
  }

  function handleStartEditGroup(group: PlayerGroup): void {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
    setTimeout(() => { editGroupInputRef.current?.focus(); }, 0);
  }

  function handleSaveEditGroup(): void {
    const trimmed = editingGroupName.trim();
    if (editingGroupId === null) return;
    if (trimmed.length > 0) {
      void updatePlayerGroup(editingGroupId, { name: trimmed }).then(reloadLibrary);
    }
    setEditingGroupId(null);
    setEditingGroupName('');
  }

  function handleEditGroupKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') {
      handleSaveEditGroup();
    } else if (e.key === 'Escape') {
      setEditingGroupId(null);
      setEditingGroupName('');
    }
  }

  function handleConfirmDeleteGroup(): void {
    if (deleteGroupTarget === null) return;
    const id = deleteGroupTarget.id;
    if (selectedGroupId === id) {
      setSelectedGroupId(null);
    }
    void deletePlayerGroup(id).then(reloadLibrary);
    setDeleteGroupTarget(null);
  }

  // --- Player handlers ---

  function handleAddPlayer(): void {
    const trimmed = newPlayerName.trim();
    if (trimmed.length === 0) return;
    const eloRaw = newPlayerElo.trim();
    const eloNum = eloRaw.length > 0 ? Number(eloRaw) : undefined;
    if (eloNum !== undefined && (!Number.isInteger(eloNum) || eloNum < 1 || eloNum > 9999)) {
      setNewPlayerEloError(true);
      return;
    }
    const req = eloNum === undefined
      ? { name: trimmed, groupIds: newPlayerGroupIds }
      : { name: trimmed, elo: eloNum, groupIds: newPlayerGroupIds };
    void createPlayer(req).then(reloadLibrary);
    setNewPlayerName('');
    setNewPlayerElo('');
    setNewPlayerEloError(false);
    setNewPlayerGroupIds([]);
  }

  function handleNewPlayerGroupToggle(groupId: string): void {
    setNewPlayerGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  }

  function handleStartEditPlayer(player: PlayerLibraryEntry): void {
    setEditingPlayerId(player.id);
    setEditingPlayerName(player.name);
    setEditingPlayerElo(player.elo === undefined ? '' : String(player.elo));
    setTimeout(() => { editPlayerNameRef.current?.focus(); }, 0);
  }

  function handleSaveEditPlayer(): void {
    if (editingPlayerId === null) return;
    const trimmed = editingPlayerName.trim();
    if (trimmed.length === 0) {
      setEditingPlayerId(null);
      return;
    }
    const eloRaw = editingPlayerElo.trim();
    let eloNum: number | undefined;
    if (eloRaw.length > 0) {
      const parsed = Number(eloRaw);
      eloNum = Number.isInteger(parsed) && parsed >= 1 && parsed <= 9999 ? parsed : undefined;
    }
    const patch = eloNum === undefined ? { name: trimmed } : { name: trimmed, elo: eloNum };
    void updatePlayerApi(editingPlayerId, patch).then(reloadLibrary);
    setEditingPlayerId(null);
    setEditingPlayerName('');
    setEditingPlayerElo('');
  }

  function handleEditPlayerKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') {
      handleSaveEditPlayer();
    } else if (e.key === 'Escape') {
      setEditingPlayerId(null);
      setEditingPlayerName('');
      setEditingPlayerElo('');
    }
  }

  function handleRemovePlayerGroup(playerId: string, groupId: string): void {
    const player = library.players.find((p) => p.id === playerId);
    if (player === undefined) return;
    void updatePlayerApi(playerId, { groupIds: player.groupIds.filter((gid) => gid !== groupId) }).then(reloadLibrary);
  }

  function handleAddGroupToPlayer(playerId: string, groupId: string): void {
    const player = library.players.find((p) => p.id === playerId);
    if (player === undefined) return;
    void updatePlayerApi(playerId, { groupIds: [...player.groupIds, groupId] }).then(reloadLibrary);
    setAddingGroupForPlayerId(null);
  }

  function handleDeletePlayer(playerId: string): void {
    const players = library.players.filter((p) => p.id !== playerId);
    setLibrary((prev) => ({ ...prev, players }));
    void deletePlayerApi(playerId);
  }

  // --- Delete-all handlers ---

  function handleDeleteAllPlayers(): void {
    setLibrary((prev) => ({ ...prev, players: [] }));
    setShowDeleteAllPlayersConfirm(false);
    void deleteAllPlayersApi();
  }

  function handleDeleteAllGroups(): void {
    setSelectedGroupId(null);
    const ids = library.groups.map((g) => g.id);
    void Promise.all(ids.map((id) => deletePlayerGroup(id))).then(reloadLibrary);
    setShowDeleteAllGroupsConfirm(false);
  }

  // --- Bulk import handler ---

  function handleBulkImport(): void {
    const { parsed, errors: parseErrors } = parseBulkInput(
      importText,
      library.players.map((p) => p.name),
    );
    const newErrors = parseErrors.map((e) => ({ line: e.line, msg: t(e.msgKey) }));
    if (newErrors.length > 0) { setImportErrors(newErrors); return; }
    if (parsed.length === 0) { setImportErrors([{ line: 0, msg: t('players.importErrorNone') }]); return; }

    const groupIds = selectedGroupId === null ? [] : [selectedGroupId];
    void Promise.all(parsed.map((p) => createPlayer({ name: p.name, ...(p.elo !== undefined && { elo: p.elo }), groupIds }))).then(reloadLibrary);
    setShowImportModal(false);
    setImportText('');
    setImportErrors([]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          {t('playerLibrary.title')}
        </h1>
        {library.players.length > 0 && (
          <Button
            variant="secondary-ghost"
            size="icon"
            aria-label={t('playerLibrary.deleteAllPlayers')}
            onClick={() => { setShowDeleteAllPlayersConfirm(true); }}
            className="h-8 w-8"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Top row: Add Player (left) + Groups management (right) */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left: Add Player */}
        <div className="lg:w-1/2 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            {t('playerLibrary.addPlayer')}
          </p>
          <div className="flex flex-wrap gap-2">
            <Input
              value={newPlayerName}
              onChange={(e) => { setNewPlayerName(e.target.value); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddPlayer(); }}
              placeholder={t('playerLibrary.playerName')}
              className="h-8 text-sm w-48"
            />
            <div className="flex flex-col gap-0.5">
              <Input
                value={newPlayerElo}
                onChange={(e) => { setNewPlayerElo(e.target.value); setNewPlayerEloError(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddPlayer(); }}
                placeholder={t('playerLibrary.elo')}
                type="number"
                min={1}
                max={9999}
                className={`h-8 text-sm w-24${newPlayerEloError ? ' border-[var(--color-accent)]' : ''}`}
              />
              {newPlayerEloError && (
                <span className="text-xs text-[var(--color-accent)]">1–9999</span>
              )}
            </div>
          </div>

          {library.groups.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-[var(--color-muted)]">{t('playerLibrary.assignGroups')}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 max-h-32 overflow-y-auto">
                {library.groups.map((g, idx) => (
                  <label key={g.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPlayerGroupIds.includes(g.id)}
                      onChange={() => { handleNewPlayerGroupToggle(g.id); }}
                      className="accent-[var(--color-primary)] h-3.5 w-3.5"
                    />
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getGroupColor(idx)}`}>
                      {g.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={handleAddPlayer}
              disabled={newPlayerName.trim().length === 0}
            >
              {t('playerLibrary.add')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => { setShowImportModal(true); }}
              className="flex items-center gap-1.5 text-sm"
            >
              <Upload className="h-4 w-4" />
              {t('players.importTitle')}
            </Button>
          </div>
        </div>

        {/* Right: Groups management */}
        <div className="lg:w-1/2 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              {t('playerLibrary.groups')}
            </p>
            {library.groups.length > 0 && (
              <Button
                variant="secondary-ghost"
                size="icon"
                aria-label={t('playerLibrary.deleteAllGroups')}
                onClick={() => { setShowDeleteAllGroupsConfirm(true); }}
                className="h-7 w-7"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>

          {library.groups.map((group) => (
            <div
              key={group.id}
              className="flex items-center gap-1 rounded px-1 py-0.5"
            >
              {editingGroupId === group.id ? (
                <Input
                  ref={editGroupInputRef}
                  value={editingGroupName}
                  onChange={(e) => { setEditingGroupName(e.target.value); }}
                  onBlur={handleSaveEditGroup}
                  onKeyDown={handleEditGroupKeyDown}
                  className="h-7 text-sm flex-1"
                />
              ) : (
                <>
                  <span className="flex-1 text-sm text-[var(--color-text)] truncate px-1">
                    {group.name}
                  </span>
                  <Button
                    variant="primary-ghost"
                    size="icon"
                    aria-label={t('playerLibrary.renameGroup')}
                    onClick={() => { handleStartEditGroup(group); }}
                    className="h-7 w-7 shrink-0"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="secondary-ghost"
                    size="icon"
                    aria-label={t('playerLibrary.deleteGroup')}
                    onClick={() => { setDeleteGroupTarget(group); }}
                    className="h-7 w-7 shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          ))}

          {library.groups.length === 0 && (
            <p className="text-xs text-[var(--color-faint)] px-1 py-1">
              {t('playerLibrary.noGroups')}
            </p>
          )}

          {showAddGroup ? (
            <div className="pt-1">
              <Input
                ref={groupInputRef}
                value={newGroupName}
                onChange={(e) => { setNewGroupName(e.target.value); }}
                onBlur={handleSaveNewGroup}
                onKeyDown={handleNewGroupKeyDown}
                placeholder={t('playerLibrary.groupName')}
                className="h-7 text-sm w-full"
              />
            </div>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleStartAddGroup}
            >
              <Plus className="h-3 w-3" />
              {t('playerLibrary.addGroup')}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs + Player list */}
      <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)]">
        {/* Tab bar */}
        <div className="flex items-center gap-0.5 border-b border-[var(--color-border-soft)] overflow-x-auto overflow-y-hidden">
          <button
            type="button"
            onClick={() => { setSelectedGroupId(null); }}
            className={`px-3 py-2.5 text-sm whitespace-nowrap transition-colors border-b-2 -mb-px ${
              selectedGroupId === null
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-medium'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {t('playerLibrary.allPlayers')} ({library.players.length})
          </button>

          {library.groups.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => { setSelectedGroupId(group.id); }}
              className={`px-3 py-2.5 text-sm whitespace-nowrap transition-colors border-b-2 -mb-px ${
                selectedGroupId === group.id
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-medium'
                  : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {group.name} ({library.players.filter((p) => p.groupIds.includes(group.id)).length})
            </button>
          ))}
        </div>

        {/* Player panel */}
        <div className="p-4 space-y-4">
          {filteredPlayers.length === 0 && (
            <p className="text-sm text-[var(--color-muted)]">
              {t('playerLibrary.noPlayers')}
            </p>
          )}

          <div className="space-y-2">
            {filteredPlayers.map((player) => {
              const playerGroups = library.groups.filter((g) => player.groupIds.includes(g.id));
              const availableGroups = library.groups.filter((g) => !player.groupIds.includes(g.id));
              const isEditing = editingPlayerId === player.id;

              return (
                <div
                  key={player.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--color-border-soft)] px-3 py-2 bg-[var(--color-surface-alt,var(--color-surface))]"
                >
                  {isEditing ? (
                    <>
                      <Input
                        ref={editPlayerNameRef}
                        value={editingPlayerName}
                        onChange={(e) => { setEditingPlayerName(e.target.value); }}
                        onBlur={handleSaveEditPlayer}
                        onKeyDown={handleEditPlayerKeyDown}
                        className="h-7 text-sm w-40"
                      />
                      <Input
                        value={editingPlayerElo}
                        onChange={(e) => { setEditingPlayerElo(e.target.value); }}
                        onBlur={handleSaveEditPlayer}
                        onKeyDown={handleEditPlayerKeyDown}
                        placeholder={t('playerLibrary.elo')}
                        type="number"
                        min={1}
                        max={9999}
                        className="h-7 text-sm w-20"
                      />
                    </>
                  ) : (
                    <>
                      <Link
                        to={`/players/${player.id}`}
                        className="font-medium text-sm text-[var(--color-text)] hover:text-[var(--color-primary)] hover:underline transition-colors"
                      >
                        {player.name}
                      </Link>
                      <span className="text-xs text-[var(--color-muted)]">
                        {player.elo === undefined ? '—' : t('players.elo', { elo: String(player.elo) })}
                      </span>
                    </>
                  )}

                  {/* Group badges */}
                  <div className="flex flex-wrap gap-1 items-center">
                    {playerGroups.map((g) => {
                      const colorIdx = library.groups.findIndex((grp) => grp.id === g.id);
                      return (
                        <span
                          key={g.id}
                          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${getGroupColor(colorIdx)}`}
                        >
                          {g.name}
                          <button
                            type="button"
                            aria-label={`Remove from ${g.name}`}
                            onClick={() => { handleRemovePlayerGroup(player.id, g.id); }}
                            className="ml-0.5 hover:opacity-70 transition-opacity"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      );
                    })}

                    {/* Add group button */}
                    {availableGroups.length > 0 && (
                      <div className="relative">
                        <button
                          type="button"
                          aria-label={t('playerLibrary.assignGroups')}
                          onClick={() => {
                            setAddingGroupForPlayerId(
                              addingGroupForPlayerId === player.id ? null : player.id
                            );
                          }}
                          className="inline-flex items-center justify-center h-5 w-5 rounded-full border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)] transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        {addingGroupForPlayerId === player.id && (
                          <div className="absolute z-10 left-0 top-6 min-w-[140px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] shadow-md py-1">
                            {availableGroups.map((g) => {
                              const colorIdx = library.groups.findIndex((grp) => grp.id === g.id);
                              return (
                                <button
                                  key={g.id}
                                  type="button"
                                  onClick={() => { handleAddGroupToPlayer(player.id, g.id); }}
                                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--color-soft)] transition-colors ${getGroupColor(colorIdx)}`}
                                >
                                  {g.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="ml-auto flex items-center gap-1">
                    {!isEditing && (
                      <Button
                        variant="primary-ghost"
                        size="icon"
                        aria-label={t('playerLibrary.renameGroup')}
                        onClick={() => { handleStartEditPlayer(player); }}
                        className="h-7 w-7"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="secondary-ghost"
                      size="icon"
                      aria-label={t('playerLibrary.deletePlayer')}
                      onClick={() => { handleDeletePlayer(player.id); }}
                      className="h-7 w-7"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Delete All Players Confirm Modal */}
      {showDeleteAllPlayersConfirm && (
        <ConfirmModal
          title={t('playerLibrary.deleteAllPlayers')}
          message={t('playerLibrary.deleteAllPlayersConfirm')}
          confirmLabel={t('playerLibrary.deleteAllPlayers')}
          cancelLabel={t('playerLibrary.cancel')}
          onConfirm={handleDeleteAllPlayers}
          onCancel={() => { setShowDeleteAllPlayersConfirm(false); }}
        />
      )}

      {/* Delete All Groups Confirm Modal */}
      {showDeleteAllGroupsConfirm && (
        <ConfirmModal
          title={t('playerLibrary.deleteAllGroups')}
          message={t('playerLibrary.deleteAllGroupsConfirm')}
          confirmLabel={t('playerLibrary.deleteAllGroups')}
          cancelLabel={t('playerLibrary.cancel')}
          onConfirm={handleDeleteAllGroups}
          onCancel={() => { setShowDeleteAllGroupsConfirm(false); }}
        />
      )}

      {/* Delete Group Confirm Modal */}
      {deleteGroupTarget !== null && (
        <ConfirmModal
          title={t('playerLibrary.deleteGroup')}
          message={t('playerLibrary.deleteGroupConfirm', { name: deleteGroupTarget.name })}
          confirmLabel={t('playerLibrary.deleteGroup')}
          cancelLabel={t('playerLibrary.cancel')}
          onConfirm={handleConfirmDeleteGroup}
          onCancel={() => { setDeleteGroupTarget(null); }}
        />
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
        <CustomDialog
          open={showImportModal}
          onOpenChange={(o) => {
            if (!o) {
              setShowImportModal(false);
              setImportText('');
              setImportErrors([]);
            }
          }}
          onPrimaryAction={handleBulkImport}
        >
          <DialogContent className="z-150 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('players.importTitle')}</DialogTitle>
              <DialogDescription className="whitespace-pre-line">{t('players.importDesc')}</DialogDescription>
            </DialogHeader>
            <div className="py-2">
              {selectedGroupId !== null && (
                <p className="text-xs text-[var(--color-muted)] mb-2">
                  {t('playerLibrary.assignGroups')}: <strong>{library.groups.find((g) => g.id === selectedGroupId)?.name}</strong>
                </p>
              )}
              <textarea
                className="w-full min-h-[160px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
                placeholder={t('players.importPlaceholder')}
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportErrors([]);
                }}
              />
              {importErrors.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {importErrors.map((err) => (
                    <li key={`${err.line}-${err.msg}`} className="text-sm text-[var(--color-accent)]">
                      {err.line > 0
                        ? t('players.importError', { n: String(err.line), msg: err.msg })
                        : err.msg}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="primary-ghost"
                onClick={() => {
                  setShowImportModal(false);
                  setImportText('');
                  setImportErrors([]);
                }}
              >
                {t('players.importCancel')}
              </Button>
              <Button variant="secondary" onClick={handleBulkImport}>
                {t('players.importConfirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </CustomDialog>
      )}
    </div>
  );
};
