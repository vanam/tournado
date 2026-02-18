import { useMemo, useState, type ReactElement } from 'react';
import type { Group, GroupAdvancerEntry } from '../../types';
import { useTranslation } from '../../i18n/useTranslation';
import { indexToGroupLabel } from '../../utils/groupStageUtils';
import { ScoreMode } from '../../types';
import { QualifiersList } from './QualifiersList';
import { LuckyLosersList } from './LuckyLosersList';
import { LuckyCandidatesTable } from './LuckyCandidatesTable';

interface GroupAdvancersPanelProps {
  qualifiers: GroupAdvancerEntry[];
  luckyLosers: GroupAdvancerEntry[];
  luckyCandidates?: GroupAdvancerEntry[];
  groups: Group[];
  bracketTargetSize: number;
  scoringMode?: ScoreMode;
}

export const GroupAdvancersPanel = ({
  qualifiers,
  luckyLosers,
  luckyCandidates = [],
  groups,
  bracketTargetSize,
  scoringMode = ScoreMode.SETS,
}: GroupAdvancersPanelProps): ReactElement | null => {
  const { t } = useTranslation();
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);

  const groupLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const [index, group] of groups.entries()) {
      map.set(group.id, t('groupStage.groupTitle', { label: indexToGroupLabel(index) }));
    }
    return map;
  }, [groups, t]);

  const luckyIdSet = useMemo(() => new Set(luckyLosers.map((player) => player.id)), [luckyLosers]);
  const showBalls = scoringMode === ScoreMode.POINTS;

  const hasLucky = luckyLosers.length > 0;
  const hasLuckyCandidates = luckyCandidates.length > 0;
  if (qualifiers.length === 0 && !hasLucky) return null;

  const handleToggleExpand = (id: string): void => {
    setExpandedCandidateId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="border border-[var(--color-border)] rounded-xl p-4 space-y-4 bg-[var(--color-card)]">
      <div className="text-sm font-semibold text-[var(--color-muted)]">
        {t('groupStage.advancersTitle')}
      </div>
      {hasLucky && (
        <div className="text-xs text-[var(--color-muted)]">
          {t('groupStage.luckyLoserNote', { target: bracketTargetSize })}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <QualifiersList
          qualifiers={qualifiers}
          groupLabelById={groupLabelById}
        />
        <div className="space-y-4">
          <LuckyLosersList
            luckyLosers={luckyLosers}
            hasLucky={hasLucky}
            groupLabelById={groupLabelById}
          />
          {hasLucky && hasLuckyCandidates && (
            <LuckyCandidatesTable
              candidates={luckyCandidates}
              luckyIdSet={luckyIdSet}
              groupLabelById={groupLabelById}
              showBalls={showBalls}
              expandedId={expandedCandidateId}
              onToggleExpand={handleToggleExpand}
            />
          )}
        </div>
      </div>
    </div>
  );
};