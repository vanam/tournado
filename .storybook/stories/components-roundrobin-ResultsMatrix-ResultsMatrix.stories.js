// @ts-check
import * as fixtures from '../fixtures';
import { ScoreMode } from '../../src/types';
import { ResultsMatrix } from '../../src/components/roundrobin/ResultsMatrix';
/** @satisfies {import('@storybook/react-vite').Meta<typeof ResultsMatrix>} */
const meta = {
  title: 'Formats/ResultsMatrix',
  component: ResultsMatrix,
  tags: ['autodocs'],
  args: {
    schedule: fixtures.robinPlaying.schedule,
    players: fixtures.robinPlaying.players,
    scoringMode: ScoreMode.SETS,
  },
  parameters: { sourceFiles: ['components/roundrobin/ResultsMatrix.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Partial = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Empty = { args: { schedule: fixtures.robin.schedule } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Completed = {
  args: { schedule: fixtures.robinCompleted.schedule },
};
