// @ts-check
import { fn } from 'storybook/test';
import * as fixtures from '../fixtures';
import { RoundSchedule } from '../../src/components/roundrobin/RoundSchedule';
/** @satisfies {import('@storybook/react-vite').Meta<typeof RoundSchedule>} */
const meta = {
  title: 'Formats/RoundSchedule',
  component: RoundSchedule,
  tags: ['autodocs'],
  args: {
    schedule: fixtures.robinPlaying.schedule,
    players: fixtures.robinPlaying.players,
    onEditMatch: fn(),
  },
  parameters: { sourceFiles: ['components/roundrobin/RoundSchedule.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const OddPlayerBye = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Completed = {
  args: { schedule: fixtures.robinCompleted.schedule },
};
