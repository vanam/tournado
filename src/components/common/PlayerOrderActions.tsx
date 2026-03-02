import type { ReactElement } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { Button } from '@/components/ui/Button';

interface PlayerOrderActionsProps {
  useElo: boolean;
  canReorder: boolean;
  onSortByElo: () => void;
  onShuffle: () => void;
  onImport: () => void;
}

export const PlayerOrderActions = ({
  useElo,
  canReorder,
  onSortByElo,
  onShuffle,
  onImport,
}: PlayerOrderActionsProps): ReactElement => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="link"
        onClick={onSortByElo}
        disabled={!useElo || !canReorder}
        className="text-sm p-0 h-auto mb-1"
      >
        {t('players.sortByElo')}
      </Button>
      <Button
        type="button"
        variant="link"
        onClick={onShuffle}
        disabled={!canReorder}
        className="text-sm p-0 h-auto mb-1"
      >
        {t('players.shuffle')}
      </Button>
      <Button
        type="button"
        variant="link"
        onClick={onImport}
        className="text-sm p-0 h-auto mb-1"
      >
        {t('players.import')}
      </Button>
    </div>
  );
};
