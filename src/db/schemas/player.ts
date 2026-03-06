import type { RxJsonSchema } from 'rxdb';
import type { PlayerLibraryEntry } from '../../types/playerLibrary';

export const playerSchema: RxJsonSchema<PlayerLibraryEntry> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
    version: { type: 'integer' },
    elo: { type: 'number' },
    groupIds: { type: 'array', items: { type: 'string' } },
  },
  required: ['id', 'name', 'version', 'groupIds'],
};
