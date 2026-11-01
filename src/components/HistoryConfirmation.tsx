import type { ReactElement } from 'react';
import { AlertTriangle } from 'lucide-react';
import { CustomDialog } from './CustomDialog';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/Dialog';
import { Button } from './ui/Button';
import { useTranslation } from '../i18n/useTranslation';
import type { Tournament } from '../types';
import type { HistoryReview } from '../hooks/useHistoryChange';
import type { LocatedMatch } from '../utils/matchChanges';
import { ensureParticipants, getParticipantPlayers } from '../utils/participantUtils';
import { formatSetResults } from '../utils/scoreUtils';

interface Props {
  tournament: Tournament;
  review: HistoryReview;
  isSaving: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const HistoryConfirmation = ({ tournament, review, isSaving, error, onConfirm, onCancel }: Readonly<Props>): ReactElement => {
  const { t } = useTranslation();
  const { impact, change, stale } = review;
  const players = getParticipantPlayers(tournament.players, ensureParticipants(tournament.players, tournament.participants));
  const name = (id: string | null): string => players.find((player) => player.id === id)?.name ?? t('history.pending');
  const count = impact.deletedResults.length;
  let reason = t('history.changeReason', { next: name(impact.nextWinnerId), previous: name(impact.previousWinnerId) });
  if (change.type === 'clear') reason = t('history.clearReason');
  if (change.type === 'reseed') reason = t('history.reseedReason');
  const title = change.type === 'score' ? 'history.confirmTitle' : 'history.clearTitle';
  const confirmLabel = t(count > 0 ? 'history.confirm' : 'history.confirmNoResults', { count });
  function rows(matches: LocatedMatch[], showScores: boolean): ReactElement {
    return <ul className="divide-y divide-[var(--color-border-soft)]">{matches.map((row) => (
      <li key={row.key} className="py-2">
        <div className="text-xs text-[var(--color-muted)]">
          {row.groupName && `${row.groupName} · `}
          {row.section && `${t(row.section.startsWith('main') ? 'groupStage.mainBracket' : 'groupStage.consolationBracket')} · `}
          {t(row.stage, { n: row.round })}
        </div>
        <div className="flex justify-between gap-3 text-sm"><span>{name(row.match.player1Id)} × {name(row.match.player2Id)}</span>
          {showScores && <span className="shrink-0 tabular-nums">{formatSetResults(row.match.scores)}</span>}</div>
      </li>
    ))}</ul>;
  }
  return <CustomDialog open={true} onOpenChange={(open) => { if (!open && !isSaving) onCancel(); }}>
    <DialogContent className="z-150 max-h-[85dvh] overflow-y-auto max-w-lg" onEscapeKeyDown={(event) => { if (isSaving) event.preventDefault(); }}>
      <DialogHeader>
        <DialogTitle className="flex items-start gap-2"><AlertTriangle className="h-5 w-5 shrink-0 text-[var(--color-accent)]" />
          {t(change.type === 'reseed' ? 'history.reseedTitle' : title)}</DialogTitle>
        <DialogDescription>{reason}</DialogDescription>
      </DialogHeader>
      {stale && <p role="alert" className="text-sm text-[var(--color-accent)]">{t('history.stale')}</p>}
      {count > 0 && <section><h3 className="font-medium text-sm">{t('history.deletedTitle', { count })}</h3>{rows(impact.deletedResults, true)}</section>}
      {impact.changedMatches.length > 0 && <section><h3 className="font-medium text-sm">{t('history.changedTitle', { count: impact.changedMatches.length })}</h3>{rows(impact.changedMatches, false)}</section>}
      {impact.removedRounds.length > 0 && <p className="text-sm">{t('history.roundsRemoved', { rounds: impact.removedRounds.join(', ') })}</p>}
      {impact.reopens && <p className="text-sm">{t('history.reopens')}</p>}
      <p className="text-xs text-[var(--color-muted)]">{t('history.irreversible')}</p>
      {error && <p role="alert" className="text-sm text-[var(--color-accent)]">{error}</p>}
      <DialogFooter className="flex-wrap">
        <Button variant="primary-ghost" disabled={isSaving} onClick={onCancel}>{t('history.back')}</Button>
        <Button variant="secondary" className="whitespace-normal" disabled={isSaving} onClick={onConfirm}>
          {isSaving ? t('history.saving') : confirmLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </CustomDialog>;
};
