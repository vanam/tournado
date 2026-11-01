// @ts-check
import * as fixtures from '../fixtures';
import { MatchSideName } from '../../src/components/bracket/MatchCard';
/** @satisfies {import('@storybook/react-vite').Meta<typeof MatchSideName>} */
const meta = {
  title: 'Tournament/MatchSideName',
  component: MatchSideName,
  tags: ['autodocs'],
  args: {
    members: [],
    player: fixtures.players[0],
    playerId: 'p1',
    placement: 'A1',
    seed: '1',
    isWildcard: true,
    t: (key) => key,
  },
  parameters: { sourceFiles: ['components/bracket/MatchCard.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Single = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Doubles = { args: { members: fixtures.players.slice(0, 2) } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Unknown = {
  args: { player: undefined, playerId: null, isWildcard: false },
};
