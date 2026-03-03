import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import type { GroupAdvancerEntry } from '../../types';
import { useTranslation } from '../../i18n/useTranslation';

interface PlayerEntryItemProps {
  player: GroupAdvancerEntry;
  groupLabel: string;
  tagType: 'qualifier' | 'lucky';
}

export const PlayerEntryItem = ({
  player,
  groupLabel,
  tagType,
}: PlayerEntryItemProps): ReactElement => {
  const { t } = useTranslation();

  const tagStyles = {
    qualifier: 'bg-[var(--color-soft)] text-[var(--color-primary-dark)]',
    lucky: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
  };

  const tagLabels = {
    qualifier: t('groupStage.advancerQualifierTag'),
    lucky: t('groupStage.advancerLuckyTag'),
  };

  return (
    <li className="flex items-start justify-between gap-3">
      <div>
        <div className="text-sm font-medium text-[var(--color-text)]">
          {player.libraryId === undefined
            ? player.name
            : <Link to={`/players/${player.libraryId}`} className="hover:text-[var(--color-primary)] hover:underline transition-colors">{player.name}</Link>}
        </div>
        <div className="text-xs text-[var(--color-muted)]">
          {t('groupStage.advancerGroupRank', {
            group: groupLabel,
            rank: player.groupRank,
          })}
        </div>
      </div>
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${tagStyles[tagType]}`}>
        {tagLabels[tagType]}
      </span>
    </li>
  );
};