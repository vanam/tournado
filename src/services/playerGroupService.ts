import { getDatabase } from '../db';
import { GROUP_VERSION } from '../utils/dataPortability';
import type { PlayerGroup } from '../types';

export async function listPlayerGroups(): Promise<PlayerGroup[]> {
  const db = await getDatabase();
  const docs = await db.playerGroups.find().exec();
  return docs.map(d => d.toJSON() as PlayerGroup);
}

export async function createPlayerGroup(name: string): Promise<PlayerGroup> {
  const db = await getDatabase();
  const group: PlayerGroup = { id: crypto.randomUUID(), name, version: GROUP_VERSION };
  await db.playerGroups.insert(group);
  return group;
}

export async function updatePlayerGroup(id: string, name: string): Promise<PlayerGroup> {
  const db = await getDatabase();
  const doc = await db.playerGroups.findOne(id).exec();
  if (!doc) throw new Error(`Group ${id} not found`);
  const updated = { ...doc.toMutableJSON(), name };
  await doc.incrementalModify(() => updated);
  return updated;
}

export async function deletePlayerGroup(id: string): Promise<void> {
  const db = await getDatabase();
  const doc = await db.playerGroups.findOne(id).exec();
  if (doc) await doc.remove();

  const playerDocs = await db.players.find().exec();
  for (const pDoc of playerDocs) {
    const player = pDoc.toMutableJSON();
    if (player.groupIds.includes(id)) {
      player.groupIds = player.groupIds.filter(gid => gid !== id);
      await pDoc.incrementalModify(() => player);
    }
  }
}

export async function deleteAllPlayerGroups(): Promise<void> {
  const db = await getDatabase();
  const groupDocs = await db.playerGroups.find().exec();
  await Promise.all(groupDocs.map(d => d.remove()));
  const playerDocs = await db.players.find().exec();
  for (const pDoc of playerDocs) {
    const player = pDoc.toMutableJSON();
    if (player.groupIds.length > 0) {
      player.groupIds = [];
      await pDoc.incrementalModify(() => player);
    }
  }
}

export async function reorderPlayerGroups(ids: string[]): Promise<PlayerGroup[]> {
  const db = await getDatabase();
  const docs = await db.playerGroups.find().exec();
  const groupMap = new Map(docs.map(d => [d.toJSON().id, d.toJSON() as PlayerGroup]));
  return ids.flatMap(id => {
    const g = groupMap.get(id);
    return g ? [g] : [];
  });
}
