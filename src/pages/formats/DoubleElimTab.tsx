import type { ReactElement } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { BracketRounds } from '../../components/common/BracketRounds';
import { MatchCard } from '../../components/bracket/MatchCard';
import { ScoreMode } from '../../types';
import {
  DOUBLE_ELIM_PLAYERS,
  DOUBLE_ELIM_WINNERS_BRACKET,
  DOUBLE_ELIM_LOSERS_BRACKET,
  DOUBLE_ELIM_GRAND_FINAL,
  DOUBLE_ELIM_GRAND_FINAL_REMATCH,
  DOUBLE_ELIM_3RD_PLACE,
} from './exampleData';

export const DoubleElimTab = (): ReactElement => {
  const { t } = useTranslation();
  const finalsRoundIndex = DOUBLE_ELIM_WINNERS_BRACKET.rounds.length;

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          {t('formats.howItWorks')}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t('formats.doubleElim.description')}
        </p>
        <p className="text-sm text-[var(--color-muted)]">
          {t('formats.doubleElim.grandFinal')}
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          {t('formats.seeding')}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t('formats.doubleElim.seeding')}
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          {t('formats.example')}
        </h2>

        <div className="space-y-4">
          <div className="text-sm font-semibold text-[var(--color-muted)]">
            {t('doubleElim.winnersBracket')}
          </div>
          <BracketRounds
            bracket={DOUBLE_ELIM_WINNERS_BRACKET}
            players={DOUBLE_ELIM_PLAYERS}
            canEditMatchFn={() => false}
            scoringMode={ScoreMode.POINTS}
          />
        </div>

        <div className="space-y-4">
          <div className="text-sm font-semibold text-[var(--color-muted)]">
            {t('doubleElim.losersBracket')}
          </div>
          <BracketRounds
            bracket={DOUBLE_ELIM_LOSERS_BRACKET}
            players={DOUBLE_ELIM_PLAYERS}
            canEditMatchFn={() => false}
            scoringMode={ScoreMode.POINTS}
          />
        </div>

        <div className="space-y-4">
          <div className="text-sm font-semibold text-[var(--color-muted)]">
            {t('doubleElim.grandFinal')}
          </div>
          <MatchCard
            match={DOUBLE_ELIM_GRAND_FINAL}
            players={DOUBLE_ELIM_PLAYERS}
            canEdit={false}
            roundIndex={finalsRoundIndex}
            scoringMode={ScoreMode.POINTS}
          />
        </div>

        <div className="space-y-4">
          <div className="text-sm font-semibold text-[var(--color-muted)]">
            {t('doubleElim.resetFinal')}
          </div>
          <MatchCard
            match={DOUBLE_ELIM_GRAND_FINAL_REMATCH}
            players={DOUBLE_ELIM_PLAYERS}
            canEdit={false}
            roundIndex={finalsRoundIndex}
            scoringMode={ScoreMode.POINTS}
          />
        </div>

        <div className="space-y-4">
          <div className="text-sm font-semibold text-[var(--color-muted)]">
            {t('bracket.thirdPlace')}
          </div>
          <MatchCard
            match={DOUBLE_ELIM_3RD_PLACE}
            players={DOUBLE_ELIM_PLAYERS}
            canEdit={false}
            roundIndex={finalsRoundIndex}
            scoringMode={ScoreMode.POINTS}
          />
        </div>
      </section>
    </div>
  );
};
