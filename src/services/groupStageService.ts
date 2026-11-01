import { getDatabase } from '../db';
import { ensurePlayoffs, changePlayoffSettings } from '../utils/playoffLifecycle';
import type { PlayoffSettings } from '../utils/playoffLifecycle';
export { PlayoffSettingsLockedError } from '../utils/playoffLifecycle';
import { computeStandings } from '../utils/roundRobinUtils';
import {
  getGroupAdvancers,
  getGroupPlayers,
} from '../utils/groupStageUtils';
import {
  ensureParticipants,
  getParticipantPlayers,
} from '../utils/participantUtils';
import { Format } from '../types';
import type {
  Tournament,
  StandingsRow,
  GroupAdvancersResult,
} from '../types';

export async function getGroupStandings(
  tournamentId: string,
  groupId: string,
): Promise<StandingsRow[]> {
  const db = await getDatabase();
  const doc = await db.tournaments.findOne(tournamentId).exec();
  if (!doc) throw new Error(`Tournament ${tournamentId} not found`);

  const tournament = doc.toMutableJSON();
  if (tournament.format !== Format.GROUPS_TO_BRACKET) {
    throw new Error('Tournament is not a Groups to Bracket format');
  }

  const group = tournament.groupStage.groups.find((g) => g.id === groupId);
  if (group === undefined) {
    throw new Error(`Group ${groupId} not found`);
  }

  const storedParticipants = ensureParticipants(
    tournament.players,
    tournament.participants,
  );
  const participantPlayers = getParticipantPlayers(
    tournament.players,
    storedParticipants,
  );
  const groupPlayers = getGroupPlayers(group, participantPlayers);
  const standings = computeStandings(group.schedule, groupPlayers, {
    scoringMode: tournament.scoringMode,
    maxSets: tournament.groupStageMaxSets ?? tournament.maxSets,
  });

  return standings;
}

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

  const saved = await doc.incrementalModify((tournament) => {
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

  await doc.incrementalModify((tournament) => {
    if (tournament.format !== Format.GROUPS_TO_BRACKET) {
      throw new Error('Tournament is not a Groups to Bracket format');
    }

    changePlayoffSettings(tournament, params);

    return tournament;
  });
}
