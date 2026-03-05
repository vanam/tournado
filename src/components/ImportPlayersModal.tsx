import { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { CustomDialog } from './CustomDialog';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { parseBulkInput } from '../utils/importUtils';
import { loadLibrary } from '../services/playerLibraryService';
import type { PlayerLibrary } from '../types';
import { showToast } from '../utils/toastUtils';

interface ImportPlayersModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (players: Array<{ name: string; elo?: number; libraryId?: string }>) => void;
  existingNames: string[];
}

interface ParseError {
  line: number;
  msg: string;
}

export const ImportPlayersModal = ({
  open,
  onClose,
  onImport,
  existingNames,
}: ImportPlayersModalProps): ReactElement => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [activeTab, setActiveTab] = useState<'text' | 'groups'>('text');
  const [library, setLibrary] = useState<PlayerLibrary>({ groups: [], players: [] });
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      void loadLibrary()
        .then((lib) => {
          setLibrary(lib);
          if (lib.groups.length > 0 && lib.groups[0] !== undefined) {
            setSelectedGroupId(lib.groups[0].id);
          }
        })
        .catch(() => { showToast({ message: t('api.errorLoad') }); });
    }
  }, [open, t]);

  function handleImport(): void {
    const { parsed, errors: parseErrors } = parseBulkInput(text, existingNames);
    const newErrors: ParseError[] = parseErrors.map((e) => ({ line: e.line, msg: t(e.msgKey) }));

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    if (parsed.length === 0) {
      setErrors([{ line: 0, msg: t('players.importErrorNone') }]);
      return;
    }

    setErrors([]);
    setText('');
    onImport(parsed);
    onClose();
  }

  function handleGroupImport(): void {
    if (selectedPlayerIds.size === 0) {
      setErrors([{ line: 0, msg: t('players.importNoneSelected') }]);
      return;
    }
    const playersToImport: Array<{ name: string; elo?: number; libraryId?: string }> = [];
    for (const pid of selectedPlayerIds) {
      const player = library.players.find((p) => p.id === pid);
      if (player === undefined) continue;
      if (existingNames.includes(player.name)) continue;
      playersToImport.push({
        name: player.name,
        ...(player.elo !== undefined && { elo: player.elo }),
        libraryId: player.id,
      });
    }
    if (playersToImport.length === 0) {
      setErrors([{ line: 0, msg: t('players.importErrorNone') }]);
      return;
    }
    setErrors([]);
    setSelectedPlayerIds(new Set());
    onImport(playersToImport);
    onClose();
  }

  function handlePrimaryAction(): void {
    if (activeTab === 'text') {
      handleImport();
    } else {
      handleGroupImport();
    }
  }

  function handleClose(): void {
    setText('');
    setErrors([]);
    setSelectedPlayerIds(new Set());
    onClose();
  }

  const groupPlayers = library.players.filter((p) => p.groupIds.includes(selectedGroupId));

  function handleTogglePlayer(playerId: string): void {
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
    setErrors([]);
  }

  const availableGroupPlayers = groupPlayers.filter((p) => !existingNames.includes(p.name));
  const allAvailableSelected =
    availableGroupPlayers.length > 0 &&
    availableGroupPlayers.every((p) => selectedPlayerIds.has(p.id));

  function handleSelectAll(): void {
    if (allAvailableSelected) {
      setSelectedPlayerIds((prev) => {
        const next = new Set(prev);
        for (const p of availableGroupPlayers) {
          next.delete(p.id);
        }
        return next;
      });
    } else {
      setSelectedPlayerIds((prev) => {
        const next = new Set(prev);
        for (const p of availableGroupPlayers) {
          next.add(p.id);
        }
        return next;
      });
    }
    setErrors([]);
  }

  return (
    <CustomDialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }} onPrimaryAction={handlePrimaryAction}>
      <DialogContent className="z-150 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('players.importTitle')}</DialogTitle>
        </DialogHeader>
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as 'text' | 'groups');
            setErrors([]);
          }}
        >
          <TabsList className="w-full border-b border-[var(--color-border-soft)] bg-transparent rounded-none mb-0 h-auto p-0">
            <TabsTrigger value="text">{t('players.importTabText')}</TabsTrigger>
            <TabsTrigger value="groups">{t('players.importTabGroups')}</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-3">
            <DialogDescription className="whitespace-pre-line mb-3">{t('players.importDesc')}</DialogDescription>
            <textarea
              className="w-full min-h-[160px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
              placeholder={t('players.importPlaceholder')}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setErrors([]);
              }}
            />
          </TabsContent>

          <TabsContent value="groups" className="mt-3">
            {library.groups.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)] py-4">
                {t('players.importNoGroups')}
              </p>
            ) : (
              <div className="space-y-3">
                <select
                  value={selectedGroupId}
                  onChange={(e) => {
                    setSelectedGroupId(e.target.value);
                    setSelectedPlayerIds(new Set());
                    setErrors([]);
                  }}
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  aria-label={t('players.importSelectGroup')}
                >
                  {library.groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>

                {groupPlayers.length === 0 ? (
                  <p className="text-sm text-[var(--color-muted)]">
                    {t('players.importNoGroupPlayers')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availableGroupPlayers.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-xs text-[var(--color-primary-dark)] hover:text-[var(--color-primary)] transition-colors"
                      >
                        {allAvailableSelected ? t('players.importDeselectAll') : t('players.importSelectAll')}
                      </button>
                    )}
                    <div className="max-h-48 overflow-y-auto space-y-1 border border-[var(--color-border-soft)] rounded-md p-2">
                      {groupPlayers.map((player) => {
                        const alreadyAdded = existingNames.includes(player.name);
                        return (
                          <label
                            key={player.id}
                            className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-sm transition-colors ${
                              alreadyAdded
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-[var(--color-soft)]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPlayerIds.has(player.id)}
                              disabled={alreadyAdded}
                              onChange={() => { if (!alreadyAdded) handleTogglePlayer(player.id); }}
                              className="accent-[var(--color-primary)] h-3.5 w-3.5"
                            />
                            <span className="flex-1 text-[var(--color-text)]">{player.name}</span>
                            {player.elo !== undefined && (
                              <span className="text-xs text-[var(--color-muted)]">
                                {t('players.elo', { elo: String(player.elo) })}
                              </span>
                            )}
                            {alreadyAdded && (
                              <span className="text-xs text-[var(--color-muted)] italic">
                                {t('players.importAlreadyAdded')}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {errors.length > 0 && (
          <ul className="mt-2 space-y-1">
            {errors.map((err) => (
              <li key={`${err.line}-${err.msg}`} className="text-sm text-[var(--color-accent)]">
                {err.line > 0
                  ? t('players.importError', { n: String(err.line), msg: err.msg })
                  : err.msg}
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button variant="primary-ghost" onClick={handleClose}>
            {t('players.importCancel')}
          </Button>
          <Button variant="secondary" onClick={handlePrimaryAction}>
            {t('players.importConfirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </CustomDialog>
  );
};
