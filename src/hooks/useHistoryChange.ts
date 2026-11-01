import { useState } from 'react';
import type { Match, Tournament } from '../types';
import { useTranslation } from '../i18n/useTranslation';
import { HistoryConfirmationRequiredError, saveMatchChange } from '../services/matchService';
import { MatchParticipantsChangedError, planMatchChange, requiresHistoryConfirmation } from '../utils/matchChanges';
import type { MatchChange, MatchChangeImpact, MatchTarget, PlayoffSection } from '../utils/matchChanges';

export interface HistoryReview { change: MatchChange; impact: MatchChangeImpact; stale: boolean }
interface HistoryEditor {
  match: Pick<Match, 'id' | 'player1Id' | 'player2Id'>;
  groupId?: string;
  section?: PlayoffSection;
}
type Confirmation = { kind: 'history'; review: HistoryReview }
  | { kind: 'clear'; change: MatchChange; impact: MatchChangeImpact };
interface HistoryPreview { impact: MatchChangeImpact; needsReview: boolean }
interface HistoryWorkflow {
  review: HistoryReview | null;
  clearConfirmation: boolean;
  isSaving: boolean;
  error: string | null;
  preview: (change: MatchChange) => HistoryPreview | null;
  request: (change: MatchChange) => void;
  confirm: () => void;
  cancel: () => void;
}

/** Owns the draft target, impact preview, confirmation routing and transactional revalidation. */
export function useHistoryChange(tournament: Tournament | undefined, onSaved: () => void, editor?: HistoryEditor): HistoryWorkflow {
  const [target] = useState<MatchTarget | undefined>(() => editor ? {
    matchId: editor.match.id,
    expectedPlayers: [editor.match.player1Id, editor.match.player2Id],
    ...(editor.groupId && { groupId: editor.groupId }),
    ...(editor.section && { section: editor.section }),
  } : undefined);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  function targetChange(change: MatchChange): MatchChange {
    return change.type !== 'reseed' && target?.matchId === change.matchId ? { ...change, ...target } : change;
  }

  function preview(change: MatchChange): HistoryPreview | null {
    if (!tournament) return null;
    try {
      const { impact } = planMatchChange(tournament, targetChange(change));
      return { impact, needsReview: requiresHistoryConfirmation(impact) };
    } catch { return null; }
  }

  function showError(error_: unknown): void {
    setError(t(error_ instanceof MatchParticipantsChangedError ? 'history.targetChanged' : 'api.errorSave'));
  }

  async function persist(change: MatchChange, token: string): Promise<void> {
    if (!tournament || isSaving) return;
    setSaving(true);
    setError(null);
    try {
      await saveMatchChange(tournament.id, change, token);
      setConfirmation(null);
      onSaved();
    } catch (error_) {
      if (error_ instanceof HistoryConfirmationRequiredError) {
        setConfirmation({ kind: 'history', review: { change, impact: error_.impact, stale: true } });
      } else showError(error_);
    } finally { setSaving(false); }
  }

  function request(change: MatchChange): void {
    if (!tournament || isSaving) return;
    setError(null);
    try {
      const prepared = targetChange(change);
      const { impact } = planMatchChange(tournament, prepared);
      if (requiresHistoryConfirmation(impact)) {
        setConfirmation({ kind: 'history', review: { change: prepared, impact, stale: false } });
      } else if (prepared.type === 'clear') {
        setConfirmation({ kind: 'clear', change: prepared, impact });
      } else void persist(prepared, impact.token);
    } catch (error_) { showError(error_); }
  }

  function confirm(): void {
    if (!confirmation || isSaving) return;
    const { change, impact } = confirmation.kind === 'history' ? confirmation.review : confirmation;
    // Ordinary clear dialogs do not display saving/error state. Return errors to the editor.
    if (confirmation.kind === 'clear') setConfirmation(null);
    void persist(change, impact.token);
  }

  function cancel(): void {
    if (!isSaving) { setConfirmation(null); setError(null); }
  }

  return { review: confirmation?.kind === 'history' ? confirmation.review : null,
    clearConfirmation: confirmation?.kind === 'clear', isSaving, error, preview, request, confirm, cancel };
}
