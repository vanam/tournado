import { ApiError } from './errors';
import { errorResponse } from './helpers';

import {
  listTournaments,
  createTournament,
  getTournament,
  deleteTournament,
  deleteAllTournaments,
  duplicateTournament,
  getProgress,
  getResults,
  renameTournamentPlayer,
} from './handlers/tournaments';

import {
  recordScore,
  clearScore,
  checkEditable,
} from './handlers/matches';

import {
  nextRound,
  roundComplete,
} from './handlers/swiss';

import {
  getGroupStandings,
  getAdvancers,
  generatePlayoffs,
} from './handlers/groupStage';

import {
  getStandings,
  getMatrix,
} from './handlers/standings';

import {
  listPlayers,
  createPlayerHandler,
  updatePlayerHandler,
  deletePlayerHandler,
  deleteAllPlayersHandler,
  bulkImport,
  getPlayerProfile,
} from './handlers/players';

import {
  listGroups,
  createGroupHandler,
  updateGroupHandler,
  deleteGroupHandler,
} from './handlers/playerGroups';

interface Route {
  method: string;
  pathPattern: string;
  handler: (request: Request, params: Record<string, string>) => Promise<Response>;
}

function matchPath(pattern: string, path: string): Record<string, string> | null {
  const paramNames: string[] = [];
  const regexStr = pattern.replaceAll(/:([^/]+)/g, (_, name: string) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  const match = new RegExp(`^${regexStr}$`).exec(path);
  if (match === null) return null;
  const params: Record<string, string> = {};
  for (const [i, name] of paramNames.entries()) {
    params[name] = match[i + 1] ?? '';
  }
  return params;
}

const routes: Route[] = [
  // Tournaments
  { method: 'GET', pathPattern: '/api/tournaments', handler: listTournaments },
  { method: 'POST', pathPattern: '/api/tournaments', handler: createTournament },
  { method: 'DELETE', pathPattern: '/api/tournaments', handler: deleteAllTournaments },
  { method: 'GET', pathPattern: '/api/tournaments/:id', handler: getTournament },
  { method: 'DELETE', pathPattern: '/api/tournaments/:id', handler: deleteTournament },
  { method: 'POST', pathPattern: '/api/tournaments/:id/duplicate', handler: duplicateTournament },
  { method: 'GET', pathPattern: '/api/tournaments/:id/progress', handler: getProgress },
  { method: 'GET', pathPattern: '/api/tournaments/:id/results', handler: getResults },
  { method: 'PATCH', pathPattern: '/api/tournaments/:id/players/:playerId', handler: renameTournamentPlayer },

  // Matches
  { method: 'PUT', pathPattern: '/api/tournaments/:id/matches/:matchId/score', handler: recordScore },
  { method: 'DELETE', pathPattern: '/api/tournaments/:id/matches/:matchId/score', handler: clearScore },
  { method: 'GET', pathPattern: '/api/tournaments/:id/matches/:matchId/editable', handler: checkEditable },

  // Group stage matches (with groupId)
  { method: 'PUT', pathPattern: '/api/tournaments/:id/groups/:groupId/matches/:matchId/score', handler: recordScore },
  { method: 'DELETE', pathPattern: '/api/tournaments/:id/groups/:groupId/matches/:matchId/score', handler: clearScore },

  // Swiss
  { method: 'POST', pathPattern: '/api/tournaments/:id/swiss/next-round', handler: nextRound },
  { method: 'GET', pathPattern: '/api/tournaments/:id/swiss/round-complete', handler: roundComplete },

  // Group stage
  { method: 'GET', pathPattern: '/api/tournaments/:id/groups/:groupId/standings', handler: getGroupStandings },
  { method: 'GET', pathPattern: '/api/tournaments/:id/groups/advancers', handler: getAdvancers },
  { method: 'POST', pathPattern: '/api/tournaments/:id/groups/playoffs', handler: generatePlayoffs },

  // Standings
  { method: 'GET', pathPattern: '/api/tournaments/:id/standings', handler: getStandings },
  { method: 'GET', pathPattern: '/api/tournaments/:id/matrix', handler: getMatrix },

  // Players
  { method: 'GET', pathPattern: '/api/players', handler: listPlayers },
  { method: 'POST', pathPattern: '/api/players', handler: createPlayerHandler },
  { method: 'DELETE', pathPattern: '/api/players', handler: deleteAllPlayersHandler },
  { method: 'PUT', pathPattern: '/api/players/:id', handler: updatePlayerHandler },
  { method: 'DELETE', pathPattern: '/api/players/:id', handler: deletePlayerHandler },
  { method: 'POST', pathPattern: '/api/players/import', handler: bulkImport },
  { method: 'GET', pathPattern: '/api/players/:id/profile', handler: getPlayerProfile },

  // Player groups
  { method: 'GET', pathPattern: '/api/player-groups', handler: listGroups },
  { method: 'POST', pathPattern: '/api/player-groups', handler: createGroupHandler },
  { method: 'PUT', pathPattern: '/api/player-groups/:id', handler: updateGroupHandler },
  { method: 'DELETE', pathPattern: '/api/player-groups/:id', handler: deleteGroupHandler },
];

export async function routeRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();

  for (const route of routes) {
    if (route.method !== method) continue;
    const params = matchPath(route.pathPattern, path);
    if (params === null) continue;

    try {
      return await route.handler(request, params);
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        return errorResponse(error);
      }
      const detail = error instanceof Error ? error.message : 'Internal server error';
      return Response.json(
        { type: 'about:blank', title: 'Internal Server Error', status: 500, detail },
        { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
      );
    }
  }

  return Response.json(
    { type: 'about:blank', title: 'Not Found', status: 404, detail: `No route matched ${method} ${path}` },
    { status: 404, headers: { 'Content-Type': 'application/problem+json' } },
  );
}
