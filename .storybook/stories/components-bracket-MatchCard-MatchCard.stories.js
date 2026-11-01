// @ts-check
import { fn } from 'storybook/test';
import * as fixtures from '../fixtures';
import { ScoreMode } from '../../src/types';
import { MatchCard } from '../../src/components/bracket/MatchCard';
/** @satisfies {import('@storybook/react-vite').Meta<typeof MatchCard>} */
const meta = {
  title: 'Tournament/MatchCard',
  component: MatchCard,
  tags: ['autodocs'],
  args: {
    match: fixtures.match,
    players: fixtures.players,
    canEdit: true,
    roundIndex: 0,
    onClick: fn(),
  },
  parameters: { sourceFiles: ['components/bracket/MatchCard.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Ready = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Played = { args: { match: fixtures.playedMatch } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Points = {
  args: { match: fixtures.pointsMatch, scoringMode: ScoreMode.POINTS },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Unassigned = {
  args: { match: { ...fixtures.match, player1Id: null, player2Id: null } },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Bye = {
  args: {
    match: {
      ...fixtures.match,
      player2Id: null,
      winnerId: fixtures.match.player1Id,
    },
  },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Locked = { args: { canEdit: false } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Walkover = {
  args: { match: { ...fixtures.playedMatch, walkover: true } },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Wildcard = {
  args: {
    wildcardIds: new Set([fixtures.match.player1Id ?? '']),
    groupPlacementByPlayerId: new Map([[fixtures.match.player1Id ?? '', 'A1']]),
  },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Doubles = {
  args: {
    match: fixtures.doubles.bracket.rounds[0]?.[0] ?? fixtures.match,
    players: fixtures.doubles.players,
    participants: fixtures.doubles.participants,
  },
};
