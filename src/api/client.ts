import type { Tournament, PlayerLibraryEntry, PlayerGroup } from '../types';
import type {
  TournamentSummary,
  CreateTournamentRequest,
  RecordScoreRequest,
  CreatePlayerRequest,
  UpdatePlayerRequest,
  CreateGroupRequest,
  UpdateGroupRequest,
  ReorderGroupsRequest,
  PlayerProfile,
  MatrixResponse,
  BulkImportResult,
} from './types';

function getAcceptLanguage(): string {
  return localStorage.getItem('tournado-lang') ?? navigator.language;
}

async function apiCall<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Accept-Language': getAcceptLanguage() };
  const init: RequestInit = { method, headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(path, init);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: res.statusText })) as { detail?: string };
    throw new Error(errData.detail ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Tournaments
export const listTournaments = (): Promise<TournamentSummary[]> => apiCall('GET', '/api/tournaments');
export const getTournament = (id: string): Promise<Tournament> => apiCall('GET', `/api/tournaments/${id}`);
export const createTournament = (req: CreateTournamentRequest): Promise<Tournament> => apiCall('POST', '/api/tournaments', req);
export const deleteTournament = (id: string): Promise<void> => apiCall('DELETE', `/api/tournaments/${id}`);
export const deleteAllTournaments = (): Promise<void> => apiCall('DELETE', '/api/tournaments');
export const duplicateTournament = (id: string): Promise<Tournament> => apiCall('POST', `/api/tournaments/${id}/duplicate`);

// Matches
export const recordScore = (id: string, matchId: string, req: RecordScoreRequest): Promise<void> =>
  apiCall('PUT', `/api/tournaments/${id}/matches/${matchId}/score`, req);
export const clearScore = (id: string, matchId: string): Promise<void> =>
  apiCall('DELETE', `/api/tournaments/${id}/matches/${matchId}/score`);
export const recordGroupScore = (id: string, groupId: string, matchId: string, req: RecordScoreRequest): Promise<void> =>
  apiCall('PUT', `/api/tournaments/${id}/groups/${groupId}/matches/${matchId}/score`, req);
export const clearGroupScore = (id: string, groupId: string, matchId: string): Promise<void> =>
  apiCall('DELETE', `/api/tournaments/${id}/groups/${groupId}/matches/${matchId}/score`);

// Swiss
export const swissNextRound = (id: string): Promise<void> => apiCall('POST', `/api/tournaments/${id}/swiss/next-round`);

// Group stage
export const generateGroupPlayoffs = (id: string): Promise<void> => apiCall('POST', `/api/tournaments/${id}/groups/playoffs`);

// Standings
export const getMatrix = (id: string): Promise<MatrixResponse> => apiCall('GET', `/api/tournaments/${id}/matrix`);

// Players
export const listPlayers = (groupId?: string): Promise<PlayerLibraryEntry[]> =>
  apiCall('GET', groupId === undefined ? '/api/players' : `/api/players?groupId=${encodeURIComponent(groupId)}`);
export const createPlayer = (req: CreatePlayerRequest): Promise<PlayerLibraryEntry> => apiCall('POST', '/api/players', req);
export const updatePlayer = (id: string, req: UpdatePlayerRequest): Promise<PlayerLibraryEntry> => apiCall('PUT', `/api/players/${id}`, req);
export const deletePlayer = (id: string): Promise<void> => apiCall('DELETE', `/api/players/${id}`);
export const deleteAllPlayers = (): Promise<void> => apiCall('DELETE', '/api/players');
export const importPlayers = (text: string, groupIds?: string[]): Promise<BulkImportResult> => apiCall('POST', '/api/players/import', { text, ...(groupIds !== undefined && { groupIds }) });

// Player groups
export const listPlayerGroups = (): Promise<PlayerGroup[]> => apiCall('GET', '/api/player-groups');
export const createPlayerGroup = (req: CreateGroupRequest): Promise<PlayerGroup> => apiCall('POST', '/api/player-groups', req);
export const reorderPlayerGroups = (req: ReorderGroupsRequest): Promise<PlayerGroup[]> => apiCall('PUT', '/api/player-groups/reorder', req);
export const updatePlayerGroup = (id: string, req: UpdateGroupRequest): Promise<PlayerGroup> => apiCall('PUT', `/api/player-groups/${id}`, req);
export const deletePlayerGroup = (id: string): Promise<void> => apiCall('DELETE', `/api/player-groups/${id}`);

// Player profile
export const getPlayerProfile = (id: string): Promise<PlayerProfile> => apiCall('GET', `/api/players/${id}/profile`);

// Rename player in tournament
export const renameTournamentPlayer = (tournamentId: string, playerId: string, name: string): Promise<void> =>
  apiCall('PATCH', `/api/tournaments/${tournamentId}/players/${playerId}`, { name });
