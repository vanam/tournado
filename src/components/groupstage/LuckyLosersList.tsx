import type { ReactElement } from 'react';
import type { GroupAdvancerEntry } from '../../types';
import { useTranslation } from '../../i18n/useTranslation';
import { PlayerEntryItem } from './PlayerEntryItem';

interface LuckyLosersListProps {
  luckyLosers: GroupAdvancerEntry[];
  hasLucky: boolean;
  groupLabelById: Map<string, string>;
}

export const LuckyLosersList = ({
  luckyLosers,
  hasLucky,
  groupLabelById,
}: LuckyLosersListProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">
        {t('groupStage.luckyLosersTitle')}
      </div>
      {hasLucky ? (
        <ul className="space-y-2">
          {luckyLosers.map((player) => (
            <PlayerEntryItem
              key={player.id}
              player={player}
              groupLabel={groupLabelById.get(player.groupId) ?? player.groupId}
              tagType="lucky"
            />
          ))}
        </ul>
      ) : (
        <div className="text-xs text-[var(--color-muted)]">{t('groupStage.luckyLosersNone')}</div>
      )}
    </div>
  );
};