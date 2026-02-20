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
        className="text-sm px-0 h-auto"
      >
        {t('players.sortByElo')}
      </Button>
      <Button
        type="button"
        variant="link"
        onClick={onShuffle}
        className="text-sm px-0 h-auto"
      >
        {t('players.shuffle')}
      </Button>
    </div>
  );
};
