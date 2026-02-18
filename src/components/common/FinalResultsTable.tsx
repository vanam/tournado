import type { ReactElement } from 'react';
import { Trophy, Medal } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import type { RankedResult } from '../../types';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';

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
    <Table>
      <TableHeader>
        <TableRow className="border-b-2 border-[var(--color-border)]">
          <TableHead className="py-2.5 pr-3 text-xs uppercase tracking-wider font-semibold text-[var(--color-muted)]">
            {t('results.rank')}
          </TableHead>
          <TableHead className="py-2.5 pr-3 text-xs uppercase tracking-wider font-semibold text-[var(--color-muted)]">
            {t('results.player')}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((row) => (
          <TableRow
            key={row.playerId}
            className={podiumClass(row.rankStart)}
          >
            <TableCell className="py-2.5 pr-3 text-[var(--color-faint)] tabular-nums">
              {row.rankStart === 1 && (
                <Trophy className="h-4 w-4 inline-block mr-1 text-yellow-500" />
              )}
              {row.rankStart === 2 && (
                <Medal className="h-4 w-4 inline-block mr-1 text-gray-400" />
              )}
              {row.rankStart === 3 && (
                <Medal className="h-4 w-4 inline-block mr-1 text-amber-600" />
              )}
              {rankLabel(row.rankStart, row.rankEnd)}
            </TableCell>
            <TableCell className="py-2.5 pr-3 font-medium">{row.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
