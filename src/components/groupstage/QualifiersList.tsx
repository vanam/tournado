import type { ReactElement } from 'react';
import type { GroupAdvancerEntry } from '../../types';
import { useTranslation } from '../../i18n/useTranslation';
import { PlayerEntryItem } from './PlayerEntryItem';

interface QualifiersListProps {
  qualifiers: GroupAdvancerEntry[];
  groupLabelById: Map<string, string>;
}

export const QualifiersList = ({
  qualifiers,
  groupLabelById,
}: QualifiersListProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">
        {t('groupStage.qualifiersTitle')}
      </div>
      <ul className="space-y-2">
        {qualifiers.map((player) => (
          <PlayerEntryItem
            key={player.id}
            player={player}
            groupLabel={groupLabelById.get(player.groupId) ?? player.groupId}
            tagType="qualifier"
          />
        ))}
      </ul>
    </div>
  );
};