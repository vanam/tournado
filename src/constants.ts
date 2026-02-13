export const FORMATS = {
  SINGLE_ELIM: 'SINGLE_ELIM',
  DOUBLE_ELIM: 'DOUBLE_ELIM',
  ROUND_ROBIN: 'ROUND_ROBIN',
  GROUPS_TO_BRACKET: 'GROUPS_TO_BRACKET',
} as const;

export const BRACKET_TYPES = {
  SINGLE_ELIM: 'single_elim',
  DOUBLE_ELIM: 'double_elim',
} as const;

export const SCORE_MODES = {
  SETS: 'SETS',
  POINTS: 'POINTS',
} as const;

export const DEFAULT_MAX_SETS = 5;

export const STORAGE_KEY = 'tournado';

export const MIN_PLAYERS = 2;
