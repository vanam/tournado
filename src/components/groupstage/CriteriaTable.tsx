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

function formatSignedNumber(value: number): string {
  const formatted = formatNumber(value);
  return value > 0 ? `+${formatted}` : formatted;
}

function buildCriteriaRows(
  player: GroupAdvancerEntry,
  t: (key: string, params?: Record<string, string | number>) => string,
  showBalls: boolean
): CriteriaRow<GroupStageCriteriaKey>[] {
  const details = player.tiebreakDetails;
  const applied = Array.isArray(player.tiebreakApplied)
    ? player.tiebreakApplied.filter((key): key is GroupStageCriteriaKey =>
        key === 'setsWonPerMatch' ||
        key === 'setDiffPerMatch' ||
        key === 'pointsDiffPerMatch' ||
        key === 'opponentAvgRank' ||
        key === 'relativeRank' ||
        key === 'fairPlay' ||
        key === 'lottery'
      )
    : [];
  const labelMap: Record<GroupStageCriteriaKey, string> = {
    setsWonPerMatch: t('groupStage.luckyCriteriaSetsWon'),
    setDiffPerMatch: t('groupStage.luckyCriteriaSetDiff'),
    pointsDiffPerMatch: t('groupStage.luckyCriteriaPointsDiff'),
    opponentAvgRank: t('groupStage.luckyCriteriaOpponentRank'),
    relativeRank: t('groupStage.luckyCriteriaRelativeRank'),
    fairPlay: t('groupStage.luckyCriteriaFairPlay'),
    lottery: t('groupStage.luckyCriteriaLottery'),
  };
  const helpMap: Record<GroupStageCriteriaKey, string> = {
    setsWonPerMatch: t('groupStage.luckyCriteriaSetsWonHelp'),
    setDiffPerMatch: t('groupStage.luckyCriteriaSetDiffHelp'),
    pointsDiffPerMatch: t('groupStage.luckyCriteriaPointsDiffHelp'),
    opponentAvgRank: t('groupStage.luckyCriteriaOpponentRankHelp'),
    relativeRank: t('groupStage.luckyCriteriaRelativeRankHelp'),
    fairPlay: t('groupStage.luckyCriteriaFairPlayHelp'),
    lottery: t('groupStage.luckyCriteriaLotteryHelp'),
  };

  return applied
    .filter((key) => showBalls || key !== 'pointsDiffPerMatch')
    .map((key) => {
      let value = '-';
      if (key === 'setsWonPerMatch') value = formatNumber(details.setsWonPerMatch);
      if (key === 'setDiffPerMatch') value = formatSignedNumber(details.setDiffPerMatch);
      if (key === 'pointsDiffPerMatch') value = formatSignedNumber(details.pointsDiffPerMatch);
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