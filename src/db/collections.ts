import type { RxCollection, RxDatabase, RxDocument } from 'rxdb';
import type { Tournament } from '../types/tournament';
import type { PlayerLibraryEntry, PlayerGroup } from '../types/playerLibrary';

export type TournamentDocument = RxDocument<Tournament>;
export type PlayerDocument = RxDocument<PlayerLibraryEntry>;
export type PlayerGroupDocument = RxDocument<PlayerGroup>;

export type TournamentCollection = RxCollection<Tournament>;
export type PlayerCollection = RxCollection<PlayerLibraryEntry>;
export type PlayerGroupCollection = RxCollection<PlayerGroup>;

export type DatabaseCollections = {
  tournaments: TournamentCollection;
  players: PlayerCollection;
  playerGroups: PlayerGroupCollection;
};

export type TournadoDatabase = RxDatabase<DatabaseCollections>;
