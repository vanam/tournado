import {
  loadLibrary,
  addGroup,
  updateGroup,
  deleteGroup,
} from '../../services/playerLibraryService';
import type { CreateGroupRequest, UpdateGroupRequest } from '../types';
import { jsonResponse, noContent, parseJsonBody } from '../helpers';
import { notFound, badRequest } from '../errors';

export async function listGroups(): Promise<Response> {
  const library = await loadLibrary();
  return jsonResponse(library.groups);
}

export async function createGroupHandler(req: Request): Promise<Response> {
  const body = await parseJsonBody<CreateGroupRequest>(req);

  if (!body.name || body.name.trim() === '') {
    throw badRequest('Group name is required');
  }

  const library = await addGroup(body.name.trim());
  const created = library.groups.at(-1);
  return jsonResponse(created, 201);
}

export async function updateGroupHandler(req: Request, params: Record<string, string>): Promise<Response> {
  const id = params['id'] ?? '';
  const body = await parseJsonBody<UpdateGroupRequest>(req);

  if (!body.name || body.name.trim() === '') {
    throw badRequest('Group name is required');
  }

  const library = await loadLibrary();
  const existing = library.groups.find((g) => g.id === id);
  if (existing === undefined) {
    throw notFound(`Group ${id} not found`);
  }

  const updated = await updateGroup(id, body.name.trim());
  const group = updated.groups.find((g) => g.id === id);
  return jsonResponse(group);
}

export async function deleteGroupHandler(_req: Request, params: Record<string, string>): Promise<Response> {
  const id = params['id'] ?? '';
  await deleteGroup(id);
  return noContent();
}
