import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import type { Tournament } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface TournamentCardProps {
  tournament: Tournament;
  onDelete: (id: string) => void;
}

export const TournamentCard = ({ tournament, onDelete }: TournamentCardProps): ReactElement => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const winner = tournament.winnerId
    ? tournament.players.find((p) => p.id === tournament.winnerId)
    : null;

  const handleCardActivate = (): void => {
    void navigate(`/tournament/${tournament.id}`);
  };

  return (
    <Card
      className="group cursor-pointer hover:shadow-lg hover:border-[var(--color-primary)] hover:-translate-y-0.5 transition-all duration-200"
      role="button"
      tabIndex={0}
      onClick={handleCardActivate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleCardActivate();
        }
      }}
    >
      <CardHeader className="p-5">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-[var(--color-primary-dark)] group-hover:text-[var(--color-primary)] transition-colors">
            {tournament.name}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(tournament.id);
            }}
            className="text-[var(--color-accent)] hover:text-[var(--color-primary-dark)] text-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 h-auto px-2 py-1"
          >
            {t('card.delete')}
          </Button>
        </div>
        <CardDescription className="text-sm text-[var(--color-muted)] mt-1">
          {t(`format.${tournament.format}`)} &middot;{' '}
          {t('tournament.players', { count: tournament.players.length })}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <p className="text-xs text-[var(--color-subtle)]">
          {t('card.created', { date: new Date(tournament.createdAt).toLocaleDateString() })}
        </p>
        {winner && (
          <p className="text-xs text-[var(--color-accent)] font-medium mt-2">
            {t('card.winner', {
              name: winner.name,
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
