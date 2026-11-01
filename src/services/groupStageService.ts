import { normalizeTournament } from '../utils/tournamentCompatibility';
import { getDatabase } from '../db';
import { ensurePlayoffs, changePlayoffSettings } from '../utils/playoffLifecycle';
import type { PlayoffSettings } from '../utils/playoffLifecycle';
export { PlayoffSettingsLockedError } from '../utils/playoffLifecycle';
import {
  getGroupAdvancers,
} from '../utils/groupStageUtils';
import {
  ensureParticipants,
  getParticipantPlayers,
} from '../utils/participantUtils';
import { Format } from '../types';
import type {
  Tournament,
  GroupAdvancersResult,
} from '../types';

export async function getAdvancers(
  tournamentId: string,
): Promise<GroupAdvancersResult> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(tournamentId).exec();
  if (!doc) throw new Error(`Tournament ${tournamentId} not found`);

  const tournament = doc.toMutableJSON();
  if (tournament.format !== Format.GROUPS_TO_BRACKET) {
    throw new Error('Tournament is not a Groups to Bracket format');
  }

  const storedParticipants = ensureParticipants(
    tournament.players,
    tournament.participants,
  );
  const participantPlayers = getParticipantPlayers(
    tournament.players,
    storedParticipants,
  );
  const advancers = getGroupAdvancers(
    tournament.groupStage,
    participantPlayers,
    {
      scoringMode: tournament.scoringMode,
      maxSets: tournament.groupStageMaxSets ?? tournament.maxSets,
    },
  );

  return advancers;
}

export async function generatePlayoffs(
  tournamentId: string,
): Promise<Tournament> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(tournamentId).exec();
  if (!doc) throw new Error(`Tournament ${tournamentId} not found`);

  const saved = await doc.incrementalModify((current) => {
    const tournament = normalizeTournament(current);
    if (tournament.format !== Format.GROUPS_TO_BRACKET) {
      throw new Error('Tournament is not a Groups to Bracket format');
    }

    ensurePlayoffs(tournament);

    return tournament;
  });
  return saved.toMutableJSON();
}

export async function updateGroupStageSettings(
  tournamentId: string,
  params: PlayoffSettings,
): Promise<void> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(tournamentId).exec();
  if (doc === null) throw new Error(`Tournament ${tournamentId} not found`);

  await doc.incrementalModify((current) => {
    const tournament = normalizeTournament(current);
    if (tournament.format !== Format.GROUPS_TO_BRACKET) {
      throw new Error('Tournament is not a Groups to Bracket format');
    }

    changePlayoffSettings(tournament, params);

    return tournament;
  });
}
