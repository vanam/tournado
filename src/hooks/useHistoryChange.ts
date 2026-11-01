import { useState } from 'react';
import type { Tournament } from '../types';
import { useTranslation } from '../i18n/useTranslation';
import { HistoryConfirmationRequiredError, saveMatchChange } from '../services/matchService';
import { MatchParticipantsChangedError, planMatchChange, requiresHistoryConfirmation } from '../utils/matchChanges';
import type { MatchChange, MatchChangeImpact } from '../utils/matchChanges';

export interface HistoryReview { change: MatchChange; impact: MatchChangeImpact; stale: boolean }

/** Owns confirmation and revalidation for score edits and explicit playoff reseeding. */
export function useHistoryChange(tournament: Tournament | undefined, onSaved: () => void): {
  review: HistoryReview | null; isSaving: boolean; error: string | null;
  request: (change: MatchChange) => void; confirm: () => void; cancel: () => void;
} {
  const [review, setReview] = useState<HistoryReview | null>(null);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  async function persist(change: MatchChange, token: string): Promise<void> {
    if (!tournament || isSaving) return;
    setSaving(true);
    setError(null);
    try {
      await saveMatchChange(tournament.id, change, token);
      setReview(null);
      onSaved();
    } catch (error_) {
      if (error_ instanceof HistoryConfirmationRequiredError) setReview({ change, impact: error_.impact, stale: true });
      else setError(t(error_ instanceof MatchParticipantsChangedError ? 'history.targetChanged' : 'api.errorSave'));
    } finally { setSaving(false); }
  }
  function request(change: MatchChange): void {
    if (!tournament || isSaving) return;
    setError(null);
    try {
      const { impact } = planMatchChange(tournament, change);
      if (requiresHistoryConfirmation(impact)) setReview({ change, impact, stale: false });
      else void persist(change, impact.token);
    } catch (error_) {
      setError(t(error_ instanceof MatchParticipantsChangedError ? 'history.targetChanged' : 'api.errorSave'));
    }
  }
  return { review, isSaving, error, request,
    confirm: (): void => { if (review) void persist(review.change, review.impact.token); },
    cancel: (): void => { if (!isSaving) { setReview(null); setError(null); } },
  };
}
