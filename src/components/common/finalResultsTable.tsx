import type { ReactElement } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { RankedResult } from '../../types';

function rankLabel(rankStart?: number | null, rankEnd?: number | null): string {
  if (rankStart == null) return '?';
  if (rankStart === rankEnd || rankEnd == null) return `${rankStart}.`;
  return `${rankStart}.-${rankEnd}.`;
}

function podiumClass(rankStart?: number | null): string {
  if (rankStart === 1) return 'bg-[var(--color-podium-gold)] font-semibold';
  if (rankStart === 2) return 'bg-[var(--color-podium-silver)]';
  if (rankStart === 3) return 'bg-[var(--color-podium-bronze)]';
  return '';
}

interface FinalResultsTableProps {
  results?: RankedResult[] | null;
}

export const FinalResultsTable = ({ results }: FinalResultsTableProps): ReactElement | null => {
  const { t } = useTranslation();

  if (!results || results.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-[var(--color-border)] text-left text-[var(--color-muted)]">
            <th className="py-2.5 pr-3 text-xs uppercase tracking-wider font-semibold">{t('results.rank')}</th>
            <th className="py-2.5 pr-3 text-xs uppercase tracking-wider font-semibold">{t('results.player')}</th>
          </tr>
        </thead>
        <tbody>
          {results.map((row) => (
            <tr
              key={row.playerId}
              className={`border-b border-[var(--color-border-soft)] hover:bg-[var(--color-soft)] ${podiumClass(row.rankStart)}`}
            >
              <td className="py-2.5 pr-3 text-[var(--color-faint)] tabular-nums">
                {rankLabel(row.rankStart, row.rankEnd)}
              </td>
              <td className="py-2.5 pr-3 font-medium">{row.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
