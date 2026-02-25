import type { ReactElement } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { BracketRounds } from '../../components/common/BracketRounds';
import { MatchCard } from '../../components/bracket/MatchCard';
import { ScoreMode } from '../../types';
import { SINGLE_ELIM_PLAYERS, SINGLE_ELIM_BRACKET, SINGLE_ELIM_3RD_PLACE } from './exampleData';

export const SingleElimTab = (): ReactElement => {
  const { t } = useTranslation();
  const thirdPlaceRoundIndex = SINGLE_ELIM_BRACKET.rounds.length - 1;

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          {t('formats.howItWorks')}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t('formats.singleElim.description')}
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          {t('formats.seeding')}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t('formats.singleElim.seeding')}
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          {t('formats.tiebreaking')}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t('formats.singleElim.tiebreaking')}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          {t('formats.example')}
        </h2>
        <BracketRounds
          bracket={SINGLE_ELIM_BRACKET}
          players={SINGLE_ELIM_PLAYERS}
          canEditMatchFn={() => false}
          scoringMode={ScoreMode.POINTS}
        />
        <div className="space-y-4">
          <div className="text-sm font-semibold text-[var(--color-muted)]">
            {t('bracket.thirdPlace')}
          </div>
          <MatchCard
            match={SINGLE_ELIM_3RD_PLACE}
            players={SINGLE_ELIM_PLAYERS}
            canEdit={false}
            roundIndex={thirdPlaceRoundIndex}
            scoringMode={ScoreMode.POINTS}
          />
        </div>
      </section>
    </div>
  );
};
