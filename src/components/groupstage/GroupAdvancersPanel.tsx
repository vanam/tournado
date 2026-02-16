import { useMemo, Fragment, useState, type ReactElement } from 'react';
import {type Group, type GroupAdvancerEntry, type StandingsRow, type GroupStageCriteriaKey, type CriteriaRow } from '../../types';
import { useTranslation } from '../../i18n/useTranslation';
import { indexToGroupLabel } from '../../utils/groupStageUtils';
import { ScoreMode } from '../../types';

type TranslationFn = (key: string, params?: Record<string, string | number>) => string;

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

function buildCriteriaRows(player: GroupAdvancerEntry, t: TranslationFn, showBalls: boolean): CriteriaRow<GroupStageCriteriaKey>[] {
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
  t: TranslationFn;
  showBalls: boolean;
}

const CriteriaTable = ({ player, t, showBalls }: CriteriaTableProps): ReactElement | null => {
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
}

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

  return (
    <div className="border border-[var(--color-border)] rounded-xl p-4 space-y-4">
      <div className="text-sm font-semibold text-[var(--color-muted)]">
        {t('groupStage.advancersTitle')}
      </div>
      {hasLucky && (
        <div className="text-xs text-[var(--color-muted)]">
          {t('groupStage.luckyLoserNote', { target: bracketTargetSize })}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <div className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">
            {t('groupStage.qualifiersTitle')}
          </div>
          <ul className="space-y-2">
            {qualifiers.map((player) => (
              <li key={player.id} className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-[var(--color-text)]">{player.name}</div>
                  <div className="text-xs text-[var(--color-muted)]">
                    {t('groupStage.advancerGroupRank', {
                      group: groupLabelById.get(player.groupId) ?? player.groupId,
                      rank: player.groupRank,
                    })}
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[var(--color-soft)] text-[var(--color-primary-dark]">
                  {t('groupStage.advancerQualifierTag')}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <div className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">
            {t('groupStage.luckyLosersTitle')}
          </div>
          {hasLucky ? (
            <ul className="space-y-2">
              {luckyLosers.map((player) => (
                <li key={player.id} className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-[var(--color-text)]">{player.name}</div>
                    <div className="text-xs text-[var(--color-muted)]">
                      {t('groupStage.advancerGroupRank', {
                        group: groupLabelById.get(player.groupId) ?? player.groupId,
                        rank: player.groupRank,
                      })}
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                    {t('groupStage.advancerLuckyTag')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-[var(--color-muted)]">{t('groupStage.luckyLosersNone')}</div>
          )}

          {hasLucky && hasLuckyCandidates && (
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
                    {luckyCandidates.map((player, index) => {
                      const stats: Partial<StandingsRow> = player.stats;
                      const rowClass = luckyIdSet.has(player.id) ? 'bg-[var(--color-accent-soft)]' : '';
                      const colSpan = showBalls ? 9 : 8;
                      const isExpanded = expandedCandidateId === player.id;
                      const toggleExpanded = (): void => {
                        setExpandedCandidateId((prev) => (prev === player.id ? null : player.id));
                      };

                      return (
                        <Fragment key={player.id}>
                          <tr
                            className={`border-b border-[var(--color-border-soft)] ${rowClass} cursor-pointer`}
                            onClick={toggleExpanded}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                toggleExpanded();
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            aria-expanded={isExpanded}
                          >
                            <td className="py-2 pr-2 text-[var(--color-faint)]">
                              <span
                                className="mr-1 inline-flex h-3 w-3 items-center justify-center text-[var(--color-muted)]"
                                aria-hidden="true"
                              >
                                <svg
                                  viewBox="0 0 20 20"
                                  className={`h-3 w-3 transition-transform ${
                                    isExpanded ? 'rotate-90' : 'rotate-0'
                                  }`}
                                  fill="currentColor"
                                >
                                  <path d="M7.5 5.5 12.5 10 7.5 14.5" />
                                </svg>
                              </span>
                              {index + 1}
                            </td>
                            <td className="py-2 pr-2 font-medium text-[var(--color-text)]">{player.name}</td>
                            <td className="py-2 pr-2 text-[var(--color-muted)]">
                              {t('groupStage.advancerGroupRank', {
                                group: groupLabelById.get(player.groupId) ?? player.groupId,
                                rank: player.groupRank,
                              })}
                            </td>
                            <td className="py-2 pr-2 text-center">{stats.played ?? 0}</td>
                            <td className="py-2 pr-2 text-center">{stats.wins ?? 0}</td>
                            <td className="py-2 pr-2 text-center">{stats.losses ?? 0}</td>
                            <td className="py-2 pr-2 text-center">
                              {(stats.setsWon ?? 0)}-{(stats.setsLost ?? 0)}
                            </td>
                            {showBalls && (
                              <td className="py-2 pr-2 text-center">
                                {(stats.pointsWon ?? 0)}-{(stats.pointsLost ?? 0)}
                              </td>
                            )}
                            <td className="py-2 text-center font-semibold">{stats.points ?? 0}</td>
                          </tr>
                          {isExpanded && (
                            <tr className={`border-b border-[var(--color-border-soft)] ${rowClass}`}>
                              <td className="px-2" colSpan={colSpan}>
                                <CriteriaTable player={player} t={t} showBalls={showBalls} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
