import type { ReactElement } from 'react';
import { RRMatchCard } from './RrMatchCard';
import { useTranslation } from '../../i18n/useTranslation';
import { ScoreMode } from '../../types';
import type { Match, Player, Round, RoundRobinSchedule } from '../../types';

interface ScheduleRoundProps {
  round: Round;
  players: Player[];
  onEditMatch: (match: Match) => void;
  scoringMode?: ScoreMode | undefined;
  maxSets?: number | undefined;
  roundLabelKey: string;
  byeLabelKey: string;
}

const ScheduleRound = ({
  round,
  players,
  onEditMatch,
  scoringMode,
  maxSets,
  roundLabelKey,
  byeLabelKey,
}: ScheduleRoundProps): ReactElement => {
  const { t } = useTranslation();
  const byePlayer = round.byePlayerId
    ? players.find((p) => p.id === round.byePlayerId)
    : null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-2">
        {t(roundLabelKey, { n: round.roundNumber })}
        {byePlayer && (
          <span className="text-[var(--color-faint)] font-normal ml-2">
            {t(byeLabelKey, {
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
};

interface RoundScheduleProps {
  schedule: RoundRobinSchedule;
  players: Player[];
  onEditMatch: (match: Match) => void;
  scoringMode?: ScoreMode | undefined;
  maxSets?: number | undefined;
  roundLabelKey?: string;
  byeLabelKey?: string;
}

export const RoundSchedule = ({
  schedule,
  players,
  onEditMatch,
  scoringMode = ScoreMode.SETS,
  maxSets,
  roundLabelKey = 'roundRobin.round',
  byeLabelKey = 'roundRobin.bye',
}: RoundScheduleProps): ReactElement => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {schedule.rounds.map((round) => (
        <ScheduleRound
          key={round.roundNumber}
          round={round}
          players={players}
          onEditMatch={onEditMatch}
          scoringMode={scoringMode}
          maxSets={maxSets}
          roundLabelKey={roundLabelKey}
          byeLabelKey={byeLabelKey}
        />
      ))}
    </div>
  );
};
