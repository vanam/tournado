// @ts-check
import { fn } from 'storybook/test';
import * as fixtures from '../fixtures';
import { RRMatchCard } from '../../src/components/roundrobin/RrMatchCard';
/** @satisfies {import('@storybook/react-vite').Meta<typeof RRMatchCard>} */
const meta = {
  title: 'Formats/RoundRobinMatch',
  component: RRMatchCard,
  tags: ['autodocs'],
  args: { match: fixtures.match, players: fixtures.players, onEdit: fn() },
  parameters: { sourceFiles: ['components/roundrobin/RrMatchCard.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Ready = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Played = { args: { match: fixtures.playedMatch } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Walkover = {
  args: { match: { ...fixtures.playedMatch, walkover: true } },
};
