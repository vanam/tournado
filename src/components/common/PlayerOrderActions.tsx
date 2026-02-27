import type { ReactElement } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { Button } from '@/components/ui/Button';

interface PlayerOrderActionsProps {
  useElo: boolean;
  onSortByElo: () => void;
  onShuffle: () => void;
}

export const PlayerOrderActions = ({
  useElo,
  onSortByElo,
  onShuffle,
}: PlayerOrderActionsProps): ReactElement => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="link"
        onClick={onSortByElo}
        disabled={!useElo}
        className="text-sm p-0 h-auto mb-1"
      >
        {t('players.sortByElo')}
      </Button>
      <Button
        type="button"
        variant="link"
        onClick={onShuffle}
        className="text-sm p-0 h-auto mb-1"
      >
        {t('players.shuffle')}
      </Button>
    </div>
  );
};
