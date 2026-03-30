import type { ReactElement } from 'react';
import type { GroupAdvancerEntry, GroupStageCriteriaKey, CriteriaRow } from '../../types';
import { useTranslation } from '../../i18n/useTranslation';

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0%';
  return `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0.00';
  return value.toFixed(2);
}


function buildCriteriaRows(
  player: GroupAdvancerEntry,
  t: (key: string, params?: Record<string, string | number>) => string,
  showBalls: boolean
): CriteriaRow<GroupStageCriteriaKey>[] {
  const details = player.tiebreakDetails;
  const applied = Array.isArray(player.tiebreakApplied)
    ? player.tiebreakApplied.filter((key): key is GroupStageCriteriaKey =>
        key === 'winRate' ||
        key === 'setRatio' ||
        key === 'pointRatio' ||
        key === 'opponentAvgRank' ||
        key === 'relativeRank' ||
        key === 'fairPlay' ||
        key === 'lottery'
      )
    : [];
  const labelMap: Record<GroupStageCriteriaKey, string> = {
    winRate: t('groupStage.luckyCriteriaSetsWon'),
    setRatio: t('groupStage.luckyCriteriaSetDiff'),
    pointRatio: t('groupStage.luckyCriteriaPointsDiff'),
    opponentAvgRank: t('groupStage.luckyCriteriaOpponentRank'),
    relativeRank: t('groupStage.luckyCriteriaRelativeRank'),
    fairPlay: t('groupStage.luckyCriteriaFairPlay'),
    lottery: t('groupStage.luckyCriteriaLottery'),
  };
  const helpMap: Record<GroupStageCriteriaKey, string> = {
    winRate: t('groupStage.luckyCriteriaSetsWonHelp'),
    setRatio: t('groupStage.luckyCriteriaSetDiffHelp'),
    pointRatio: t('groupStage.luckyCriteriaPointsDiffHelp'),
    opponentAvgRank: t('groupStage.luckyCriteriaOpponentRankHelp'),
    relativeRank: t('groupStage.luckyCriteriaRelativeRankHelp'),
    fairPlay: t('groupStage.luckyCriteriaFairPlayHelp'),
    lottery: t('groupStage.luckyCriteriaLotteryHelp'),
  };

  return applied
    .filter((key) => showBalls || key !== 'pointRatio')
    .map((key) => {
      let value = '-';
      if (key === 'winRate') value = formatPercent(details.winRate);
      if (key === 'setRatio') value = formatPercent(details.setRatio);
      if (key === 'pointRatio') value = formatPercent(details.pointRatio);
      if (key === 'opponentAvgRank') value = formatNumber(details.opponentAvgRank);
      if (key === 'relativeRank') value = formatPercent(details.relativeRank);
      if (key === 'fairPlay') {
        value = details.fairPlay ? t('groupStage.luckyCriteriaYes') : t('groupStage.luckyCriteriaNo');
      }
      if (key === 'lottery') value = t('groupStage.luckyCriteriaApplied');
      return { key, label: labelMap[key], value, help: helpMap[key] };
    });
}

interface CriteriaTableProps {
  player: GroupAdvancerEntry;
  showBalls: boolean;
}

export const CriteriaTable = ({ player, showBalls }: CriteriaTableProps): ReactElement | null => {
  const { t } = useTranslation();
  const rows = buildCriteriaRows(player, t, showBalls);
  if (rows.length === 0) return null;
  return (
    <table className="w-full text-[0.7rem] text-[var(--color-muted)]">
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="border-t border-[var(--color-border-soft)]">
            <td className="py-1 pr-2 font-medium">
              <span
                className="underline decoration-dotted underline-offset-2 cursor-help"
                title={row.help}
              >
                {row.label}
              </span>
            </td>
            <td className="py-1 text-right">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};