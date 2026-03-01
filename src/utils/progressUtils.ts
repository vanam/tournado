import { Format, BracketType } from '../types';
import type { Tournament, Group, GroupStage } from '../types';
import type { Match } from '../types/core';
import { nextPowerOf2 } from './bracketUtils';

function singleElimMatchCount(bracketSize: number): number {
  return bracketSize >= 4 ? bracketSize : bracketSize - 1;
}

function doubleElimMatchCount(bracketSize: number): number {
  return 2 * bracketSize - 1;
}

function estimatePlayoffMatchCount(groupStage: GroupStage): number {
  const { settings, groups } = groupStage;
  const totalPlayers = groups.reduce((sum, g) => sum + g.playerIds.length, 0);
  const mainCount = settings.qualifiers.reduce((sum, q) => sum + q, 0);
  const bracketSize = nextPowerOf2(Math.max(2, mainCount));
  const bracketType = settings.bracketType ?? BracketType.SINGLE_ELIM;

  const countForSize = (size: number): number =>
    bracketType === BracketType.SINGLE_ELIM ? singleElimMatchCount(size) : doubleElimMatchCount(size);

  const mainMatchCount = bracketSize >= 2 ? countForSize(bracketSize) : 0;

  const consolationCount = settings.consolation ? totalPlayers - bracketSize : 0;
  const consolationBracketSize = consolationCount >= 2 ? nextPowerOf2(consolationCount) : 0;
  const consolationMatchCount = consolationBracketSize >= 2 ? countForSize(consolationBracketSize) : 0;

  const total = mainMatchCount + consolationMatchCount;

  return total;
}

export function computeTournamentProgress(tournament: Tournament): { completed: number; total: number } {
  switch (tournament.format) {
    case Format.SINGLE_ELIM: {
      const allMatches: Match[] = tournament.bracket.rounds.flat().filter(m => !m.dummy);
      if (tournament.bracket.thirdPlaceMatch === null || tournament.bracket.thirdPlaceMatch === undefined) {
        // no third place match
      } else {
        allMatches.push(tournament.bracket.thirdPlaceMatch);
      }
      return {
        total: allMatches.length,
        completed: allMatches.filter(m => m.winnerId !== null).length,
      };
    }
    case Format.DOUBLE_ELIM: {
      const { winners, losers, finals } = tournament.doubleElim;
      const allMatches = [
        ...winners.rounds.flat(),
        ...losers.rounds.flat(),
        finals.grandFinal,
        finals.resetFinal,
      ].filter(m => !m.dummy);
      return {
        total: allMatches.length,
        completed: allMatches.filter(m => m.winnerId !== null).length,
      };
    }
    case Format.ROUND_ROBIN: {
      const allMatches = tournament.schedule.rounds.flatMap(r => r.matches).filter(m => !m.dummy);
      return {
        total: allMatches.length,
        completed: allMatches.filter(m => m.winnerId !== null).length,
      };
    }
    case Format.SWISS: {
      const total = tournament.totalRounds * Math.floor(tournament.players.length / 2);
      const completed = tournament.schedule.rounds
        .flatMap(r => r.matches)
        .filter(m => !m.dummy && m.winnerId !== null).length;
      return { total, completed };
    }
    case Format.GROUPS_TO_BRACKET: {
      const groupMatches = tournament.groupStage.groups
        .flatMap(g => g.schedule.rounds.flatMap(r => r.matches))
        .filter(m => !m.dummy);

      const playoffs = tournament.groupStagePlayoffs ?? tournament.groupStageBrackets;
      const playoffMatches: Match[] = [];

      if (playoffs != null) {
        if (playoffs.mainBracket != null) {
          playoffMatches.push(...playoffs.mainBracket.rounds.flat());
          if (playoffs.mainBracket.thirdPlaceMatch != null) {
            playoffMatches.push(playoffs.mainBracket.thirdPlaceMatch);
          }
        }
        if (playoffs.mainDoubleElim != null) {
          playoffMatches.push(
            ...playoffs.mainDoubleElim.winners.rounds.flat(),
            ...playoffs.mainDoubleElim.losers.rounds.flat(),
            playoffs.mainDoubleElim.finals.grandFinal,
            playoffs.mainDoubleElim.finals.resetFinal,
          );
        }
        if (playoffs.consolationBracket != null) {
          playoffMatches.push(...playoffs.consolationBracket.rounds.flat());
          if (playoffs.consolationBracket.thirdPlaceMatch != null) {
            playoffMatches.push(playoffs.consolationBracket.thirdPlaceMatch);
          }
        }
        if (playoffs.consolationDoubleElim != null) {
          playoffMatches.push(
            ...playoffs.consolationDoubleElim.winners.rounds.flat(),
            ...playoffs.consolationDoubleElim.losers.rounds.flat(),
            playoffs.consolationDoubleElim.finals.grandFinal,
            playoffs.consolationDoubleElim.finals.resetFinal,
          );
        }

        const nonDummyPlayoff = playoffMatches.filter(m => !m.dummy);
        const allMatches = [...groupMatches, ...nonDummyPlayoff];
        return {
          total: allMatches.length,
          completed: allMatches.filter(m => m.winnerId !== null).length,
        };
      }

      // Playoffs not yet generated — estimate expected total so bar doesn't jump
      const estimatedPlayoff = estimatePlayoffMatchCount(tournament.groupStage);
      return {
        total: groupMatches.length + estimatedPlayoff,
        completed: groupMatches.filter(m => m.winnerId !== null).length,
      };
    }
  }
}

export function computeGroupProgress(group: Group): { completed: number; total: number } {
  const matches = group.schedule.rounds.flatMap(r => r.matches).filter(m => !m.dummy);
  return {
    completed: matches.filter(m => m.winnerId !== null).length,
    total: matches.length,
  };
}
