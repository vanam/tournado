import type { ReactElement } from 'react';
import type { GroupsToBracketTournament } from '../types';
import { hasPlayoffMismatch } from '../utils/playoffLifecycle';
import { useHistoryChange } from '../hooks/useHistoryChange';
import { useTranslation } from '../i18n/useTranslation';
import { HistoryConfirmation } from './HistoryConfirmation';
import { Button } from './ui/Button';

export const PlayoffRecalculation = ({ tournament }: Readonly<{ tournament: GroupsToBracketTournament }>): ReactElement | null => {
  const { t } = useTranslation();
  const history = useHistoryChange(tournament, () => {});
  if (!hasPlayoffMismatch(tournament)) return null;
  return <>
    <div className="rounded-lg border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] p-3 my-4">
      <p className="text-sm">{t('history.mismatch')}</p>
      <Button variant="secondary-outlined" className="mt-2 whitespace-normal" disabled={history.isSaving} onClick={() => { history.request({ type: 'reseed' }); }}>
        {t('history.reseedAction')}
      </Button>
      {history.error && !history.review && <p role="alert" className="text-sm mt-2">{history.error}</p>}
    </div>
    {history.review && <HistoryConfirmation tournament={tournament} review={history.review} isSaving={history.isSaving}
      error={history.error} onConfirm={history.confirm} onCancel={history.cancel} />}
  </>;
};
