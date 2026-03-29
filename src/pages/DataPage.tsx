import { type ReactElement, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, Download, Trash2, Upload } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAnalytics } from '@/utils/analytics';
import { getDatabase } from '../db';
import {
  buildExportPayload,
  downloadJson,
  parseExportFile,
  importPayload,
  DATA_VERSION,
  type ExportPayload,
  type ImportResult,
} from '../utils/dataPortability';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { CustomDialog } from '@/components/CustomDialog';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import type { Tournament } from '../types';
import { showToast } from '../utils/toastUtils';
import type { PlayerLibraryEntry, PlayerGroup } from '../types/playerLibrary';
import { deleteAllTournaments } from '../services/tournamentService';
import { deleteAllPlayers } from '../services/playerService';
import { deleteAllPlayerGroups } from '../services/playerGroupService';

type ImportState =
  | { status: 'idle' }
  | { status: 'invalid' }
  | { status: 'version_mismatch'; fileVersion: number }
  | { status: 'preview'; payload: ExportPayload }
  | { status: 'importing' }
  | { status: 'success'; result: ImportResult }
  | { status: 'error'; msg: string };

export const DataPage = (): ReactElement => {
  const location = useLocation();
  const { tracker } = useAnalytics();
  const { t } = useTranslation();

  useEffect(() => {
    tracker.trackPageView({});
  }, [location, tracker]);

  usePageTitle(t('data.title'));

  // --- Data loading ---
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [groups, setGroups] = useState<PlayerGroup[]>([]);
  const [players, setPlayers] = useState<PlayerLibraryEntry[]>([]);

  useEffect(() => {
    async function loadData(): Promise<void> {
      try {
        const db = await getDatabase();
        const tournamentDocs = await db.tournaments.find().exec();
        setTournaments(tournamentDocs.map(d => d.toMutableJSON()));
        const playerDocs = await db.players.find().exec();
        setPlayers(playerDocs.map(d => d.toJSON() as PlayerLibraryEntry));
        const groupDocs = await db.playerGroups.find().exec();
        setGroups(groupDocs.map(d => d.toJSON() as PlayerGroup));
      } catch {
        showToast({ message: t('api.errorLoad') });
      }
    }
    void loadData();
  }, [t]);

  // --- Export selection state ---
  const [selectedTournaments, setSelectedTournaments] = useState(new Set<string>());
  const [selectedGroups, setSelectedGroups] = useState(new Set<string>());
  const [selectedPlayers, setSelectedPlayers] = useState(new Set<string>());

  const ungroupedPlayers = players.filter((p) => p.groupIds.length === 0);

  function toggleTournament(id: string): void {
    setSelectedTournaments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleGroup(id: string, adding: boolean): void {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (adding) next.add(id); else next.delete(id);
      return next;
    });
    // also toggle all players in this group
    const groupPlayers = players.filter((p) => p.groupIds.includes(id));
    setSelectedPlayers((prev) => {
      const next = new Set(prev);
      for (const p of groupPlayers) {
        if (adding) next.add(p.id); else next.delete(p.id);
      }
      return next;
    });
  }

  function togglePlayer(id: string): void {
    setSelectedPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAllTournaments(): void {
    setSelectedTournaments(new Set(tournaments.map((t) => t.id)));
  }

  function deselectAllTournaments(): void {
    setSelectedTournaments(new Set());
  }

  function selectAllPlayerLibrary(): void {
    setSelectedGroups(new Set(groups.map((g) => g.id)));
    setSelectedPlayers(new Set(players.map((p) => p.id)));
  }

  function deselectAllPlayerLibrary(): void {
    setSelectedGroups(new Set());
    setSelectedPlayers(new Set());
  }

  const nothingSelected =
    selectedTournaments.size === 0 &&
    selectedGroups.size === 0 &&
    selectedPlayers.size === 0;

  async function handleExport(): Promise<void> {
    const payload = await buildExportPayload(selectedTournaments, selectedPlayers, selectedGroups);
    downloadJson(payload);
  }

  // --- Import state ---
  const [importState, setImportState] = useState<ImportState>({ status: 'idle' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Delete state ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteSelections, setDeleteSelections] = useState({ tournaments: true, players: true, groups: true });
  const nothingToDelete = !deleteSelections.tournaments && !deleteSelections.players && !deleteSelections.groups;

  function openDeleteModal(): void {
    setDeleteSelections({ tournaments: true, players: true, groups: true });
    setShowDeleteModal(true);
  }

  async function handleDelete(): Promise<void> {
    setShowDeleteModal(false);
    try {
      if (deleteSelections.groups) await deleteAllPlayerGroups();
      if (deleteSelections.players) await deleteAllPlayers();
      if (deleteSelections.tournaments) await deleteAllTournaments();
      const db = await getDatabase();
      const tournamentDocs = await db.tournaments.find().exec();
      setTournaments(tournamentDocs.map(d => d.toMutableJSON()));
      const playerDocs = await db.players.find().exec();
      setPlayers(playerDocs.map(d => d.toJSON() as PlayerLibraryEntry));
      const groupDocs = await db.playerGroups.find().exec();
      setGroups(groupDocs.map(d => d.toJSON() as PlayerGroup));
      showToast({ message: t('data.deleteSuccess') });
    } catch {
      showToast({ message: t('api.errorLoad') });
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (!file) return;
    void file.text().then((text) => {
      const payload = parseExportFile(text);
      if (!payload) {
        setImportState({ status: 'invalid' });
        return;
      }
      if (payload.version !== DATA_VERSION) {
        setImportState({ status: 'version_mismatch', fileVersion: payload.version });
        return;
      }
      setImportState({ status: 'preview', payload });
    });
    // Reset input so same file can be re-selected
    e.target.value = '';
  }

  async function handleImportConfirm(): Promise<void> {
    if (importState.status !== 'preview') return;
    setImportState({ status: 'importing' });
    try {
      const result = await importPayload(importState.payload);
      setImportState({ status: 'success', result });
      // Reload from RxDB after import
      const db = await getDatabase();
      const tournamentDocs = await db.tournaments.find().exec();
      setTournaments(tournamentDocs.map(d => d.toMutableJSON()));
      const playerDocs = await db.players.find().exec();
      setPlayers(playerDocs.map(d => d.toJSON() as PlayerLibraryEntry));
      const groupDocs = await db.playerGroups.find().exec();
      setGroups(groupDocs.map(d => d.toJSON() as PlayerGroup));
    } catch (error) {
      setImportState({ status: 'error', msg: error instanceof Error ? error.message : String(error) });
    }
  }

  function handleImportCancel(): void {
    setImportState({ status: 'idle' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('data.title')}</h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
          {t('data.experimentalBadge')}
        </span>
      </div>

      {/* Experimental warning */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>{t('data.experimentalWarning')}</p>
      </div>

      {/* Export section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('data.exportTitle')}</h2>
        </div>
        <p className="text-sm text-[var(--color-muted)]">{t('data.exportDesc')}</p>

        {/* Tournaments */}
        <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-raised)] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-[var(--color-text)]">{t('data.tournamentsSection')}</h3>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={selectAllTournaments}
                className="text-[var(--color-primary-dark)] hover:text-[var(--color-primary)] transition-colors"
              >
                {t('data.selectAll')}
              </button>
              <span className="text-[var(--color-border-soft)]">·</span>
              <button
                type="button"
                onClick={deselectAllTournaments}
                className="text-[var(--color-primary-dark)] hover:text-[var(--color-primary)] transition-colors"
              >
                {t('data.deselectAll')}
              </button>
            </div>
          </div>
          {tournaments.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">—</p>
          ) : (
            <ul className="space-y-2">
              {tournaments.map((tournament) => (
                <li key={tournament.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`t-${tournament.id}`}
                    checked={selectedTournaments.has(tournament.id)}
                    onCheckedChange={() => { toggleTournament(tournament.id); }}
                  />
                  <label
                    htmlFor={`t-${tournament.id}`}
                    className="text-sm text-[var(--color-text)] cursor-pointer select-none"
                  >
                    {tournament.name}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Player library */}
        <div className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-raised)] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-[var(--color-text)]">{t('data.playerLibrarySection')}</h3>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={selectAllPlayerLibrary}
                className="text-[var(--color-primary-dark)] hover:text-[var(--color-primary)] transition-colors"
              >
                {t('data.selectAll')}
              </button>
              <span className="text-[var(--color-border-soft)]">·</span>
              <button
                type="button"
                onClick={deselectAllPlayerLibrary}
                className="text-[var(--color-primary-dark)] hover:text-[var(--color-primary)] transition-colors"
              >
                {t('data.deselectAll')}
              </button>
            </div>
          </div>

          {groups.length === 0 && players.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">—</p>
          ) : (
            <div className="space-y-4">
              {/* Groups with their players */}
              {groups.map((group) => {
                const groupPlayers = players.filter((p) => p.groupIds.includes(group.id));
                return (
                  <div key={group.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`g-${group.id}`}
                        checked={selectedGroups.has(group.id)}
                        onCheckedChange={(checked) => { if (checked !== 'indeterminate') toggleGroup(group.id, checked); }}
                      />
                      <label
                        htmlFor={`g-${group.id}`}
                        className="text-sm font-medium text-[var(--color-text)] cursor-pointer select-none"
                      >
                        {group.name}
                      </label>
                    </div>
                    {groupPlayers.length > 0 && (
                      <ul className="ml-6 space-y-1.5">
                        {groupPlayers.map((player) => (
                          <li key={player.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`p-${player.id}`}
                              checked={selectedPlayers.has(player.id)}
                              onCheckedChange={() => { togglePlayer(player.id); }}
                            />
                            <label
                              htmlFor={`p-${player.id}`}
                              className="text-sm text-[var(--color-text)] cursor-pointer select-none"
                            >
                              {player.name}
                              {player.elo !== undefined && (
                                <span className="ml-1 text-xs text-[var(--color-muted)]">ELO {player.elo}</span>
                              )}
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}

              {/* Ungrouped players */}
              {ungroupedPlayers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide">
                    {t('data.ungroupedPlayers')}
                  </p>
                  <ul className="space-y-1.5">
                    {ungroupedPlayers.map((player) => (
                      <li key={player.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`p-${player.id}`}
                          checked={selectedPlayers.has(player.id)}
                          onCheckedChange={() => { togglePlayer(player.id); }}
                        />
                        <label
                          htmlFor={`p-${player.id}`}
                          className="text-sm text-[var(--color-text)] cursor-pointer select-none"
                        >
                          {player.name}
                          {player.elo !== undefined && (
                            <span className="ml-1 text-xs text-[var(--color-muted)]">ELO {player.elo}</span>
                          )}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {nothingSelected && (
          <p className="text-sm text-[var(--color-muted)]">{t('data.nothingSelected')}</p>
        )}

        <Button
          onClick={() => { void handleExport(); }}
          disabled={nothingSelected}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {t('data.downloadJson')}
        </Button>
      </section>

      {/* Divider */}
      <hr className="border-[var(--color-border-soft)]" />

      {/* Import section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('data.importTitle')}</h2>
        </div>
        <p className="text-sm text-[var(--color-muted)]">{t('data.importDesc')}</p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          onChange={handleFileChange}
          aria-label={t('data.importSelectFile')}
        />

        {importState.status === 'idle' || importState.status === 'success' || importState.status === 'error' ? (
          <div className="space-y-3">
            <Button
              variant="primary-outlined"
              onClick={() => { fileInputRef.current?.click(); }}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {t('data.importSelectFile')}
            </Button>
            {importState.status === 'success' && (
              <div className="text-sm text-green-700 dark:text-green-400 space-y-1">
                <p>{t('data.importSuccess')}</p>
                {(importState.result.skippedTournaments > 0 || importState.result.skippedPlayers > 0 || importState.result.skippedGroups > 0) && (
                  <p className="text-amber-700 dark:text-amber-400">
                    {t('data.importSkipped', {
                      tournaments: String(importState.result.skippedTournaments),
                      players: String(importState.result.skippedPlayers),
                      groups: String(importState.result.skippedGroups),
                    })}
                  </p>
                )}
              </div>
            )}
            {importState.status === 'error' && (
              <p className="text-sm text-red-700 dark:text-red-400">
                {t('data.importError', { msg: importState.msg })}
              </p>
            )}
          </div>
        ) : null}

        {importState.status === 'invalid' && (
          <div className="space-y-3">
            <p className="text-sm text-red-700 dark:text-red-400">{t('data.importInvalidFile')}</p>
            <Button
              variant="primary-outlined"
              onClick={() => { fileInputRef.current?.click(); }}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {t('data.importSelectFile')}
            </Button>
          </div>
        )}

        {importState.status === 'version_mismatch' && (
          <div className="space-y-3">
            <p className="text-sm text-red-700 dark:text-red-400">
              {t('data.importVersionMismatch', {
                fileVersion: String(importState.fileVersion),
                appVersion: String(DATA_VERSION),
              })}
            </p>
            <Button
              variant="primary-outlined"
              onClick={() => { fileInputRef.current?.click(); }}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {t('data.importSelectFile')}
            </Button>
          </div>
        )}

        {importState.status === 'preview' && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-text)]">
              {t('data.importPreview', {
                tournaments: String(importState.payload.tournaments.length),
                players: String(importState.payload.players.length),
                groups: String(importState.payload.groups.length),
              })}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => { void handleImportConfirm(); }}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                {t('data.importConfirm')}
              </Button>
              <Button variant="primary-outlined" onClick={handleImportCancel}>
                {t('data.importCancel')}
              </Button>
            </div>
          </div>
        )}

        {importState.status === 'importing' && (
          <p className="text-sm text-[var(--color-muted)]">…</p>
        )}
      </section>

      {/* Divider */}
      <hr className="border-[var(--color-border-soft)]" />

      {/* Delete section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('data.deleteTitle')}</h2>
        </div>
        <p className="text-sm text-[var(--color-muted)]">{t('data.deleteDesc')}</p>
        <Button
          variant="secondary-outlined"
          onClick={openDeleteModal}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {t('data.deleteButton')}
        </Button>
      </section>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <CustomDialog
          open={true}
          onOpenChange={(open) => { if (!open) setShowDeleteModal(false); }}
          onPrimaryAction={() => { void handleDelete(); }}
          primaryActionDisabled={nothingToDelete}
        >
          <DialogContent className="z-150">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[var(--color-accent)] shrink-0" aria-hidden="true" />
                <DialogTitle>{t('data.deleteModalTitle')}</DialogTitle>
              </div>
              <DialogDescription>{t('data.deleteModalDesc')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="delete-tournaments"
                  checked={deleteSelections.tournaments}
                  onCheckedChange={(checked) => {
                    if (checked !== 'indeterminate') setDeleteSelections(prev => ({ ...prev, tournaments: checked }));
                  }}
                />
                <label htmlFor="delete-tournaments" className="text-sm text-[var(--color-text)] cursor-pointer select-none">
                  {t('data.deleteTournaments')}
                  {tournaments.length > 0 && (
                    <span className="ml-1 text-xs text-[var(--color-muted)]">({tournaments.length})</span>
                  )}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="delete-players"
                  checked={deleteSelections.players}
                  onCheckedChange={(checked) => {
                    if (checked !== 'indeterminate') setDeleteSelections(prev => ({ ...prev, players: checked }));
                  }}
                />
                <label htmlFor="delete-players" className="text-sm text-[var(--color-text)] cursor-pointer select-none">
                  {t('data.deletePlayers')}
                  {players.length > 0 && (
                    <span className="ml-1 text-xs text-[var(--color-muted)]">({players.length})</span>
                  )}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="delete-groups"
                  checked={deleteSelections.groups}
                  onCheckedChange={(checked) => {
                    if (checked !== 'indeterminate') setDeleteSelections(prev => ({ ...prev, groups: checked }));
                  }}
                />
                <label htmlFor="delete-groups" className="text-sm text-[var(--color-text)] cursor-pointer select-none">
                  {t('data.deleteGroups')}
                  {groups.length > 0 && (
                    <span className="ml-1 text-xs text-[var(--color-muted)]">({groups.length})</span>
                  )}
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="primary-ghost" onClick={() => { setShowDeleteModal(false); }}>
                {t('data.deleteCancel')}
              </Button>
              <Button variant="secondary" onClick={() => { void handleDelete(); }} disabled={nothingToDelete}>
                {t('data.deleteConfirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </CustomDialog>
      )}
    </div>
  );
};
