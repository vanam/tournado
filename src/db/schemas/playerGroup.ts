import type { RxJsonSchema } from 'rxdb';
import type { PlayerGroup } from '../../types/playerLibrary';

export const playerGroupSchema: RxJsonSchema<PlayerGroup> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
    version: { type: 'integer' },
  },
  required: ['id', 'name', 'version'],
};
