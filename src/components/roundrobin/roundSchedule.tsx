import type { ReactElement } from 'react';
import { RRMatchCard } from './rrMatchCard';
import { useTranslation } from '../../i18n/useTranslation';
import { SCORE_MODES } from '../../constants';
import type { Match, Player, RoundRobinSchedule, ScoreMode } from '../../types';

interface RoundScheduleProps {
  schedule: RoundRobinSchedule;
  players: Player[];
  onEditMatch: (match: Match) => void;
  scoringMode?: ScoreMode | undefined;
  maxSets?: number | undefined;
}

export const RoundSchedule = ({
  schedule,
  players,
  onEditMatch,
  scoringMode = SCORE_MODES.SETS,
  maxSets,
}: RoundScheduleProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {schedule.rounds.map((round) => {
        const byePlayer = round.byePlayerId
          ? players.find((p) => p.id === round.byePlayerId)
          : null;

        return (
          <div key={round.roundNumber}>
            <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-2">
              {t('roundRobin.round', { n: round.roundNumber })}
              {byePlayer && (
                <span className="text-[var(--color-faint)] font-normal ml-2">
                  {t('roundRobin.bye', {
                    name:
                      byePlayer.elo == null
                        ? byePlayer.name
                        : `${byePlayer.name} (${t('players.elo', { elo: byePlayer.elo })})`,
                  })}
                </span>
              )}
            </h3>
            <div className="space-y-2">
              {round.matches.map((match) => (
                <RRMatchCard
                  key={match.id}
                  match={match}
                  players={players}
                  onEdit={onEditMatch}
                  scoringMode={scoringMode}
                  maxSets={maxSets}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
