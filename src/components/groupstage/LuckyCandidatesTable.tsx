import type { ReactElement } from 'react';
import type { GroupAdvancerEntry } from '../../types';
import { useTranslation } from '../../i18n/useTranslation';
import { LuckyCandidateRow } from './LuckyCandidateRow';

interface LuckyCandidatesTableProps {
  candidates: GroupAdvancerEntry[];
  luckyIdSet: Set<string>;
  groupLabelById: Map<string, string>;
  showBalls: boolean;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
}

export const LuckyCandidatesTable = ({
  candidates,
  luckyIdSet,
  groupLabelById,
  showBalls,
  expandedId,
  onToggleExpand,
}: LuckyCandidatesTableProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">
        {t('groupStage.luckyCandidatesTitle')}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--color-border-soft)] text-left text-[var(--color-muted)]">
              <th className="py-2 pr-2">{t('standings.rank')}</th>
              <th className="py-2 pr-2">{t('standings.player')}</th>
              <th className="py-2 pr-2">{t('standings.group')}</th>
              <th className="py-2 pr-2 text-center">{t('standings.played')}</th>
              <th className="py-2 pr-2 text-center">{t('standings.wins')}</th>
              <th className="py-2 pr-2 text-center">{t('standings.losses')}</th>
              <th className="py-2 pr-2 text-center">{t('standings.sets')}</th>
              {showBalls && (
                <th className="py-2 pr-2 text-center">{t('standings.balls')}</th>
              )}
              <th className="py-2 text-center">{t('standings.points')}</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((player, index) => (
              <LuckyCandidateRow
                key={player.id}
                player={player}
                index={index}
                groupLabel={groupLabelById.get(player.groupId) ?? player.groupId}
                isLucky={luckyIdSet.has(player.id)}
                showBalls={showBalls}
                isExpanded={expandedId === player.id}
                onToggle={() => { onToggleExpand(player.id); }}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};